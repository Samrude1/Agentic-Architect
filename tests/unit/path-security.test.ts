import { describe, it, expect } from "vitest";
import path from "path";
import os from "os";
import {
  validateProjectTargetPath,
  validateProjectFileWritePath,
  ALLOWED_WRITE_PATHS,
} from "@/lib/path-security";

describe("validateProjectTargetPath Security Guardrails", () => {
  it("rejects empty or whitespace-only target path", () => {
    expect(validateProjectTargetPath("").isValid).toBe(false);
    expect(validateProjectTargetPath("   ").isValid).toBe(false);
  });

  it("rejects drive root directories (C:\\, D:\\, /)", () => {
    const isWin = process.platform === "win32";
    const driveRoot = isWin ? "C:\\" : "/";
    const res = validateProjectTargetPath(driveRoot);
    expect(res.isValid).toBe(false);
    expect(res.error).toContain("juurihakemistoa");
  });

  it("rejects raw user home directory without project subfolder", () => {
    const home = os.homedir();
    const res = validateProjectTargetPath(home);
    expect(res.isValid).toBe(false);
    expect(res.error).toContain("pääkansiota");
  });

  it("rejects Windows and POSIX system folders", () => {
    const dangerousPaths = [
      "C:\\Windows\\System32",
      "C:\\Program Files\\MyBadDir",
      "/usr/bin/evil",
      "/etc/nginx",
      "/var/log/myproject",
    ];

    for (const dPath of dangerousPaths) {
      const res = validateProjectTargetPath(dPath);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain("Järjestelmäkansioon");
    }
  });

  it("accepts valid, safe project directories", () => {
    const safePaths = [
      path.resolve("./sandbox/my-cool-project"),
      path.resolve(os.homedir(), "projects/saas-app"),
    ];

    for (const sPath of safePaths) {
      const res = validateProjectTargetPath(sPath);
      expect(res.isValid).toBe(true);
      expect(res.normalizedPath).toBeDefined();
    }
  });
});

describe("validateProjectFileWritePath Allowlist & Traversal", () => {
  const safeTarget = path.resolve("./sandbox/my-cool-project");

  it("allows all paths registered in ALLOWED_WRITE_PATHS", () => {
    for (const allowed of ALLOWED_WRITE_PATHS) {
      const res = validateProjectFileWritePath(safeTarget, allowed);
      expect(res.isValid).toBe(true);
      expect(res.fullPath).toBe(path.resolve(safeTarget, allowed));
    }
  });

  it("blocks arbitrary files not in allowlist even if inside project", () => {
    const unallowed = [
      "package.json",
      "tsconfig.json",
      "src/app/layout.tsx",
      ".git/config",
      "malicious_script.sh",
    ];

    for (const target of unallowed) {
      const res = validateProjectFileWritePath(safeTarget, target);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain("sallittujen kirjoituskohteiden listalla");
    }
  });

  it("blocks directory traversal attempts", () => {
    const malicious = [
      "../../etc/shadow",
      "..\\..\\Windows\\System32\\cmd.exe",
      "prisma/../../../malicious.prisma",
    ];

    for (const mal of malicious) {
      const res = validateProjectFileWritePath(safeTarget, mal);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain("Path traversal check failed");
    }
  });
});
