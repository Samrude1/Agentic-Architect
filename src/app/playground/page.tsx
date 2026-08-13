import { getProjectById } from "@/app/actions/project";
import { PlaygroundWorkspace } from "@/components/playground-workspace";

interface PlaygroundPageProps {
  searchParams: Promise<{
    prompt?: string;
    projectId?: string;
  }>;
}

export default async function PlaygroundPage({ searchParams }: PlaygroundPageProps) {
  const resolvedSearchParams = await searchParams;
  const projectId = resolvedSearchParams.projectId;
  const promptParam = resolvedSearchParams.prompt || "";

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
    />
  );
}

