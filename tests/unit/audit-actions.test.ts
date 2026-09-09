import { describe, it, expect, vi, beforeEach } from "vitest";
import { runSecurityAudit, runOptimizationAudit } from "@/app/actions/audit";

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
});
