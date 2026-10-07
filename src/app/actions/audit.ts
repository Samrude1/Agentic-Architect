"use server";

import fs from "fs";
import path from "path";
import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import { writeProjectFileToDisk } from "@/app/actions/codegen";

export interface AuditFinding {
  id: string;
  type: "critical" | "warning" | "success" | "info";
  title: string;
  detail: string;
  recommendation: string;
}

export interface AuditReport {
  type: "security" | "optimization";
  title: string;
  score: number; // 0 - 100
  grade: "A" | "B" | "C" | "D" | "F";
  summary: string;
  findings: AuditFinding[];
  timestamp: string;
}

interface AuditNode {
  id: string;
  data?: { label?: string; tech?: string; description?: string };
}

interface AuditEdge {
  source: string;
  target: string;
  label?: string;
}

function calculateGrade(score: number): "A" | "B" | "C" | "D" | "F" {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

/**
 * Fallback security analysis engine when AI key is unavailable or fails.
 */
function runFallbackSecurityAudit(
  nodes: Array<{ id: string; data?: { label?: string; tech?: string; description?: string } }>,
  edges: Array<{ source: string; target: string; label?: string }>,
  prismaSchema?: string,
  apiCode?: string
): AuditReport {
  const findings: AuditFinding[] = [];
  let score = 95;

  const hasAuthInSchema = Boolean(
    prismaSchema &&
      (prismaSchema.includes("passwordHash") ||
        prismaSchema.includes("Session") ||
        prismaSchema.includes("Account") ||
        prismaSchema.toLowerCase().includes("nextauth"))
  );
  const hasAuthNode =
    hasAuthInSchema ||
    nodes.some((n) => {
      const text = `${n.data?.label || ""} ${n.data?.tech || ""} ${n.data?.description || ""}`.toLowerCase();
      return (
        text.includes("auth") ||
        text.includes("login") ||
        text.includes("identity") ||
        text.includes("session")
      );
    });
  const hasDbNode = nodes.some((n) => {
    const text = `${n.data?.label || ""} ${n.data?.tech || ""} ${n.data?.description || ""}`.toLowerCase();
    return (
      text.includes("database") ||
      text.includes("db") ||
      text.includes("postgres") ||
      text.includes("sqlite")
    );
  });

  // Check 1: Authentication layer
  if (!hasAuthNode) {
    score -= 15;
    findings.push({
      id: "sec-auth-missing",
      type: "warning",
      title: "Autentikaatiokerros puuttuu kaaviosta",
      detail: "Arkkitehtuurikaaviossa ei havaittu erillistä autentikaatio- tai käyttäjätunnistuskomponenttia.",
      recommendation: "Lisää arkkitehtuuriin tunnistautumispalvelu (esim. NextAuth, Clerk tai Supabase Auth) suojatuille toiminnoille.",
    });
  } else {
    findings.push({
      id: "sec-auth-present",
      type: "success",
      title: "Käyttäjätunnistus määritelty",
      detail: "Arkkitehtuurissa on huomioitu autentikaatiokerros käyttäjäistuntojen hallintaan.",
      recommendation: "Varmista, että istuntotokeneissa käytetään HttpOnly- ja Secure-evästeitä.",
    });
  }

  // Check 2: API Input Validation (Zod)
  if (apiCode) {
    if (apiCode.includes("z.object") || apiCode.includes("zod")) {
      findings.push({
        id: "sec-zod-present",
        type: "success",
        title: "Syötteiden validointi (Zod) käytössä",
        detail: "API-koodipohjassa käytetään tiukkaa Zod-skeemavalidointia pyyntöjen tarkastamiseen.",
        recommendation: "Pidä validaatiomallit synkronoituna tietokantamallien kanssa.",
      });
    } else {
      score -= 20;
      findings.push({
        id: "sec-zod-missing",
        type: "critical",
        title: "API-pyyntöjen skeemavalidointi puutteellinen",
        detail: "Taustajärjestelmän reiteistä ei löytynyt kattavaa syötteiden validointia (Zod / schema validation).",
        recommendation: "Määritä Zod-skeemat kaikille POST/PUT/PATCH-pyynnöille injektioiden ja virhesyötteiden estämiseksi.",
      });
    }
  } else {
    findings.push({
      id: "sec-api-unbuilt",
      type: "info",
      title: "API-koodia ei ole vielä generoitu",
      detail: "Data Gate 2 (API & Actions) on vielä generoimatta, joten rajapintakohtaista koodianalyysiä ei voitu suorittaa.",
      recommendation: "Generoi ja katselmoi API-koodi Gate 2 -välilehdeltä.",
    });
  }

  // Check 3: Database Security & Secrets
  if (prismaSchema) {
    if (prismaSchema.includes("env(\"DATABASE_URL\")")) {
      findings.push({
        id: "sec-db-env",
        type: "success",
        title: "Tietokantaosoite eristetty ympäristömuuttujaan",
        detail: "Tietokannan yhteysosoite ladataan turvallisesti ympäristömuuttujasta (DATABASE_URL).",
        recommendation: "Varmista, ettei .env-tiedostoa koskaan kommitoida versionhallintaan.",
      });
    }
    if (prismaSchema.toLowerCase().includes("password") && !prismaSchema.toLowerCase().includes("hash")) {
      score -= 15;
      findings.push({
        id: "sec-db-plaintext-pwd",
        type: "warning",
        title: "Tarkista salasanojen tallennusmuoto",
        detail: "Tietokantamallissa havaittiin salasana- tai tunnussarakkeita. Varmista ettei salasanoja tallenneta selväkielisenä.",
        recommendation: "Käytä aina vahvaa hajautusalgoritmia (esim. bcrypt tai argon2) ennen tallennusta.",
      });
    }
  }

  // Check 4: General system isolation
  if (hasDbNode && nodes.length > 1) {
    findings.push({
      id: "sec-isolation-good",
      type: "success",
      title: "Kerrosjaettu arkkitehtuuri",
      detail: "Sovelluksessa on selkeä jaottelu esitys-, logiikka- ja tietokerrosten välillä.",
      recommendation: "Pidä huoli, ettei käyttöliittymä ota suoraa yhteyttä tietokantaan ohi API-rajapinnan.",
    });
  }

  score = Math.max(20, Math.min(100, score));

  return {
    type: "security",
    title: "Tietoturva-auditointi (Security Check)",
    score,
    grade: calculateGrade(score),
    summary:
      score >= 85
        ? "Arkkitehtuurin ja koodipohjan suojaustaso on erinomainen. Keskeiset OWASP-tietoturvakäytännöt ovat kunnossa."
        : "Arkkitehtuurissa havaittiin tärkeitä tietoturvaparannuksia, jotka kannattaa huomioida ennen tuotantovaihetta.",
    findings,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Fallback code and architecture optimization engine.
 */
function runFallbackOptimizationAudit(
  nodes: Array<{ id: string; data?: { label?: string; tech?: string; description?: string } }>,
  edges: Array<{ source: string; target: string; label?: string }>,
  prismaSchema?: string,
  apiCode?: string
): AuditReport {
  const findings: AuditFinding[] = [];
  let score = 90;

  // Check 1: Database indexing
  if (prismaSchema) {
    const hasIndexes = prismaSchema.includes("@@index") || prismaSchema.includes("@unique");
    if (hasIndexes) {
      findings.push({
        id: "opt-db-indexes",
        type: "success",
        title: "Tietokantaindeksit käytössä",
        detail: "Skeemassa on määritelty indeksejä (@unique / @@index), mikä nopeuttaa kyselyitä huomattavasti.",
        recommendation: "Lisää indeksit erityisesti usein haettaville vierasavaimille (Foreign Keys).",
      });
    } else {
      score -= 15;
      findings.push({
        id: "opt-db-no-index",
        type: "warning",
        title: "Hakujen indeksit puuttuvat",
        detail: "Tietokantamalleissa ei havaittu erillisiä @@index-määrityksiä usein haettaville kentille.",
        recommendation: "Lisää @@index([kenttä]) -määritykset tauluihin, joita suodatetaan usein.",
      });
    }
  }

  // Check 2: API Error handling and caching
  if (apiCode) {
    if (apiCode.includes("try {") && apiCode.includes("catch")) {
      findings.push({
        id: "opt-api-trycatch",
        type: "success",
        title: "Rakenteellinen virheenkäsittely",
        detail: "API-reiteissä on asianmukainen try/catch-suojaus odottamattomien virheiden hallitsemiseksi.",
        recommendation: "Käytä yhdenmukaista virhevastemuotoa (esim. { success: false, error: string }).",
      });
    }

    if (apiCode.includes("revalidate") || apiCode.includes("cache")) {
      findings.push({
        id: "opt-api-cache",
        type: "success",
        title: "Välimuistitus ja uudelleenvalidointi",
        detail: "Koodissa hyödynnetään Next.js-välimuistin hallintaa.",
        recommendation: "Varmista sopivat TTL-ajat dynaamiselle datalle.",
      });
    } else {
      score -= 10;
      findings.push({
        id: "opt-api-no-cache",
        type: "info",
        title: "Välimuistituksen tehostusmahdollisuus",
        detail: "API-kutsuissa ei havaittu eksplisiittistä Next.js-välimuistin tai revalidointistrategian määritystä.",
        recommendation: "Käytä Next.js revalidateTag- tai unstable_cache -menetelmiä usein luettavalle datalle.",
      });
    }
  }

  // Check 3: Architecture graph node balance
  if (nodes.length > 8) {
    findings.push({
      id: "opt-arch-modular",
      type: "info",
      title: "Laaja järjestelmäarkkitehtuuri",
      detail: `Kaaviossa on ${nodes.length} komponenttia. Modulaarinen rakenne ehkäisee monoliittiongelmia.`,
      recommendation: "Pidä komponenttien väliset riippuvuussuunnat yksisuuntaisina (unidirectional flow).",
    });
  }

  score = Math.max(25, Math.min(100, score));

  return {
    type: "optimization",
    title: "Suorituskyky & Koodin Optimointi (Optimize Audit)",
    score,
    grade: calculateGrade(score),
    summary:
      score >= 85
        ? "Järjestelmän skaalautuvuus ja rakenne ovat tasapainossa. Ei kriittisiä suorituskykypullonkauloja."
        : "Järjestelmässä on potentiaalia nopeuden ja tehokkuuden optimointiin erityisesti tietokannan ja välimuistin osalta.",
    findings,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Execute AI or rule-based Security Audit for the project.
 */
export async function runSecurityAudit(
  projectId?: string,
  architectureJson?: string | null,
  prismaSchema?: string,
  apiCode?: string
): Promise<AuditReport> {
  let nodes: AuditNode[] = [];
  let edges: AuditEdge[] = [];

  if (architectureJson) {
    try {
      const parsed = JSON.parse(architectureJson);
      nodes = parsed.nodes || [];
      edges = parsed.edges || [];
    } catch {
      // ignore parse error
    }
  }

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

      const prompt = `You are a Principal Application Security Auditor.
Analyze this web application architecture and codebase against the OWASP Top 10 guidelines and modern fullstack security standards.

Architecture Components (${nodes.length} nodes):
${nodes.map((n) => `- ${n.data?.label || "Node"}: ${n.data?.description || ""}`).join("\n")}

Prisma Schema snippet:
${prismaSchema ? prismaSchema.slice(0, 1500) : "Not generated yet."}

API Code snippet:
${apiCode ? apiCode.slice(0, 1500) : "Not generated yet."}

Respond ONLY with valid JSON in this exact structure without markdown backticks:
{
  "score": 92,
  "grade": "A",
  "summary": "Selkeä yhteenveto suomeksi.",
  "findings": [
    {
      "id": "sec-1",
      "type": "critical|warning|success|info",
      "title": "Löydöksen otsikko suomeksi",
      "detail": "Tarkempi selitys suomeksi",
      "recommendation": "Miten korjataan suomeksi"
    }
  ]
}`;

      const response = await openai.chat.completions.create({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
      });

      const text = response.choices[0]?.message?.content?.trim() || "";
      const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned);

      const report: AuditReport = {
        type: "security",
        title: "Tietoturva-auditointi (Security Check)",
        score: typeof parsed.score === "number" ? parsed.score : 85,
        grade: parsed.grade || calculateGrade(parsed.score || 85),
        summary: parsed.summary || "Tietoturvatarkastus suoritettu.",
        findings: Array.isArray(parsed.findings) ? parsed.findings : [],
        timestamp: new Date().toISOString(),
      };
      if (projectId) await saveAuditReportToCache(projectId, report);
      return report;
    } catch (err) {
      console.warn("OpenRouter security audit failed, falling back to rule engine:", err);
    }
  }

  const fallbackReport = runFallbackSecurityAudit(nodes, edges, prismaSchema, apiCode);
  if (projectId) await saveAuditReportToCache(projectId, fallbackReport);
  return fallbackReport;
}

/**
 * Execute AI or rule-based Code & Architecture Optimization Audit.
 */
export async function runOptimizationAudit(
  projectId?: string,
  architectureJson?: string | null,
  prismaSchema?: string,
  apiCode?: string
): Promise<AuditReport> {
  let nodes: AuditNode[] = [];
  let edges: AuditEdge[] = [];

  if (architectureJson) {
    try {
      const parsed = JSON.parse(architectureJson);
      nodes = parsed.nodes || [];
      edges = parsed.edges || [];
    } catch {
      // ignore parse error
    }
  }

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

      const prompt = `You are a Principal Software Architect and Performance Engineer.
Review this fullstack application architecture and code for performance, scalability, caching, database indexing, and code cleanliness.

Architecture Components (${nodes.length} nodes):
${nodes.map((n) => `- ${n.data?.label || "Node"}: ${n.data?.description || ""}`).join("\n")}

Prisma Schema snippet:
${prismaSchema ? prismaSchema.slice(0, 1500) : "Not generated yet."}

API Code snippet:
${apiCode ? apiCode.slice(0, 1500) : "Not generated yet."}

Respond ONLY with valid JSON in this exact structure without markdown backticks:
{
  "score": 88,
  "grade": "B",
  "summary": "Selkeä suomenkielinen arvio järjestelmän tehokkuudesta ja suorituskyvystä.",
  "findings": [
    {
      "id": "opt-1",
      "type": "critical|warning|success|info",
      "title": "Otsikko suomeksi",
      "detail": "Kuvaus suomeksi",
      "recommendation": "Suositus suomeksi"
    }
  ]
}`;

      const response = await openai.chat.completions.create({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
      });

      const text = response.choices[0]?.message?.content?.trim() || "";
      const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned);

      const report: AuditReport = {
        type: "optimization",
        title: "Suorituskyky & Koodin Optimointi (Optimize Audit)",
        score: typeof parsed.score === "number" ? parsed.score : 85,
        grade: parsed.grade || calculateGrade(parsed.score || 85),
        summary: parsed.summary || "Optimointitarkastus suoritettu.",
        findings: Array.isArray(parsed.findings) ? parsed.findings : [],
        timestamp: new Date().toISOString(),
      };
      if (projectId) await saveAuditReportToCache(projectId, report);
      return report;
    } catch (err) {
      console.warn("OpenRouter optimization audit failed, falling back to rule engine:", err);
    }
  }

  const fallbackReport = runFallbackOptimizationAudit(nodes, edges, prismaSchema, apiCode);
  if (projectId) await saveAuditReportToCache(projectId, fallbackReport);
  return fallbackReport;
}

/**
 * Formats an AuditReport into structured, readable GitHub Markdown.
 */
export async function formatAuditReportMarkdown(report: AuditReport): Promise<string> {
  const icon = report.type === "security" ? "🛡️" : "⚡";
  const dateFormatted = new Date(report.timestamp || Date.now()).toLocaleString("fi-FI");

  const lines: string[] = [
    `# ${icon} ${report.title}`,
    "",
    `> **Raportti luotu:** ${dateFormatted}  `,
    `> **Terveysindeksi:** ${report.score} / 100 (${report.score >= 85 ? "Erinomainen" : report.score >= 70 ? "Tyydyttävä" : "Kriittinen"})  `,
    `> **Arvosana:** **${report.grade}**  `,
    `> **Tyyppi:** ${report.type === "security" ? "OWASP Top 10 Tietoturvatarkastus" : "Koodin & Arkkitehtuurin Optimointi"}`,
    "",
    "---",
    "",
    "## 📋 Tiivistelmä",
    "",
    report.summary,
    "",
    "---",
    "",
    "## 🔍 Löydökset ja toimenpidesuositukset",
    "",
  ];

  if (!report.findings || report.findings.length === 0) {
    lines.push("_Ei erillisiä löydöksiä raportoitu._");
  } else {
    report.findings.forEach((finding, index) => {
      const typeBadge =
        finding.type === "critical"
          ? "🔴 **KRIITTINEN (CRITICAL)**"
          : finding.type === "warning"
          ? "🟡 **HUOMIOITAVAA (WARNING)**"
          : finding.type === "success"
          ? "🟢 **KUNNOSSA (SUCCESS)**"
          : "🔵 **INFO**";

      lines.push(`### ${index + 1}. ${finding.title}`);
      lines.push("");
      lines.push(`- **Tila**: ${typeBadge}`);
      lines.push(`- **Kuvaus**: ${finding.detail}`);
      lines.push(`- **Suositeltu toimenpide**: ${finding.recommendation}`);
      lines.push("");
    });
  }

  lines.push("---");
  lines.push("");
  lines.push("## 🤖 Seuraavat askeleet (AI Agent Action Plan)");
  lines.push("");
  lines.push(
    "1. **Tarkista suositukset**: Käy läpi yllä olevat kriittiset ja huomioitavat kohdat."
  );
  lines.push(
    "2. **Agentin korjaussuunnitelma**: Anna tämä raportti Agentic Architectin AI Co-Pilotille käsiteltäväksi ('🚀 Anna agentille korjattavaksi')."
  );
  lines.push(
    "3. **Hyväksy suunnitelma**: Vahvista agentin ehdottama vaiheittainen korjaussuunnitelma ennen koodimuutoksia."
  );
  lines.push(
    "4. **Päivitä Data Gatet**: Suorita Gate 1 (Prisma), Gate 2 (API) ja Gate 3 (UI) päivitykset."
  );
  lines.push("");

  return lines.join("\n");
}

/**
 * Saves the audit report directly to the target project's disk under docs/
 */
export async function writeAuditReportToDiskAction(
  projectId: string,
  report: AuditReport
): Promise<{ success: boolean; fullPath?: string; relativePath?: string; error?: string }> {
  if (!projectId) {
    return { success: false, error: "Projektin id puuttuu." };
  }
  if (!report) {
    return { success: false, error: "Audit-raportti puuttuu." };
  }

  const relativePath =
    report.type === "security"
      ? "docs/SECURITY_AUDIT.md"
      : "docs/OPTIMIZATION_REPORT.md";

  const markdownContent = await formatAuditReportMarkdown(report);

  const result = await writeProjectFileToDisk(projectId, relativePath, markdownContent);
  if (!result.success) {
    return { success: false, error: result.error };
  }

  await saveAuditReportToCache(projectId, report);

  return {
    success: true,
    fullPath: result.fullPath,
    relativePath,
  };
}

async function saveAuditReportToCache(projectId: string, report: AuditReport) {
  if (!projectId || !report) return;
  try {
    const cacheDir = path.resolve(process.cwd(), ".audit-cache");
    await fs.promises.mkdir(cacheDir, { recursive: true });
    const cacheFile = path.resolve(cacheDir, `${projectId}-${report.type}.json`);
    await fs.promises.writeFile(cacheFile, JSON.stringify(report, null, 2), "utf-8");
  } catch (err) {
    console.warn("Could not save audit report to cache:", err);
  }
}

/**
 * Parses a saved markdown audit report back into an AuditReport object.
 */
export async function parseAuditReportMarkdown(
  markdown: string,
  type: "security" | "optimization"
): Promise<AuditReport | null> {
  try {
    const titleMatch = markdown.match(/^#\s+(?:🛡️|⚡)?\s*(.+)$/m);
    const title = titleMatch
      ? titleMatch[1].trim()
      : type === "security"
      ? "Tietoturva-auditointi (Security Check)"
      : "Suorituskyky & Koodin Optimointi";

    const scoreMatch = markdown.match(/Terveysindeksi:\*\*\s*(\d+)/i);
    const score = scoreMatch ? parseInt(scoreMatch[1], 10) : 75;

    const gradeMatch = markdown.match(/Arvosana:\*\*\s*\*\*([A-Fa-f][+-]?)\*\*/i);
    const grade = (gradeMatch ? gradeMatch[1].toUpperCase() : calculateGrade(score)) as
      | "A"
      | "B"
      | "C"
      | "D"
      | "F";

    let summary = "";
    const summaryHeader = markdown.indexOf("## 📋 Tiivistelmä");
    if (summaryHeader !== -1) {
      const afterSummary = markdown.slice(summaryHeader + "## 📋 Tiivistelmä".length);
      const nextDivider = afterSummary.indexOf("---");
      if (nextDivider !== -1) {
        summary = afterSummary.slice(0, nextDivider).trim();
      } else {
        summary = afterSummary.trim();
      }
    }
    if (!summary) {
      summary = "Tallennettu audit-raportti ladattu levyltä.";
    }

    const findings: AuditFinding[] = [];
    const findingsSectionIdx = markdown.indexOf("## 🔍 Löydökset ja toimenpidesuositukset");
    if (findingsSectionIdx !== -1) {
      const findingsContent = markdown.slice(findingsSectionIdx);
      const endIdx = findingsContent.indexOf("\n## ");
      const sectionToParse = endIdx > 0 ? findingsContent.slice(0, endIdx) : findingsContent;

      const items = sectionToParse.split(/\n###\s+/);
      items.shift();

      items.forEach((item, idx) => {
        const lines = item.split("\n");
        const cleanTitle = (lines[0] || "").replace(/^\d+\.\s*/, "").trim();

        let findingType: "critical" | "warning" | "success" | "info" = "info";
        if (item.includes("CRITICAL") || item.includes("KRIITTINEN")) {
          findingType = "critical";
        } else if (item.includes("WARNING") || item.includes("HUOMIOITAVAA")) {
          findingType = "warning";
        } else if (item.includes("SUCCESS") || item.includes("KUNNOSSA")) {
          findingType = "success";
        }

        const detailMatch = item.match(/-\s+\*\*Kuvaus\*\*:\s*([\s\S]*?)(?=\n-\s+\*\*|$)/);
        const recMatch = item.match(
          /-\s+\*\*Suositeltu toimenpide\*\*:\s*([\s\S]*?)(?=\n###|\n---|$)/
        );

        if (cleanTitle) {
          findings.push({
            id: `${type}-${idx + 1}`,
            type: findingType,
            title: cleanTitle,
            detail: detailMatch ? detailMatch[1].trim() : "Katso raportin tiedot.",
            recommendation: recMatch ? recMatch[1].trim() : "Tarkista suositukset.",
          });
        }
      });
    }

    return {
      type,
      title,
      score,
      grade,
      summary,
      findings,
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    console.error("Failed to parse audit report markdown:", err);
    return null;
  }
}

/**
 * Loads the latest cached or saved audit report for the project without re-running LLM analysis.
 */
export async function getLatestAuditReportAction(
  projectId: string,
  type: "security" | "optimization"
): Promise<{ success: boolean; report?: AuditReport; error?: string }> {
  if (!projectId) {
    return { success: false, error: "Projektin id puuttuu." };
  }

  // 1. Check local cache file (.audit-cache/<projectId>-<type>.json)
  try {
    const cacheFile = path.resolve(process.cwd(), ".audit-cache", `${projectId}-${type}.json`);
    if (fs.existsSync(cacheFile)) {
      const data = await fs.promises.readFile(cacheFile, "utf-8");
      const report = JSON.parse(data) as AuditReport;
      return { success: true, report };
    }
  } catch (err) {
    console.warn("Error reading audit cache file:", err);
  }

  // 2. Check target project's disk (docs/SECURITY_AUDIT.md or docs/OPTIMIZATION_REPORT.md)
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (project?.targetPath) {
      const docFileName =
        type === "security" ? "docs/SECURITY_AUDIT.md" : "docs/OPTIMIZATION_REPORT.md";
      const docFile = path.resolve(project.targetPath, docFileName);

      if (fs.existsSync(docFile)) {
        const mdContent = await fs.promises.readFile(docFile, "utf-8");
        const parsedReport = await parseAuditReportMarkdown(mdContent, type);
        if (parsedReport) {
          // Cache it for fast retrieval next time
          await saveAuditReportToCache(projectId, parsedReport);
          return { success: true, report: parsedReport };
        }
      }
    }
  } catch (err) {
    console.warn("Error checking project targetPath for audit report:", err);
  }

  // 3. Check workspace docs as fallback
  try {
    const docFileName =
      type === "security" ? "docs/SECURITY_AUDIT.md" : "docs/OPTIMIZATION_REPORT.md";
    const localDocFile = path.resolve(process.cwd(), docFileName);
    if (fs.existsSync(localDocFile)) {
      const mdContent = await fs.promises.readFile(localDocFile, "utf-8");
      const parsedReport = await parseAuditReportMarkdown(mdContent, type);
      if (parsedReport) {
        await saveAuditReportToCache(projectId, parsedReport);
        return { success: true, report: parsedReport };
      }
    }
  } catch (err) {
    console.warn("Error checking local workspace for audit report:", err);
  }

  return { success: false, error: "Ei aiempaa raporttia tallennettuna." };
}


