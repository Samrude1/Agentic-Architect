import { describe, it, expect, vi, beforeEach } from "vitest";
import { inferTechStackAndEnv } from "@/app/actions/tech-stack";

describe("Intelligent Tech Stack & .env Inference", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("classifies simple games and calculators as lightweight without requiring databases or API keys", async () => {
    const prompt = "Yksinkertainen Moon Drop fysiikkapeli selaimeen pisteenlaskulla";
    const profile = await inferTechStackAndEnv(prompt);

    expect(profile.tier).toBe("lightweight");
    expect(profile.database.needed).toBe(false);
    expect(profile.database.type).toBe("none");
    expect(profile.database.reason).toContain("LocalStorage");
    expect(profile.envVariables.length).toBe(0);
    expect(profile.envExampleContent).toContain("Tämä projekti on kevyt sovellus");
  });

  it("classifies standard team/todo tools as standard fullstack with SQLite zero-config", async () => {
    const prompt = "Projektien ja tehtävien hallintatyökalu tiimille";
    const profile = await inferTechStackAndEnv(prompt);

    expect(profile.tier).toBe("standard");
    expect(profile.database.needed).toBe(true);
    expect(profile.database.type).toBe("sqlite");
    expect(profile.database.reason).toContain("SQLite");
    expect(profile.envVariables.some((v) => v.key === "DATABASE_URL")).toBe(true);
  });

  it("classifies complex SaaS apps with payments and AI as heavy with PostgreSQL and full .env guidance", async () => {
    const prompt = "Kansainvälinen SaaS-sovellus Stripe-tilauksilla, OpenAI-chätillä ja Resend-sähköposteilla";
    const profile = await inferTechStackAndEnv(prompt);

    expect(profile.tier).toBe("heavy");
    expect(profile.database.needed).toBe(true);
    expect(profile.database.type).toBe("postgresql");
    expect(profile.envVariables.some((v) => v.key === "STRIPE_SECRET_KEY")).toBe(true);
    expect(profile.envVariables.some((v) => v.key === "OPENROUTER_API_KEY")).toBe(true);
    expect(profile.envVariables.some((v) => v.key === "RESEND_API_KEY")).toBe(true);
    expect(profile.envExampleContent).toContain("STRIPE_SECRET_KEY");
    expect(profile.envExampleContent).toContain("RESEND_API_KEY");
  });
});
