"use client";

import { Check, Database, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CompletionBannerProps {
  nodeCount: number;
  edgeCount: number;
  onNextStep: () => void;
  onDismiss: () => void;
}

export function CompletionBanner({
  nodeCount,
  edgeCount,
  onNextStep,
  onDismiss,
}: CompletionBannerProps) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-3 p-3.5 bg-gradient-to-r from-purple-500/10 via-background to-emerald-500/10 border border-purple-500/30 rounded-xl shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold flex-none">
          <Check className="h-4 w-4" />
        </div>
        <div>
          <p className="font-semibold text-sm text-foreground flex items-center gap-1.5">
            <span>Arkkitehtuurikaavio valmis!</span>
            <span className="text-xs font-normal text-muted-foreground">
              ({nodeCount} komponenttia, {edgeCount} yhteyttä)
            </span>
          </p>
          <p className="text-xs text-muted-foreground">
            Järjestelmäkerrokset ja rajapinnat mallinnettu. Voit tutkia solmuja tai siirtyä seuraavaan vaiheeseen.
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Button
          size="sm"
          onClick={onNextStep}
          className="bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs h-8 shadow-sm"
        >
          <Database className="mr-1.5 h-3.5 w-3.5" />
          Luo Tietokantamalli (Gate 1) &rarr;
        </Button>
        <button
          type="button"
          onClick={onDismiss}
          className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted"
          title="Sulje ilmoitus"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
