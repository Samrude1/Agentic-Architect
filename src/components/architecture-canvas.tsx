"use client";

import { useState, useCallback } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
  Node,
  Edge
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Button } from "./ui/button";
import { generateMockArchitecture, updateProjectArchitecture } from "../app/actions/project";
import { Loader2 } from "lucide-react";

interface ArchitectureCanvasProps {
  projectId: string;
  projectPrompt: string | null;
  initialArchitecture: string | null;
}

export function ArchitectureCanvas({
  projectId,
  projectPrompt,
  initialArchitecture,
}: ArchitectureCanvasProps) {
  const [nodes, setNodes] = useState<Node[]>(
    initialArchitecture ? JSON.parse(initialArchitecture).nodes : []
  );
  const [edges, setEdges] = useState<Edge[]>(
    initialArchitecture ? JSON.parse(initialArchitecture).edges : []
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const data = await generateMockArchitecture(projectPrompt);
      setNodes(data.nodes);
      setEdges(data.edges);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const architecture = JSON.stringify({ nodes, edges });
      await updateProjectArchitecture(projectId, architecture);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Visual Architecture</h2>
        <div className="space-x-2">
          <Button variant="outline" onClick={handleGenerate} disabled={isGenerating || isSaving}>
            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Generate Architecture
          </Button>
          <Button onClick={handleSave} disabled={isGenerating || isSaving}>
             {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save
          </Button>
        </div>
      </div>
      <div className="flex-1 border rounded-md overflow-hidden bg-background">
        <ReactFlow
          nodes={nodes}
          onNodesChange={onNodesChange}
          edges={edges}
          onEdgesChange={onEdgesChange}
          fitView
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}
