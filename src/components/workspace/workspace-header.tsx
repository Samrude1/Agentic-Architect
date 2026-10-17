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
  Package,
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
  agentUpdatedGates?: {
    gate1?: { summary: string; timestamp: number };
    gate2?: { summary: string; timestamp: number };
    gate3?: { summary: string; timestamp: number };
  };
  techProfile: TechStackProfile | null;
  isPending: boolean;
  savedSuccess: boolean;
  isOptimizing?: boolean;
  isAuditingSecurity?: boolean;
  onExportClick: () => void;
  onHandoverClick?: () => void;
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
  agentUpdatedGates,
  techProfile,
  isPending,
  savedSuccess,
  isOptimizing = false,
  isAuditingSecurity = false,
  onExportClick,
  onHandoverClick,
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
            className={`flex items-center space-x-1.5 px-2 sm:px-2.5 py-1 rounded-md transition-all text-xs shrink-0 whitespace-nowrap ${
              activeTab === "schema"
                ? "bg-background text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="Tietokantamalli (Data Gate 1)"
          >
            <Database className="h-3.5 w-3.5 text-purple-500 shrink-0" />
            <span>Gate 1</span>
            {agentUpdatedGates?.gate1 ? (
              <span className="flex h-2 w-2 relative" title="Uusi päivitys odottaa tallennusta">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
            ) : savedGates.gate1 ? (
              <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
            ) : null}
          </button>

          <button
            onClick={() => setActiveTab("api")}
            className={`flex items-center space-x-1.5 px-2 sm:px-2.5 py-1 rounded-md transition-all text-xs shrink-0 whitespace-nowrap ${
              activeTab === "api"
                ? "bg-background text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="API & Server Actions (Data Gate 2)"
          >
            <Server className="h-3.5 w-3.5 text-purple-500 shrink-0" />
            <span>Gate 2</span>
            {agentUpdatedGates?.gate2 ? (
              <span className="flex h-2 w-2 relative" title="Uusi päivitys odottaa tallennusta">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
            ) : savedGates.gate2 ? (
              <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
            ) : null}
          </button>

          <button
            onClick={() => setActiveTab("ui")}
            className={`flex items-center space-x-1.5 px-2 sm:px-2.5 py-1 rounded-md transition-all text-xs shrink-0 whitespace-nowrap ${
              activeTab === "ui"
                ? "bg-background text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="UI-Komponentit (Data Gate 3)"
          >
            <LayoutGrid className="h-3.5 w-3.5 text-purple-500 shrink-0" />
            <span>Gate 3</span>
            {agentUpdatedGates?.gate3 ? (
              <span className="flex h-2 w-2 relative" title="Uusi päivitys odottaa tallennusta">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
            ) : savedGates.gate3 ? (
              <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
            ) : null}
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
                    onHandoverClick?.();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-medium hover:bg-muted transition-colors text-left"
                >
                  <Package className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                  <div>
                    <div className="font-semibold text-foreground">Paketoi & Luovuta</div>
                    <div className="text-[10px] text-muted-foreground">Lataa .ZIP & Asennusohjeet</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setShowToolsMenu(false);
                    onSecurityCheck();
                  }}
                  disabled={isAuditingSecurity}
                  className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-medium hover:bg-muted transition-colors text-left disabled:opacity-60"
                >
                  {isAuditingSecurity ? (
                    <Loader2 className="h-3.5 w-3.5 text-purple-500 animate-spin shrink-0" />
                  ) : (
                    <ShieldCheck className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                  )}
                  <div>
                    <div className="font-semibold text-foreground">
                      {isAuditingSecurity ? "Tarkistetaan..." : "Security Check"}
                    </div>
                    <div className="text-[10px] text-muted-foreground">OWASP Top 10 tarkastus</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setShowToolsMenu(false);
                    onOptimizationCheck();
                  }}
                  disabled={isOptimizing}
                  className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-medium hover:bg-muted transition-colors text-left disabled:opacity-60"
                >
                  {isOptimizing ? (
                    <Loader2 className="h-3.5 w-3.5 text-amber-500 animate-spin shrink-0" />
                  ) : (
                    <Zap className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  )}
                  <div>
                    <div className="font-semibold text-foreground">
                      {isOptimizing ? "Optimoidaan..." : "Optimize Code"}
                    </div>
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
            onClick={onHandoverClick}
            variant="outline"
            size="sm"
            className="h-8 px-2.5 border-purple-500/50 bg-purple-600/10 text-purple-600 dark:text-purple-400 hover:bg-purple-600/20 font-bold shadow-sm flex items-center"
            title="Projektin Luovutus & Paketointi (.ZIP & Asennusohjeet)"
          >
            <Package className="h-3.5 w-3.5 text-purple-500 mr-1.5" />
            <span>Paketoi</span>
          </Button>

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
            disabled={isAuditingSecurity}
            variant="outline"
            size="sm"
            className={`h-8 px-2 xl:px-2.5 border-purple-500/30 font-medium transition-all ${
              isAuditingSecurity
                ? "bg-purple-500/15 text-purple-600 dark:text-purple-400 animate-pulse border-purple-500/60"
                : "text-purple-600 dark:text-purple-400 hover:bg-purple-500/10"
            }`}
            title="OWASP Tietoturvatarkastus"
          >
            {isAuditingSecurity ? (
              <Loader2 className="h-3.5 w-3.5 text-purple-500 animate-spin" />
            ) : (
              <ShieldCheck className="h-3.5 w-3.5 text-purple-500" />
            )}
            <span className="hidden xl:inline ml-1.5">
              {isAuditingSecurity ? "Tarkistetaan..." : "Security"}
            </span>
          </Button>

          <Button
            onClick={onOptimizationCheck}
            disabled={isOptimizing}
            variant="outline"
            size="sm"
            className={`h-8 px-2 xl:px-2.5 border-amber-500/30 font-medium transition-all ${
              isOptimizing
                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 animate-pulse border-amber-500/60 shadow-sm shadow-amber-500/20"
                : "text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
            }`}
            title="Koodin optimointi & Scorecard"
          >
            {isOptimizing ? (
              <Loader2 className="h-3.5 w-3.5 text-amber-500 animate-spin" />
            ) : (
              <Zap className="h-3.5 w-3.5 text-amber-500" />
            )}
            <span className="hidden xl:inline ml-1.5">
              {isOptimizing ? "Optimoidaan..." : "Optimize"}
            </span>
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
