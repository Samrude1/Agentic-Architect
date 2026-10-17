import { describe, it, expect } from "vitest";
import path from "path";
import JSZip from "jszip";
import {
  generateProjectScaffoldFiles,
  buildProjectZipBase64,
  inspectTargetProject,
} from "@/app/actions/handover";
import {
  ALLOWED_SCAFFOLD_PATHS,
  validateProjectScaffoldWritePath,
} from "@/lib/path-security";

describe("Scaffold Security Guardrails (validateProjectScaffoldWritePath)", () => {
  const safeTarget = path.resolve("./sandbox/my-cool-project");

  it("allows all registered scaffold files in ALLOWED_SCAFFOLD_PATHS", () => {
    for (const allowed of ALLOWED_SCAFFOLD_PATHS) {
      const res = validateProjectScaffoldWritePath(safeTarget, allowed);
      expect(res.isValid).toBe(true);
      expect(res.fullPath).toBe(path.resolve(safeTarget, allowed));
    }
  });

  it("blocks directory traversal attempts in scaffold paths", () => {
    const malicious = [
      "../../etc/shadow",
      "..\\..\\Windows\\System32\\cmd.exe",
      "src/app/../../../malicious.ts",
    ];

    for (const mal of malicious) {
      const res = validateProjectScaffoldWritePath(safeTarget, mal);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain("Path traversal check failed");
    }
  });

  it("blocks unallowed arbitrary filenames outside scaffold allowlist", () => {
    const blocked = ["evil_script.sh", "run.bat", "private_keys.pem"];
    for (const b of blocked) {
      const res = validateProjectScaffoldWritePath(safeTarget, b);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain("ei ole sallittujen paketointikohteiden listalla");
    }
  });
});

describe("generateProjectScaffoldFiles Generation Engine", () => {
  it("generates all essential Next.js 15 App Router files", async () => {
    const files = await generateProjectScaffoldFiles({
      projectName: "Pulsedesk App",
      mermaidDiagram: "graph TD\n A-->B",
    });

    expect(files["package.json"]).toBeDefined();
    expect(files["tsconfig.json"]).toBeDefined();
    expect(files["next.config.ts"]).toBeDefined();
    expect(files["src/lib/prisma.ts"]).toBeDefined();
    expect(files["src/types/index.ts"]).toBeDefined();
    expect(files["src/app/layout.tsx"]).toBeDefined();
    expect(files["src/app/page.tsx"]).toBeDefined();
    expect(files[".env"]).toBeDefined();
    expect(files[".env"]).toContain("file:./dev.db");
    expect(files[".env.example"]).toBeDefined();
    expect(files["README.md"]).toBeDefined();
    expect(files["docs/ARCHITECTURE.md"]).toBeDefined();

    // Verify package.json contains clean slug and dependencies
    const pkg = JSON.parse(files["package.json"]);
    expect(pkg.name).toBe("pulsedesk-app");
    expect(pkg.dependencies.next).toBeDefined();
    expect(pkg.dependencies.react).toBeDefined();
    expect(pkg.devDependencies.autoprefixer).toBeDefined();
    expect(pkg.scripts["setup"]).toBe("npx prisma db push && npm run dev");
    expect(pkg.scripts["db:push"]).toBe("prisma db push");

    // Verify README contains setup steps
    expect(files["README.md"]).toContain("Pika-aloitus");
    expect(files["README.md"]).toContain("npm install");
    expect(files["README.md"]).toContain("npm run setup");
    expect(files["README.md"]).toContain("npx prisma db push");
  });
});

describe("buildProjectZipBase64 Archive Engine", () => {
  it("packages scaffold and gate files into valid base64 zip", async () => {
    const result = await buildProjectZipBase64({
      projectName: "Test Desk",
      prismaSchema: "datasource db { provider = \"sqlite\" url = \"file:./dev.db\" }\n\nmodel Ticket {\n  id String @id\n  title String\n}",
      apiCode: "export async function GET() { return Response.json({ ok: true }); }",
      uiCode: "export default function Dashboard() { return <div>Test</div>; }",
    });

    expect(result.success).toBe(true);
    expect(result.filename).toBe("test-desk-valmis-paketti.zip");
    expect(result.zipBase64).toBeDefined();

    // Verify zip unpackability and contents
    const zip = await JSZip.loadAsync(result.zipBase64!, { base64: true });
    expect(zip.file("package.json")).not.toBeNull();
    expect(zip.file(".env")).not.toBeNull();
    expect(zip.file("src/types/index.ts")).not.toBeNull();
    expect(zip.file("prisma/schema.prisma")).not.toBeNull();
    expect(zip.file("src/app/api/endpoints/route.ts")).not.toBeNull();
    expect(zip.file("src/components/features/dashboard.tsx")).not.toBeNull();
    expect(zip.file("README.md")).not.toBeNull();

    const envContent = await zip.file(".env")!.async("string");
    expect(envContent).toContain("DATABASE_URL=\"file:./dev.db\"");

    const typesContent = await zip.file("src/types/index.ts")!.async("string");
    expect(typesContent).toContain("export interface Ticket");

    const readmeContent = await zip.file("README.md")!.async("string");
    expect(readmeContent).toContain("Test Desk");
  });
});

describe("inspectTargetProject Inspector", () => {
  it("gracefully flags invalid or non-existent directories", async () => {
    const emptyResult = await inspectTargetProject("");
    expect(emptyResult.isValidTarget).toBe(false);

    const nonExistentResult = await inspectTargetProject("./sandbox/some-fake-dir-xyz-123");
    expect(nonExistentResult.isValidTarget).toBe(true);
    expect(nonExistentResult.exists).toBe(false);
  });
});
