"use server";

import fs from "fs";
import path from "path";
import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import {
  updateProjectPrismaSchema,
  updateProjectApiCode,
  updateProjectUiCode,
} from "@/app/actions/project";

export async function generatePrismaSchemaForProject(
  projectId: string,
  prompt: string,
  architectureJson?: string | null
) {
  let nodesSummary = "";
  if (architectureJson) {
    try {
      const parsed = JSON.parse(architectureJson);
      if (parsed.nodes && Array.isArray(parsed.nodes)) {
        nodesSummary = parsed.nodes
          .map((n: { data?: { label?: string; tech?: string; description?: string } }) => {
            const label = n.data?.label || "Node";
            const tech = n.data?.tech ? ` (${n.data.tech})` : "";
            const desc = n.data?.description ? `: ${n.data.description}` : "";
            return `- ${label}${tech}${desc}`;
          })
          .join("\n");
      }
    } catch {
      console.warn("Failed to parse architectureJson in generatePrismaSchemaForProject");
    }
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  let generatedSchema = "";

  if (apiKey && !apiKey.includes("your-openrouter-key")) {
    try {
      const openai = new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey,
        defaultHeaders: {
          "HTTP-Referer": "https://github.com/Samrude1/Agentic-Architect",
          "X-Title": "Agentic Architect",
        },
      });

      const systemPrompt = `You are a Principal Database Architect AI.
Your task is to design a clean, production-ready Prisma schema (schema.prisma) based on the user's project requirements and architecture nodes.

STRICT RULES:
1. ALL model names, field names, relations, enum names, and code comments MUST BE STRICTLY IN STANDARD ENGLISH. Do not use Finnish or any other language in model names or comments.
2. Use SQLite as the datasource provider:
   datasource db {
     provider = "sqlite"
     url      = env("DATABASE_URL")
   }
   generator client {
     provider = "prisma-client-js"
   }
3. Define complete models with primary keys (@id @default(uuid())), creation/update timestamps (@default(now()), @updatedAt), appropriate indexes, and relations.
4. Return ONLY valid raw Prisma schema content. Do NOT wrap it in markdown code blocks (\`\`\`prisma).`;

      const userContent = `Project Business Requirement: "${prompt}"

Architecture Diagram Component Nodes:
${nodesSummary || "Standard web application stack"}

Design a comprehensive Prisma schema for this application.`;

      const response = await openai.chat.completions.create({
        model: "openai/gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        temperature: 0.2,
      });

      const rawContent = response.choices[0]?.message?.content?.trim();
      if (rawContent) {
        // Strip out triple backticks if present
        generatedSchema = rawContent
          .replace(/^```(prisma|graphql|txt)?\n/i, "")
          .replace(/\n```$/i, "")
          .trim();
      }
    } catch (error) {
      console.warn("OpenRouter API unavailable for codegen, using smart fallback schema generator:", error);
    }
  }

  if (!generatedSchema) {
    generatedSchema = generateSmartEnglishPrismaSchema(prompt, nodesSummary);
  }

  // Update in DB if projectId exists
  if (projectId) {
    await updateProjectPrismaSchema(projectId, generatedSchema);
  }

  return { success: true, schema: generatedSchema };
}

export async function generateApiRoutesForProject(
  projectId: string,
  prompt: string,
  architectureJson?: string | null,
  prismaSchema?: string | null
) {
  let nodesSummary = "";
  if (architectureJson) {
    try {
      const parsed = JSON.parse(architectureJson);
      if (parsed.nodes && Array.isArray(parsed.nodes)) {
        nodesSummary = parsed.nodes
          .map((n: { data?: { label?: string; tech?: string; description?: string } }) => {
            const label = n.data?.label || "Node";
            const tech = n.data?.tech ? ` (${n.data.tech})` : "";
            const desc = n.data?.description ? `: ${n.data.description}` : "";
            return `- ${label}${tech}${desc}`;
          })
          .join("\n");
      }
    } catch {
      console.warn("Failed to parse architectureJson in generateApiRoutesForProject");
    }
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  let generatedCode = "";

  if (apiKey && !apiKey.includes("your-openrouter-key")) {
    try {
      const openai = new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey,
        defaultHeaders: {
          "HTTP-Referer": "https://github.com/Samrude1/Agentic-Architect",
          "X-Title": "Agentic Architect",
        },
      });

      const systemPrompt = `You are a Principal Backend Architect AI.
Your task is to generate production-ready Next.js App Router Route Handlers and Server Actions based on the project requirements, architecture diagram nodes, and Prisma database schema.

STRICT RULES:
1. ALL code, schemas, variables, routes, and comments MUST BE STRICTLY IN STANDARD ENGLISH.
2. Include Zod input validation schemas for all mutation inputs.
3. Use a standardized API response envelope: { success: boolean, data?: any, error?: { code: string, message: string } }.
4. Include Next.js Route Handlers (GET / POST) with proper status codes (200, 400, 500) and Next.js Server Actions with revalidatePath.
5. Return ONLY valid TypeScript code. Do NOT wrap it in markdown code blocks (\`\`\`typescript).`;

      const userContent = `Project Business Requirements: "${prompt}"

Architecture Diagram Nodes:
${nodesSummary || "Standard web application stack"}

Prisma Database Schema:
${prismaSchema || "Standard SQLite database schema"}

Generate complete, production-ready backend code containing Route Handlers, Zod schemas, and Server Actions.`;

      const response = await openai.chat.completions.create({
        model: "openai/gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        temperature: 0.2,
      });

      const rawContent = response.choices[0]?.message?.content?.trim();
      if (rawContent) {
        generatedCode = rawContent
          .replace(/^```(typescript|ts|javascript|js)?\n/i, "")
          .replace(/\n```$/i, "")
          .trim();
      }
    } catch (error) {
      console.warn("OpenRouter API unavailable for api codegen, using smart fallback generator:", error);
    }
  }

  if (!generatedCode) {
    generatedCode = await generateSmartEnglishApiCode(prompt, nodesSummary, prismaSchema);
  }

  // Update in DB if projectId exists
  if (projectId) {
    await updateProjectApiCode(projectId, generatedCode);
  }

  return { success: true, code: generatedCode };
}

export async function generateUiComponentsForProject(
  projectId: string,
  prompt: string,
  architectureJson?: string | null,
  prismaSchema?: string | null,
  apiCode?: string | null
) {
  let nodesSummary = "";
  if (architectureJson) {
    try {
      const parsed = JSON.parse(architectureJson);
      if (parsed.nodes && Array.isArray(parsed.nodes)) {
        nodesSummary = parsed.nodes
          .map((n: { data?: { label?: string; tech?: string; description?: string } }) => {
            const label = n.data?.label || "Node";
            const tech = n.data?.tech ? ` (${n.data.tech})` : "";
            const desc = n.data?.description ? `: ${n.data.description}` : "";
            return `- ${label}${tech}${desc}`;
          })
          .join("\n");
      }
    } catch {
      console.warn("Failed to parse architectureJson in generateUiComponentsForProject");
    }
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  let generatedCode = "";

  if (apiKey && !apiKey.includes("your-openrouter-key")) {
    try {
      const openai = new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey,
        defaultHeaders: {
          "HTTP-Referer": "https://github.com/Samrude1/Agentic-Architect",
          "X-Title": "Agentic Architect",
        },
      });

      const systemPrompt = `You are a Principal Frontend & Fullstack UI Engineer AI.
Your task is to design production-ready, beautiful React 19 + TypeScript + Tailwind CSS UI components tailored to the user's project requirements, architecture diagram nodes, and Prisma/API models.

STRICT RULES:
1. Output must be a complete, self-contained, copy-pasteable TSX module (e.g., Dashboard or Management feature component).
2. Start with "use client"; at the very top.
3. Use Tailwind CSS with modern dark mode aesthetic (zinc/purple palette, subtle borders, glassmorphism, responsive grid).
4. Use Lucide React icons for visual cues and status indicators.
5. Include interactive local state: search filter, status badges, metric counters, creation modal/drawer form, item cards, and empty state.
6. All component code, prop types, and comments must be in STANDARD ENGLISH.
7. Return ONLY raw TypeScript/TSX code. Do NOT wrap in markdown fences (\`\`\`tsx).`;

      const userContent = `Project Requirement: "${prompt}"

Architecture Diagram Component Nodes:
${nodesSummary || "Standard React/Next.js frontend"}

Database Prisma Schema:
${prismaSchema || "Standard data models"}

API Endpoints Reference:
${apiCode || "Standard CRUD route handlers"}

Generate a complete, high-quality production UI component for this application.`;

      const response = await openai.chat.completions.create({
        model: "openai/gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        temperature: 0.2,
      });

      const rawContent = response.choices[0]?.message?.content?.trim();
      if (rawContent) {
        generatedCode = rawContent
          .replace(/^```(typescript|tsx|ts|javascript|jsx)?\n/i, "")
          .replace(/\n```$/i, "")
          .trim();
      }
    } catch (error) {
      console.warn("OpenRouter API unavailable for UI codegen, using smart fallback generator:", error);
    }
  }

  if (!generatedCode) {
    generatedCode = await generateSmartEnglishUiCode(prompt, nodesSummary, prismaSchema);
  }

  // Update in DB if projectId exists
  if (projectId) {
    await updateProjectUiCode(projectId, generatedCode);
  }

  return { success: true, code: generatedCode };
}

export async function writeProjectFileToDisk(
  projectId: string,
  relativePath: string,
  content: string
) {
  if (!projectId) {
    return { success: false, error: "Projektin id puuttuu." };
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project || !project.targetPath || !project.targetPath.trim()) {
    return {
      success: false,
      error: "Kotikansiota (Project Homebase Directory) ei ole asetettu. Syötä polku workspace-näkymässä.",
    };
  }

  try {
    const targetDir = path.resolve(project.targetPath.trim());
    const fullPath = path.resolve(targetDir, relativePath);

    // Security check: Ensure canonical target path remains strictly inside targetDir
    const relative = path.relative(targetDir, fullPath);
    if (relative.startsWith("..") || path.isAbsolute(relative)) {
      return { success: false, error: "Laiton tiedostopolku (Path traversal check failed)." };
    }

    await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.promises.writeFile(fullPath, content, "utf-8");

    return { success: true, fullPath };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Tiedoston kirjoittaminen levylle epäonnistui.";
    console.error("Error writing project file to disk:", error);
    return { success: false, error: errorMsg };
  }
}

function generateSmartEnglishPrismaSchema(prompt: string, _nodesSummary?: string): string {
  const p = prompt.toLowerCase();
  const hasTasks = p.includes("todo") || p.includes("task") || p.includes("tehtäv");
  const hasOrders = p.includes("order") || p.includes("payment") || p.includes("maksu") || p.includes("tilaus");

  return `// Prisma Database Schema
// Generated by Agentic Architect
// Datasource: SQLite

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

enum Role {
  USER
  ADMIN
}

enum ProjectStatus {
  PLANNING
  IN_PROGRESS
  COMPLETED
  ARCHIVED
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  role      Role     @default(USER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
${hasTasks ? `  tasks     Task[]\n` : ""}${hasOrders ? `  orders    Order[]\n` : ""}  projects  Project[]
}

model Project {
  id           String        @id @default(uuid())
  name         String
  description  String?
  status       ProjectStatus @default(PLANNING)
  ownerId      String
  owner        User          @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
}
${
  hasTasks
    ? `
model Task {
  id          String   @id @default(uuid())
  title       String
  description String?
  completed   Boolean  @default(false)
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
`
    : ""
}${
  hasOrders
    ? `
model Order {
  id        String   @id @default(uuid())
  amount    Float
  status    String   @default("PENDING")
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
`
    : ""
}`;
}

export async function generateSmartEnglishApiCode(
  prompt: string,
  _nodesSummary?: string,
  _prismaSchema?: string | null
): Promise<string> {
  const p = prompt.toLowerCase();
  const hasTasks = p.includes("todo") || p.includes("task") || p.includes("tehtäv");
  const hasOrders = p.includes("order") || p.includes("payment") || p.includes("maksu") || p.includes("tilaus");
  const entityName = hasTasks ? "Task" : hasOrders ? "Order" : "Project";
  const entityPlural = hasTasks ? "tasks" : hasOrders ? "orders" : "projects";

  return `// Next.js App Router Backend Endpoints & Server Actions
// Generated by Agentic Architect - Data Gate 2
// Language: Standard English

import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

// ==========================================
// 1. Uniform Response Envelopes & Types
// ==========================================
export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string; details?: unknown } };

// ==========================================
// 2. Zod Validation Schemas
// ==========================================
export const Create${entityName}Schema = z.object({
  title: z.string().min(1, "Title is required").max(120),
  description: z.string().max(1000).optional(),
  userId: z.string().uuid("Invalid user identifier").optional(),
${hasOrders ? `  amount: z.number().positive("Amount must be greater than zero"),\n` : ""}});

export const Update${entityName}Schema = Create${entityName}Schema.partial().extend({
  id: z.string().uuid("Invalid identifier"),
${hasTasks ? `  completed: z.boolean().optional(),\n` : ""}});

export type Create${entityName}Input = z.infer<typeof Create${entityName}Schema>;
export type Update${entityName}Input = z.infer<typeof Update${entityName}Schema>;

// ==========================================
// 3. Next.js Route Handlers (app/api/${entityPlural}/route.ts)
// ==========================================

/**
 * GET /api/${entityPlural}
 * Fetches a list of ${entityPlural} with pagination and security guards
 */
export async function GET(request: Request): Promise<NextResponse<ApiResponse<any[]>>> {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);

    // Fetch from database using Prisma
    const items = await (prisma as any).${entityName.toLowerCase()}.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: items,
    });
  } catch (error: any) {
    console.error("GET /api/${entityPlural} error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "Failed to retrieve ${entityPlural}",
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/${entityPlural}
 * Creates a new ${entityName.toLowerCase()} with Zod input validation
 */
export async function POST(request: Request): Promise<NextResponse<ApiResponse<any>>> {
  try {
    const body = await request.json();
    const validatedData = Create${entityName}Schema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Request payload failed schema validation",
            details: validatedData.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const newItem = await (prisma as any).${entityName.toLowerCase()}.create({
      data: validatedData.data,
    });

    return NextResponse.json({ success: true, data: newItem }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/${entityPlural} error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "CREATION_FAILED",
          message: error.message || "Failed to create ${entityName.toLowerCase()}",
        },
      },
      { status: 500 }
    );
  }
}

// ==========================================
// 4. Next.js Server Actions (src/app/actions/${entityPlural}.ts)
// ==========================================

/**
 * Server Action: Creates a new ${entityName} directly with instant cache revalidation
 */
export async function create${entityName}Action(rawData: unknown): Promise<ApiResponse<any>> {
  const result = Create${entityName}Schema.safeParse(rawData);
  if (!result.success) {
    return {
      success: false,
      error: {
        code: "INVALID_INPUT",
        message: "Validation failed",
        details: result.error.flatten(),
      },
    };
  }

  try {
    const created = await (prisma as any).${entityName.toLowerCase()}.create({
      data: result.data,
    });

    revalidatePath("/${entityPlural}");
    return { success: true, data: created };
  } catch (err: any) {
    return {
      success: false,
      error: {
        code: "DATABASE_ERROR",
        message: err.message || "Failed to save ${entityName.toLowerCase()} to database",
      },
    };
  }
}
`;
}

export async function generateSmartEnglishUiCode(
  prompt: string,
  _nodesSummary?: string,
  _prismaSchema?: string | null
): Promise<string> {
  const p = prompt.toLowerCase();
  const hasTasks = p.includes("todo") || p.includes("task") || p.includes("tehtäv");
  const hasOrders = p.includes("order") || p.includes("payment") || p.includes("maksu") || p.includes("tilaus");
  const entityName = hasTasks ? "Task" : hasOrders ? "Order" : "Project";
  const entityPlural = hasTasks ? "Tasks" : hasOrders ? "Orders" : "Projects";

  return `"use client";

import React, { useState, useTransition } from "react";
import {
  Sparkles,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Trash2,
  TrendingUp,
  LayoutGrid,
  Filter,
  Check,
  AlertCircle,
  X,
  Loader2,
  ArrowUpRight,
} from "lucide-react";

export interface ${entityName}Item {
  id: string;
  title: string;
  description?: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  createdAt: string;
${hasOrders ? "  amount?: number;\n" : ""}
}

const INITIAL_${entityPlural.toUpperCase()}: ${entityName}Item[] = [
  {
    id: "1",
    title: "Setup modern cloud infrastructure",
    description: "Initialize serverless edge runtimes, database migrations, and CI pipelines.",
    status: "COMPLETED",
    createdAt: "2026-09-10",
${hasOrders ? "    amount: 250,\n" : ""}  },
  {
    id: "2",
    title: "Implement secure authentication flow",
    description: "Configure NextAuth session encryption and role-based route middleware.",
    status: "IN_PROGRESS",
    createdAt: "2026-09-12",
${hasOrders ? "    amount: 490,\n" : ""}  },
  {
    id: "3",
    title: "Deliver production performance benchmark",
    description: "Run Core Web Vitals audit and database query optimization checks.",
    status: "PENDING",
    createdAt: "2026-09-14",
${hasOrders ? "    amount: 180,\n" : ""}  },
];

export default function ${entityName}Dashboard() {
  const [items, setItems] = useState<${entityName}Item[]>(INITIAL_${entityPlural.toUpperCase()});
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "IN_PROGRESS" | "COMPLETED">("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
${hasOrders ? '  const [newAmount, setNewAmount] = useState("100");\n' : ""}  const [isPending, startTransition] = useTransition();

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const totalCount = items.length;
  const completedCount = items.filter((i) => i.status === "COMPLETED").length;
  const inProgressCount = items.filter((i) => i.status === "IN_PROGRESS").length;
  const pendingCount = items.filter((i) => i.status === "PENDING").length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    startTransition(() => {
      const newItem: ${entityName}Item = {
        id: (items.length + 1).toString(),
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
        status: "PENDING",
        createdAt: new Date().toISOString().split("T")[0],
${hasOrders ? "        amount: parseFloat(newAmount) || 0,\n" : ""}      };

      setItems([newItem, ...items]);
      setNewTitle("");
      setNewDescription("");
${hasOrders ? '      setNewAmount("100");\n' : ""}      setIsModalOpen(false);
    });
  };

  const handleToggleStatus = (id: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const nextStatus: ${entityName}Item["status"] =
          item.status === "PENDING"
            ? "IN_PROGRESS"
            : item.status === "IN_PROGRESS"
            ? "COMPLETED"
            : "PENDING";
        return { ...item, status: nextStatus };
      })
    );
  };

  const handleDelete = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 sm:p-8 space-y-8 font-sans">
      {/* Top Header */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-purple-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="h-4 w-4" />
            <span>Production Feature Module</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            ${entityName} Management Hub
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Modern high-performance interface with reactive state and instant caching.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-xl shadow-lg shadow-purple-900/30 transition-all hover:scale-[1.02]"
        >
          <Plus className="h-4 w-4" />
          <span>New ${entityName}</span>
        </button>
      </header>

      {/* Metrics Scorecards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
            <span>Total ${entityPlural}</span>
            <LayoutGrid className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white">{totalCount}</div>
          <div className="text-xs text-zinc-500">Live indexed records</div>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
            <span>In Progress</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400">{inProgressCount}</div>
          <div className="text-xs text-zinc-500">Active workflows</div>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
            <span>Completed</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">{completedCount}</div>
          <div className="text-xs text-zinc-500">{pendingCount} pending queue</div>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
            <span>Completion Rate</span>
            <TrendingUp className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-400">{completionRate}%</div>
          <div className="text-xs text-zinc-500">System throughput</div>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <section className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ${entityPlural.toLowerCase()} by title or details..."
            className="w-full pl-10 pr-4 py-2 bg-zinc-900/80 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          />
        </div>

        <div className="flex items-center bg-zinc-900/80 p-1 rounded-xl border border-zinc-800 text-xs font-medium">
          {(["ALL", "PENDING", "IN_PROGRESS", "COMPLETED"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={\`px-3 py-1.5 rounded-lg transition-all \${
                statusFilter === tab
                  ? "bg-purple-600 text-white font-semibold shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }\`}
            >
              {tab === "ALL" ? "All" : tab.replace("_", " ")}
            </button>
          ))}
        </div>
      </section>

      {/* Items Grid */}
      <section>
        {filteredItems.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 space-y-3">
            <LayoutGrid className="h-10 w-10 text-zinc-600 mx-auto" />
            <h3 className="font-semibold text-base text-zinc-300">No ${entityPlural.toLowerCase()} found</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Try adjusting your search query or status filter, or create a new ${entityName.toLowerCase()} above.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 hover:border-purple-500/40 transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span
                      className={\`text-[10px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider \${
                        item.status === "COMPLETED"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                          : item.status === "IN_PROGRESS"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                          : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                      }\`}
                    >
                      {item.status.replace("_", " ")}
                    </span>
                    <span className="text-[11px] text-zinc-500">{item.createdAt}</span>
                  </div>

                  <h3 className="font-semibold text-sm text-zinc-100 group-hover:text-purple-300 transition-colors">
                    {item.title}
                  </h3>

                  {item.description && (
                    <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3">
                      {item.description}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs">
                  <button
                    onClick={() => handleToggleStatus(item.id)}
                    className="text-zinc-400 hover:text-white flex items-center space-x-1.5 transition-colors"
                  >
                    <Check className="h-3.5 w-3.5 text-purple-400" />
                    <span>Advance Status</span>
                  </button>

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-zinc-500 hover:text-red-400 p-1 rounded-md transition-colors"
                    title="Delete item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Creation Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <h3 className="font-bold text-lg text-white">Create New ${entityName}</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Implement user workspace permissions"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Detailed engineering notes or criteria..."
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs text-zinc-400 hover:text-white rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex items-center space-x-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl transition-all"
                >
                  {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                  <span>Create ${entityName}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
`;
}
