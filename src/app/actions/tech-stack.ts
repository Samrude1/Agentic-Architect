"use server";

import OpenAI from "openai";
import { writeProjectFileToDisk } from "@/app/actions/codegen";

export interface EnvVariableSpec {
  key: string;
  description: string;
  sampleValue: string;
  whereToGet: string;
  required: boolean;
}

export interface TechStackProfile {
  tier: "lightweight" | "standard" | "heavy";
  tierLabel: string;
  database: {
    needed: boolean;
    type: "none" | "sqlite" | "postgresql";
    reason: string;
  };
  envVariables: EnvVariableSpec[];
  envExampleContent: string;
  summary: string;
  guidance: string;
}

/**
 * Deterministic, intelligent rule engine for technology stack and environment variable inference.
 */
function inferFallbackTechStack(prompt: string, _architectureJson?: string): TechStackProfile {
  const p = prompt.toLowerCase();

  // Keyword categorization
  const isLightweightGameOrTool =
    p.includes("peli") ||
    p.includes("game") ||
    p.includes("laskin") ||
    p.includes("calculator") ||
    p.includes("muunnin") ||
    p.includes("converter") ||
    p.includes("landing") ||
    p.includes("portfolio") ||
    p.includes("kello") ||
    p.includes("timer");

  const hasAuthOrUsers =
    /\b(user|users|auth|login)\b/i.test(p) ||
    p.includes("käyttäjä") ||
    p.includes("kirjautu") ||
    p.includes("profiili");

  const hasPayments =
    p.includes("stripe") ||
    p.includes("payment") ||
    p.includes("maksu") ||
    p.includes("tilaus") ||
    p.includes("subscription") ||
    p.includes("checkout") ||
    p.includes("billing");

  const hasAi =
    /\b(ai|llm|gpt|claude|gemini|rag)\b/i.test(p) ||
    p.includes("openai") ||
    p.includes("openrouter") ||
    p.includes("tekoäly") ||
    p.includes("tekoaly") ||
    p.includes("kielimalli");

  const hasEmail =
    p.includes("email") ||
    p.includes("sähköposti") ||
    p.includes("resend") ||
    p.includes("sendgrid") ||
    p.includes("newsletter") ||
    p.includes("uutiskirje");

  // Determine Tier
  let tier: "lightweight" | "standard" | "heavy" = "standard";
  if (isLightweightGameOrTool && !hasPayments && !hasAi && !hasAuthOrUsers) {
    tier = "lightweight";
  } else if (hasPayments || hasAi || (hasAuthOrUsers && hasEmail)) {
    tier = "heavy";
  }

  // Determine Database Recommendation
  let dbNeeded = true;
  let dbType: "none" | "sqlite" | "postgresql" = "sqlite";
  let dbReason = "";

  if (tier === "lightweight") {
    dbNeeded = false;
    dbType = "none";
    dbReason =
      "Tämä sovellus on kevyt client-side -työkalu. Et tarvitse erillistä palvelintietokantaa – voit tallentaa tilan selaimen LocalStorageen tai React-tilaan.";
  } else if (tier === "heavy" && hasPayments) {
    dbType = "postgresql";
    dbReason =
      "Monikäyttäjäinen SaaS- tai maksupalvelu hyötyy vahvasta PostgreSQL-relaatiotietokannasta (esim. Supabase tai Neon) tiukkojen tietokantatransaktioiden vuoksi.";
  } else {
    dbType = "sqlite";
    dbReason =
      "SQLite on paras ja nopein valinta paikalliseen tiedostopohjaiseen kehitykseen: se ei vaadi erillisen tietokantapalvelimen asennusta ja toimii 0-konfiguraatiolla.";
  }

  // Determine Required Environment Variables
  const envVars: EnvVariableSpec[] = [];

  if (dbNeeded) {
    if (dbType === "sqlite") {
      envVars.push({
        key: "DATABASE_URL",
        description: "Paikallisen SQLite-tietokantatiedoston osoite",
        sampleValue: 'file:./dev.db',
        whereToGet: "Määritetään automaattisesti paikalliseen tiedostoon.",
        required: true,
      });
    } else {
      envVars.push({
        key: "DATABASE_URL",
        description: "PostgreSQL-tietokannan yhteysosoite (connection string)",
        sampleValue: 'postgresql://postgres:salasana@localhost:5432/sovellus?schema=public',
        whereToGet: "Luo ilmainen tietokanta osoitteessa supabase.com tai neon.tech.",
        required: true,
      });
    }
  }

  if (hasAuthOrUsers) {
    envVars.push({
      key: "NEXTAUTH_SECRET",
      description: "Istuntotokeneiden ja evästeiden salausavain",
      sampleValue: "your-random-32-char-secret-key",
      whereToGet: "Luo satunnainen avain komennolla `openssl rand -base64 32`.",
      required: true,
    });
    envVars.push({
      key: "NEXTAUTH_URL",
      description: "Sovelluksen perusosoite autentikaation uudelleenohjauksille",
      sampleValue: "http://localhost:3000",
      whereToGet: "Paikallisesti kehittäessä http://localhost:3000.",
      required: true,
    });
  }

  if (hasAi) {
    envVars.push({
      key: "OPENROUTER_API_KEY",
      description: "OpenRouter- tai OpenAI-yhteysavain tekoälymallien kutsumiseen",
      sampleValue: "your-openrouter-api-key-here",
      whereToGet: "Hanki avain osoitteesta openrouter.ai/keys tai platform.openai.com.",
      required: true,
    });
  }

  if (hasPayments) {
    envVars.push({
      key: "STRIPE_SECRET_KEY",
      description: "Stripe-maksupalvelun salainen API-avain",
      sampleValue: "your-stripe-secret-key-here",
      whereToGet: "Luo maksuton kehitystili ja kopioi avain osoitteesta dashboard.stripe.com/apikeys.",
      required: true,
    });
    envVars.push({
      key: "STRIPE_WEBHOOK_SECRET",
      description: "Maksutapahtumien webhook-allekirjoituksen varmenne",
      sampleValue: "your-stripe-webhook-secret-here",
      whereToGet: "Saat tämän Stripe CLI -työkalulla tai Stripe Dashboardin Webhooks-osiosta.",
      required: false,
    });
  }

  if (hasEmail) {
    envVars.push({
      key: "RESEND_API_KEY",
      description: "Resend-sähköpostipalvelun API-avain transaktiosähköposteille",
      sampleValue: "your-resend-api-key-here",
      whereToGet: "Luo ilmainen tunnus osoitteessa resend.com ja luo API-avain.",
      required: true,
    });
  }

  // Generate .env.local.example file content
  let envExampleContent = "";
  if (envVars.length === 0) {
    envExampleContent = `# .env.local.example
# Tämä projekti on kevyt sovellus (Lightweight Client App).
# Et tarvitse erillisiä ympäristömuuttujia tai ulkoisia API-avaimia suorittaaksesi sovelluksen!
`;
  } else {
    envExampleContent = `# .env.local.example
# Kopioi tämä tiedosto nimellä .env.local ja aseta omat avaimesi:
# cp .env.local.example .env.local
# HUOM: Älä koskaan kommitoi todellisia salaisia avaimia versionhallintaan!

${envVars
  .map((ev) => `# ${ev.description}\n# Hanki avain: ${ev.whereToGet}\n${ev.key}="${ev.sampleValue}"\n`)
  .join("\n")}`;
  }

  let tierLabel = "🟡 Standardi Fullstack";
  let summary = "Käyttää standardia Next.js-palvelinrakennetta ja kevyttä SQLite-tietokantaa.";
  let guidance =
    "Projekti käyttää vakiintunutta täyden pinon arkkitehtuuria. Voit ajaa tietokannan paikallisesti ilman ulkoisia pilvipalveluita.";

  if (tier === "lightweight") {
    tierLabel = "🟢 Kevyt sovellus (Lightweight)";
    summary = "Kevyt client-side -sovellus ilman raskasta taustajärjestelmää tai tietokantaa.";
    guidance =
      "Tämä sovellus ei tarvitse tietokanta-asennuksia tai API-avaimia. Se toimii heti suoraan selaimessa!";
  } else if (tier === "heavy") {
    tierLabel = "🟣 Vaativa SaaS & AI (Enterprise)";
    summary = "Vaativa fullstack-järjestelmä, joka vaatii ulkoisia palveluita ja API-avaimia.";
    guidance =
      "Tämä sovellus vaatii toimiakseen ulkoisia palveluita (kuten Stripe tai AI). Muista kopioida .env.local.example ja asettaa tarvittavat avaimet ennen tuotantoon viemistä.";
  }

  return {
    tier,
    tierLabel,
    database: {
      needed: dbNeeded,
      type: dbType,
      reason: dbReason,
    },
    envVariables: envVars,
    envExampleContent,
    summary,
    guidance,
  };
}

/**
 * Infer technology stack, database necessity, and generate .env.local.example.
 * Server Action (must be async).
 */
export async function inferTechStackAndEnv(
  prompt: string,
  architectureJson?: string
): Promise<TechStackProfile> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (apiKey && !apiKey.includes("your-openrouter-key") && prompt.trim().length > 10) {
    try {
      const openai = new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey,
        defaultHeaders: {
          "HTTP-Referer": "https://github.com/Samrude1/Agentic-Architect",
          "X-Title": "Agentic Architect",
        },
      });

      const systemPrompt = `You are a Principal Software Architect.
Analyze the user's project idea and recommend the leanest and most effective technology stack and environment variables.

Rules:
- For simple games, calculators, converters, or landing pages: tier is "lightweight", database.needed is false, database.type is "none". Do NOT require external API keys.
- For typical CRUD or team apps: tier is "standard", database is "sqlite".
- For payments, AI integrations, or complex multi-tenant apps: tier is "heavy", database is "postgresql".

Respond ONLY with valid JSON in this exact structure without markdown backticks:
{
  "tier": "lightweight|standard|heavy",
  "tierLabel": "🟢 Kevyt sovellus|🟡 Standardi Fullstack|🟣 Vaativa SaaS & AI",
  "database": {
    "needed": true|false,
    "type": "none|sqlite|postgresql",
    "reason": "Selitys suomeksi miksi tämä tietokanta valittiin"
  },
  "envVariables": [
    {
      "key": "KEY_NAME",
      "description": "Kuvaus suomeksi",
      "sampleValue": "esimerkki",
      "whereToGet": "Mistä avaimen saa suomeksi",
      "required": true
    }
  ],
  "envExampleContent": "Koko .env.local.example tiedoston teksti",
  "summary": "Yhteenveto suomeksi",
  "guidance": "Opastus käyttäjälle suomeksi"
}`;

      const response = await openai.chat.completions.create({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `User project idea: ${prompt}\nArchitecture: ${architectureJson || "none"}` },
        ],
        temperature: 0.2,
      });

      const raw = response.choices[0]?.message?.content?.trim() || "";
      const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned);

      if (parsed.tier && parsed.database) {
        return parsed as TechStackProfile;
      }
    } catch (err) {
      console.warn("AI tech stack inference failed, using smart fallback:", err);
    }
  }

  return inferFallbackTechStack(prompt, architectureJson);
}

/**
 * Write .env.local.example to the project's target homebase directory.
 * Server Action (must be async).
 */
export async function writeEnvExampleToDisk(
  projectId: string,
  content: string
): Promise<{ success: boolean; fullPath?: string; error?: string }> {
  return await writeProjectFileToDisk(projectId, ".env.local.example", content);
}
