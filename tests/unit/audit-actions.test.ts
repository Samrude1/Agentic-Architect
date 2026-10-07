import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  runSecurityAudit,
  runOptimizationAudit,
  formatAuditReportMarkdown,
  writeAuditReportToDiskAction,
  type AuditReport,
} from "@/app/actions/audit";

describe("Quality & Security Audit Suite (Option A)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("runSecurityAudit", () => {
    it("returns an A-grade security report when authentication, Zod schemas, and env isolation exist", async () => {
      const architectureJson = JSON.stringify({
        nodes: [
          { id: "1", data: { label: "Web UI", tech: "Next.js" } },
          { id: "2", data: { label: "Auth Service", tech: "NextAuth" } },
          { id: "3", data: { label: "Database Layer", tech: "SQLite" } },
        ],
        edges: [{ source: "1", target: "2" }],
      });

      const prismaSchema = `
        datasource db {
          provider = "sqlite"
          url      = env("DATABASE_URL")
        }
        model User {
          id           String   @id @default(uuid())
          email        String   @unique
          passwordHash String
          createdAt    DateTime @default(now())
        }
      `;

      const apiCode = `
        import { z } from "zod";
        const schema = z.object({ email: z.string().email() });
        export async function POST(req: Request) {
          const body = await req.json();
          schema.parse(body);
          return Response.json({ success: true });
        }
      `;

      const report = await runSecurityAudit("proj-1", architectureJson, prismaSchema, apiCode);

      expect(report.type).toBe("security");
      expect(report.score).toBeGreaterThanOrEqual(85);
      expect(report.grade).toBe("A");
      expect(report.findings.length).toBeGreaterThan(0);
      expect(report.findings.some((f) => f.id === "sec-auth-present")).toBe(true);
      expect(report.findings.some((f) => f.id === "sec-zod-present")).toBe(true);
      expect(report.findings.some((f) => f.id === "sec-db-env")).toBe(true);
    });

    it("flags missing auth and missing Zod validation with appropriate warnings and critical findings", async () => {
      const architectureJson = JSON.stringify({
        nodes: [{ id: "1", data: { label: "Simple Frontend", tech: "React" } }],
        edges: [],
      });

      const apiCode = `
        export async function POST(req: Request) {
          const body = await req.json();
          return Response.json(body);
        }
      `;

      const report = await runSecurityAudit("proj-2", architectureJson, undefined, apiCode);

      expect(report.type).toBe("security");
      expect(report.score).toBeLessThan(85);
      expect(report.findings.some((f) => f.id === "sec-auth-missing")).toBe(true);
      expect(report.findings.some((f) => f.id === "sec-zod-missing")).toBe(true);
    });
  });

  describe("runOptimizationAudit", () => {
    it("detects database indexes and structural error handling", async () => {
      const architectureJson = JSON.stringify({
        nodes: [
          { id: "1", data: { label: "Client Portal" } },
          { id: "2", data: { label: "API Gateway" } },
        ],
        edges: [],
      });

      const prismaSchema = `
        model Project {
          id        String   @id @default(uuid())
          ownerId   String
          createdAt DateTime @default(now())
          @@index([ownerId])
        }
      `;

      const apiCode = `
        import { revalidateTag } from "next/cache";
        export async function GET() {
          try {
            revalidateTag("projects");
            return Response.json({ success: true });
          } catch (e) {
            return Response.json({ success: false }, { status: 500 });
          }
        }
      `;

      const report = await runOptimizationAudit("proj-1", architectureJson, prismaSchema, apiCode);

      expect(report.type).toBe("optimization");
      expect(report.score).toBeGreaterThanOrEqual(80);
      expect(report.findings.some((f) => f.id === "opt-db-indexes")).toBe(true);
      expect(report.findings.some((f) => f.id === "opt-api-trycatch")).toBe(true);
      expect(report.findings.some((f) => f.id === "opt-api-cache")).toBe(true);
    });
  });

  describe("formatAuditReportMarkdown", () => {
    it("formats an audit report into structured GitHub Markdown with grade and recommendations", async () => {
      const mockReport: AuditReport = {
        type: "security",
        title: "Tietoturva-auditointi (Security Check)",
        score: 75,
        grade: "C",
        summary: "Arkkitehtuurissa on puutteita autentikoinnissa.",
        findings: [
          {
            id: "sec-auth-missing",
            type: "critical",
            title: "Puuttuva autentikointi",
            detail: "Kuka tahansa voi kutsua API-reittejä.",
            recommendation: "Toteuta NextAuth v5.",
          },
        ],
        timestamp: "2026-10-07T14:00:00.000Z",
      };

      const markdown = await formatAuditReportMarkdown(mockReport);
      expect(markdown).toContain("# 🛡️ Tietoturva-auditointi (Security Check)");
      expect(markdown).toContain("75 / 100");
      expect(markdown).toContain("**C**");
      expect(markdown).toContain("KRIITTINEN (CRITICAL)");
      expect(markdown).toContain("Puuttuva autentikointi");
      expect(markdown).toContain("Toteuta NextAuth v5");
      expect(markdown).toContain("Seuraavat askeleet (AI Agent Action Plan)");
    });
  });

  describe("writeAuditReportToDiskAction", () => {
    it("returns error if projectId is missing", async () => {
      const res = await writeAuditReportToDiskAction("", {
        type: "security",
        title: "Security",
        score: 90,
        grade: "A",
        summary: "Ok",
        findings: [],
        timestamp: new Date().toISOString(),
      });
      expect(res.success).toBe(false);
      expect(res.error).toContain("Projektin id puuttuu");
    });
  });

  describe("parseAuditReportMarkdown", () => {
    it("successfully parses formatted markdown back into structured AuditReport", async () => {
      const { parseAuditReportMarkdown } = await import("@/app/actions/audit");
      const mockReport: AuditReport = {
        type: "security",
        title: "Tietoturva-auditointi (Security Check)",
        score: 75,
        grade: "C",
        summary: "Järjestelmässä on kriittisiä puutteita.",
        findings: [
          {
            id: "sec-1",
            type: "critical",
            title: "Autentikoinnin puute",
            detail: "API-reiteillä ei ole suojausta.",
            recommendation: "Asenna NextAuth v5.",
          },
        ],
        timestamp: "2026-10-07T14:00:00.000Z",
      };

      const markdown = await formatAuditReportMarkdown(mockReport);
      const parsed = await parseAuditReportMarkdown(markdown, "security");

      expect(parsed).not.toBeNull();
      expect(parsed?.score).toBe(75);
      expect(parsed?.grade).toBe("C");
      expect(parsed?.summary).toBe("Järjestelmässä on kriittisiä puutteita.");
      expect(parsed?.findings.length).toBe(1);
      expect(parsed?.findings[0].title).toBe("Autentikoinnin puute");
      expect(parsed?.findings[0].type).toBe("critical");
      expect(parsed?.findings[0].recommendation).toBe("Asenna NextAuth v5.");
    });
  });

  describe("getLatestAuditReportAction", () => {
    it("returns error if projectId is missing", async () => {
      const { getLatestAuditReportAction } = await import("@/app/actions/audit");
      const res = await getLatestAuditReportAction("", "security");
      expect(res.success).toBe(false);
      expect(res.error).toContain("Projektin id puuttuu");
    });
  });
});

