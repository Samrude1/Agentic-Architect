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

  if (apiKey && !apiKey.includes("your-openrouter-key")) {
    try {
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
- Distribute nodes horizontally per layer (e.g. x = 150, 430, 710) so nodes never overlap.

Return ONLY a JSON object with this structure:
{
  "nodes": [
    {
      "id": "1",
      "type": "input",
      "data": { "label": "Next.js Web App", "tech": "React/Next.js", "description": "Käyttöliittymä tehtävien hallintaan ja selaamiseen" },
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

      const response = await openai.chat.completions.create({
        model: "openai/gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Design the architecture for this project requirement: "${prompt}"` },
        ],
        temperature: 0.2,
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        const rawJson = JSON.parse(content);
        const parsed = ArchitectureResponseSchema.parse(rawJson);
        const normalizedNodes = autoLayoutNodes(parsed.nodes);
        return {
          nodes: normalizedNodes,
          edges: parsed.edges,
        };
      }
    } catch (error) {
      console.warn("OpenRouter API unavailable or quota limit reached. Activating Smart Prompt Architecture Generator:", error);
    }
  }

  // Fallback: Smart Prompt-Based Architecture Engine
  return generateSmartPromptArchitecture(prompt);
}

/**
 * Intelligently generates a multi-tiered, tailored architecture graph from the prompt text
 */
export function generateSmartPromptArchitecture(prompt: string): ArchitectureGraph {
  const p = prompt.toLowerCase();
  const nodes: ArchitectureNode[] = [];
  const edges: ArchitectureEdge[] = [];

  // --- Layer 0: Client / UI (y = 50) ---
  if (p.includes("mobiili") || p.includes("mobile") || p.includes("ios") || p.includes("android")) {
    nodes.push({
      id: "client-mobile",
      type: "input",
      data: {
        label: "Mobile App UI",
        tech: "React Native / Expo",
        description: "Mobiilikäyttöliittymä loppukäyttäjille",
      },
      position: { x: 150, y: 50 },
    });
  }

  const clientLabel = p.includes("corporate") || p.includes("clean")
    ? "Corporate Clean Web UI"
    : p.includes("admin") || p.includes("hallinta")
    ? "Admin & User Web Portal"
    : "Next.js Web App";

  nodes.push({
    id: "client-web",
    type: "input",
    data: {
      label: clientLabel,
      tech: "React / Next.js App Router",
      description: "Interaktiivinen käyttöliittymä ja sivusto",
    },
    position: { x: 430, y: 50 },
  });

  // --- Layer 1: API / Gateway / Auth (y = 200) ---
  let hasAuth = p.includes("käyttäjä") || p.includes("kirjautu") || p.includes("auth") || p.includes("salasana") || p.includes("tilit");
  
  if (hasAuth) {
    nodes.push({
      id: "gw-auth",
      type: "default",
      data: {
        label: "Auth & Identity Service",
        tech: "NextAuth.js / bcrypt",
        description: "Käyttäjätilien hallinta, autentikaatio & JWT-poletit",
      },
      position: { x: 150, y: 200 },
    });
  }

  const apiLabel = p.includes("graphql")
    ? "GraphQL API Gateway"
    : p.includes("rest")
    ? "REST API Router"
    : "App API Gateway";

  nodes.push({
    id: "gw-api",
    type: "default",
    data: {
      label: apiLabel,
      tech: "Next.js Server Actions / API Routes",
      description: "Syötteiden tarkastus, reititys ja API-päätepisteet",
    },
    position: { x: 430, y: 200 },
  });

  // --- Layer 2: Business Logic / Microservices (y = 350) ---
  if (p.includes("todo") || p.includes("tehtäv")) {
    nodes.push({
      id: "svc-todo",
      type: "default",
      data: {
        label: "Todo Task Manager Engine",
        tech: "CRUD Task Service",
        description: "Tehtävien lisäys, Muokkaus, Merkintä & Poisto",
      },
      position: { x: 290, y: 350 },
    });
  } else if (p.includes("maksu") || p.includes("stripe")) {
    nodes.push({
      id: "svc-payment",
      type: "default",
      data: {
        label: "Payment & Billing Engine",
        tech: "Stripe SDK / Webhooks",
        description: "Maksutapahtumat ja tilausten hallinta",
      },
      position: { x: 290, y: 350 },
    });
  } else {
    nodes.push({
      id: "svc-core",
      type: "default",
      data: {
        label: "Core Business Service",
        tech: "Node.js Core Logic",
        description: "Sovelluslogiikka ja prosessointi",
      },
      position: { x: 290, y: 350 },
    });
  }

  // --- Layer 3: Database & Storage (y = 500) ---
  let dbLabel = "Relational Database";
  let dbTech = "Prisma ORM";

  if (p.includes("postgres") || p.includes("postgresql")) {
    dbLabel = "PostgreSQL Database";
    dbTech = "Prisma / PostgreSQL";
  } else if (p.includes("sqlite") || p.includes("paikallinen") || p.includes("omalla koneella")) {
    dbLabel = "SQLite Local Database";
    dbTech = "Prisma / SQLite (dev.db)";
  } else if (p.includes("mongo")) {
    dbLabel = "MongoDB Document DB";
    dbTech = "Mongoose / Mongo Atlas";
  }

  nodes.push({
    id: "db-main",
    type: "output",
    data: {
      label: dbLabel,
      tech: dbTech,
      description: "Relaatiotietokanta datan pysyvään tallennukseen",
    },
    position: { x: 290, y: 500 },
  });

  if (p.includes("redis") || p.includes("cache") || p.includes("välimuisti")) {
    nodes.push({
      id: "db-cache",
      type: "output",
      data: {
        label: "Redis Cache Store",
        tech: "Upstash / Redis",
        description: "Nopea välimuisti istunnoille ja hautuille",
      },
      position: { x: 570, y: 500 },
    });
  }

  // --- Construct Edges with Animated Visual Connections ---
  // Layer 0 -> Layer 1
  nodes.filter(n => n.type === "input").forEach(clientNode => {
    if (hasAuth) {
      edges.push({
        id: `e-${clientNode.id}-auth`,
        source: clientNode.id,
        target: "gw-auth",
        label: "Kirjautuminen",
        animated: true,
      });
    }
    edges.push({
      id: `e-${clientNode.id}-api`,
      source: clientNode.id,
      target: "gw-api",
      label: "HTTPS Pyynnöt",
      animated: true,
    });
  });

  // Layer 1 -> Layer 2
  const serviceNode = nodes.find(n => n.position.y === 350);
  if (serviceNode) {
    if (hasAuth) {
      edges.push({
        id: "e-auth-svc",
        source: "gw-auth",
        target: serviceNode.id,
        label: "Validoitu Istunto",
        animated: true,
      });
    }
    edges.push({
      id: "e-api-svc",
      source: "gw-api",
      target: serviceNode.id,
      label: "Komennot & Haut",
      animated: true,
    });

    // Layer 2 -> Layer 3
    nodes.filter(n => n.type === "output").forEach(dbNode => {
      edges.push({
        id: `e-svc-${dbNode.id}`,
        source: serviceNode.id,
        target: dbNode.id,
        label: "SQL / Prisma Kyselyt",
        animated: true,
      });
    });
  }

  return {
    nodes: autoLayoutNodes(nodes),
    edges,
  };
}

function autoLayoutNodes(nodes: ArchitectureNode[]): ArchitectureNode[] {
  const layerCounts: Record<number, number> = {};

  return nodes.map((node) => {
    let y = node.position?.y ?? 100;
    let tier = 0;
    if (y > 425 || node.type === "output") tier = 3;
    else if (y > 275) tier = 2;
    else if (y > 125) tier = 1;
    else tier = 0;

    const targetY = tier === 0 ? 50 : tier === 1 ? 200 : tier === 2 ? 350 : 500;
    const indexInTier = layerCounts[tier] || 0;
    layerCounts[tier] = indexInTier + 1;

    const targetX = 160 + indexInTier * 280;

    return {
      ...node,
      position: {
        x: targetX,
        y: targetY,
      },
    };
  });
}
