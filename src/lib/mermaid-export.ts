export interface NodeLike {
  id: string;
  type?: string;
  data?: {
    label?: string;
    description?: string;
    tech?: string;
    [key: string]: unknown;
  };
  position?: {
    x: number;
    y: number;
  };
}

export interface EdgeLike {
  id?: string;
  source: string;
  target: string;
  label?: unknown;
  animated?: boolean;
}

/**
 * Sanitizes an arbitrary string for safe use inside Mermaid node labels.
 */
function sanitizeMermaidText(text: unknown): string {
  if (!text) return "";
  const str = typeof text === "string" ? text : String(text);
  return str
    .replace(/"/g, "'")
    .replace(/[[\]{}()]/g, "")
    .replace(/\n+/g, " ")
    .trim();
}

/**
 * Sanitizes a node ID for use as a Mermaid node identifier (alphanumeric + underscores).
 */
function sanitizeNodeId(id: string): string {
  const cleaned = id.replace(/[^a-zA-Z0-9_]/g, "_");
  return cleaned.length > 0 ? `n_${cleaned}` : "n_node";
}

/**
 * Categorizes a node into an architectural tier based on position.y or node type/data.
 */
function getTierForNode(node: NodeLike): "client" | "gateway" | "services" | "data" {
  const y = node.position?.y ?? 200;
  const label = (node.data?.label || "").toLowerCase();
  const tech = (node.data?.tech || "").toLowerCase();

  if (y <= 120 || node.type === "input" || label.includes("client") || label.includes("app") || label.includes("ui")) {
    return "client";
  }
  if (y <= 280 || label.includes("api") || label.includes("gateway") || label.includes("auth") || tech.includes("rest")) {
    return "gateway";
  }
  if (y <= 420 || label.includes("service") || label.includes("worker") || label.includes("logic") || label.includes("ai")) {
    return "services";
  }
  return "data";
}

/**
 * Converts React Flow nodes and edges into a standardized, beautifully styled Mermaid.js flowchart.
 */
export function canvasToMermaid(
  nodes: NodeLike[],
  edges: EdgeLike[],
  options?: { title?: string; direction?: "TD" | "LR" }
): string {
  if (!nodes || nodes.length === 0) {
    return `%% Mermaid Architecture Diagram\nflowchart TD\n  empty["Tyhjä arkkitehtuurikaavio"]\n`;
  }

  const direction = options?.direction || "TD";
  const title = options?.title ? `%% Title: ${options.title}\n` : "";

  // Group nodes by tier
  const tiers: Record<"client" | "gateway" | "services" | "data", NodeLike[]> = {
    client: [],
    gateway: [],
    services: [],
    data: [],
  };

  for (const node of nodes) {
    const tier = getTierForNode(node);
    tiers[tier].push(node);
  }

  const lines: string[] = [
    title + `flowchart ${direction}`,
    "  %% Modern High-Tech Theme & Classes",
    "  classDef client fill:#3b82f6,stroke:#1d4ed8,stroke-width:2px,color:#ffffff;",
    "  classDef gateway fill:#8b5cf6,stroke:#6d28d9,stroke-width:2px,color:#ffffff;",
    "  classDef service fill:#ec4899,stroke:#be185d,stroke-width:2px,color:#ffffff;",
    "  classDef data fill:#10b981,stroke:#047857,stroke-width:2px,color:#ffffff;",
    "",
  ];

  const tierMeta: Array<{ key: keyof typeof tiers; label: string; class: string }> = [
    { key: "client", label: "💻 Client Layer (UI / Frontend)", class: "client" },
    { key: "gateway", label: "🛡️ Gateway & Auth Layer (API / Edge)", class: "gateway" },
    { key: "services", label: "⚙️ Services & Business Logic (Backend / Workers)", class: "service" },
    { key: "data", label: "💾 Data & Storage Layer (Database / Cache / External)", class: "data" },
  ];

  const nodeClassMap = new Map<string, string>();

  // Render Subgraphs
  for (const { key, label, class: className } of tierMeta) {
    const tierNodes = tiers[key];
    if (tierNodes.length > 0) {
      const subgraphId = `sub_${key}`;
      lines.push(`  subgraph ${subgraphId} ["${label}"]`);
      for (const node of tierNodes) {
        const id = sanitizeNodeId(node.id);
        const nodeLabel = sanitizeMermaidText(node.data?.label || node.id);
        const tech = node.data?.tech ? sanitizeMermaidText(node.data.tech) : "";
        const desc = node.data?.description ? sanitizeMermaidText(node.data.description) : "";

        let display = `<b>${nodeLabel}</b>`;
        if (tech) display += `<br/><i>${tech}</i>`;
        if (desc) display += `<br/><small>${desc}</small>`;

        lines.push(`    ${id}["${display}"]`);
        nodeClassMap.set(id, className);
      }
      lines.push("  end");
      lines.push("");
    }
  }

  // Render Edges
  if (edges && edges.length > 0) {
    lines.push("  %% Connectors & Signal Flows");
    for (const edge of edges) {
      const sourceId = sanitizeNodeId(edge.source);
      const targetId = sanitizeNodeId(edge.target);
      const edgeLabel = edge.label ? sanitizeMermaidText(edge.label) : "";

      if (edgeLabel) {
        lines.push(`  ${sourceId} -->|"${edgeLabel}"| ${targetId}`);
      } else {
        lines.push(`  ${sourceId} --> ${targetId}`);
      }
    }
    lines.push("");
  }

  // Apply Classes
  for (const [id, cls] of nodeClassMap.entries()) {
    lines.push(`  class ${id} ${cls};`);
  }

  return lines.join("\n") + "\n";
}

/**
 * Triggers a client-side download of a text blob as a file.
 */
export function downloadTextFile(filename: string, content: string, mimeType = "text/plain"): void {
  if (typeof window === "undefined") return;
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
