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

import { writeProjectFileToDisk, generatePrismaSchemaForProject } from "@/app/actions/codegen";
import { prisma } from "@/lib/prisma";
import fs from "fs";

describe("writeProjectFileToDisk Security & Path Bounds", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error if projectId is empty", async () => {
    const result = await writeProjectFileToDisk("", "schema.prisma", "content");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Projektin id puuttuu");
  });

  it("returns error if project has no targetPath set", async () => {
    (prisma.project.findUnique as any).mockResolvedValue({
      id: "proj-1",
      targetPath: null,
    });

    const result = await writeProjectFileToDisk("proj-1", "schema.prisma", "content");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Kotikansiota");
  });

  it("blocks directory traversal attacks attempting to escape target directory (..)", async () => {
    const safeTarget = path.resolve("./sandbox/my-project");
    (prisma.project.findUnique as any).mockResolvedValue({
      id: "proj-1",
      targetPath: safeTarget,
    });

    const maliciousPaths = [
      "../../etc/passwd",
      "..\\..\\windows\\system32\\calc.exe",
      "subdir/../../../secret.env",
    ];

    for (const malPath of maliciousPaths) {
      const result = await writeProjectFileToDisk("proj-1", malPath, "malicious-content");
      expect(result.success).toBe(false);
      expect(result.error).toContain("Path traversal check failed");
      expect(fs.promises.writeFile).not.toHaveBeenCalled();
    }
  });

  it("successfully writes file when path is within safe target bounds", async () => {
    const safeTarget = path.resolve("./sandbox/my-project");
    (prisma.project.findUnique as any).mockResolvedValue({
      id: "proj-1",
      targetPath: safeTarget,
    });

    const result = await writeProjectFileToDisk("proj-1", "prisma/schema.prisma", "datasource db {}");
    expect(result.success).toBe(true);
    expect(fs.promises.mkdir).toHaveBeenCalled();
    expect(fs.promises.writeFile).toHaveBeenCalled();
  });
});

describe("generatePrismaSchemaForProject", () => {
  it("generates fallback schema when OPENROUTER_API_KEY is not set or placeholder", async () => {
    (prisma.project.update as any).mockResolvedValue({ id: "proj-1" });

    const result = await generatePrismaSchemaForProject("proj-1", "A simple todo app with tasks");
    expect(result.success).toBe(true);
    expect(result.schema).toContain("datasource db");
    expect(result.schema).toContain("provider = \"sqlite\"");
    expect(result.schema).toContain("model User");
    expect(result.schema).toContain("model Task");
  });
});
