import { notFound } from "next/navigation";
import { getProjectById } from "@/app/actions/project";
import { ArchitectureCanvas } from "@/components/architecture-canvas";
import { DeleteProjectButton } from "@/components/delete-project-button";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

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
      <div className="flex items-center justify-between flex-none">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" render={<Link href="/" />} nativeButton={false}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
            <p className="text-base text-muted-foreground font-medium">
              Tila: {project.status}
            </p>
          </div>
        </div>

        {/* Actions: Edit in Playground & Delete */}
        <div className="flex items-center space-x-3">
          <Button
            render={<Link href={`/playground?projectId=${project.id}`} />}
            nativeButton={false}
            size="default"
            className="bg-purple-600 hover:bg-purple-700 text-white font-medium"
          >
            <Sparkles className="mr-1.5 h-4 w-4 text-purple-200" />
            Editoi Ajatushautomossa
          </Button>

          <DeleteProjectButton projectId={project.id} projectName={project.name} />
        </div>
      </div>

      <div className="space-y-4 flex-none">
        <h3 className="text-xl font-bold">Liiketoimintavaatimus (Prompt)</h3>
        <div className="rounded-md bg-muted/40 p-4 text-base text-foreground/90 whitespace-pre-wrap leading-relaxed">
          {project.prompt || "Ei annettu kuvausta."}
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
