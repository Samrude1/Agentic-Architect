import { Node, Edge } from "@xyflow/react";

export interface WorkspaceContext {
  activeTab: "canvas" | "schema" | "api" | "ui";
  projectId?: string;
  projectName?: string;
  targetPath?: string;
  nodes: Node[];
  edges: Edge[];
  gateStatus: {
    hasSchema: boolean;
    hasApi: boolean;
    hasUi: boolean;
    schemaPreview?: string;
    apiPreview?: string;
    uiPreview?: string;
  };
  latestAudit?: {
    type: "security" | "optimization";
    grade: string;
    score: number;
    title: string;
    summary: string;
    criticalFindings: Array<{
      title: string;
      detail: string;
      recommendation: string;
    }>;
  } | null;
}

export interface GateCodeUpdatePayload {
  gate: "gate1" | "gate2" | "gate3";
  code: string;
  summary?: string;
}
