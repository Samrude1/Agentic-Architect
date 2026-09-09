import { describe, it, expect, vi, beforeEach } from "vitest";
import path from "path";

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    project: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Mock fs
vi.mock("fs", () => ({
  default: {
    promises: {
      mkdir: vi.fn().mockResolvedValue(undefined),
      writeFile: vi.fn().mockResolvedValue(undefined),
    },
  },
}));

import {
  generateApiRoutesForProject,
  generateSmartEnglishApiCode,
  writeProjectFileToDisk,
} from "@/app/actions/codegen";
import { prisma } from "@/lib/prisma";
import fs from "fs";

describe("Data Gate 2: generateApiRoutesForProject", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("generates production-ready Next.js Route Handlers and Zod schemas in English", async () => {
    (prisma.project.update as any).mockResolvedValue({ id: "proj-1" });

    const prompt = "SaaS task management platform with user assignments";
    const architectureJson = JSON.stringify({
      nodes: [
        { id: "1", data: { label: "Web Portal", tech: "Next.js" } },
        { id: "2", data: { label: "App Gateway", tech: "REST API" } },
        { id: "3", data: { label: "Task Service", tech: "CRUD Service" } },
        { id: "4", data: { label: "Database", tech: "SQLite" } },
      ],
    });

    const result = await generateApiRoutesForProject("proj-1", prompt, architectureJson);
    expect(result.success).toBe(true);
    expect(result.code).toBeDefined();

    // Verify key architectural requirements
    expect(result.code).toContain("import { z } from \"zod\";");
    expect(result.code).toContain("export type ApiResponse<T>");
    expect(result.code).toContain("export const CreateTaskSchema");
    expect(result.code).toContain("export async function GET(request: Request)");
    expect(result.code).toContain("export async function POST(request: Request)");
    expect(result.code).toContain("export async function createTaskAction");
    expect(result.code).toContain("VALIDATION_ERROR");
    expect(result.code).toContain("NextResponse.json");

    // Verify DB update was invoked
    expect(prisma.project.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "proj-1" },
        data: expect.objectContaining({
          apiCode: expect.any(String),
        }),
      })
    );
  });

  it("tailors entities for order/payment domains", async () => {
    const code = await generateSmartEnglishApiCode("E-commerce store with stripe payment and orders", "");
    expect(code).toContain("CreateOrderSchema");
    expect(code).toContain("amount: z.number().positive");
    expect(code).toContain("/api/orders");
  });

  it("writes generated API code securely to disk within project boundary", async () => {
    const safeTarget = path.resolve("./sandbox/target-app");
    (prisma.project.findUnique as any).mockResolvedValue({
      id: "proj-1",
      targetPath: safeTarget,
    });

    const apiContent = "export async function GET() {}";
    const result = await writeProjectFileToDisk(
      "proj-1",
      "src/app/api/endpoints/route.ts",
      apiContent
    );

    expect(result.success).toBe(true);
    expect(fs.promises.mkdir).toHaveBeenCalled();
    expect(fs.promises.writeFile).toHaveBeenCalledWith(
      path.resolve(safeTarget, "src/app/api/endpoints/route.ts"),
      apiContent,
      "utf-8"
    );
  });
});
