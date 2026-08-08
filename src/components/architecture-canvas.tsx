"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
  Node,
  Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Button } from "@/components/ui/button";
import { generateRealArchitecture, updateProjectArchitecture } from "@/app/actions/project";
import { Loader2, Sparkles } from "lucide-react";

interface ArchitectureCanvasProps {
  projectId?: string;
  projectPrompt?: string | null;
  initialArchitecture?: string | null;
  nodes?: Node[];
  edges?: Edge[];
  selectedNodeId?: string | null;
  onNodesChange?: (nodes: Node[]) => void;
  onEdgesChange?: (edges: Edge[]) => void;
  onNodeSelect?: (node: Node | null) => void;
  hideHeader?: boolean;
}

const safeParseArchitecture = (initialArchitecture?: string | null) => {
  if (!initialArchitecture) return { nodes: [], edges: [] };
  try {
    return JSON.parse(initialArchitecture);
  } catch (error) {
    console.error("Failed to parse architecture JSON:", error);
    return { nodes: [], edges: [] };
  }
};

export function ArchitectureCanvas({
  projectId,
  projectPrompt,
  initialArchitecture,
  nodes: controlledNodes,
  edges: controlledEdges,
  selectedNodeId,
  onNodesChange: notifyNodesChange,
  onEdgesChange: notifyEdgesChange,
  onNodeSelect,
  hideHeader = false,
}: ArchitectureCanvasProps) {
  const parsed = useMemo(
    () => safeParseArchitecture(initialArchitecture),
    [initialArchitecture]
  );

  const [internalNodes, setInternalNodes] = useState<Node[]>(controlledNodes || parsed.nodes);
  const [internalEdges, setInternalEdges] = useState<Edge[]>(controlledEdges || parsed.edges);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Synchronize when controlled nodes/edges change externally (e.g., from AI chat tool call)
  useEffect(() => {
    if (controlledNodes) {
      setInternalNodes(controlledNodes);
    }
  }, [controlledNodes]);

  useEffect(() => {
    if (controlledEdges) {
      setInternalEdges(controlledEdges);
    }
  }, [controlledEdges]);

  // Visually highlight selected node if selectedNodeId is passed
  const styledNodes = useMemo(() => {
    if (!selectedNodeId) return internalNodes;
    return internalNodes.map((n) => ({
      ...n,
      style: {
        ...n.style,
        border: n.id === selectedNodeId ? "2px solid #a855f7" : undefined,
        boxShadow: n.id === selectedNodeId ? "0 0 12px rgba(168, 85, 247, 0.4)" : undefined,
      },
    }));
  }, [internalNodes, selectedNodeId]);

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setInternalNodes((nds) => {
        const updated = applyNodeChanges(changes, nds);
        queueMicrotask(() => {
          notifyNodesChange?.(updated);
        });
        return updated;
      });
    },
    [notifyNodesChange]
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setInternalEdges((eds) => {
        const updated = applyEdgeChanges(changes, eds);
        queueMicrotask(() => {
          notifyEdgesChange?.(updated);
        });
        return updated;
      });
    },
    [notifyEdgesChange]
  );

  const handleGenerate = async () => {
    if (!projectPrompt) return;
    setIsGenerating(true);
    try {
      const data = await generateRealArchitecture(projectPrompt);
      setInternalNodes(data.nodes);
      setInternalEdges(data.edges);
      notifyNodesChange?.(data.nodes);
      notifyEdgesChange?.(data.edges);

      if (projectId) {
        await updateProjectArchitecture(projectId, JSON.stringify(data));
      }
    } catch (error) {
      console.error("Error generating architecture:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!projectId) return;
    setIsSaving(true);
    try {
      const architecture = JSON.stringify({ nodes: internalNodes, edges: internalEdges });
      await updateProjectArchitecture(projectId, architecture);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {!hideHeader && (
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Visuaalinen Arkkitehtuuri</h2>
          <div className="space-x-2">
            <Button variant="outline" onClick={handleGenerate} disabled={isGenerating || isSaving}>
              {isGenerating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4 text-purple-500" />
              )}
              Generoi AI Arkkitehtuuri
            </Button>
            {projectId && (
              <Button onClick={handleSave} disabled={isGenerating || isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Tallenna
              </Button>
            )}
          </div>
        </div>
      )}
      <div className="flex-1 border rounded-md overflow-hidden bg-background relative">
        {isGenerating && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center space-x-3 bg-background/95 backdrop-blur-md px-5 py-2.5 rounded-full border border-purple-500/50 shadow-[0_0_25px_rgba(168,85,247,0.35)] animate-bounce">
            <div className="relative flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-purple-500 animate-spin" />
            </div>
            <span className="text-base font-bold text-foreground tracking-tight">
              ⚡ Tekoäly-arkkitehti luo ja optimoi kaaviota...
            </span>
          </div>
        )}
        <ReactFlow
          nodes={styledNodes}
          onNodesChange={handleNodesChange}
          edges={internalEdges}
          onEdgesChange={handleEdgesChange}
          onNodeClick={(_event, node) => onNodeSelect?.(node)}
          onPaneClick={() => onNodeSelect?.(null)}
          fitView
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}
