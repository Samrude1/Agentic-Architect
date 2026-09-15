"use client";

import { Database, Sparkles, Loader2, HardDrive, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CodeViewer } from "@/components/code-viewer";
import { TechStackProfile } from "@/app/actions/tech-stack";

interface Gate1SchemaTabProps {
  prismaSchema: string;
  isGeneratingSchema: boolean;
  isWritingToDisk: boolean;
  diskMessage: { type: "success" | "error"; text: string } | null;
  techProfile: TechStackProfile | null;
  onGenerateSchema: () => void;
  onWriteToDisk: () => void;
}

export function Gate1SchemaTab({
  prismaSchema,
  isGeneratingSchema,
  isWritingToDisk,
  diskMessage,
  techProfile,
  onGenerateSchema,
  onWriteToDisk,
}: Gate1SchemaTabProps) {
  return (
    <div className="flex-1 min-h-0 flex flex-col bg-background border rounded-lg p-4 shadow-sm space-y-4">
      <div className="flex items-center justify-between flex-none">
        <div>
          <h3 className="font-bold text-base flex items-center space-x-2">
            <Database className="h-5 w-5 text-purple-500" />
            <span>Data Gate 1: Prisma Database Schema</span>
          </h3>
          <p className="text-xs text-muted-foreground">
            Generoi tuotantovalmis Prisma-tietokantamalli kaaviossa määriteltyjen komponenttien pohjalta (Standard English).
          </p>
        </div>

        <div className="flex items-center space-x-2">
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
            {prismaSchema ? "Päivitä kaavio AI:lla" : "Generoi tietokantamalli AI:lla"}
          </Button>

          {prismaSchema && (
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
              Kirjoita levylle (prisma/schema.prisma)
            </Button>
          )}
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
