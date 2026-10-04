"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  Save,
  Loader2,
  Check,
  ShieldCheck,
  Database,
  LayoutGrid,
  Server,
  Zap,
  Key,
  Download,
  CheckCircle2,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TechStackProfile } from "@/app/actions/tech-stack";

export type WorkspaceTab = "canvas" | "schema" | "api" | "ui";

export interface WorkspaceHeaderProps {
  currentProjectId?: string;
  currentProjectName?: string;
  activeTab: WorkspaceTab;
  setActiveTab: (tab: WorkspaceTab) => void;
  savedGates: {
    gate1?: boolean;
    gate2?: boolean;
    gate3?: boolean;
  };
  techProfile: TechStackProfile | null;
  isPending: boolean;
  savedSuccess: boolean;
  onExportClick: () => void;
  onSecurityCheck: () => void;
  onOptimizationCheck: () => void;
  onEnvClick: () => void;
  onSave: () => void;
}

export function WorkspaceHeader({
  currentProjectId,
  currentProjectName,
  activeTab,
  setActiveTab,
  savedGates,
  techProfile,
  isPending,
  savedSuccess,
  onExportClick,
  onSecurityCheck,
  onOptimizationCheck,
  onEnvClick,
  onSave,
}: WorkspaceHeaderProps) {
  const [showToolsMenu, setShowToolsMenu] = useState(false);

  return (
    <header className="h-14 border-b bg-background px-2 sm:px-4 lg:px-6 flex items-center justify-between flex-none gap-1.5 sm:gap-3 overflow-visible relative z-30">
      {/* Left: Back button + Title */}
      <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0 min-w-0">
        <Button
          variant="ghost"
          size="icon-sm"
          render={<Link href={currentProjectId ? `/projects/${currentProjectId}` : "/"} />}
          nativeButton={false}
          className="shrink-0 h-8 w-8"
          title="Takaisin projektilistaukseen"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center space-x-1.5 min-w-0">
          <Sparkles className="h-4 w-4 text-purple-500 shrink-0" />
          <h1
            className="font-bold text-xs sm:text-sm tracking-tight truncate max-w-[80px] xs:max-w-[120px] sm:max-w-[160px] md:max-w-[200px]"
            title={currentProjectName ? `Ajatushautomo: ${currentProjectName}` : "Arkkitehtuurin Hiekkalaatikko"}
          >
            {currentProjectName || "Arkkitehtuuri"}
          </h1>
        </div>
      </div>

      {/* Center: View Mode Toggle Tabs (Responsive & Compact with scrollable fallback) */}
      <div className="flex items-center justify-center min-w-0 flex-1 px-1">
        <div className="flex items-center bg-muted/60 p-0.5 sm:p-1 rounded-lg border border-border/50 text-xs font-medium overflow-x-auto max-w-full scrollbar-none gap-0.5 shrink-0">
          <button
            onClick={() => setActiveTab("canvas")}
            className={`flex items-center space-x-1 px-2 sm:px-2.5 py-1 rounded-md transition-all text-xs shrink-0 whitespace-nowrap ${
              activeTab === "canvas"
                ? "bg-background text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="Visuaalinen Kaavio"
          >
            <LayoutGrid className="h-3.5 w-3.5 text-purple-500 shrink-0" />
            <span>Kaavio</span>
          </button>

          <button
            onClick={() => setActiveTab("schema")}
            className={`flex items-center space-x-1 px-2 sm:px-2.5 py-1 rounded-md transition-all text-xs shrink-0 whitespace-nowrap ${
              activeTab === "schema"
                ? "bg-background text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="Tietokantamalli (Data Gate 1)"
          >
            <Database className="h-3.5 w-3.5 text-purple-500 shrink-0" />
            <span>Gate 1</span>
            {savedGates.gate1 && (
              <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("api")}
            className={`flex items-center space-x-1 px-2 sm:px-2.5 py-1 rounded-md transition-all text-xs shrink-0 whitespace-nowrap ${
              activeTab === "api"
                ? "bg-background text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="API & Server Actions (Data Gate 2)"
          >
            <Server className="h-3.5 w-3.5 text-purple-500 shrink-0" />
            <span>Gate 2</span>
            {savedGates.gate2 && (
              <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("ui")}
            className={`flex items-center space-x-1 px-2 sm:px-2.5 py-1 rounded-md transition-all text-xs shrink-0 whitespace-nowrap ${
              activeTab === "ui"
                ? "bg-background text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="UI-Komponentit (Data Gate 3)"
          >
            <LayoutGrid className="h-3.5 w-3.5 text-purple-500 shrink-0" />
            <span>Gate 3</span>
            {savedGates.gate3 && (
              <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
            )}
          </button>
        </div>
      </div>

      {/* Right: Action Buttons (Adaptive dropdown on mobile/tablet, full suite on desktop) */}
      <div className="flex items-center space-x-1 sm:space-x-1.5 shrink-0">
        {/* Mobile/Compact dropdown for tools (< lg) */}
        <div className="relative lg:hidden">
          <Button
            onClick={() => setShowToolsMenu((prev) => !prev)}
            variant="outline"
            size="sm"
            className="h-8 px-2 border-purple-500/30 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 font-medium"
            title="Työkalut (Vie, Security, Optimize, .env)"
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline ml-1 text-xs">Työkalut</span>
          </Button>

          {showToolsMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowToolsMenu(false)}
              />
              <div className="absolute right-0 top-9 z-50 w-56 rounded-lg border bg-popover p-1.5 text-popover-foreground shadow-xl ring-1 ring-black/10 animate-in fade-in-0 zoom-in-95 space-y-0.5">
                <button
                  onClick={() => {
                    setShowToolsMenu(false);
                    onExportClick();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-medium hover:bg-muted transition-colors text-left"
                >
                  <Download className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                  <div>
                    <div className="font-semibold text-foreground">Vie Kaavio</div>
                    <div className="text-[10px] text-muted-foreground">PNG, SVG, Mermaid.js</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setShowToolsMenu(false);
                    onSecurityCheck();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-medium hover:bg-muted transition-colors text-left"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                  <div>
                    <div className="font-semibold text-foreground">Security Check</div>
                    <div className="text-[10px] text-muted-foreground">OWASP Top 10 tarkastus</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setShowToolsMenu(false);
                    onOptimizationCheck();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-medium hover:bg-muted transition-colors text-left"
                >
                  <Zap className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  <div>
                    <div className="font-semibold text-foreground">Optimize Code</div>
                    <div className="text-[10px] text-muted-foreground">Suorituskyky & Scorecard</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setShowToolsMenu(false);
                    onEnvClick();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-medium hover:bg-muted transition-colors text-left"
                >
                  <Key className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                  <div>
                    <div className="font-semibold text-foreground">Avaimet & .env</div>
                    <div className="text-[10px] text-muted-foreground">API-avaimet & ympäristö</div>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Desktop tool suite (>= lg) */}
        <div className="hidden lg:flex items-center space-x-1 sm:space-x-1.5">
          <Button
            onClick={onExportClick}
            variant="outline"
            size="sm"
            className="h-8 px-2 xl:px-2.5 border-purple-500/30 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 font-medium"
            title="Vie Kaavio (PNG, SVG, Mermaid.js)"
          >
            <Download className="h-3.5 w-3.5 text-purple-500" />
            <span className="hidden xl:inline ml-1.5">Vie</span>
          </Button>

          <Button
            onClick={onSecurityCheck}
            variant="outline"
            size="sm"
            className="h-8 px-2 xl:px-2.5 border-purple-500/30 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 font-medium"
            title="OWASP Tietoturvatarkastus"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-purple-500" />
            <span className="hidden xl:inline ml-1.5">Security</span>
          </Button>

          <Button
            onClick={onOptimizationCheck}
            variant="outline"
            size="sm"
            className="h-8 px-2 xl:px-2.5 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 font-medium"
            title="Koodin optimointi & Scorecard"
          >
            <Zap className="h-3.5 w-3.5 text-amber-500" />
            <span className="hidden xl:inline ml-1.5">Optimize</span>
          </Button>

          <Button
            onClick={onEnvClick}
            variant="outline"
            size="sm"
            className="h-8 px-2 xl:px-2.5 border-purple-500/30 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 font-medium"
            title={techProfile?.tierLabel ? `${techProfile.tierLabel} Avaimet & .env` : "Avaimet & .env"}
          >
            <Key className="h-3.5 w-3.5 text-purple-500" />
            <span className="hidden xl:inline ml-1.5">.env</span>
          </Button>
        </div>

        {/* Primary Save Button - Always visible */}
        <Button
          onClick={onSave}
          disabled={isPending}
          size="sm"
          className="h-8 px-2.5 sm:px-3 bg-purple-600 hover:bg-purple-700 text-white font-medium"
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : savedSuccess ? (
            <Check className="h-3.5 w-3.5 text-green-400" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          <span className="hidden sm:inline ml-1.5">{savedSuccess ? "Tallennettu" : "Tallenna"}</span>
        </Button>
      </div>
    </header>
  );
}
