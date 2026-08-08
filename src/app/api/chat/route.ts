import { createOpenAI } from "@ai-sdk/openai";
import { streamText, tool } from "ai";
import { z } from "zod";

export const maxDuration = 30;

const architectureSchema = z.object({
  nodes: z.array(
    z.object({
      id: z.string(),
      type: z.string().optional(),
      data: z.object({
        label: z.string(),
        description: z.string().optional(),
        tech: z.string().optional(),
      }),
      position: z.object({
        x: z.number(),
        y: z.number(),
      }),
    })
  ),
  edges: z.array(
    z.object({
      id: z.string(),
      source: z.string(),
      target: z.string(),
      label: z.string().optional(),
      animated: z.boolean().optional(),
    })
  ),
});

export async function POST(req: Request) {
  const { messages } = await req.json();

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "OPENROUTER_API_KEY missing" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const openrouter = createOpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey,
    headers: {
      "HTTP-Referer": "https://github.com/Samrude1/Agentic-Architect",
      "X-Title": "Agentic Architect",
    },
  });

  const systemPrompt = `Olet kokenut ohjelmistoarkkitehti ja tekoälyavustaja (Co-Pilot). Tehtäväsi on auttaa käyttäjää suunnittelemaan ja hiomaan ohjelmistonsa arkkitehtuuria interaktiivisessa kankaassa (React Flow).
Pidä aina mielessäsi sovelluksen kokonaiskuva ja loppukäyttäjän käyttökokemus.

Ohjeet:
1. Vastaa selkeästi, neuvoen ja ammattimaisesti suomeksi.
2. Kun suunnitelmaan ehdotetaan tai pyydetään muutoksia (esim. lisätään välimuisti, maksunvälittäjä, kirjautuminen tai uusi palvelu), KUTSU AINA "update_architecture"-työkalua päivittääksesi arkkitehtuurikankaan nodaalit ja linkit!
3. Komponenttien kerrokset (Y-koordinaatit):
   - Kerros 0 (Käyttöliittymä / Client, y = 50): Next.js, Mobile App, Admin Dashboard. (type: "input")
   - Kerros 1 (API / Gateway / Auth, y = 200): REST API, GraphQL, Auth Service. (type: "default")
   - Kerros 2 (Palvelut / Taustalogiikka, y = 350): Order Service, Async Worker, AI Engine. (type: "default")
   - Kerros 3 (Tietokannat / Ulkoiset rajapinnat, y = 500): PostgreSQL, Redis, Stripe, S3. (type: "output")
4. Sijoita saman kerroksen nodaalit vaakasuunnassa erilleen (esim. x = 100, 380, 660) niin että ne eivät mene päällekkäin.`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateArchitectureTool: any = tool({
    description: "Päivittää arkkitehtuurikaavion nodaalit (nodes) ja linkit (edges) React Flow -kankaalle.",
    parameters: architectureSchema,
    execute: async (args: z.infer<typeof architectureSchema>) => {
      return args;
    },
  } as never);

  const result = streamText({
    model: openrouter("openai/gpt-4o-mini"),
    system: systemPrompt,
    messages,
    tools: {
      update_architecture: updateArchitectureTool,
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (result as any).toDataStreamResponse();
}
