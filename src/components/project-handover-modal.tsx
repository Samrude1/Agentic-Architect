"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Package,
  Download,
  FolderSync,
  Terminal,
  Bot,
  Check,
  Copy,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Layers,
  Sparkles,
  Database,
  FileCode,
  LayoutGrid,
} from "lucide-react";
import {
  buildProjectZipBase64,
  scaffoldProjectTargetFolder,
  inspectTargetProject,
  type TargetProjectInspection,
  type ProjectScaffoldOptions,
} from "@/app/actions/handover";
import type { TechStackProfile } from "@/app/actions/tech-stack";

interface ProjectHandoverModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string;
  projectName?: string;
  targetPath?: string;
  prismaSchema?: string;
  apiCode?: string;
  uiCode?: string;
  techProfile?: TechStackProfile | null;
  mermaidDiagram?: string;
  onTriggerCopilotGuidance?: (prompt: string) => void;
}

export function ProjectHandoverModal({
  open,
  onOpenChange,
  projectId = "",
  projectName = "Sovellus",
  targetPath = "",
  prismaSchema = "",
  apiCode = "",
  uiCode = "",
  techProfile,
  mermaidDiagram = "",
  onTriggerCopilotGuidance,
}: ProjectHandoverModalProps) {
  const [activeTab, setActiveTab] = useState<"package" | "instructions" | "copilot">("package");
  const [isZipping, setIsZipping] = useState(false);
  const [isScaffolding, setIsScaffolding] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [scaffoldResult, setScaffoldResult] = useState<{
    success: boolean;
    writtenCount?: number;
    error?: string;
  } | null>(null);
  const [inspection, setInspection] = useState<TargetProjectInspection | null>(null);
  const [isInspecting, setIsInspecting] = useState(false);

  // Clean slug for display
  const cleanSlug = (projectName || "projekti")
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "projekti";

  // Re-inspect target project folder when dialog opens
  useEffect(() => {
    if (open && targetPath) {
      let isMounted = true;
      setIsInspecting(true);
      inspectTargetProject(targetPath)
        .then((res) => {
          if (isMounted) setInspection(res);
        })
        .catch(() => {
          if (isMounted) setInspection(null);
        })
        .finally(() => {
          if (isMounted) setIsInspecting(false);
        });
      return () => {
        isMounted = false;
      };
    }
  }, [open, targetPath]);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      const options: ProjectScaffoldOptions = {
        projectName,
        targetPath,
        prismaSchema,
        apiCode,
        uiCode,
        techProfile,
        mermaidDiagram,
      };

      const res = await buildProjectZipBase64(options);
      if (!res.success || !res.zipBase64) {
        throw new Error(res.error || "Zip-paketin luonti epäonnistui.");
      }

      // Convert base64 to blob and trigger download
      const binaryString = atob(res.zipBase64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: "application/zip" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = res.filename || `${cleanSlug}-valmis-paketti.zip`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading zip:", err);
      alert(err instanceof Error ? err.message : "Zip-paketin lataus epäonnistui.");
    } finally {
      setIsZipping(false);
    }
  };

  const handleScaffoldTargetFolder = async () => {
    setIsScaffolding(true);
    setScaffoldResult(null);
    try {
      const options: ProjectScaffoldOptions = {
        projectName,
        targetPath,
        prismaSchema,
        apiCode,
        uiCode,
        techProfile,
        mermaidDiagram,
      };

      const res = await scaffoldProjectTargetFolder(projectId, options);
      if (!res.success) {
        setScaffoldResult({ success: false, error: res.error });
      } else {
        setScaffoldResult({
          success: true,
          writtenCount: res.writtenFiles?.length || 0,
        });
        // Refresh inspection
        if (targetPath) {
          inspectTargetProject(targetPath).then(setInspection);
        }
      }
    } catch (err) {
      setScaffoldResult({
        success: false,
        error: err instanceof Error ? err.message : "Kohdekansion täydennys epäonnistui.",
      });
    } finally {
      setIsScaffolding(false);
    }
  };

  const handleAskCopilot = () => {
    const prompt = `Projekti "${projectName}" on nyt valmis ja paketoitu luovutusta varten!
Anna minulle tarkka, selkeä suomenkielinen pika-aloitusopas:
1. Miten otan puretun koodin käyttöön omassa IDE-kehitysympäristössäni (esim. VS Code / Cursor).
2. Mitä komentoja minun tulee ajaa järjestyksessä (riippuvuudet, .env, tietokanta ja kehityspalvelin).
3. Miten voin testata että Data Gate 2:n rajapinnat ja Data Gate 3:n käyttöliittymä toimivat yhdessä.
4. Parhaat vinkit projektin jatkokehitykseen.`;

    onTriggerCopilotGuidance?.(prompt);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-3xl md:max-w-4xl lg:max-w-5xl max-h-[92vh] flex flex-col p-0 overflow-hidden bg-background border-border/80 shadow-2xl">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b bg-gradient-to-r from-purple-500/10 via-indigo-500/5 to-emerald-500/10 flex-none">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-purple-600/15 border border-purple-500/30 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold shadow-sm flex-none">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg sm:text-xl font-bold flex items-center gap-2">
                  <span>Projektin Luovutus & Paketointi</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-semibold">
                    Turnkey Ready
                  </span>
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  Luovuta koko {projectName} -sovellus itsenäisenä .ZIP-tiedostona tai täydennä kohdekansio ajovalmiiksi.
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-4 pt-2 border-t border-border/50">
            <button
              onClick={() => setActiveTab("package")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "package"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Package className="h-3.5 w-3.5" />
              <span>Paketointi & Luovutus</span>
            </button>

            <button
              onClick={() => setActiveTab("instructions")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "instructions"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Terminal className="h-3.5 w-3.5" />
              <span>Asennus- & IDE-ohjeet</span>
            </button>

            <button
              onClick={() => setActiveTab("copilot")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "copilot"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Bot className="h-3.5 w-3.5 text-purple-400" />
              <span>Co-Pilot Opastus</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* TAB 1: PAKETOINTI (.ZIP & LEVY) */}
          {activeTab === "package" && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              {/* Primary Download Action Card */}
              <div className="p-5 rounded-xl border-2 border-purple-500/40 bg-gradient-to-br from-purple-500/10 via-background to-emerald-500/5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm sm:text-base text-foreground flex items-center gap-2">
                      <span>1. Lataa itsenäinen .ZIP-koodipaketti</span>
                      <span className="text-[10px] font-semibold bg-purple-500/20 text-purple-600 dark:text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30">
                        Suositeltu
                      </span>
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Paketoi sovelluksen koodin, Next.js 15 konfiguraatiot, package.json-riippuvuudet, Prisma-skeeman ja asennusoppaan suoraan ladattavaksi zipiksi.
                    </p>
                  </div>

                  <Button
                    onClick={handleDownloadZip}
                    disabled={isZipping}
                    size="default"
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md shrink-0 h-11 px-5 min-w-[200px]"
                  >
                    {isZipping ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin shrink-0" />
                        <span>Paketoidaan .ZIP...</span>
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4 shrink-0" />
                        <div className="flex flex-col items-start leading-tight text-left">
                          <span className="text-sm">Lataa .ZIP-paketti</span>
                          <span className="text-[10px] text-purple-200 font-normal">
                            {cleanSlug.length > 22 ? `${cleanSlug.slice(0, 20)}...` : cleanSlug}.zip
                          </span>
                        </div>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Secondary Option: Scaffold to target directory on disk */}
              <div className="p-5 rounded-xl border bg-card shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                      <FolderSync className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>2. Täydennä paikallinen kotikansio ajovalmiiksi</span>
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Kirjoittaa puuttuvat peruskivet (<code className="text-xs bg-muted px-1 py-0.5 rounded">package.json</code>, <code className="text-xs bg-muted px-1 py-0.5 rounded">tsconfig.json</code>, <code className="text-xs bg-muted px-1 py-0.5 rounded">src/app/layout.tsx</code>, jne.) suoraan projektin kotikansioon.
                    </p>
                    {targetPath ? (
                      <p className="text-xs font-mono text-purple-600 dark:text-purple-400 pt-1 truncate max-w-lg">
                        📂 {targetPath}
                      </p>
                    ) : (
                      <p className="text-xs text-amber-500 pt-1">
                        ⚠️ Kotikansiota ei ole asetettu työtilassa.
                      </p>
                    )}
                  </div>

                  <Button
                    onClick={handleScaffoldTargetFolder}
                    disabled={isScaffolding || !targetPath}
                    variant="outline"
                    size="default"
                    className="border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 font-bold shrink-0 h-10 px-4 whitespace-nowrap min-w-[170px]"
                  >
                    {isScaffolding ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin shrink-0" />
                        <span>Kirjoitetaan...</span>
                      </>
                    ) : (
                      <>
                        <FolderSync className="mr-1.5 h-3.5 w-3.5 shrink-0" />
                        <span>Täydennä kansio</span>
                      </>
                    )}
                  </Button>
                </div>

                {scaffoldResult && (
                  <div
                    className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                      scaffoldResult.success
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                        : "bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20"
                    }`}
                  >
                    {scaffoldResult.success ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 flex-none text-emerald-500" />
                        <span>
                          Kohdekansio täydennetty onnistuneesti! Kirjoitettu {scaffoldResult.writtenCount} käynnistystiedostoa levylle.
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4 flex-none text-red-500" />
                        <span>{scaffoldResult.error || "Virhe kohdekansion kirjoituksessa."}</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Package Contents Checklist */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Mitä toimitettava paketti sisältää:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="flex items-center space-x-2.5 p-2.5 rounded-lg border bg-muted/40 text-xs">
                    <Database className="h-4 w-4 text-purple-500 flex-none" />
                    <div>
                      <div className="font-semibold text-foreground">Data Gate 1: Prisma Schema</div>
                      <div className="text-[10px] text-muted-foreground">prisma/schema.prisma</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2.5 p-2.5 rounded-lg border bg-muted/40 text-xs">
                    <FileCode className="h-4 w-4 text-indigo-500 flex-none" />
                    <div>
                      <div className="font-semibold text-foreground">Data Gate 2: REST API & Zod</div>
                      <div className="text-[10px] text-muted-foreground">src/app/api/endpoints/route.ts</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2.5 p-2.5 rounded-lg border bg-muted/40 text-xs">
                    <LayoutGrid className="h-4 w-4 text-emerald-500 flex-none" />
                    <div>
                      <div className="font-semibold text-foreground">Data Gate 3: UI Dashboard</div>
                      <div className="text-[10px] text-muted-foreground">src/components/features/dashboard.tsx</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2.5 p-2.5 rounded-lg border bg-muted/40 text-xs">
                    <Layers className="h-4 w-4 text-amber-500 flex-none" />
                    <div>
                      <div className="font-semibold text-foreground">Next.js 15 & Tailwind Riippuvuudet</div>
                      <div className="text-[10px] text-muted-foreground">package.json, tsconfig.json, next.config.ts</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2.5 p-2.5 rounded-lg border bg-muted/40 text-xs">
                    <CheckCircle2 className="h-4 w-4 text-blue-500 flex-none" />
                    <div>
                      <div className="font-semibold text-foreground">Käynnistyssivu & Prisma Singleton</div>
                      <div className="text-[10px] text-muted-foreground">src/app/page.tsx, layout.tsx, prisma.ts</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2.5 p-2.5 rounded-lg border bg-muted/40 text-xs">
                    <Terminal className="h-4 w-4 text-pink-500 flex-none" />
                    <div>
                      <div className="font-semibold text-foreground">Asennusohjeet & Arkkitehtuuri</div>
                      <div className="text-[10px] text-muted-foreground">README.md, docs/ARCHITECTURE.md</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ASENNUS- & IDE-OHJEET */}
          {activeTab === "instructions" && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              <div className="p-4 rounded-xl border bg-muted/30 space-y-2">
                <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-purple-500" />
                  <span>Käyttöönotto 5 minuutissa missä tahansa IDE:ssä</span>
                </h4>
                <p className="text-xs text-muted-foreground">
                  Noudata näitä vaiheita kun olet purkanut .ZIP-paketin tai avannut kotikansion editorissasi (VS Code, Cursor, Windsurf tai Antigravity).
                </p>
              </div>

              {/* Quick One-Liner Box */}
              <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-500/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">
                    ⚡ Pikakomento (Kaikki asennukset yhdellä rivillä):
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard("npm install && npx prisma db push && npm run dev", 999)
                    }
                    className="text-xs flex items-center gap-1 text-purple-600 dark:text-purple-400 font-semibold hover:underline"
                  >
                    {copiedIndex === 999 ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedIndex === 999 ? "Kopioitu!" : "Kopioi komento"}</span>
                  </button>
                </div>
                <pre className="p-2.5 rounded-lg bg-black/90 text-emerald-400 font-mono text-xs overflow-x-auto">
                  npm install && npx prisma db push && npm run dev
                </pre>
              </div>

              {/* Step-by-Step Breakdown */}
              <div className="space-y-4">
                {/* Step 1 */}
                <div className="p-3.5 rounded-lg border bg-card space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">
                      Vaihe 1: Siirry kansioon ja avaa IDE
                    </span>
                    <button
                      onClick={() => copyToClipboard(`cd ${cleanSlug}\ncode .`, 1)}
                      className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      {copiedIndex === 1 ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedIndex === 1 ? "Kopioitu" : "Kopioi"}</span>
                    </button>
                  </div>
                  <pre className="p-2 rounded bg-muted font-mono text-xs text-foreground">
                    cd {cleanSlug} && code .
                  </pre>
                </div>

                {/* Step 2 */}
                <div className="p-3.5 rounded-lg border bg-card space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">
                      Vaihe 2: Asenna riippuvuudet
                    </span>
                    <button
                      onClick={() => copyToClipboard("npm install", 2)}
                      className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      {copiedIndex === 2 ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedIndex === 2 ? "Kopioitu" : "Kopioi"}</span>
                    </button>
                  </div>
                  <pre className="p-2 rounded bg-muted font-mono text-xs text-foreground">
                    npm install
                  </pre>
                </div>

                {/* Step 3 */}
                <div className="p-3.5 rounded-lg border bg-card space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">
                      Vaihe 3: Kopioi ympäristötiedosto (.env)
                    </span>
                    <button
                      onClick={() => copyToClipboard("cp .env.example .env.local", 3)}
                      className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      {copiedIndex === 3 ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedIndex === 3 ? "Kopioitu" : "Kopioi"}</span>
                    </button>
                  </div>
                  <pre className="p-2 rounded bg-muted font-mono text-xs text-foreground">
                    cp .env.example .env.local
                  </pre>
                </div>

                {/* Step 4 */}
                <div className="p-3.5 rounded-lg border bg-card space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">
                      Vaihe 4: Luo tietokanta (Prisma)
                    </span>
                    <button
                      onClick={() => copyToClipboard("npx prisma db push", 4)}
                      className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      {copiedIndex === 4 ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedIndex === 4 ? "Kopioitu" : "Kopioi"}</span>
                    </button>
                  </div>
                  <pre className="p-2 rounded bg-muted font-mono text-xs text-foreground">
                    npx prisma db push
                  </pre>
                </div>

                {/* Step 5 */}
                <div className="p-3.5 rounded-lg border bg-card space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">
                      Vaihe 5: Käynnistä kehityspalvelin
                    </span>
                    <button
                      onClick={() => copyToClipboard("npm run dev", 5)}
                      className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      {copiedIndex === 5 ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedIndex === 5 ? "Kopioitu" : "Kopioi"}</span>
                    </button>
                  </div>
                  <pre className="p-2 rounded bg-muted font-mono text-xs text-foreground">
                    npm run dev
                  </pre>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    Avaa selain: <strong>http://localhost:3000</strong>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: COPILOT OPASTUS */}
          {activeTab === "copilot" && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              <div className="p-5 rounded-xl border-2 border-purple-500/40 bg-gradient-to-br from-purple-500/15 via-indigo-500/10 to-background space-y-4">
                <div className="flex items-start space-x-3.5">
                  <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold shrink-0 mt-0.5">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-base text-foreground">
                      Haluatko että Co-Pilot opastaa käyttöönoton askel askeleelta?
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Voit siirtää asennusohjeiden läpikäynnin suoraan Co-Pilot-chatiin. Co-Pilot antaa sinulle räätälöidyt ohjeet projektin {projectName} ajamiseen, virheiden välttämiseen ja ympäristömuuttujien konfigurointiin.
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    onClick={handleAskCopilot}
                    className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md"
                  >
                    <Bot className="mr-2 h-4 w-4" />
                    <span>Pyydä Co-Pilotia opastamaan chatissa ➔</span>
                  </Button>
                </div>
              </div>

              <div className="p-4 rounded-xl border bg-muted/20 space-y-2 text-xs text-muted-foreground">
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                  <span>Mitä Co-Pilot osaa kertoa?</span>
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Miten testata Route Handler API -päätepisteitä esim. curlilla tai Postmanilla.</li>
                  <li>Miten käyttää Prisma Studiota (<code className="text-[11px] bg-muted px-1">npx prisma studio</code>) tietokannan selailuun.</li>
                  <li>Miten viedä projekti tuotantoon (Vercel, Docker tai Netlify).</li>
                  <li>Miten lisätä uusia malleja skeemaan ja päivittää UI-näkymiä.</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-muted/20 flex flex-wrap items-center justify-between gap-3 flex-none">
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span>Kaikki tiedostot noudattavat Next.js 15 App Router -standardeja.</span>
          </div>

          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Sulje
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
