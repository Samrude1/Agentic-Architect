import { describe, it, expect } from "vitest";
import { POST } from "@/app/api/chat/route";
import { WorkspaceContext } from "@/types/workspace-context";

describe("Live Workspace Bridge & /api/chat Route", () => {
  it("processes workspaceContext and returns bidirectional tool-calls for audit remediation", async () => {
    const mockContext: WorkspaceContext = {
      activeTab: "schema",
      projectName: "PulseDesk",
      targetPath: "C:\\Users\\samru\\DEVELOPER\\PROJECTS\\pulsedesk",
      nodes: [
        {
          id: "client-web",
          position: { x: 160, y: 50 },
          data: { label: "PulseDesk Web", tech: "Next.js", description: "Asiakaspalveluportaali" },
        },
        {
          id: "db-main",
          position: { x: 160, y: 500 },
          data: { label: "SQLite Local Database", tech: "SQLite", description: "Lokaali tietokanta" },
        },
      ],
      edges: [
        { id: "e1", source: "client-web", target: "db-main" },
      ],
      gateStatus: {
        hasSchema: true,
        hasApi: true,
        hasUi: true,
        schemaPreview: "datasource db { provider = \"sqlite\" }",
      },
      latestAudit: {
        type: "security",
        grade: "B",
        score: 74,
        title: "OWASP Tietoturva-auditointi",
        summary: "Kriittisiä puutteita: SQLite tuotannossa ja salasanat selväkielisenä",
        criticalFindings: [
          {
            title: "Salasanatiiviste puuttuu",
            detail: "Käyttäjien salasanat tallentuvat selväkielisenä",
            recommendation: "Käytä bcrypt-hashausta ja passwordHash-kenttää",
          },
        ],
      },
    };

    const mockRequest = new Request("http://localhost:3000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: "Ohessa on tuore laadunvarmistusraportti. Korjaa tietoturvapuutteet ja lisää Auth Service.",
          },
        ],
        workspaceContext: mockContext,
      }),
    });

    const response = await POST(mockRequest);
    expect(response.status).toBe(200);

    const textStream = await response.text();

    // Verify SSE payload structure
    expect(textStream).toContain('"type":"start"');
    expect(textStream).toContain("apply_security_remediation");

    // Verify Auth Service and PostgreSQL remediation
    expect(textStream).toContain("Auth Service");
    expect(textStream).toContain("PostgreSQL");
    expect(textStream).toContain("gate1Code");
    expect(textStream).toContain("passwordHash");
    expect(textStream).toContain("gate2Code");
    expect(textStream).toContain("getAuthenticatedUser");
  });

  it("handles standard architecture queries gracefully with workspace context", async () => {
    const mockContext: WorkspaceContext = {
      activeTab: "canvas",
      projectName: "TaskMaster",
      nodes: [],
      edges: [],
      gateStatus: {
        hasSchema: false,
        hasApi: false,
        hasUi: false,
      },
    };

    const mockRequest = new Request("http://localhost:3000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: "Miten järjestelmä kannattaa jakaa kerroksiin?",
          },
        ],
        workspaceContext: mockContext,
      }),
    });

    const response = await POST(mockRequest);
    expect(response.status).toBe(200);

    const textStream = await response.text();
    expect(textStream).toContain("update_architecture");
    expect(textStream).toContain("TaskMaster");
  });

  it("analyzes codebase for spaghetti code and bloated files when requested", async () => {
    const mockContext: WorkspaceContext = {
      activeTab: "canvas",
      projectName: "PulseDesk",
      nodes: [
        { id: "1", position: { x: 100, y: 100 }, data: { label: "PulseDesk UI", tech: "React" } },
        { id: "6", position: { x: 100, y: 500 }, data: { label: "PostgreSQL Database", tech: "PostgreSQL" } },
      ],
      edges: [{ id: "e1", source: "1", target: "6" }],
      gateStatus: {
        hasSchema: true,
        hasApi: true,
        hasUi: true,
      },
    };

    const mockRequest = new Request("http://localhost:3000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: "Analysoi PulseDeskin koodipohja ja havaitse spagettikoodit ja bloated files.",
          },
        ],
        workspaceContext: mockContext,
      }),
    });

    const response = await POST(mockRequest);
    expect(response.status).toBe(200);

    const textStream = await response.text();
    expect(textStream).toContain("Optimointianalyysi");
    expect(textStream).toContain("Paisuneet tiedostot");
    expect(textStream).toContain("Spagettikoodi");
    expect(textStream).toContain("Parannusehdotukset");
  });

  it("applies code optimization across all gates when confirmed by user", async () => {
    const mockContext: WorkspaceContext = {
      activeTab: "canvas",
      projectName: "PulseDesk",
      nodes: [
        { id: "1", position: { x: 100, y: 100 }, data: { label: "PulseDesk UI", tech: "React" } },
        { id: "6", position: { x: 100, y: 500 }, data: { label: "PostgreSQL Database", tech: "PostgreSQL" } },
      ],
      edges: [{ id: "e1", source: "1", target: "6" }],
      gateStatus: {
        hasSchema: true,
        hasApi: true,
        hasUi: true,
      },
    };

    const mockRequest = new Request("http://localhost:3000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: "Kyllä, toteuta optimointi.",
          },
        ],
        workspaceContext: mockContext,
      }),
    });

    const response = await POST(mockRequest);
    expect(response.status).toBe(200);

    const textStream = await response.text();
    expect(textStream).toContain("apply_code_optimization");
    expect(textStream).toContain("gate1Code");
    expect(textStream).toContain("userId, status");
    expect(textStream).toContain("gate2Code");
    expect(textStream).toContain("revalidatePath");
    expect(textStream).toContain("gate3Code");
    expect(textStream).toContain("useMemo");
  });
});
