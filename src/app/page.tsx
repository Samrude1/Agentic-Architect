import Link from "next/link";
import { getProjects } from "@/app/actions/project";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IdeaInputForm } from "@/components/idea-input-form";
import { formatDistanceToNow } from "date-fns";
import { fi } from "date-fns/locale";
import { Sparkles, Layers } from "lucide-react";

export default async function Home() {
  const projects = await getProjects();

  return (
    <div className="min-h-screen bg-muted/30 p-6 md:p-12">
      <div className="mx-auto max-w-4xl space-y-12">
        {/* Header Hero */}
        <header className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Tekoälyavusteinen Arkkitehtuurisuunnittelu</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Agentic Architect
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg">
            Muuta ohjelmistoideasi tai vaatimusdokumenttisi (.pdf, .txt, .md) interaktiiviseksi visuaaliseksi arkkitehtuurikaavioksi ja hiot sitä yhdessä tekoälyn kanssa.
          </p>
        </header>

        {/* Primary Action Input Area */}
        <section className="space-y-4">
          <IdeaInputForm />
        </section>

        {/* Existing Projects section */}
        {projects.length > 0 && (
          <section className="space-y-4 pt-6 border-t">
            <div className="flex items-center space-x-2">
              <Layers className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-lg font-semibold tracking-tight">Tallennetut Projektit</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <Card className="cursor-pointer hover:bg-accent/50 transition-colors h-full">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{project.name}</CardTitle>
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                          {project.status}
                        </span>
                      </div>
                      <CardDescription>
                        {formatDistanceToNow(project.createdAt, { addSuffix: true, locale: fi })}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {project.prompt}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
