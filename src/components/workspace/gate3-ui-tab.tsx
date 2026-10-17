"use client";

import { LayoutGrid, Sparkles, Loader2, HardDrive, Check, AlertCircle, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CodeViewer } from "@/components/code-viewer";

interface Gate3UiTabProps {
  uiCode: string;
  isGeneratingUi: boolean;
  isWritingToDisk: boolean;
  isSaved?: boolean;
  diskMessage: { type: "success" | "error"; text: string } | null;
  agentUpdate?: { summary: string; timestamp: number } | null;
  onGenerateUi: () => void;
  onWriteToDisk: () => void;
  onNavigateNext?: () => void;
  onDismissAgentUpdate?: () => void;
}

export function Gate3UiTab({
  uiCode,
  isGeneratingUi,
  isWritingToDisk,
  isSaved = false,
  diskMessage,
  agentUpdate,
  onGenerateUi,
  onWriteToDisk,
  onNavigateNext,
  onDismissAgentUpdate,
}: Gate3UiTabProps) {
  const hasStagedChanges = Boolean(agentUpdate);

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-background border rounded-lg p-4 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 flex-none">
        <div>
          <h3 className="font-bold text-base flex items-center space-x-2">
            <LayoutGrid className="h-5 w-5 text-purple-500" />
            <span>Data Gate 3: UI Components & Frontend Views</span>
          </h3>
          <p className="text-xs text-muted-foreground">
            Generoi tuotantovalmiit React 19 + Tailwind CSS -käyttöliittymäkomponentit ja tilanhallinnan arkkitehtuurikaaviosi pohjalta (Standard English).
          </p>
        </div>

        {/* Clear Action Toolbar - Prioritize Single Primary Action */}
        <div className="flex items-center space-x-2">
          {/* Priority 1: If staged changes exist, highlight save action only */}
          {hasStagedChanges ? (
            <Button
              onClick={onWriteToDisk}
              disabled={isWritingToDisk}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md animate-pulse"
            >
              {isWritingToDisk ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <HardDrive className="mr-1.5 h-4 w-4" />}
              <span>Tallenna muutokset levylle</span>
            </Button>
          ) : isSaved && onNavigateNext ? (
            /* Priority 2: When saved, guide to next step (Project Handover) */
            <Button
              onClick={onNavigateNext}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-sm flex items-center"
            >
              <Package className="mr-1.5 h-4 w-4" />
              <span>🎉 Kaikki 3 Gatea valmiina! Paketoi ja luovuta projekti</span>
              <span className="ml-1 text-sm font-black">➔</span>
            </Button>
          ) : uiCode ? (
            /* Priority 3: When code exists but not yet saved, write to disk */
            <Button
              onClick={onWriteToDisk}
              disabled={isWritingToDisk}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              {isWritingToDisk ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <HardDrive className="mr-1.5 h-4 w-4" />}
              <span>Kirjoita levylle (src/components/features/dashboard.tsx)</span>
            </Button>
          ) : (
            /* Priority 4: Initial state: Generate */
            <Button
              onClick={onGenerateUi}
              disabled={isGeneratingUi}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white font-medium"
            >
              {isGeneratingUi ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1.5 h-4 w-4" />}
              <span>Generoi UI AI:lla</span>
            </Button>
          )}

          {/* Secondary helper: Regenerate only when not in staged review */}
          {!hasStagedChanges && uiCode && (
            <Button
              onClick={onGenerateUi}
              disabled={isGeneratingUi}
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground"
              title="Generoi UI uudelleen arkkitehtuurin pohjalta"
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
                  ⚡ Vaihe 3/3: Tekoäly on päivittänyt käyttöliittymäkoodin työtilassa
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
                <span>✅ Gate 3 (React 19 UI) on valmis ja tallennettu levylle!</span>
                <span className="text-[10px] text-muted-foreground font-mono">src/components/features/dashboard.tsx</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Kaikki 3 Gatea on tuotettu ja tallennettu onnistuneesti! Voit nyt avata arkkitehtuurikaavion tai tarkastella kokonaisuutta.
              </p>
            </div>
          </div>
          {onNavigateNext && (
            <Button
              onClick={onNavigateNext}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-sm shrink-0 flex items-center gap-1.5 text-xs h-9 px-4"
            >
              <span>Avaa arkkitehtuurikaavio</span>
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
            UI-komponentti on ehdotus kaavion tilan ja toimintojen visualisoimiseksi. Tarkista komponentti ja vahvista tallennus <strong>Diff-esikatselun</strong> kautta ennen paikallista tiedostotallennusta.
          </span>
        </div>
      </div>

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
        {uiCode ? (
          <CodeViewer
            code={uiCode}
            filename="src/components/features/dashboard.tsx"
            badge="Data Gate 3 • English"
          />
        ) : (
          <div className="h-full border border-dashed rounded-lg flex flex-col items-center justify-center p-8 text-center bg-muted/20 space-y-3">
            <LayoutGrid className="h-10 w-10 text-muted-foreground/50" />
            <div>
              <h4 className="font-semibold text-sm">Ei vielä generoituja käyttöliittymäkomponentteja</h4>
              <p className="text-xs text-muted-foreground max-w-sm mt-1">
                Paina &quot;Generoi UI AI:lla&quot; -painiketta luodaksesi arkkitehtuurikaaviosi ja tietomallisi pohjalta tuotantovalmiin React 19 + Tailwind CSS -näkymän.
              </p>
            </div>
            <Button
              onClick={onGenerateUi}
              disabled={isGeneratingUi}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white font-medium"
            >
              {isGeneratingUi ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-1.5 h-4 w-4" />
              )}
              Generoi UI AI:lla
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
