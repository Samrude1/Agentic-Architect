import path from "path";
import os from "os";

export const ALLOWED_WRITE_PATHS = [
  "prisma/schema.prisma",
  "src/app/api/endpoints/route.ts",
  "src/components/features/dashboard.tsx",
  ".env.local.example",
] as const;

export type AllowedWritePath = (typeof ALLOWED_WRITE_PATHS)[number];

// Prohibited system root directory names in lowercase
const FORBIDDEN_DIR_NAMES = new Set([
  "windows",
  "system32",
  "syswow64",
  "program files",
  "program files (x86)",
  "programdata",
  "recovery",
  "$recycle.bin",
  "bin",
  "sbin",
  "usr",
  "etc",
  "var",
  "lib",
  "dev",
  "proc",
  "sys",
  "boot",
  "root",
]);

/**
 * Validates a user-supplied project homebase directory (targetPath).
 * Ensures it cannot be a system folder, drive root, or raw user home directory.
 */
export function validateProjectTargetPath(targetPath: string): {
  isValid: boolean;
  error?: string;
  normalizedPath?: string;
} {
  if (!targetPath || !targetPath.trim()) {
    return {
      isValid: false,
      error: "Kotikansiota (Project Homebase Directory) ei ole asetettu.",
    };
  }

  const trimmed = targetPath.trim();
  const resolved = path.resolve(trimmed);
  const parsed = path.parse(resolved);

  // 1. Prohibit drive root (e.g. C:\ or /)
  if (resolved === parsed.root || resolved.replace(/[/\\]+$/, "") === parsed.root.replace(/[/\\]+$/, "")) {
    return {
      isValid: false,
      error: "Levyn juurihakemistoa (esim. C:\\ tai /) ei voi käyttää kotikansiona. Valitse projektikohtainen alikansio.",
    };
  }

  // 2. Prohibit user's raw home directory directly without a subfolder
  const home = os.homedir();
  if (path.resolve(home) === resolved) {
    return {
      isValid: false,
      error: "Käyttäjän pääkansiota (esim. C:\\Users\\nimi) ei voi käyttää suoraan kotikansiona. Luo tai valitse projektikohtainen alikansio (esim. projects/minun-projekti).",
    };
  }

  // 3. Prohibit system folders
  const parts = resolved.split(/[/\\]+/).filter(Boolean);
  for (const part of parts) {
    const lower = part.toLowerCase();
    if (FORBIDDEN_DIR_NAMES.has(lower)) {
      return {
        isValid: false,
        error: `Järjestelmäkansioon ('${part}') kirjoittaminen on estetty turvallisuussyistä.`,
      };
    }
  }

  return {
    isValid: true,
    normalizedPath: resolved,
  };
}

/**
 * Validates relative file path against allowlist and ensures path containment within targetDir.
 */
export function validateProjectFileWritePath(
  targetDir: string,
  relativePath: string
): {
  isValid: boolean;
  error?: string;
  fullPath?: string;
} {
  const resolvedTarget = path.resolve(targetDir);
  const fullPath = path.resolve(resolvedTarget, relativePath);

  // Path traversal check
  const rel = path.relative(resolvedTarget, fullPath);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    return {
      isValid: false,
      error: "Laiton tiedostopolku (Path traversal check failed).",
    };
  }

  // Normalize forward/backward slashes for comparison
  const normalizedRelative = relativePath.replace(/\\/g, "/").replace(/^\/+/, "");

  // Check allowlist
  const isAllowed = ALLOWED_WRITE_PATHS.some((allowed) => allowed === normalizedRelative);
  if (!isAllowed) {
    return {
      isValid: false,
      error: `Laiton kohdepolku: Tiedostoa '${relativePath}' ei ole sallittujen kirjoituskohteiden listalla.`,
    };
  }

  return {
    isValid: true,
    fullPath,
  };
}
