"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { generateArchitectureDiagram } from "@/agents/architecture-agent";

export async function getProjects() {
  return await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function createProject(name: string, prompt: string) {
  const project = await prisma.project.create({
    data: {
      name,
      prompt,
      status: "PLANNING",
    },
  });

  revalidatePath("/");
  return project;
}

export async function createProjectWithArchitecture(name: string, prompt: string, architecture: string) {
  const project = await prisma.project.create({
    data: {
      name: name.trim() || "Uusi Arkkitehtuuriprojekti",
      prompt,
      architecture,
      status: "PLANNING",
    },
  });

  revalidatePath("/");
  return project;
}

export async function getProjectById(id: string) {
  return await prisma.project.findUnique({
    where: { id },
  });
}

export async function updateProjectArchitecture(id: string, architecture: string) {
  const project = await prisma.project.update({
    where: { id },
    data: { architecture },
  });
  revalidatePath(`/projects/${id}`);
  return project;
}

export async function updateProjectTargetPath(id: string, targetPath: string) {
  const project = await prisma.project.update({
    where: { id },
    data: { targetPath },
  });
  revalidatePath(`/projects/${id}`);
  return project;
}

export async function updateProjectPrismaSchema(id: string, prismaSchema: string) {
  const project = await prisma.project.update({
    where: { id },
    data: { prismaSchema },
  });
  revalidatePath(`/projects/${id}`);
  return project;
}


export async function deleteProject(id: string) {
  await prisma.project.delete({
    where: { id },
  });
  revalidatePath("/");
}

export async function generateMockArchitecture(prompt: string | null) {
  // Mock data for fallback / testing
  const nodes = [
    { id: "1", type: "input", data: { label: "User Context" }, position: { x: 250, y: 50 } },
    { id: "2", data: { label: "API Gateway" }, position: { x: 250, y: 200 } },
    { id: "3", type: "output", data: { label: "Database" }, position: { x: 250, y: 350 } },
  ];
  const edges = [
    { id: "e1-2", source: "1", target: "2", animated: true },
    { id: "e2-3", source: "2", target: "3" },
  ];
  return { nodes, edges };
}

export async function generateRealArchitecture(prompt: string | null) {
  if (!prompt || !prompt.trim()) {
    return generateMockArchitecture(prompt);
  }

  try {
    return await generateArchitectureDiagram(prompt);
  } catch (error) {
    console.error("Failed to generate AI architecture, falling back to mock:", error);
    return generateMockArchitecture(prompt);
  }
}
