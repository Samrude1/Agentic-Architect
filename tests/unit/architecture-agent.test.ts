import { describe, it, expect } from "vitest";
import { generateSmartPromptArchitecture } from "@/agents/architecture-agent";

describe("generateSmartPromptArchitecture", () => {
  it("generates a 4-tier architecture diagram for basic web requirements", () => {
    const graph = generateSmartPromptArchitecture("Simple portfolio website");
    expect(graph.nodes.length).toBeGreaterThanOrEqual(3);
    expect(graph.edges.length).toBeGreaterThanOrEqual(2);

    const clientNodes = graph.nodes.filter((n) => n.position.y === 50);
    const apiNodes = graph.nodes.filter((n) => n.position.y === 200);
    const serviceNodes = graph.nodes.filter((n) => n.position.y === 350);
    const dbNodes = graph.nodes.filter((n) => n.position.y === 500);

    expect(clientNodes.length).toBeGreaterThan(0);
    expect(apiNodes.length).toBeGreaterThan(0);
    expect(serviceNodes.length).toBeGreaterThan(0);
    expect(dbNodes.length).toBeGreaterThan(0);
  });

  it("includes mobile node when mobile keywords are present", () => {
    const graph = generateSmartPromptArchitecture("Rakennetaan mobiili sovellus iOS ja Android alustoille");
    const mobileNode = graph.nodes.find((n) => n.id === "client-mobile");
    expect(mobileNode).toBeDefined();
    expect(mobileNode?.data.label).toBe("Mobile App UI");
  });

  it("includes authentication service when auth keywords are detected", () => {
    const graph = generateSmartPromptArchitecture("Sovellus käyttäjätunnuksilla ja kirjautumisella");
    const authNode = graph.nodes.find((n) => n.id === "gw-auth");
    expect(authNode).toBeDefined();
    expect(authNode?.data.label).toBe("Auth & Identity Service");

    // Verify auth edge exists
    const authEdge = graph.edges.find((e) => e.target === "gw-auth");
    expect(authEdge).toBeDefined();
  });

  it("selects appropriate database tech based on prompt", () => {
    const pgGraph = generateSmartPromptArchitecture("Scalable enterprise with PostgreSQL");
    const pgNode = pgGraph.nodes.find((n) => n.id === "db-main");
    expect(pgNode?.data.label).toBe("PostgreSQL Database");

    const sqliteGraph = generateSmartPromptArchitecture("Paikallinen sovellus SQLite tietokannalla omalla koneella");
    const sqliteNode = sqliteGraph.nodes.find((n) => n.id === "db-main");
    expect(sqliteNode?.data.label).toBe("SQLite Local Database");
  });

  it("adds Redis cache when caching keywords are specified", () => {
    const graph = generateSmartPromptArchitecture("Verkkopalvelu ja Redis välimuisti");
    const cacheNode = graph.nodes.find((n) => n.id === "db-cache");
    expect(cacheNode).toBeDefined();
    expect(cacheNode?.data.label).toBe("Redis Cache Store");
  });

  it("ensures all edges have animated set to true for visual flow", () => {
    const graph = generateSmartPromptArchitecture("Fullstack SaaS platform with auth and stripe payment");
    expect(graph.edges.length).toBeGreaterThan(0);
    graph.edges.forEach((edge) => {
      expect(edge.animated).toBe(true);
      expect(edge.source).toBeTruthy();
      expect(edge.target).toBeTruthy();
    });
  });
});
