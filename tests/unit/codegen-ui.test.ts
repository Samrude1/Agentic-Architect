import { describe, it, expect } from "vitest";
import {
  generateSmartEnglishUiCode,
  generateUiComponentsForProject,
} from "@/app/actions/codegen";

describe("Data Gate 3: UI Component Code Generation", () => {
  it("should generate a complete, client-rendered React 19 component for task manager prompts", async () => {
    const code = await generateSmartEnglishUiCode("Build a team todo and task tracking app");

    // Must be a client component
    expect(code).toContain('"use client";');

    // Must import React and Lucide icons
    expect(code).toContain('import React, { useState, useTransition } from "react";');
    expect(code).toContain('import {');
    expect(code).toContain('Sparkles,');
    expect(code).toContain('LayoutGrid,');

    // Must define TaskItem interface and TaskDashboard component
    expect(code).toContain("export interface TaskItem");
    expect(code).toContain("export default function TaskDashboard()");

    // Must include metrics scorecards
    expect(code).toContain("Total Tasks");
    expect(code).toContain("Completion Rate");

    // Must include interactive state and creation modal
    expect(code).toContain("isModalOpen");
    expect(code).toContain("handleCreate");
    expect(code).toContain("handleToggleStatus");
    expect(code).toContain("Create New Task");
  });

  it("should adapt entity names to Orders for payment and commerce prompts", async () => {
    const code = await generateSmartEnglishUiCode("Verkkokauppa ja maksujen hallintajärjestelmä");

    expect(code).toContain("export interface OrderItem");
    expect(code).toContain("export default function OrderDashboard()");
    expect(code).toContain("amount?: number;");
    expect(code).toContain("Total Orders");
    expect(code).toContain("Create New Order");
  });

  it("should generate UI code successfully through the top-level Server Action fallback", async () => {
    const result = await generateUiComponentsForProject(
      "",
      "SaaS analytics platform for engineering teams",
      JSON.stringify({
        nodes: [
          { id: "1", data: { label: "Web Dashboard", tech: "React" } },
          { id: "2", data: { label: "Analytics Service", tech: "Node" } },
        ],
      })
    );

    expect(result.success).toBe(true);
    expect(result.code).toBeDefined();
    expect(result.code).toContain("ProjectDashboard");
    expect(result.code).toContain('"use client";');
  });
});
