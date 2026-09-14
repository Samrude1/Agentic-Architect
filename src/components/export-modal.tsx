"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Download,
  Copy,
  Check,
  FileCode,
  Image as ImageIcon,
  Sparkles,
  ExternalLink,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { canvasToMermaid, downloadTextFile } from "@/lib/mermaid-export";
import { toPng, toSvg } from "html-to-image";
import { Node, Edge } from "@xyflow/react";

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodes: Node[];
  edges: Edge[];
  projectName?: string;
}

export function ExportModal({
  open,
  onOpenChange,
  nodes,
  edges,
  projectName = "arkkitehtuuri",
}: ExportModalProps) {
  const [activeTab, setActiveTab] = useState<"mermaid" | "image">("mermaid");
  const [copied, setCopied] = useState(false);
  const [isExportingPng, setIsExportingPng] = useState(false);
  const [isExportingSvg, setIsExportingSvg] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const cleanProjectName = (projectName || "arkkitehtuuri")
    .toLowerCase()
    .replace(/[^a-z0-9_-]/gi, "-")
    .replace(/-+/g, "-");

  const mermaidCode = canvasToMermaid(nodes, edges, { title: projectName });

  const handleCopyMermaid = () => {
    navigator.clipboard.writeText(mermaidCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadMmd = () => {
    downloadTextFile(`${cleanProjectName}-diagram.mmd`, mermaidCode, "text/vnd.mermaid");
  };

  const handleDownloadMd = () => {
    const markdownWithMermaid = `# ${projectName} - Arkkitehtuurikaavio\n\n\`\`\`mermaid\n${mermaidCode}\`\`\`\n`;
    downloadTextFile(`${cleanProjectName}-arkkitehtuuri.md`, markdownWithMermaid, "text/markdown");
  };

  const handleExportPng = async () => {
    setIsExportingPng(true);
    setExportError(null);
    try {
      const flowElement = document.querySelector(".react-flow") as HTMLElement;
      if (!flowElement) {
        throw new Error("Kaavioelementtiä ei löydetty näytöltä. Varmista että Visuaalinen Kaavio -välilehti on auki.");
      }

      const dataUrl = await toPng(flowElement, {
        backgroundColor: "#09090b",
        pixelRatio: 2,
        filter: (node) => {
          // Exclude controls and attribution from the exported PNG image
          const element = node as HTMLElement;
          if (element?.classList?.contains("react-flow__controls")) return false;
          if (element?.classList?.contains("react-flow__attribution")) return false;
          return true;
        },
      });

      const anchor = document.createElement("a");
      anchor.href = dataUrl;
      anchor.download = `${cleanProjectName}-canvas.png`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    } catch (err: unknown) {
      console.error("PNG export error:", err);
      const msg = err instanceof Error ? err.message : "Virhe PNG-kuvan luomisessa.";
      setExportError(msg);
    } finally {
      setIsExportingPng(false);
    }
  };

  const handleExportSvg = async () => {
    setIsExportingSvg(true);
    setExportError(null);
    try {
      const flowElement = document.querySelector(".react-flow") as HTMLElement;
      if (!flowElement) {
        throw new Error("Kaavioelementtiä ei löydetty näytöltä. Varmista että Visuaalinen Kaavio -välilehti on auki.");
      }

      const dataUrl = await toSvg(flowElement, {
        backgroundColor: "#09090b",
        filter: (node) => {
          const element = node as HTMLElement;
          if (element?.classList?.contains("react-flow__controls")) return false;
          if (element?.classList?.contains("react-flow__attribution")) return false;
          return true;
        },
      });

      const anchor = document.createElement("a");
      anchor.href = dataUrl;
      anchor.download = `${cleanProjectName}-canvas.svg`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    } catch (err: unknown) {
      console.error("SVG export error:", err);
      const msg = err instanceof Error ? err.message : "Virhe SVG-kuvan luomisessa.";
      setExportError(msg);
    } finally {
      setIsExportingSvg(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] flex flex-col p-6 bg-card border-border shadow-2xl rounded-2xl overflow-hidden">
        {/* Header */}
        <DialogHeader className="flex-none pb-4 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500">
                <Download className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold tracking-tight">
                  Vie Kaavio & Arkkitehtuuri
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Lataa kaavio kuvana (PNG, SVG) tai vie Mermaid.js -markdownina dokumentaatioon
                </DialogDescription>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border/60 text-xs font-semibold">
              <button
                onClick={() => setActiveTab("mermaid")}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === "mermaid"
                    ? "bg-background text-foreground shadow-sm font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <FileCode className="h-3.5 w-3.5 text-purple-500" />
                <span>Mermaid.js</span>
              </button>
              <button
                onClick={() => setActiveTab("image")}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === "image"
                    ? "bg-background text-foreground shadow-sm font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <ImageIcon className="h-3.5 w-3.5 text-blue-500" />
                <span>PNG & SVG</span>
              </button>
            </div>
          </div>
        </DialogHeader>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {exportError && (
            <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 flex-none" />
              <span>{exportError}</span>
            </div>
          )}

          {activeTab === "mermaid" ? (
            <div className="space-y-4">
              <div className="p-3.5 bg-muted/40 rounded-xl border border-border/50 text-xs space-y-1">
                <div className="font-semibold text-foreground flex items-center space-x-1.5">
                  <Sparkles className="h-4 w-4 text-purple-400" />
                  <span>Mermaid.js -yhteensopivuus:</span>
                </div>
                <p className="text-muted-foreground leading-relaxed pl-5">
                  Tämä syntaksi toimii heti sellaisenaan <b>GitHubin README.md</b> -tiedostoissa, <b>Notionissa</b>, <b>Obsidianissa</b> tai suoraan verkkopohjaisessa renderöijässä.
                </p>
              </div>

              {/* Action buttons toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyMermaid}
                    className="h-8 text-xs border-purple-500/30 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 font-semibold"
                  >
                    {copied ? (
                      <>
                        <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-500" />
                        Kopioitu leikepöydälle!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-1.5 h-3.5 w-3.5" />
                        Kopioi Mermaid-koodi
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadMmd}
                    className="h-8 text-xs"
                  >
                    <Download className="mr-1.5 h-3.5 w-3.5" />
                    Lataa .mmd
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadMd}
                    className="h-8 text-xs"
                  >
                    <Download className="mr-1.5 h-3.5 w-3.5" />
                    Lataa .md
                  </Button>
                </div>

                <a
                  href="https://mermaid.live"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-purple-400 hover:text-purple-300 flex items-center space-x-1 font-medium transition-colors"
                >
                  <span>Avaa Mermaid Live Editor</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              {/* Code preview block */}
              <pre className="p-4 rounded-xl bg-zinc-950 text-zinc-100 font-mono text-xs overflow-x-auto border border-zinc-800 leading-relaxed max-h-72">
                {mermaidCode}
              </pre>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3.5 bg-muted/40 rounded-xl border border-border/50 text-xs space-y-1">
                <div className="font-semibold text-foreground flex items-center space-x-1.5">
                  <ImageIcon className="h-4 w-4 text-blue-400" />
                  <span>Korkearesoluutioinen Kuva- ja Vektorivienti:</span>
                </div>
                <p className="text-muted-foreground leading-relaxed pl-5">
                  Lataa visuaalinen arkkitehtuurikaavio suoraan laadukkaana PNG-kuvana (2x retina-tarkkuus) tai skaalautuvana SVG-vektoritiedostona esityksiä, arkkitehtuuridokumentteja ja tiimipalavereita varten.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* PNG Card */}
                <div className="p-5 rounded-2xl border border-border/60 bg-background/50 hover:border-purple-500/40 transition-all flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="p-2.5 w-fit rounded-xl bg-purple-500/10 text-purple-500">
                      <ImageIcon className="h-5 w-5" />
                    </div>
                    <h4 className="font-bold text-sm text-foreground">PNG Bittikarttakuva</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Laadukas, 2x skaalattu tummataustainen PNG-tiedosto. Erinomainen dioihin, Slackiin ja raportteihin.
                    </p>
                  </div>
                  <Button
                    onClick={handleExportPng}
                    disabled={isExportingPng}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs h-9"
                  >
                    {isExportingPng ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    Lataa PNG-kuva (.png)
                  </Button>
                </div>

                {/* SVG Card */}
                <div className="p-5 rounded-2xl border border-border/60 bg-background/50 hover:border-blue-500/40 transition-all flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="p-2.5 w-fit rounded-xl bg-blue-500/10 text-blue-500">
                      <FileCode className="h-5 w-5" />
                    </div>
                    <h4 className="font-bold text-sm text-foreground">SVG Vektorigrafiikka</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Skaalautuva ja terävä vektorigrafiikka. Soveltuu täydellisesti verkkosivustoille ja painotuotteisiin ilman laadun heikkenemistä.
                    </p>
                  </div>
                  <Button
                    onClick={handleExportSvg}
                    disabled={isExportingSvg}
                    variant="outline"
                    className="w-full border-blue-500/40 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 font-medium text-xs h-9"
                  >
                    {isExportingSvg ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    Lataa SVG-vektori (.svg)
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-none pt-4 border-t border-border/50 flex items-center justify-end">
          <Button size="sm" onClick={() => onOpenChange(false)}>
            Sulje
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
