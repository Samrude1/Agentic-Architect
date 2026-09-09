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
  Key,
  Database,
  Check,
  Copy,
  HardDrive,
  Sparkles,
  Info,
  CheckCircle2,
} from "lucide-react";
import { TechStackProfile, writeEnvExampleToDisk } from "@/app/actions/tech-stack";
import { ConfirmActionDialog } from "@/components/confirm-action-dialog";

interface EnvDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: TechStackProfile | null;
  projectId?: string;
  targetPath?: string;
}

export function EnvDialog({
  open,
  onOpenChange,
  profile,
  projectId,
  targetPath,
}: EnvDialogProps) {
  const [copied, setCopied] = useState(false);
  const [isWriting, setIsWriting] = useState(false);
  const [writeMessage, setWriteMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!profile) return null;

  const isLight = profile.tier === "lightweight";
  const isHeavy = profile.tier === "heavy";

  const getTierColorClass = () => {
    if (isLight) return "bg-emerald-500/10 text-emerald-500 border-emerald-500/30";
    if (isHeavy) return "bg-purple-500/10 text-purple-500 border-purple-500/30";
    return "bg-blue-500/10 text-blue-500 border-blue-500/30";
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(profile.envExampleContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWriteToDisk = async () => {
    if (!projectId) {
      setWriteMessage({ type: "error", text: "Tallenna projekti ensin ennen levylle kirjoittamista." });
      return;
    }
    if (!targetPath || !targetPath.trim()) {
      setWriteMessage({ type: "error", text: "Aseta projektin kotikansio (Target Path) työtilassa ensin." });
      return;
    }

    setIsWriting(true);
    try {
      const result = await writeEnvExampleToDisk(projectId, profile.envExampleContent);
      if (result.success) {
        setWriteMessage({
          type: "success",
          text: `Tiedosto .env.local.example kirjoitettu onnistuneesti! (${result.fullPath})`,
        });
      } else {
        setWriteMessage({ type: "error", text: result.error || "Kirjoitus epäonnistui." });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Tuntematon virhe levylle kirjoitettaessa.";
      setWriteMessage({ type: "error", text: msg });
    } finally {
      setIsWriting(false);
      setTimeout(() => setWriteMessage(null), 5000);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-6 bg-card border-border shadow-2xl rounded-2xl overflow-hidden">
          {/* Header */}
          <DialogHeader className="flex-none pb-4 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500">
                  <Key className="h-6 w-6" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold tracking-tight">
                    Teknologiapino & Ympäristöasetukset
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    Tekoälyn päättelemä arkkitehtuurikokoluokka ja .env.local.example -ohjeistus
                  </DialogDescription>
                </div>
              </div>

              {/* Tier Badge */}
              <div className={`px-3 py-1.5 rounded-xl border text-xs font-semibold ${getTierColorClass()}`}>
                {profile.tierLabel}
              </div>
            </div>
          </DialogHeader>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
            {/* Summary Banner */}
            <div className="p-3.5 bg-muted/40 rounded-xl border border-border/50 text-xs sm:text-sm text-foreground/90 space-y-1">
              <div className="font-semibold text-foreground flex items-center space-x-1.5">
                <Sparkles className="h-4 w-4 text-purple-400" />
                <span>Arkkitehdin arvio:</span>
              </div>
              <p className="text-muted-foreground leading-relaxed pl-5">{profile.guidance}</p>
            </div>

            {/* Database Recommendation Card */}
            <div className="p-4 rounded-xl border border-border/50 bg-background/50 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Database className="h-4 w-4 text-purple-500" />
                  <span className="font-bold text-xs uppercase tracking-wider text-foreground">
                    Tietokantasuositus
                  </span>
                </div>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                    profile.database.needed
                      ? "bg-blue-500/10 text-blue-500"
                      : "bg-emerald-500/10 text-emerald-500"
                  }`}
                >
                  {profile.database.needed ? profile.database.type.toUpperCase() : "EI TIETOKANTAA"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{profile.database.reason}</p>
            </div>

            {/* Required API Keys Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center space-x-1.5">
                  <Key className="h-3.5 w-3.5" />
                  <span>Tarvittavat API-avaimet ({profile.envVariables.length} kpl)</span>
                </span>
              </div>

              {profile.envVariables.length === 0 ? (
                <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-xs text-emerald-600 dark:text-emerald-400 flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 flex-none" />
                  <span>
                    Tämä sovellus ei tarvitse lainkaan ulkoisia API-avaimia! Voit ajaa sen suoraan.
                  </span>
                </div>
              ) : (
                <div className="space-y-2">
                  {profile.envVariables.map((ev) => (
                    <div
                      key={ev.key}
                      className="p-3 rounded-xl border border-border/50 bg-muted/20 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-foreground text-[13px]">{ev.key}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted font-medium text-muted-foreground">
                          {ev.required ? "Pakollinen" : "Valinnainen"}
                        </span>
                      </div>
                      <p className="text-muted-foreground">{ev.description}</p>
                      <div className="p-2 rounded-lg bg-background border border-border/40 font-mono text-[11px] text-purple-400">
                        {ev.key}=&quot;{ev.sampleValue}&quot;
                      </div>
                      <div className="text-[11px] text-muted-foreground/90 flex items-center space-x-1 pt-0.5">
                        <Info className="h-3 w-3 text-purple-400 flex-none" />
                        <span>Mistä saa: {ev.whereToGet}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* .env.local.example Code Preview */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                  Mallitiedosto: .env.local.example
                </span>
                <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 text-xs">
                  {copied ? (
                    <>
                      <Check className="mr-1 h-3 w-3 text-emerald-500" />
                      Kopioitu!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-1 h-3 w-3" />
                      Kopioi sisältö
                    </>
                  )}
                </Button>
              </div>

              <pre className="p-3 rounded-xl bg-zinc-950 text-zinc-100 font-mono text-xs overflow-x-auto border border-zinc-800 leading-relaxed max-h-48">
                {profile.envExampleContent}
              </pre>
            </div>

            {/* Status message */}
            {writeMessage && (
              <div
                className={`p-3 rounded-xl text-xs font-medium ${
                  writeMessage.type === "success"
                    ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30"
                    : "bg-destructive/10 text-destructive border border-destructive/30"
                }`}
              >
                {writeMessage.text}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex-none pt-4 border-t border-border/50 flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmOpen(true)}
              disabled={isWriting}
              className="text-xs border-purple-500/30 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 font-medium"
            >
              <HardDrive className="mr-1.5 h-3.5 w-3.5" />
              Kirjoita .env.local.example levylle
            </Button>

            <Button size="sm" onClick={() => onOpenChange(false)}>
              Sulje
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog before writing to disk */}
      <ConfirmActionDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Kirjoitetaanko .env.local.example levylle?"
        description={`Tämä toiminto luo tai päivittää tiedoston '.env.local.example' valitussa kotikansiossa:\n${targetPath || "Valittu kotikansio"}`}
        confirmLabel="Kyllä, kirjoita tiedosto"
        variant="purple"
        icon={<Key className="h-5 w-5" />}
        isLoading={isWriting}
        consequences={[
          "Luo selkeän mallipohjan API-avaimille",
          "Ei korvaa olemassa olevaa todellista .env.local -tiedostoasi",
        ]}
        onConfirm={async () => {
          setConfirmOpen(false);
          await handleWriteToDisk();
        }}
      />
    </>
  );
}
