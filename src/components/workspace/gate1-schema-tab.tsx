"use client";

import { Database, Sparkles, Loader2, HardDrive, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CodeViewer } from "@/components/code-viewer";
import { TechStackProfile } from "@/app/actions/tech-stack";

interface Gate1SchemaTabProps {
  prismaSchema: string;
  isGeneratingSchema: boolean;
  isWritingToDisk: boolean;
  isSaved?: boolean;
  diskMessage: { type: "success" | "error"; text: string } | null;
  techProfile: TechStackProfile | null;
  agentUpdate?: { summary: string; timestamp: number } | null;
  onGenerateSchema: () => void;
  onWriteToDisk: () => void;
  onDismissAgentUpdate?: () => void;
  onNavigateNext?: () => void;
}

export function Gate1SchemaTab({
  prismaSchema,
  isGeneratingSchema,
  isWritingToDisk,
  isSaved = false,
  diskMessage,
  techProfile,
  agentUpdate,
  onGenerateSchema,
  onWriteToDisk,
  onDismissAgentUpdate,
  onNavigateNext,
}: Gate1SchemaTabProps) {
  const hasStagedChanges = Boolean(agentUpdate);

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-background border rounded-lg p-4 shadow-sm space-y-4">
      {/* Header bar with unambiguous action buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 flex-none">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base flex items-center space-x-2">
              <Database className="h-5 w-5 text-purple-500" />
              <span>Data Gate 1: Prisma Database Schema</span>
            </h3>
            {isSaved && !hasStagedChanges && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1">
                <Check className="h-3 w-3" /> Tallennettu levylle
              </span>
            )}
            {hasStagedChanges && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> Odottaa tallennusta
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Generoi tuotantovalmis Prisma-tietokantamalli kaaviossa määriteltyjen komponenttien pohjalta (<code className="text-foreground font-mono">prisma/schema.prisma</code>).
          </p>
        </div>

        {/* Primary Action Button Area - exactly ONE clear primary button */}
        <div className="flex items-center space-x-2">
          {hasStagedChanges ? (
            // State: AI updated code -> ONE primary button: Tallenna muutokset levylle
            <Button
              onClick={onWriteToDisk}
              disabled={isWritingToDisk}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md animate-pulse h-9 px-4 flex items-center gap-2"
            >
              {isWritingToDisk ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <HardDrive className="h-4 w-4" />
              )}
              <span>Tallenna muutokset levylle</span>
            </Button>
          ) : isSaved ? (
            // State: Saved -> ONE primary button: Siirry seuraavaan vaiheeseen
            <div className="flex items-center gap-2">
              <Button
                onClick={onWriteToDisk}
                disabled={isWritingToDisk}
                variant="outline"
                size="sm"
                className="text-xs border-green-500/30 text-green-600 hover:bg-green-500/10"
                title="Päivitä levylle uudestaan tarvittaessa"
              >
                <Check className="mr-1.5 h-3.5 w-3.5 text-green-500" />
                Kirjoitettu levylle
              </Button>
              {onNavigateNext && (
                <Button
                  onClick={onNavigateNext}
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-sm h-9 px-4 flex items-center gap-1.5"
                >
                  <span>Siirry Gate 2:een (API)</span>
                  <span className="text-sm font-black">➔</span>
                </Button>
              )}
            </div>
          ) : prismaSchema ? (
            // State: Code exists but never written -> Save to disk
            <Button
              onClick={onWriteToDisk}
              disabled={isWritingToDisk}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md h-9 px-4 flex items-center gap-2"
            >
              {isWritingToDisk ? <Loader2 className="h-4 w-4 animate-spin" /> : <HardDrive className="h-4 w-4" />}
              <span>Kirjoita levylle</span>
            </Button>
          ) : (
            // State: Empty -> Generate code
            <Button
              onClick={onGenerateSchema}
              disabled={isGeneratingSchema}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white font-medium"
            >
              {isGeneratingSchema ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1.5 h-4 w-4" />}
              <span>Generoi tietokantamalli AI:lla</span>
            </Button>
          )}

          {/* Secondary helper: Regenerate only when not in staged review */}
          {!hasStagedChanges && prismaSchema && (
            <Button
              onClick={onGenerateSchema}
              disabled={isGeneratingSchema}
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground"
              title="Generoi skeema uudelleen arkkitehtuurin pohjalta"
            >
              <Sparkles className="mr-1 h-3.5 w-3.5" />
              <span>Generoi uudelleen</span>
            </Button>
          )}
        </div>
      </div>

      {/* Prominent Visual Step Callout Banner for Staged AI Updates */}
      {agentUpdate && (
        <div className="p-4 bg-gradient-to-r from-purple-500/15 via-indigo-500/10 to-emerald-500/10 border-2 border-emerald-500/50 rounded-xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-1 flex-none">
          <div className="flex items-start space-x-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex-shrink-0 mt-0.5">
              <HardDrive className="h-5 w-5 text-emerald-400 animate-bounce" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-foreground">
                  ⚡ Vaihe 1/3: Tekoäly on päivittänyt tietokantamallin työtilassa
                </span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold px-2 py-0.5 rounded-full">
                  Odottaa tallennusta levylle
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {agentUpdate.summary}
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold pt-0.5 flex items-center gap-1.5">
                <span>👉</span>
                <span>
                  <strong>Mitä teet nyt:</strong> Paina vihreää <strong>[ Tallenna muutokset levylle ]</strong> -painiketta. Pääset tarkastamaan Diff-esikatselun ennen tallennusta!
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              onClick={onWriteToDisk}
              disabled={isWritingToDisk}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg h-10 px-5 flex items-center gap-2 text-sm"
            >
              {isWritingToDisk ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <HardDrive className="h-4 w-4" />
              )}
              <span>Tallenna muutokset levylle</span>
            </Button>
            {onDismissAgentUpdate && (
              <button
                type="button"
                onClick={onDismissAgentUpdate}
                className="text-xs text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                Sulje
              </button>
            )}
          </div>
        </div>
      )}

      {/* Completed Gate Success Banner with Next-Step Guide */}
      {isSaved && !hasStagedChanges && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm animate-in fade-in flex-none">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
              <Check className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-foreground flex items-center gap-2">
                <span>✅ Gate 1 (Prisma) on valmis ja tallennettu levylle!</span>
                <span className="text-[10px] text-muted-foreground font-mono">prisma/schema.prisma</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Tietokantamalli on tallennettu. Siirry seuraavaksi Gate 2:een (API & Server Actions) tarkastamaan rajapintakoodi.
              </p>
            </div>
          </div>
          {onNavigateNext && (
            <Button
              onClick={onNavigateNext}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-sm shrink-0 flex items-center gap-1.5 text-xs h-9 px-4"
            >
              <span>Siirry Gate 2:een (API)</span>
              <span className="text-sm font-black">➔</span>
            </Button>
          )}
        </div>
      )}

      {/* AI Co-Pilot Advisory Banner */}
      <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-start space-x-2.5 text-xs text-purple-300 flex-none">
        <Sparkles className="h-4 w-4 text-purple-400 flex-none mt-0.5" />
        <div>
          <span className="font-semibold text-purple-200">AI Co-Pilot -apukuljettaja:</span>{" "}
          <span className="text-foreground/80">
            Generoitu koodi on arkkitehtuurikaavion pohjalta luotu ehdotus. Voit tarkastella koodia vapaasti, ja levykirjoitus avaa aina <strong>Diff-esikatselun</strong> ennen kuin tiedostoja tallennetaan paikallisesti.
          </span>
        </div>
      </div>

      {/* Lightweight App Database Notice */}
      {techProfile && !techProfile.database.needed && (
        <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-xs flex items-start space-x-2.5 flex-none">
          <Sparkles className="h-4 w-4 text-emerald-500 flex-none mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              Kevyt sovellus ({techProfile.tierLabel}): Erillistä palvelintietokantaa ei tarvita!
            </span>
            <p className="text-foreground/80 leading-relaxed">
              {techProfile.database.reason} Voit käyttää suoraan selaimen LocalStoragea tai siirtyä käyttöliittymäkehitykseen. Voit kuitenkin generoida Prisma-skeeman alla olevasta napista, jos haluat myöhemmin laajentaa sovellusta.
            </p>
          </div>
        </div>
      )}

      {/* Status/Error Messages */}
      {diskMessage && (
        <div
          className={`p-3 rounded-md text-xs font-medium flex items-center space-x-2 ${
            diskMessage.type === "success"
              ? "bg-green-500/10 text-green-600 border border-green-500/30"
              : "bg-destructive/10 text-destructive border border-destructive/30"
          }`}
        >
          {diskMessage.type === "success" ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <AlertCircle className="h-4 w-4 text-destructive" />
          )}
          <span>{diskMessage.text}</span>
        </div>
      )}

      {/* Code Display */}
      <div className="flex-1 min-h-0">
        {prismaSchema ? (
          <CodeViewer
            code={prismaSchema}
            filename="prisma/schema.prisma"
            badge="Data Gate 1 • English"
          />
        ) : (
          <div className="h-full border border-dashed rounded-lg flex flex-col items-center justify-center p-8 text-center bg-muted/20 space-y-3">
            <Database className="h-10 w-10 text-muted-foreground/50" />
            <div>
              <h4 className="font-semibold text-sm">Ei vielä generoitua tietokantamallia</h4>
              <p className="text-xs text-muted-foreground max-w-sm mt-1">
                Paina &quot;Generoi tietokantamalli AI:lla&quot; -painiketta luodaksesi arkkitehtuurikaaviosi pohjalta tuotantovalmiin Prisma-skeeman.
              </p>
            </div>
            <Button
              onClick={onGenerateSchema}
              disabled={isGeneratingSchema}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white font-medium"
            >
              {isGeneratingSchema ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-1.5 h-4 w-4" />
              )}
              Generoi tietokantamalli AI:lla
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
