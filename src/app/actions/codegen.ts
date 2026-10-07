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
2. Use PostgreSQL as the datasource provider unless SQLite is explicitly requested:
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   generator client {
     provider = "prisma-client-js"
   }
3. Security: NEVER store plain text passwords. Always use "passwordHash String" or NextAuth models (Account, Session, User).
4. Define complete models with primary keys (@id @default(uuid())), creation/update timestamps (@default(now()), @updatedAt), appropriate indexes (@@index), and cascade relations.
5. Return ONLY valid raw Prisma schema content. Do NOT wrap it in markdown code blocks (\`\`\`prisma).`;

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

