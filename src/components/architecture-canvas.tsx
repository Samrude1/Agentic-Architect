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
  onNodesChange?: (nodes: Node[]) => void;
  onEdgesChange?: (edges: Edge[]) => void;
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
  onNodesChange: notifyNodesChange,
  onEdgesChange: notifyEdgesChange,
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
      <div className="flex-1 border rounded-md overflow-hidden bg-background">
        <ReactFlow
          nodes={internalNodes}
          onNodesChange={handleNodesChange}
          edges={internalEdges}
          onEdgesChange={handleEdgesChange}
          fitView
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}
