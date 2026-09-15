"use client";

import { LayoutGrid, Sparkles, Loader2, HardDrive, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CodeViewer } from "@/components/code-viewer";

interface Gate3UiTabProps {
  uiCode: string;
  isGeneratingUi: boolean;
  isWritingToDisk: boolean;
  diskMessage: { type: "success" | "error"; text: string } | null;
  onGenerateUi: () => void;
  onWriteToDisk: () => void;
}

export function Gate3UiTab({
  uiCode,
  isGeneratingUi,
  isWritingToDisk,
  diskMessage,
  onGenerateUi,
  onWriteToDisk,
}: Gate3UiTabProps) {
  return (
    <div className="flex-1 min-h-0 flex flex-col bg-background border rounded-lg p-4 shadow-sm space-y-4">
      <div className="flex items-center justify-between flex-none">
        <div>
          <h3 className="font-bold text-base flex items-center space-x-2">
            <LayoutGrid className="h-5 w-5 text-purple-500" />
            <span>Data Gate 3: UI Components & Frontend Views</span>
          </h3>
          <p className="text-xs text-muted-foreground">
            Generoi tuotantovalmiit React 19 + Tailwind CSS -käyttöliittymäkomponentit ja tilanhallinnan arkkitehtuurikaaviosi pohjalta (Standard English).
          </p>
        </div>

        <div className="flex items-center space-x-2">
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
            {uiCode ? "Päivitä UI-koodi AI:lla" : "Generoi UI AI:lla"}
          </Button>

          {uiCode && (
            <Button
              onClick={onWriteToDisk}
              disabled={isWritingToDisk}
              variant="outline"
              size="sm"
              className="border-green-500/40 text-green-600 hover:bg-green-500/10 font-medium"
            >
              {isWritingToDisk ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <HardDrive className="mr-1.5 h-4 w-4 text-green-500" />
              )}
              Kirjoita levylle (src/components/features/dashboard.tsx)
            </Button>
          )}
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
