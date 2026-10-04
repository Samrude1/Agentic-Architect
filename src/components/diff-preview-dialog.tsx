"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  GitCompare,
  Sparkles,
  FileCheck,
  ShieldCheck,
  Loader2,
  HardDrive,
  Copy,
  Check,
  CheckCircle2,
  ArrowRight,
  FolderCheck,
} from "lucide-react";
import type { DiffResult } from "@/lib/diff";

export interface DiffPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  relativePath: string;
  fullPath?: string;
  diff: DiffResult | null;
  isLoadingPreview?: boolean;
  isWriting?: boolean;
  writeResult?: {
    success: boolean;
    fullPath?: string;
    backupCreated?: boolean;
    backupPath?: string;
  } | null;
  onConfirmWrite: () => Promise<void>;
  onNextStep?: () => void;
  nextStepLabel?: string;
}

export function DiffPreviewDialog({
  open,
  onOpenChange,
  title = "Tiedoston tallennuksen esikatselu (Diff Preview)",
  relativePath,
  fullPath,
  diff,
  isLoadingPreview = false,
  isWriting = false,
  writeResult,
  onConfirmWrite,
  onNextStep,
  nextStepLabel = "Jatka seuraavaan vaiheeseen →",
}: DiffPreviewDialogProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyNewContent = () => {
    if (!diff) return;
    const newContent = diff.lines
      .filter((l) => l.type === "added" || l.type === "unchanged")
      .map((l) => l.text)
      .join("\n");
    navigator.clipboard.writeText(newContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isNewFile = diff?.isNewFile ?? true;
  const isIdentical = diff?.isIdentical ?? false;
  const isCompleted = !!writeResult?.success;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[94vw] sm:max-w-4xl md:max-w-5xl max-h-[92vh] flex flex-col p-6 bg-card border-border shadow-2xl rounded-2xl overflow-hidden">
        {/* COMPLETED SUCCESS VIEW */}
        {isCompleted ? (
          <div className="flex flex-col space-y-6 py-4 animate-in fade-in-50 zoom-in-95 duration-200">
            <div className="flex items-center space-x-4">
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex-none animate-pulse">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  Vaihe suoritettu onnistuneesti! 🎉
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Tiedosto ja sen tarvitsemat kansiot luotiin paikalliseen tiedostojärjestelmään.
                </p>
              </div>
            </div>

            {/* Results Details Card */}
            <div className="bg-muted/40 rounded-xl p-4 border border-border/60 space-y-3.5 text-xs">
              <div className="flex items-start space-x-3">
                <FolderCheck className="h-4 w-4 text-emerald-500 flex-none mt-0.5" />
                <div className="space-y-0.5 flex-1 min-w-0">
                  <div className="font-semibold text-foreground">Tiedostopolku levyltä:</div>
                  <div className="font-mono text-purple-400 bg-background/80 p-2 rounded-lg border border-border/40 break-all select-all">
                    {writeResult?.fullPath || fullPath}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-lg bg-background/60 border border-border/30">
                  <span className="text-muted-foreground block text-[11px]">Tila:</span>
                  <span className="font-semibold text-emerald-400 flex items-center mt-0.5">
                    <Check className="h-3.5 w-3.5 mr-1" />
                    Kirjoitettu onnistuneesti ({diff?.additions || 0} riviä)
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-background/60 border border-border/30">
                  <span className="text-muted-foreground block text-[11px]">Turvallisuus / Varmuuskopio:</span>
                  <span className="font-medium text-foreground/90 mt-0.5 block truncate">
                    {writeResult?.backupCreated ? (
                      <span className="text-amber-400">
                        Varmuuskopio luotu ({writeResult.backupPath})
                      </span>
                    ) : (
                      <span className="text-emerald-400">
                        Uusi tiedosto luotu turvallisesti
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Next Step Guidance */}
            <div className="p-4 rounded-xl border border-purple-500/20 bg-purple-500/10 text-xs flex items-start space-x-3">
              <Sparkles className="h-5 w-5 text-purple-400 flex-none mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-purple-300">
                  Tämä vaihe on nyt 100 % valmis ja vahvistettu levylle!
                </span>
                <p className="text-foreground/80 leading-relaxed">
                  Voit nyt siirtyä suoraan seuraavaan vaiheeseen kehittämään arkkitehtuurin muita osa-alueita tai tarkastella koodia rauhassa.
                </p>
              </div>
            </div>

            <DialogFooter className="pt-2 gap-2 sm:gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1 sm:flex-initial"
              >
                Sulje ikkuna
              </Button>
              {onNextStep && (
                <Button
                  onClick={() => {
                    onOpenChange(false);
                    onNextStep();
                  }}
                  className="flex-1 sm:flex-initial bg-purple-600 hover:bg-purple-700 text-white font-medium"
                >
                  <span>{nextStepLabel}</span>
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              )}
            </DialogFooter>
          </div>
        ) : (
          <>
            {/* Header */}
            <DialogHeader className="flex-none pb-4 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500">
                    <GitCompare className="h-5 w-5" />
                  </div>
                  <div>
                    <DialogTitle className="text-lg font-bold tracking-tight">{title}</DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                      Tarkista AI-generoiman tiedoston muutokset ennen levylle kirjoittamista
                    </DialogDescription>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyNewContent}
                  disabled={!diff || isWriting}
                  className="text-xs h-8"
                >
                  {copied ? (
                    <>
                      <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-500" />
                      Kopioitu
                    </>
                  ) : (
                    <>
                      <Copy className="mr-1.5 h-3.5 w-3.5" />
                      Kopioi koodi
                    </>
                  )}
                </Button>
              </div>

              {/* Path info and Stats bar */}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="font-mono bg-muted/60 px-2.5 py-1 rounded-md text-foreground/90 border border-border/40 truncate max-w-xl">
                  <span className="text-muted-foreground mr-1">Polku:</span>
                  <span className="font-semibold text-purple-400">{relativePath}</span>
                  {fullPath && (
                    <span className="text-muted-foreground text-[11px] ml-2 hidden sm:inline">
                      ({fullPath})
                    </span>
                  )}
                </div>

                {diff && (
                  <div className="flex items-center space-x-2">
                    {isNewFile ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <Sparkles className="mr-1 h-3 w-3" />
                        Uusi tiedosto ({diff.additions} riviä)
                      </span>
                    ) : isIdentical ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        <FileCheck className="mr-1 h-3 w-3" />
                        Identtinen levyn kanssa
                      </span>
                    ) : (
                      <div className="flex items-center space-x-1.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          +{diff.additions}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          -{diff.deletions}
                        </span>
                        <span className="text-muted-foreground text-[11px]">
                          ({diff.unchanged} muuttumatonta)
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </DialogHeader>

            {/* Safety Banner */}
            <div className="flex-none my-3">
              {isLoadingPreview ? (
                <div className="p-3 bg-muted/40 rounded-xl flex items-center space-x-2 text-xs text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
                  <span>Luetaan levyn nykytilaa ja lasketaan erotuksia (diff)...</span>
                </div>
              ) : isNewFile ? (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start space-x-2.5 text-xs text-emerald-300">
                  <Sparkles className="h-4 w-4 text-emerald-400 flex-none mt-0.5" />
                  <div>
                    <p className="font-semibold text-emerald-200">Uusi tiedosto luodaan turvallisesti</p>
                    <p className="text-emerald-300/80 text-[11px] mt-0.5">
                      Tiedostoa ei ole vielä olemassa valitussa kotikansiossa. Tallennus luo tiedoston ja sen yläkansiot automaattisesti.
                    </p>
                  </div>
                </div>
              ) : isIdentical ? (
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-start space-x-2.5 text-xs text-blue-300">
                  <FileCheck className="h-4 w-4 text-blue-400 flex-none mt-0.5" />
                  <div>
                    <p className="font-semibold text-blue-200">Tiedosto on jo ajan tasalla</p>
                    <p className="text-blue-300/80 text-[11px] mt-0.5">
                      Levyllä oleva versio vastaa täysin tekoälyn nykyistä koodiluonnosta. Ylikirjoitukselle ei ole tarvetta.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start space-x-2.5 text-xs text-amber-300">
                  <ShieldCheck className="h-4 w-4 text-amber-400 flex-none mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-200">Olemassa oleva tiedosto korvataan — Automaattinen varmuuskopiointi päällä</p>
                    <p className="text-amber-300/80 text-[11px] mt-0.5">
                      Nykyinen levyversio varmuuskopioidaan automaattisesti hakemistoon <code className="bg-black/30 px-1 py-0.5 rounded text-amber-200">.agentic-backup/&lt;aikaleima&gt;/</code> ennen korvaamista, joten mitään ei katoa.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Diff Content View */}
            <div className="flex-1 min-h-[300px] max-h-[55vh] bg-zinc-950 rounded-xl border border-border/50 overflow-auto font-mono text-xs">
              {isLoadingPreview ? (
                <div className="h-full flex items-center justify-center p-8 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin mr-2 text-purple-400" />
                  <span>Lasketaan diff-erotusta...</span>
                </div>
              ) : !diff ? (
                <div className="h-full flex items-center justify-center p-8 text-muted-foreground">
                  <span>Ei esikatseltavaa sisältöä.</span>
                </div>
              ) : (
                <table className="w-full border-collapse">
                  <tbody>
                    {diff.lines.map((line, idx) => {
                      const isAdd = line.type === "added";
                      const isRem = line.type === "removed";
                      return (
                        <tr
                          key={idx}
                          className={`hover:bg-white/5 transition-colors ${
                            isAdd
                              ? "bg-emerald-950/30 text-emerald-200"
                              : isRem
                              ? "bg-rose-950/30 text-rose-200"
                              : "text-zinc-400"
                          }`}
                        >
                          {/* Old Line # */}
                          <td className="w-10 select-none text-right pr-2 py-0.5 text-[11px] text-zinc-600 border-r border-zinc-800/60">
                            {line.oldLineNumber ?? ""}
                          </td>
                          {/* New Line # */}
                          <td className="w-10 select-none text-right pr-2 py-0.5 text-[11px] text-zinc-600 border-r border-zinc-800/60">
                            {line.newLineNumber ?? ""}
                          </td>
                          {/* Prefix (+ / - / space) */}
                          <td className="w-6 select-none text-center py-0.5 font-bold">
                            {isAdd ? (
                              <span className="text-emerald-400">+</span>
                            ) : isRem ? (
                              <span className="text-rose-400">-</span>
                            ) : (
                              <span className="text-zinc-600">&nbsp;</span>
                            )}
                          </td>
                          {/* Line Text */}
                          <td className="py-0.5 pl-2 pr-4 whitespace-pre font-mono">
                            {line.text}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer */}
            <DialogFooter className="flex-none pt-4 mt-2 border-t border-border/50 gap-2 sm:gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isWriting}
                className="flex-1 sm:flex-initial"
              >
                Sulje esikatselu
              </Button>

              <Button
                onClick={onConfirmWrite}
                disabled={isWriting || isLoadingPreview || isIdentical}
                className={`flex-1 sm:flex-initial font-medium ${
                  isIdentical
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : isNewFile
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "bg-purple-600 hover:bg-purple-700 text-white"
                }`}
              >
                {isWriting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Kirjoitetaan levylle...
                  </>
                ) : isIdentical ? (
                  <>
                    <FileCheck className="mr-1.5 h-4 w-4" />
                    Tiedosto on jo identtinen
                  </>
                ) : isNewFile ? (
                  <>
                    <HardDrive className="mr-1.5 h-4 w-4" />
                    Luo ja kirjoita tiedosto levylle
                  </>
                ) : (
                  <>
                    <HardDrive className="mr-1.5 h-4 w-4" />
                    Vahvista ja ylikirjoita (varmuuskopioidaan)
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
