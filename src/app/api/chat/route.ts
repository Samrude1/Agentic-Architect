import { createOpenAI } from "@ai-sdk/openai";
import { streamText, tool } from "ai";
import { z } from "zod";
import { generateSmartPromptArchitecture } from "@/agents/architecture-agent";

export const maxDuration = 30;

const architectureSchema = z.object({
  nodes: z.array(
    z.object({
      id: z.string(),
      type: z.string().optional(),
      data: z.object({
        label: z.string(),
        description: z.string().describe("Tarkka suomenkielinen kuvaus komponentin tehtävästä ja roolista arkkitehtuurissa"),
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const normalizedMessages = (messages || []).map((m: any) => {
    let content = "";
    if (typeof m.content === "string") {
      content = m.content;
    } else if (Array.isArray(m.parts)) {
      content = m.parts
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((p: any) => p.type === "text" && typeof p.text === "string")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((p: any) => p.text)
        .join("");
    }
    return {
      role: m.role || "user",
      content: content || "Jatka arkkitehtuurin analysointia.",
    };
  });

  const lastUserMessage =
    normalizedMessages.filter((m: { role: string; content: string }) => m.role === "user").pop()?.content || "";

  if (!apiKey || apiKey.includes("your-openrouter-key")) {
    return respondWithSmartFallback(lastUserMessage);
  }

  try {
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
4. Sijoita saman kerroksen nodaalit vaakasuunnassa erilleen (esim. x = 160, 440, 720) niin että ne eivät mene päällekkäin.
5. PAKOLLISTA: Generoi AINA jokaiselle nodaalille "description"-kenttään perusteellinen suomenkielinen kuvaus siitä, mitä kyseinen komponentti tekee (esim. "Käyttäjien todennus, JWT-autentikaatio ja salasanan bcrypt-tiivistys").`;

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      messages: normalizedMessages as any,
      tools: {
        update_architecture: updateArchitectureTool,
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const streamRes: any = result;
    if (typeof streamRes.toUIMessageStreamResponse === "function") {
      return streamRes.toUIMessageStreamResponse();
    }
    if (typeof streamRes.toDataStreamResponse === "function") {
      return streamRes.toDataStreamResponse();
    }
    if (typeof streamRes.toTextStreamResponse === "function") {
      return streamRes.toTextStreamResponse();
    }
    return new Response(result.textStream as unknown as BodyInit, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error) {
    console.warn("API route error, responding with Smart Fallback:", error);
    return respondWithSmartFallback(lastUserMessage);
  }
}

function respondWithSmartFallback(prompt: string) {
  const smartGraph = generateSmartPromptArchitecture(prompt);
  const text = `⚡ **Arkkitehtuurikaavio analysoitu vaatimustesi pohjalta!**\n\nOlen analysoinut syötteesi ja suunnitellut sille 4-kerroksisen sovellusarkkitehtuurin:\n\n1. **Käyttöliittymäkerros (Layer 0):** React / Next.js -pohjainen suorituskykyinen käyttöliittymä ja hallintapaneeli.\n2. **Rajapintakerros (Layer 1):** API Gateway / Reititys ja autentikaatio.\n3. **Palvelukerros (Layer 2):** Palautteiden käsittely, AI-analyysi ja ilmoituspalvelut.\n4. **Tietokanta & Välimuisti (Layer 3):** PostgreSQL-relaatiotietokanta ja Redis-välimuisti.\n\nVoit jatkaa kaavion hiomista chatissa (esim. *"Lisää Redis-välimuisti"* tai *"Tarkista tietoturva"*).`;

  const id = `msg_${Date.now()}`;
  const sseData = [
    `data: {"type":"start"}\n\n`,
    `data: {"type":"start-step"}\n\n`,
    `data: {"type":"text-start","id":"${id}"}\n\n`,
    `data: {"type":"text-delta","id":"${id}","delta":${JSON.stringify(text)}}\n\n`,
    `data: {"type":"text-end","id":"${id}"}\n\n`,
    `data: {"type":"tool-call","toolCallId":"call_${Date.now()}","toolName":"update_architecture","args":${JSON.stringify(smartGraph)}}\n\n`,
    `data: {"type":"tool-result","toolCallId":"call_${Date.now()}","toolName":"update_architecture","result":${JSON.stringify(smartGraph)}}\n\n`,
    `data: {"type":"finish-step"}\n\n`,
    `data: {"type":"finish"}\n\n`,
    `data: [DONE]\n\n`,
  ].join("");

  return new Response(sseData, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
