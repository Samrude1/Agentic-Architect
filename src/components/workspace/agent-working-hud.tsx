"use client";

import { Bot, CheckCircle2, Circle, Loader2 } from "lucide-react";

interface AgentWorkingHudProps {
  step: number;
}

export function AgentWorkingHud({ step }: AgentWorkingHudProps) {
  return (
    <div className="absolute inset-0 z-20 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 transition-all duration-300 rounded-lg">
      <div className="max-w-md w-full bg-card border border-purple-500/40 rounded-2xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
            <Bot className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-base text-foreground">Tekoäly-arkkitehti työskentelee</h3>
            <p className="text-xs text-muted-foreground">Muodostetaan 4-tasoista järjestelmärakennetta...</p>
          </div>
        </div>

        <div className="space-y-3 pt-1">
          <div className="flex items-center space-x-3 text-xs">
            {step > 1 ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-none" />
            ) : step === 1 ? (
              <Loader2 className="h-4 w-4 text-purple-500 animate-spin flex-none" />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground/40 flex-none" />
            )}
            <span className={step === 1 ? "font-semibold text-foreground" : "text-muted-foreground"}>
              1. Puretaan vaatimusmäärittely ja tunnistetaan integraatiot
            </span>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            {step > 2 ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-none" />
            ) : step === 2 ? (
              <Loader2 className="h-4 w-4 text-purple-500 animate-spin flex-none" />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground/40 flex-none" />
            )}
            <span className={step === 2 ? "font-semibold text-foreground" : "text-muted-foreground"}>
              2. Muotoillaan 4-kerroksinen arkkitehtuuri (Client, API, Services, DB)
            </span>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            {step >= 3 ? (
              <Loader2 className="h-4 w-4 text-purple-500 animate-spin flex-none" />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground/40 flex-none" />
            )}
            <span className={step === 3 ? "font-semibold text-foreground" : "text-muted-foreground"}>
              3. Sijoitetaan solmut ja kytketään tietovirrat
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
