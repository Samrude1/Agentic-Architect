import Link from "next/link";
import { getProjects } from "./actions/project";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { NewProjectDialog } from "../components/new-project-dialog";
import { formatDistanceToNow } from "date-fns";
import { fi } from "date-fns/locale";

export default async function Home() {
  const projects = await getProjects();

  return (
    <div className="min-h-screen bg-muted/40 p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Agentic Builder</h1>
            <p className="text-muted-foreground">Tekoälyohjattu ohjelmistokehitysalusta.</p>
          </div>
          <NewProjectDialog />
        </header>

        <main>
          {projects.length === 0 ? (
            <div className="flex h-40 items-center justify-center rounded-lg border border-dashed">
              <p className="text-sm text-muted-foreground">Ei vielä projekteja. Luo ensimmäinen projektisi aloittaaksesi.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <Card className="cursor-pointer hover:bg-accent/50 transition-colors h-full">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl">{project.name}</CardTitle>
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                          {project.status}
                        </span>
                      </div>
                      <CardDescription>
                        Luotu {formatDistanceToNow(project.createdAt, { addSuffix: true, locale: fi })}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="line-clamp-3 text-sm text-muted-foreground">
                        {project.prompt}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
