"use client";

import { useState, useCallback, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, Save, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArchitectureCanvas } from "@/components/architecture-canvas";
import { ChatSidebar } from "@/components/chat-sidebar";
import { updateProjectArchitecture } from "@/app/actions/project";
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
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [isPending, startTransition] = useTransition();
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleArchitectureUpdate = useCallback(
    (data: { nodes: Node[]; edges: Edge[] }) => {
      if (data.nodes) setNodes(data.nodes);
      if (data.edges) setEdges(data.edges);

      // If tied to an existing project ID, auto-save updates to DB
      if (projectId && data.nodes && data.edges) {
        startTransition(async () => {
          await updateProjectArchitecture(projectId, JSON.stringify(data));
        });
      }
    },
    [projectId]
  );

  const handleSaveToDb = () => {
    if (!projectId) return;
    startTransition(async () => {
      await updateProjectArchitecture(projectId, JSON.stringify({ nodes, edges }));
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    });
  };

  return (
    <div className="h-screen flex flex-col bg-muted/20">
      {/* Top bar */}
      <header className="h-14 border-b bg-background px-6 flex items-center justify-between flex-none">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="icon-sm" render={<Link href={projectId ? `/projects/${projectId}` : "/"} />} nativeButton={false}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center space-x-2">
            <Sparkles className="h-4 w-4 text-purple-500" />
            <h1 className="font-bold text-base tracking-tight">
              {projectName ? `Ajatushautomo: ${projectName}` : "Arkkitehtuurin Hiekkalaatikko"}
            </h1>
          </div>
          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded font-mono">
            Interaktiivinen Suunnittelu
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {projectId ? (
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
            <Button variant="outline" size="sm" disabled title="Luo uusi projekti tallentaaksesi">
              <Save className="mr-1.5 h-3.5 w-3.5" />
              Tallenna & Aloita Rakentaminen (Tulossa)
            </Button>
          )}
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 min-h-0 p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Architecture Canvas (8 cols) */}
        <div className="lg:col-span-8 h-full flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-muted-foreground">Visuaalinen Kaavio</h2>
            <span className="text-xs text-muted-foreground">
              {nodes.length} komponenttia kaaviossa
            </span>
          </div>
          <div className="flex-1 min-h-0">
            <ArchitectureCanvas
              nodes={nodes}
              edges={edges}
              onNodesChange={setNodes}
              onEdgesChange={setEdges}
              hideHeader={true}
            />
          </div>
        </div>

        {/* Right: AI Chat Co-Pilot (4 cols) */}
        <div className="lg:col-span-4 h-full flex flex-col">
          <ChatSidebar
            initialPrompt={initialPrompt}
            onArchitectureUpdate={handleArchitectureUpdate}
          />
        </div>
      </div>
    </div>
  );
}
