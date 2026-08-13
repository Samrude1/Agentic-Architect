"use client";

import { useState, useCallback, useTransition, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  Save,
  Loader2,
  Check,
  ShieldCheck,
  Database,
  LayoutGrid,
  Folder,
  HardDrive,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArchitectureCanvas } from "@/components/architecture-canvas";
import { ChatSidebar } from "@/components/chat-sidebar";
import { NodeInspector } from "@/components/node-inspector";
import { CodeViewer } from "@/components/code-viewer";
import { useRouter } from "next/navigation";
import {
  updateProjectArchitecture,
  generateRealArchitecture,
  createProjectWithArchitecture,
  updateProjectTargetPath,
} from "@/app/actions/project";
import {
  generatePrismaSchemaForProject,
  writeProjectFileToDisk,
} from "@/app/actions/codegen";
import { Node, Edge } from "@xyflow/react";

interface PlaygroundWorkspaceProps {
  projectId?: string;
  projectName?: string;
  initialPrompt?: string;
  initialNodes?: Node[];
  initialEdges?: Edge[];
  initialTargetPath?: string;
  initialPrismaSchema?: string;
}

export function PlaygroundWorkspace({
  projectId,
  projectName,
  initialPrompt = "",
  initialNodes = [],
  initialEdges = [],
  initialTargetPath = "",
  initialPrismaSchema = "",
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

  // Data Gate 1 & Homebase State
  const [activeTab, setActiveTab] = useState<"canvas" | "schema">("canvas");
  const [targetPath, setTargetPath] = useState<string>(initialTargetPath);
  const [prismaSchema, setPrismaSchema] = useState<string>(initialPrismaSchema);
  const [isGeneratingSchema, setIsGeneratingSchema] = useState(false);
  const [isWritingToDisk, setIsWritingToDisk] = useState(false);
  const [diskMessage, setDiskMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Generate initial architecture diagram immediately if canvas is empty and prompt exists
  useEffect(() => {
    if (initialPrompt && initialNodes.length === 0) {
      generateRealArchitecture(initialPrompt)
        .then((data) => {
          if (data.nodes && data.nodes.length > 0) {
            setNodes(data.nodes);
            setEdges(data.edges);
          }
        })
        .catch((err) => {
          console.error("Failed to generate initial architecture diagram:", err);
        });
    }
  }, [initialPrompt, initialNodes.length]);

  const handleArchitectureUpdate = useCallback(
    (data: { nodes: Node[]; edges: Edge[] }) => {
      if (data.nodes) setNodes(data.nodes);
      if (data.edges) setEdges(data.edges);

      if (selectedNode && data.nodes) {
        const found = data.nodes.find((n) => n.id === selectedNode.id);
        setSelectedNode(found || null);
      }

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

  const handleSaveTargetPath = async () => {
    if (!currentProjectId) return;
    await updateProjectTargetPath(currentProjectId, targetPath);
    setDiskMessage({ type: "success", text: "Kotikansio (Target Path) tallennettu." });
    setTimeout(() => setDiskMessage(null), 3000);
  };

  const handleGenerateSchema = async () => {
    setIsGeneratingSchema(true);
    try {
      const res = await generatePrismaSchemaForProject(
        currentProjectId || "",
        initialPrompt,
        JSON.stringify({ nodes, edges })
      );
      if (res.schema) {
        setPrismaSchema(res.schema);
      }
    } catch (err) {
      console.error("Failed to generate schema:", err);
    } finally {
      setIsGeneratingSchema(false);
    }
  };

  const handleWriteToDisk = async () => {
    if (!currentProjectId) {
      setDiskMessage({ type: "error", text: "Tallenna projekti ensin ennen levylle kirjoittamista." });
      return;
    }
    if (!targetPath.trim()) {
      setDiskMessage({ type: "error", text: "Syötä projektin kotikansio (Project Homebase Directory) ensin." });
      return;
    }
    if (!prismaSchema.trim()) {
      setDiskMessage({ type: "error", text: "Generoi tietokantamalli ensin." });
      return;
    }

    setIsWritingToDisk(true);
    try {
      // Save targetPath to DB first
      await updateProjectTargetPath(currentProjectId, targetPath);

      const result = await writeProjectFileToDisk(currentProjectId, "prisma/schema.prisma", prismaSchema);
      if (result.success) {
        setDiskMessage({
          type: "success",
          text: `Tiedosto kirjoitettu onnistuneesti! (${result.fullPath})`,
        });
      } else {
        setDiskMessage({ type: "error", text: result.error || "Virhe kirjoitettaessa levylle." });
      }
    } catch (err: any) {
      setDiskMessage({ type: "error", text: err.message || "Tiedoston kirjoitus epäonnistui." });
    } finally {
      setIsWritingToDisk(false);
      setTimeout(() => setDiskMessage(null), 5000);
    }
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
          <Button
            variant="ghost"
            size="icon-sm"
            render={<Link href={currentProjectId ? `/projects/${currentProjectId}` : "/"} />}
            nativeButton={false}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            <h1 className="font-bold text-lg tracking-tight">
              {currentProjectName ? `Ajatushautomo: ${currentProjectName}` : "Arkkitehtuurin Hiekkalaatikko"}
            </h1>
          </div>

          {/* View Mode Toggle Tabs */}
          <div className="ml-4 flex items-center bg-muted/50 p-1 rounded-lg border border-border/50 text-xs font-medium">
            <button
              onClick={() => setActiveTab("canvas")}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-md transition-all ${
                activeTab === "canvas"
                  ? "bg-background text-foreground shadow-sm font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5 text-purple-500" />
              <span>Visuaalinen Kaavio</span>
            </button>
            <button
              onClick={() => setActiveTab("schema")}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-md transition-all ${
                activeTab === "schema"
                  ? "bg-background text-foreground shadow-sm font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Database className="h-3.5 w-3.5 text-purple-500" />
              <span>Tietokanta & Koodi (Gate 1)</span>
            </button>
          </div>
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
            <Button
              onClick={handleCreateAndSaveProject}
              disabled={isPending}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white font-medium"
            >
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
        {/* Left/Main Area based on activeTab */}
        {activeTab === "canvas" ? (
          <>
            <div
              className={`h-full flex flex-col transition-all duration-300 ${
                selectedNode ? "lg:col-span-6" : "lg:col-span-8"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base font-semibold text-foreground">Visuaalinen Kaavio</h2>
                <span className="text-sm text-muted-foreground font-medium">
                  {nodes.length} komponenttia kaaviossa{" "}
                  {selectedNode ? "• Valittuna: " + ((selectedNode.data?.label as string) || selectedNode.id) : ""}
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
          </>
        ) : (
          <div className="lg:col-span-8 h-full flex flex-col space-y-4 min-h-0">
            {/* Project Homebase Folder Directory Settings Card */}
            <div className="bg-background rounded-lg border p-4 shadow-sm space-y-3 flex-none">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Folder className="h-5 w-5 text-purple-500" />
                  <h3 className="font-semibold text-sm">Projektin Kotikansio (Project Homebase Directory)</h3>
                </div>
                <span className="text-xs text-muted-foreground">Koodikannan juuripolku levyllä</span>
              </div>

              <div className="flex items-center space-x-2">
                <Input
                  value={targetPath}
                  onChange={(e) => setTargetPath(e.target.value)}
                  placeholder="Esim. C:\Users\samru\DEVELOPER\PROJECTS\my-app"
                  className="font-mono text-xs"
                />
                <Button variant="outline" size="sm" onClick={handleSaveTargetPath}>
                  Aseta polku
                </Button>
              </div>
            </div>

            {/* Code Generator & Viewer Card */}
            <div className="flex-1 min-h-0 flex flex-col bg-background border rounded-lg p-4 shadow-sm space-y-4">
              <div className="flex items-center justify-between flex-none">
                <div>
                  <h3 className="font-bold text-base flex items-center space-x-2">
                    <Database className="h-5 w-5 text-purple-500" />
                    <span>Data Gate 1: Prisma Database Schema</span>
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Generoi tuotantovalmis Prisma-tietokantamalli kaaviossa määriteltyjen komponenttien pohjalta (Standard English).
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    onClick={handleGenerateSchema}
                    disabled={isGeneratingSchema}
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700 text-white font-medium"
                  >
                    {isGeneratingSchema ? (
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-1.5 h-4 w-4" />
                    )}
                    {prismaSchema ? "Päivitä kaavio AI:lla" : "Generoi tietokantamalli AI:lla"}
                  </Button>

                  {prismaSchema && (
                    <Button
                      onClick={handleWriteToDisk}
                      disabled={isWritingToDisk}
                      variant="outline"
                      size="sm"
                      className="border-green-500/40 text-green-600 hover:bg-green-500/10 font-medium"
                    >
                      {isWritingToDisk ? (
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      ) : (
                        <HardDrive className="mr-1.5 h-4 w-4 text-green-500" />
                      )}
                      Kirjoita levyarvoon (prisma/schema.prisma)
                    </Button>
                  )}
                </div>
              </div>

              {/* Status/Error Messages */}
              {diskMessage && (
                <div
                  className={`p-3 rounded-md text-xs font-medium flex items-center space-x-2 ${
                    diskMessage.type === "success"
                      ? "bg-green-500/10 text-green-600 border border-green-500/30"
                      : "bg-destructive/10 text-destructive border border-destructive/30"
                  }`}
                >
                  {diskMessage.type === "success" ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  )}
                  <span>{diskMessage.text}</span>
                </div>
              )}

              {/* Code Display */}
              <div className="flex-1 min-h-0">
                {prismaSchema ? (
                  <CodeViewer code={prismaSchema} filename="prisma/schema.prisma" />
                ) : (
                  <div className="h-full border border-dashed rounded-lg flex flex-col items-center justify-center p-8 text-center bg-muted/20 space-y-3">
                    <Database className="h-10 w-10 text-muted-foreground/50" />
                    <div>
                      <h4 className="font-semibold text-sm">Ei vielä generoitua tietokantamallia</h4>
                      <p className="text-xs text-muted-foreground max-w-sm mt-1">
                        Paina *"Generoi tietokantamalli AI:lla"* painiketta luodaksesi arkkitehtuurikaaviosi pohjalta tuotantovalmiin Prisma-skeeman.
                      </p>
                    </div>
                    <Button
                      onClick={handleGenerateSchema}
                      disabled={isGeneratingSchema}
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700 text-white font-medium"
                    >
                      {isGeneratingSchema ? (
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="mr-1.5 h-4 w-4" />
                      )}
                      Generoi tietokantamalli AI:lla
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Right: AI Chat Co-Pilot */}
        <div
          className={`h-full flex flex-col transition-all duration-300 ${
            activeTab === "canvas"
              ? selectedNode
                ? "lg:col-span-3"
                : "lg:col-span-4"
              : "lg:col-span-4"
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
