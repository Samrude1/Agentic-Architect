import OpenAI from "openai";
import { z } from "zod";

export interface ArchitectureNode {
  id: string;
  type?: "input" | "default" | "output";
  data: {
    label: string;
    description?: string;
    tech?: string;
  };
  position: {
    x: number;
    y: number;
  };
}

export interface ArchitectureEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
}

export interface ArchitectureGraph {
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
}

const ArchitectureResponseSchema = z.object({
  nodes: z.array(
    z.object({
      id: z.string(),
      type: z.enum(["input", "default", "output"]).optional().default("default"),
      data: z.object({
        label: z.string(),
        description: z.string().optional(),
        tech: z.string().optional(),
      }),
      position: z
        .object({
          x: z.number(),
          y: z.number(),
        })
        .optional()
        .default({ x: 100, y: 100 }),
    })
  ),
  edges: z.array(
    z.object({
      id: z.string(),
      source: z.string(),
      target: z.string(),
      label: z.string().optional(),
      animated: z.boolean().optional().default(true),
    })
  ),
});

export async function generateArchitectureDiagram(prompt: string): Promise<ArchitectureGraph> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured in environment variables.");
  }

  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey,
    defaultHeaders: {
      "HTTP-Referer": "https://github.com/Samrude1/Agentic-Architect",
      "X-Title": "Agentic Architect",
    },
  });

  const systemPrompt = `You are a Principal Software Architect AI.
Your task is to design a clear, scalable software architecture diagram based on the user's project requirements.
Return a valid JSON object matching the React Flow format containing "nodes" and "edges".

Architecture Guidelines & Layers:
- Layer 0 (Client/UI, y = 50): Frontends, Mobile Apps, Web Apps, Dashboards. (type: "input")
- Layer 1 (API/Gateway, y = 200): REST API, GraphQL, API Gateway, Auth Services. (type: "default")
- Layer 2 (Services/Workers, y = 350): Core Business Logic, Microservices, Async Jobs, AI Engines. (type: "default")
- Layer 3 (Data/Storage/External, y = 500): Databases, Cache, Object Storage, External APIs (Stripe, Twilio). (type: "output")

Positioning:
- Distribute nodes horizontally per layer (e.g. x = 100, 350, 600) so nodes never overlap.

Return ONLY a JSON object with this structure:
{
  "nodes": [
    {
      "id": "1",
      "type": "input",
      "data": { "label": "Next.js Web App", "tech": "React/Next.js" },
      "position": { "x": 250, "y": 50 }
    }
  ],
  "edges": [
    {
      "id": "e1-2",
      "source": "1",
      "target": "2",
      "label": "HTTPS",
      "animated": true
    }
  ]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "openai/gpt-4o-mini", // Fallback gracefully if high tier is not available on OpenRouter
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Design the architecture for this project requirement: "${prompt}"` },
      ],
      temperature: 0.2,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("AI returned empty response.");
    }

    const rawJson = JSON.parse(content);
    const parsed = ArchitectureResponseSchema.parse(rawJson);

    // Normalize node positions to avoid any overlapping
    const normalizedNodes = autoLayoutNodes(parsed.nodes);

    return {
      nodes: normalizedNodes,
      edges: parsed.edges,
    };
  } catch (error) {
    console.error("Architecture agent error:", error);
    throw error;
  }
}

/**
 * Ensures node positions are evenly distributed per tier to prevent overlapping
 */
function autoLayoutNodes(nodes: ArchitectureNode[]): ArchitectureNode[] {
  const layerCounts: Record<number, number> = {};

  return nodes.map((node) => {
    let y = node.position?.y ?? 100;
    // Map y to nearest standard tier (50, 200, 350, 500)
    let tier = 0;
    if (y > 425 || node.type === "output") tier = 3;
    else if (y > 275) tier = 2;
    else if (y > 125) tier = 1;
    else tier = 0;

    const targetY = tier === 0 ? 50 : tier === 1 ? 200 : tier === 2 ? 350 : 500;
    const indexInTier = layerCounts[tier] || 0;
    layerCounts[tier] = indexInTier + 1;

    // Distribute horizontally
    const targetX = 150 + indexInTier * 280;

    return {
      ...node,
      position: {
        x: targetX,
        y: targetY,
      },
    };
  });
}
