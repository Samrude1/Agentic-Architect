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
import {
  validateProjectTargetPath,
  validateProjectFileWritePath,
} from "@/lib/path-security";
import { computeLineDiff, type DiffResult } from "@/lib/diff";
import { generateTypeScriptContracts } from "@/app/actions/handover";
import {
  generateSmartEnglishPrismaSchema,
  generateSmartEnglishApiCode,
  generateSmartEnglishUiCode,
} from "@/lib/codegen/smart-templates";

export {
  generateSmartEnglishPrismaSchema,
  generateSmartEnglishApiCode,
  generateSmartEnglishUiCode,
};

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
2. Default to SQLite as the datasource provider for zero-config local development unless PostgreSQL is explicitly requested:
   datasource db {
     provider = "sqlite"
     url      = env("DATABASE_URL")
   }
   generator client {
     provider = "prisma-client-js"
   }
3. RELATIONAL INTEGRITY: All relations MUST be fully bidirectional. If model A defines a relation field referencing model B, model B MUST define the opposite relation field (e.g. if Comment has user User @relation(...), User must have comments Comment[]).
4. SQLite Compatibility: When using SQLite, avoid native enum syntax if possible, or use Prisma-supported enums/strings.
5. Security: NEVER store plain text passwords. Always use "passwordHash String" or NextAuth models (Account, Session, User).
6. Define complete models with primary keys (@id @default(uuid())), creation/update timestamps (@default(now()), @updatedAt), appropriate indexes (@@index), and cascade relations where appropriate.
7. Return ONLY valid raw Prisma schema content. Do NOT wrap it in markdown code blocks (\`\`\`prisma).`;

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
2. Include authentication and authorization checks (e.g. bearer token or session check) on protected routes and mutations to prevent data leaks.
3. Include Zod input validation schemas for all mutation inputs.
4. Use a standardized API response envelope: { success: boolean, data?: any, error?: { code: string, message: string } }.
5. Include Next.js Route Handlers (GET / POST) with proper status codes (200, 401, 400, 500) and Next.js Server Actions with revalidatePath.
6. Return ONLY valid TypeScript code. Do NOT wrap it in markdown code blocks (\`\`\`typescript).`;

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

      const typesContract = generateTypeScriptContracts({
        prismaSchema: prismaSchema || undefined,
      });

      const systemPrompt = `You are a Principal Frontend & Fullstack UI Engineer AI.
Your task is to design production-ready, beautiful React 19 + TypeScript + Tailwind CSS UI components tailored to the user's project requirements, architecture diagram nodes, and Prisma/API models.

STRICT RULES:
1. Output must be a complete, self-contained, copy-pasteable TSX module (e.g., export default function FeatureDashboard()).
2. Start with "use client"; at the very top.
3. ZERO PHANTOM IMPORTS / ASSUMPTIONS:
   - NEVER import from imaginary paths like "@/api/...", "./api/...", or "@/services/...". In Next.js App Router, API routes are HTTP endpoints called via native fetch('/api/endpoints', { ... }), NEVER imported as local JavaScript modules.
   - NEVER write comment assumptions like "// Assume createFeedback exists" or "// Assume @/types is defined elsewhere".
   - Allowed imports: "react" (useState, useEffect, useMemo, etc.), "lucide-react" (standard icons), "clsx", "tailwind-merge", and "@/types" (shared types provided below).
   - DO NOT import packages that are not installed (e.g. DO NOT import next-auth, next-auth/react, @tanstack/react-query, framer-motion, recharts, or @radix-ui/*). Use native React state, standard CSS/Tailwind transitions, and lucide-react.
4. REQUIRED CORE UI FEATURES:
   - TOP KPI METRIC CARDS: Render 3 to 4 prominent metric summary cards at the top (e.g. Total Items, Active/Pending, Completed/Resolved, Success Rate) with Lucide icons, numbers, and trend badges.
   - MASTER-DETAIL INSPECTION MODAL: Clicking any item card or row in the list MUST open a detailed inspection modal or drawer displaying full attributes, timestamps, and action buttons.
   - CREATION MODAL / DRAWER: A functional form modal with input validation to add new records.
   - SEARCH & FILTER: Instant search input and status tabs/pills.
   - RESILIENT DATA FETCHING: In useEffect, attempt to fetch from "/api/endpoints" with native fetch, and initialize with realistic initial mock items so the UI is immediately interactive and visually stunning out-of-the-box.
5. Use Tailwind CSS with modern aesthetic (dark/light friendly zinc palette, subtle borders, glassmorphic headers, responsive grid).
6. All component code, prop types, and comments must be in STANDARD ENGLISH.
7. Return ONLY raw TypeScript/TSX code. Do NOT wrap in markdown fences (\`\`\`tsx).`;

      const userContent = `Project Requirement: "${prompt}"

Architecture Diagram Component Nodes:
${nodesSummary || "Standard React/Next.js frontend"}

Database Prisma Schema:
${prismaSchema || "Standard data models"}

Shared TypeScript Contracts (available in @/types):
${typesContract}

API Endpoints Reference:
${apiCode || "Standard CRUD route handlers"}

Generate a complete, high-quality production UI component for this application following all strict rules.`;

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

export interface FileWritePreviewResult {
  success: boolean;
  error?: string;
  exists?: boolean;
  fullPath?: string;
  relativePath?: string;
  diff?: DiffResult;
}

function checkFileExists(filePath: string): boolean {
  try {
    if (typeof fs.existsSync === "function") {
      return fs.existsSync(filePath);
    }
    return false;
  } catch {
    return false;
  }
}

export async function previewProjectFileWrite(
  projectId: string,
  relativePath: string,
  content: string
): Promise<FileWritePreviewResult> {
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

  const targetDirVal = validateProjectTargetPath(project.targetPath);
  if (!targetDirVal.isValid) {
    return { success: false, error: targetDirVal.error };
  }
  const targetDir = targetDirVal.normalizedPath!;

  const pathVal = validateProjectFileWritePath(targetDir, relativePath);
  if (!pathVal.isValid) {
    return { success: false, error: pathVal.error };
  }
  const fullPath = pathVal.fullPath!;

  try {
    let exists = false;
    let originalContent: string | null = null;

    try {
      if (checkFileExists(fullPath)) {
        exists = true;
        originalContent = await fs.promises.readFile(fullPath, "utf-8");
      }
    } catch {
      exists = false;
    }

    const diff = computeLineDiff(originalContent, content);

    return {
      success: true,
      exists,
      fullPath,
      relativePath,
      diff,
    };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Tiedoston esikatselu epäonnistui.";
    return { success: false, error: errorMsg };
  }
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

  const targetDirVal = validateProjectTargetPath(project.targetPath);
  if (!targetDirVal.isValid) {
    return { success: false, error: targetDirVal.error };
  }
  const targetDir = targetDirVal.normalizedPath!;

  const pathVal = validateProjectFileWritePath(targetDir, relativePath);
  if (!pathVal.isValid) {
    return { success: false, error: pathVal.error };
  }
  const fullPath = pathVal.fullPath!;

  try {
    let backupPath: string | undefined;
    let backupCreated = false;

    // If file already exists and differs, create automatic timestamped backup in .agentic-backup/
    if (checkFileExists(fullPath)) {
      try {
        const existingContent = await fs.promises.readFile(fullPath, "utf-8");
        if (existingContent !== content) {
          const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
          backupPath = path.resolve(targetDir, ".agentic-backup", timestamp, relativePath);
          await fs.promises.mkdir(path.dirname(backupPath), { recursive: true });
          await fs.promises.writeFile(backupPath, existingContent, "utf-8");
          backupCreated = true;
        }
      } catch (backupErr) {
        console.warn("Varoitus: automaattinen varmuuskopiointi epäonnistui:", backupErr);
      }
    }

    await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.promises.writeFile(fullPath, content, "utf-8");

    return {
      success: true,
      fullPath,
      backupCreated,
      backupPath,
    };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Tiedoston kirjoittaminen levylle epäonnistui.";
    console.error("Error writing project file to disk:", error);
    return { success: false, error: errorMsg };
  }
}

