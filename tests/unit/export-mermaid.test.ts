import { describe, it, expect } from "vitest";
import { canvasToMermaid } from "@/lib/mermaid-export";

describe("Mermaid Diagram Export Utility", () => {
  it("should handle empty nodes gracefully", () => {
    const result = canvasToMermaid([], []);
    expect(result).toContain("flowchart TD");
    expect(result).toContain("Tyhjä arkkitehtuurikaavio");
  });

  it("should partition nodes into architectural tier subgraphs", () => {
    const nodes = [
      {
        id: "1",
        type: "input",
        data: { label: "Next.js Web App", tech: "React/Next.js", description: "Frontend dashboard" },
        position: { x: 250, y: 50 },
      },
      {
        id: "2",
        data: { label: "API Gateway", tech: "Route Handlers", description: "Edge routes" },
        position: { x: 250, y: 200 },
      },
      {
        id: "3",
        data: { label: "Task Processing Service", tech: "Node.js Workers", description: "Core logic" },
        position: { x: 250, y: 350 },
      },
      {
        id: "4",
        type: "output",
        data: { label: "SQLite Database", tech: "Prisma ORM", description: "Primary relational store" },
        position: { x: 250, y: 500 },
      },
    ];

    const edges = [
      { id: "e1-2", source: "1", target: "2", label: "HTTPS" },
      { id: "e2-3", source: "2", target: "3", label: "RPC" },
      { id: "e3-4", source: "3", target: "4", label: "SQL" },
    ];

    const result = canvasToMermaid(nodes, edges, { title: "Test Architecture" });

    // Verify title and subgraphs
    expect(result).toContain("%% Title: Test Architecture");
    expect(result).toContain("subgraph sub_client");
    expect(result).toContain("subgraph sub_gateway");
    expect(result).toContain("subgraph sub_services");
    expect(result).toContain("subgraph sub_data");

    // Verify sanitized node IDs and labels
    expect(result).toContain('n_1["<b>Next.js Web App</b><br/><i>React/Next.js</i><br/><small>Frontend dashboard</small>"]');
    expect(result).toContain('n_4["<b>SQLite Database</b><br/><i>Prisma ORM</i><br/><small>Primary relational store</small>"]');

    // Verify edges with labels
    expect(result).toContain('n_1 -->|"HTTPS"| n_2');
    expect(result).toContain('n_2 -->|"RPC"| n_3');
    expect(result).toContain('n_3 -->|"SQL"| n_4');

    // Verify class definitions and assignments
    expect(result).toContain("classDef client");
    expect(result).toContain("class n_1 client;");
    expect(result).toContain("class n_4 data;");
  });

  it("should sanitize brackets, quotes and newlines in node labels to prevent syntax errors", () => {
    const nodes = [
      {
        id: "node-with [special] (characters) \"quotes\"",
        data: {
          label: 'Customer "Portal" [V2] (Beta)\nNext Line',
          tech: "React (Web)",
          description: "Contains {curly} and [square] brackets",
        },
        position: { x: 100, y: 50 },
      },
    ];

    const result = canvasToMermaid(nodes, []);
    expect(result).not.toContain('"quotes"');
    expect(result).not.toContain("[special]");
    expect(result).toContain("Customer 'Portal' V2 Beta Next Line");
    expect(result).toContain("Contains curly and square brackets");
  });
});
