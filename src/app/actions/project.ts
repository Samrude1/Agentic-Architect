"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "../../lib/prisma";

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

export async function generateMockArchitecture(prompt: string | null) {
  // Mock data for MVP
  const nodes = [
    { id: '1', type: 'input', data: { label: 'User Context' }, position: { x: 250, y: 25 } },
    { id: '2', data: { label: 'API Gateway' }, position: { x: 250, y: 125 } },
    { id: '3', data: { label: 'Database' }, position: { x: 250, y: 225 } },
  ];
  const edges = [
    { id: 'e1-2', source: '1', target: '2', animated: true },
    { id: 'e2-3', source: '2', target: '3' },
  ];
  return { nodes, edges };
}
