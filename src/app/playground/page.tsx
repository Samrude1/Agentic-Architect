import { getProjectById } from "@/app/actions/project";
import { PlaygroundWorkspace } from "@/components/playground-workspace";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

interface PlaygroundPageProps {
  searchParams: Promise<{
    prompt?: string;
    projectId?: string;
  }>;
}

export default async function PlaygroundPage({ searchParams }: PlaygroundPageProps) {
  const resolvedSearchParams = await searchParams;
  let projectId = resolvedSearchParams.projectId;
  const promptParam = resolvedSearchParams.prompt || "";

  // If no projectId and no prompt were given, auto-resume the latest active project
  if (!projectId && !promptParam) {
    const latestProject = await prisma.project.findFirst({
      orderBy: { createdAt: "desc" },
    });
    if (latestProject) {
      redirect(`/playground?projectId=${latestProject.id}`);
    }
  }

  let project = null;
  let initialNodes = [];
  let initialEdges = [];

  if (projectId) {
    project = await getProjectById(projectId);
    if (project && project.architecture) {
      try {
        const parsed = JSON.parse(project.architecture);
        initialNodes = parsed.nodes || [];
        initialEdges = parsed.edges || [];
      } catch (e) {
        console.error("Failed to parse project architecture JSON:", e);
      }
    }
  }

  return (
    <PlaygroundWorkspace
      projectId={project?.id}
      projectName={project?.name}
      initialPrompt={project?.prompt || promptParam}
      initialNodes={initialNodes}
      initialEdges={initialEdges}
      initialTargetPath={project?.targetPath || ""}
      initialPrismaSchema={project?.prismaSchema || ""}
      initialApiCode={project?.apiCode || ""}
      initialUiCode={project?.uiCode || ""}
    />
  );
}

