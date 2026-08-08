"use client";

import { useState, useCallback, useTransition, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, Save, Loader2, Check, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArchitectureCanvas } from "@/components/architecture-canvas";
import { ChatSidebar } from "@/components/chat-sidebar";
import { NodeInspector } from "@/components/node-inspector";
import { useRouter } from "next/navigation";
import { updateProjectArchitecture, generateRealArchitecture, createProjectWithArchitecture } from "@/app/actions/project";
import { Node, Edge } from "@xyflow/react";

interface PlaygroundWorkspaceProps {
  projectId?: string;
  projectName?: string;
  initialPrompt?: string;
  initialNodes?: Node[];
  initialEdges?: Edge[];
}

export function PlaygroundWorkspace({
  projectId,
  projectName,
  initialPrompt = "",
  initialNodes = [],
  initialEdges = [],
}: PlaygroundWorkspaceProps) {
  const router = useRouter();
  const [currentProjectId, setCurrentProjectId] = useState<string | undefined>(projectId);
  const [currentProjectName, setCurrentProjectName] = useState<string | undefined>(projectName);
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [externalPrompt, setExternalPrompt] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Generate initial architecture diagram immediately if canvas is empty and prompt exists
  useEffect(() => {
    if (initialPrompt && initialNodes.length === 0) {
      generateRealArchitecture(initialPrompt).then((data) => {
        if (data.nodes && data.nodes.length > 0) {
          setNodes(data.nodes);
          setEdges(data.edges);
        }
      }).catch((err) => {
        console.error("Failed to generate initial architecture diagram:", err);
      });
    }
  }, [initialPrompt, initialNodes.length]);

  const handleArchitectureUpdate = useCallback(
    (data: { nodes: Node[]; edges: Edge[] }) => {
      if (data.nodes) setNodes(data.nodes);
      if (data.edges) setEdges(data.edges);

      // If selected node was updated or removed, update reference
      if (selectedNode && data.nodes) {
        const found = data.nodes.find((n) => n.id === selectedNode.id);
        setSelectedNode(found || null);
      }

      // If tied to an existing project ID, auto-save updates to DB
      if (currentProjectId && data.nodes && data.edges) {
        startTransition(async () => {
          await updateProjectArchitecture(currentProjectId, JSON.stringify(data));
        });
      }
    },
    [currentProjectId, selectedNode]
  );

  const handleSingleNodeUpdate = (updatedNode: Node) => {
    const updatedNodes = nodes.map((n) => (n.id === updatedNode.id ? updatedNode : n));
    setNodes(updatedNodes);
    setSelectedNode(updatedNode);

    if (currentProjectId) {
      startTransition(async () => {
        await updateProjectArchitecture(currentProjectId, JSON.stringify({ nodes: updatedNodes, edges }));
      });
    }
  };

  const handleSaveToDb = () => {
    if (!currentProjectId) return;
    startTransition(async () => {
      await updateProjectArchitecture(currentProjectId, JSON.stringify({ nodes, edges }));
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    });
  };

  const handleCreateAndSaveProject = () => {
    startTransition(async () => {
      const generatedName = initialPrompt
        ? initialPrompt.slice(0, 30).trim() + (initialPrompt.length > 30 ? "..." : "")
        : "Uusi Arkkitehtuuriprojekti";

      const newProject = await createProjectWithArchitecture(
        generatedName,
        initialPrompt,
        JSON.stringify({ nodes, edges })
      );

      setCurrentProjectId(newProject.id);
      setCurrentProjectName(newProject.name);
      setSavedSuccess(true);
      router.replace(`/playground?projectId=${newProject.id}`);
      setTimeout(() => setSavedSuccess(false), 2500);
    });
  };

  const handleProjectAICheck = () => {
    const prompt = `Suorita kokonaisvaltainen arkkitehtuuritarkistus (Audit) koko järjestelmälle (${nodes.length} komponenttia, ${edges.length} linkkiä).
Tarkasta komponenttien väliset riippuvuudet, mahdolliset suorituskyky- tai tietoturvapullonkaulat sekä puuttuvat kerrokset. Jos näet aiheelliseksi korjata kaaviota, kutsu update_architecture-työkalua ja selitä suosituksesi.`;
    setExternalPrompt(prompt);
  };

  return (
    <div className="h-screen flex flex-col bg-muted/20">
      {/* Top bar */}
      <header className="h-14 border-b bg-background px-6 flex items-center justify-between flex-none">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="icon-sm" render={<Link href={currentProjectId ? `/projects/${currentProjectId}` : "/"} />} nativeButton={false}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            <h1 className="font-bold text-lg tracking-tight">
              {currentProjectName ? `Ajatushautomo: ${currentProjectName}` : "Arkkitehtuurin Hiekkalaatikko"}
            </h1>
          </div>
          <span className="text-sm bg-muted text-muted-foreground px-2.5 py-1 rounded font-mono font-medium">
            Interaktiivinen Suunnittelu
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Project-wide AI Audit Button */}
          <Button
            onClick={handleProjectAICheck}
            variant="outline"
            size="sm"
            className="border-purple-500/30 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 font-medium"
          >
            <ShieldCheck className="mr-1.5 h-4 w-4 text-purple-500" />
            AI Tarkista arkkitehtuuri
          </Button>

          {currentProjectId ? (
            <Button onClick={handleSaveToDb} disabled={isPending} size="sm">
              {isPending ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : savedSuccess ? (
                <Check className="mr-1.5 h-4 w-4 text-green-400" />
              ) : (
                <Save className="mr-1.5 h-4 w-4" />
              )}
              {savedSuccess ? "Tallennettu!" : "Tallenna muutokset"}
            </Button>
          ) : (
            <Button onClick={handleCreateAndSaveProject} disabled={isPending} size="sm" className="bg-purple-600 hover:bg-purple-700 text-white font-medium">
              {isPending ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : savedSuccess ? (
                <Check className="mr-1.5 h-4 w-4 text-green-400" />
              ) : (
                <Save className="mr-1.5 h-4 w-4" />
              )}
              {savedSuccess ? "Tallennettu!" : "Tallenna Projekti"}
            </Button>
          )}
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 min-h-0 p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Architecture Canvas */}
        <div
          className={`h-full flex flex-col transition-all duration-300 ${
            selectedNode ? "lg:col-span-6" : "lg:col-span-8"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-semibold text-foreground">Visuaalinen Kaavio</h2>
            <span className="text-sm text-muted-foreground font-medium">
              {nodes.length} komponenttia kaaviossa {selectedNode ? "• Valittuna: " + ((selectedNode.data?.label as string) || selectedNode.id) : ""}
            </span>
          </div>
          <div className="flex-1 min-h-0">
            <ArchitectureCanvas
              nodes={nodes}
              edges={edges}
              selectedNodeId={selectedNode?.id}
              onNodesChange={setNodes}
              onEdgesChange={setEdges}
              onNodeSelect={setSelectedNode}
              hideHeader={true}
            />
          </div>
        </div>

        {/* Center/Side: Node Inspector (Visible only when node selected) */}
        {selectedNode && (
          <div className="lg:col-span-3 h-full flex flex-col">
            <NodeInspector
              selectedNode={selectedNode}
              onNodeUpdate={handleSingleNodeUpdate}
              onClose={() => setSelectedNode(null)}
              onTriggerAICheck={setExternalPrompt}
            />
          </div>
        )}

        {/* Right: AI Chat Co-Pilot */}
        <div
          className={`h-full flex flex-col transition-all duration-300 ${
            selectedNode ? "lg:col-span-3" : "lg:col-span-4"
          }`}
        >
          <ChatSidebar
            initialPrompt={initialPrompt}
            hasExistingArchitecture={initialNodes.length > 0}
            externalPrompt={externalPrompt}
            onClearExternalPrompt={() => setExternalPrompt(null)}
            onArchitectureUpdate={handleArchitectureUpdate}
          />
        </div>
      </div>
    </div>
  );
}
