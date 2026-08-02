import { notFound } from "next/navigation";
import { getProjectById } from "../../actions/project";
import { ArchitectureCanvas } from "../../../components/architecture-canvas";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "../../../components/ui/button";

interface ProjectPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const resolvedParams = await params;
  const project = await getProjectById(resolvedParams.id);

  if (!project) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-8 h-screen flex flex-col">
      <div className="flex items-center space-x-4 flex-none">
        <Button variant="ghost" size="icon" render={<Link href="/" />}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
          <p className="text-sm text-muted-foreground">
            Status: {project.status}
          </p>
        </div>
      </div>

      <div className="space-y-4 flex-none">
        <h3 className="text-lg font-semibold">Prompt / Requirements</h3>
        <div className="rounded-md bg-muted/40 p-4 text-sm text-muted-foreground whitespace-pre-wrap">
          {project.prompt || "No prompt provided."}
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <ArchitectureCanvas
          projectId={project.id}
          projectPrompt={project.prompt}
          initialArchitecture={project.architecture}
        />
      </div>
    </div>
  );
}
