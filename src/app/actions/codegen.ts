"use server";

import fs from "fs";
import path from "path";
import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import { updateProjectPrismaSchema, updateProjectApiCode } from "@/app/actions/project";

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
