"use server";

import fs from "fs";
import path from "path";
import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import { updateProjectPrismaSchema } from "@/app/actions/project";

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
    const fullPath = path.join(targetDir, relativePath);

    // Security check: Ensure target path remains inside targetDir
    if (!fullPath.startsWith(targetDir)) {
      return { success: false, error: "Laiton tiedostopolku (Path traversal check failed)." };
    }

    await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.promises.writeFile(fullPath, content, "utf-8");

    return { success: true, fullPath };
  } catch (error: any) {
    console.error("Error writing project file to disk:", error);
    return { success: false, error: error.message || "Tiedoston kirjoittaminen levylle epäonnistui." };
  }
}

function generateSmartEnglishPrismaSchema(prompt: string, nodesSummary: string): string {
  const p = prompt.toLowerCase();
  const hasAuth = p.includes("user") || p.includes("auth") || p.includes("login") || p.includes("käyttäjä") || p.includes("tilit");
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
