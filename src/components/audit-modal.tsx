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
  ShieldCheck,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  HardDrive,
  Sparkles,
  Loader2,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import { AuditReport, writeAuditReportToDiskAction } from "@/app/actions/audit";

interface AuditModalProps {
  report: AuditReport | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string;
  targetPath?: string;
  onSendToAgent?: (prompt: string) => void;
  onRerunAudit?: () => void;
  isRerunning?: boolean;
}

export function AuditModal({
  report,
  open,
  onOpenChange,
  projectId,
  targetPath,
  onSendToAgent,
  onRerunAudit,
  isRerunning = false,
}: AuditModalProps) {
  const [copied, setCopied] = useState(false);
  const [filter, setFilter] = useState<"all" | "critical" | "warning" | "success">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isSavingToDisk, setIsSavingToDisk] = useState(false);
  const [saveDiskMessage, setSaveDiskMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  if (!report) {
    if (!open) return null;
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md p-6 bg-card border-border shadow-2xl rounded-2xl flex flex-col items-center justify-center py-12 text-center">
          <Loader2 className="h-8 w-8 text-purple-500 animate-spin mb-3" />
          <DialogTitle className="text-base font-semibold text-foreground">
            Ladataan auditointiraporttia...
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Haetaan tallennetut löydökset ja terveysindeksi.
          </DialogDescription>
        </DialogContent>
      </Dialog>
    );
  }

  const isSecurity = report.type === "security";

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "A":
        return "text-emerald-500 border-emerald-500/30 bg-emerald-500/10";
      case "B":
        return "text-blue-500 border-blue-500/30 bg-blue-500/10";
      case "C":
        return "text-amber-500 border-amber-500/30 bg-amber-500/10";
      default:
        return "text-rose-500 border-rose-500/30 bg-rose-500/10";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-emerald-500";
    if (score >= 70) return "text-amber-500";
    return "text-rose-500";
  };

  const filteredFindings = report.findings.filter((f) => {
    if (filter === "all") return true;
    return f.type === filter;
  });

  const criticalCount = report.findings.filter((f) => f.type === "critical").length;
  const warningCount = report.findings.filter((f) => f.type === "warning").length;
  const successCount = report.findings.filter((f) => f.type === "success").length;

  const handleCopy = () => {
    const text = `=== ${report.title} ===
Arvosana: ${report.grade} (${report.score}/100)
Yhteenveto: ${report.summary}

Löydökset:
${report.findings
  .map(
    (f, i) =>
      `${i + 1}. [${f.type.toUpperCase()}] ${f.title}\n   - Kuvaus: ${f.detail}\n   - Suositus: ${f.recommendation}`
  )
  .join("\n\n")}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const targetDocName = isSecurity ? "docs/SECURITY_AUDIT.md" : "docs/OPTIMIZATION_REPORT.md";

  const handleSaveToDisk = async () => {
    if (!projectId) {
      setSaveDiskMessage({
        type: "error",
        text: "Tallenna projekti ensin ennen tiedostotallennusta.",
      });
      return;
    }
    if (!targetPath || !targetPath.trim()) {
      setSaveDiskMessage({
        type: "error",
        text: "Aseta projektin kotikansio työtilassa ensin.",
      });
      return;
    }

    setIsSavingToDisk(true);
    try {
      const res = await writeAuditReportToDiskAction(projectId, report);
      if (res.success) {
        setSaveDiskMessage({
          type: "success",
          text: `Dokumentti luotu: ${res.relativePath}!`,
        });
      } else {
        setSaveDiskMessage({
          type: "error",
          text: res.error || "Tallennus epäonnistui.",
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Virhe raporttia tallennettaessa.";
      setSaveDiskMessage({ type: "error", text: msg });
    } finally {
      setIsSavingToDisk(false);
      setTimeout(() => setSaveDiskMessage(null), 5000);
    }
  };

  const handleSendToAgent = () => {
    if (!report) return;

    const relevantFindings = report.findings.filter(
      (f) => f.type === "critical" || f.type === "warning"
    );
    const findingsList = relevantFindings.length > 0 ? relevantFindings : report.findings;
    const findingsSummary = findingsList
      .map(
        (f, i) =>
          `${i + 1}. [${f.type.toUpperCase()}] ${f.title}\n   - Kuvaus: ${f.detail}\n   - Suositus: ${f.recommendation}`
      )
      .join("\n\n");

    const promptText = `Ohessa on järjestelmän tuore laadunvarmistus- ja auditointiraportti:
Otsikko: ${report.title}
Terveysindeksi: ${report.score} / 100 (Arvosana ${report.grade})
Tiivistelmä: ${report.summary}

Tärkeimmät havainnot ja toimenpidesuositukset:
${findingsSummary}

Toimi kokeneena Principal Architect -tekoälynä:
1. Analysoi nämä havainnot ja selitä minulle selkokielellä, miksi ne ovat kriittisiä ja miten ne ratkaistaan.
2. Esitä selkeä, vaiheittainen korjaussuunnitelma (Action Plan).
3. Päivitä arkkitehtuurikaavio heti update_architecture-työkalulla heijastamaan korjattua rakennetta (esim. lisätään Auth Service, PostgreSQL tuotannossa ja asianmukaiset yhteydet).
4. Pyydä minulta lopuksi selkeä hyväksyntä suunnitelmalle ennen seuraaviin vaiheisiin (Gate 1 Prisma, Gate 2 API, Gate 3 UI) siirtymistä.`;

    onSendToAgent?.(promptText);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-6 bg-card border-border shadow-2xl rounded-2xl overflow-hidden">
        {/* Header */}
        <DialogHeader className="flex-none pb-4 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                className={`p-2.5 rounded-xl ${
                  isSecurity ? "bg-purple-500/10 text-purple-500" : "bg-amber-500/10 text-amber-500"
                }`}
              >
                {isSecurity ? <ShieldCheck className="h-6 w-6" /> : <Zap className="h-6 w-6" />}
              </div>
              <div>
                <DialogTitle className="text-xl font-bold tracking-tight">{report.title}</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Automatisoitu laadunvarmistus ja järjestelmäanalyysi
                </DialogDescription>
              </div>
            </div>

            {/* Grade Badge */}
            <div className={`px-3 py-1.5 rounded-xl border flex items-center space-x-2 ${getGradeColor(report.grade)}`}>
              <span className="text-xs font-medium uppercase tracking-wider">Arvosana</span>
              <span className="text-xl font-black">{report.grade}</span>
            </div>
          </div>
        </DialogHeader>

        {/* Score & Summary Banner */}
        <div className="flex-none py-4 border-b border-border/40">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Score box */}
            <div className="p-3 bg-muted/40 rounded-xl border border-border/40 flex flex-col items-center justify-center text-center">
              <span className="text-xs text-muted-foreground uppercase font-medium">Terveysindeksi</span>
              <div className="flex items-baseline space-x-1 mt-1">
                <span className={`text-3xl font-extrabold ${getScoreColor(report.score)}`}>
                  {report.score}
                </span>
                <span className="text-xs text-muted-foreground">/ 100</span>
              </div>
            </div>

            {/* Summary text */}
            <div className="md:col-span-2 p-3 bg-muted/30 rounded-xl border border-border/40 flex items-center text-xs sm:text-sm text-foreground/90 leading-relaxed">
              {report.summary}
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center space-x-2 mt-4 text-xs font-medium overflow-x-auto pb-1">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1 rounded-lg transition-colors ${
                filter === "all"
                  ? "bg-foreground text-background font-semibold"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              Kaikki ({report.findings.length})
            </button>
            {criticalCount > 0 && (
              <button
                onClick={() => setFilter("critical")}
                className={`px-3 py-1 rounded-lg transition-colors flex items-center space-x-1 ${
                  filter === "critical"
                    ? "bg-rose-500 text-white font-semibold"
                    : "bg-rose-500/10 text-rose-500 hover:bg-rose-500/20"
                }`}
              >
                <XCircle className="h-3 w-3" />
                <span>Kriittiset ({criticalCount})</span>
              </button>
            )}
            {warningCount > 0 && (
              <button
                onClick={() => setFilter("warning")}
                className={`px-3 py-1 rounded-lg transition-colors flex items-center space-x-1 ${
                  filter === "warning"
                    ? "bg-amber-500 text-white font-semibold"
                    : "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
                }`}
              >
                <AlertTriangle className="h-3 w-3" />
                <span>Huomioitavaa ({warningCount})</span>
              </button>
            )}
            {successCount > 0 && (
              <button
                onClick={() => setFilter("success")}
                className={`px-3 py-1 rounded-lg transition-colors flex items-center space-x-1 ${
                  filter === "success"
                    ? "bg-emerald-500 text-white font-semibold"
                    : "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                }`}
              >
                <CheckCircle2 className="h-3 w-3" />
                <span>Kunnossa ({successCount})</span>
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Findings List */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2.5 pr-1">
          {filteredFindings.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground">
              Ei valitun suodattimen mukaisia löydöksiä.
            </div>
          ) : (
            filteredFindings.map((finding) => {
              const isExpanded = expandedId === finding.id;
              const isCritical = finding.type === "critical";
              const isWarning = finding.type === "warning";
              const isSuccess = finding.type === "success";

              return (
                <div
                  key={finding.id}
                  className={`rounded-xl border transition-all text-xs ${
                    isCritical
                      ? "border-rose-500/30 bg-rose-500/5"
                      : isWarning
                      ? "border-amber-500/30 bg-amber-500/5"
                      : isSuccess
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : "border-border/50 bg-muted/20"
                  }`}
                >
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : finding.id)}
                    className="w-full text-left p-3.5 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                      {isCritical && <XCircle className="h-4 w-4 text-rose-500 flex-none" />}
                      {isWarning && <AlertTriangle className="h-4 w-4 text-amber-500 flex-none" />}
                      {isSuccess && <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-none" />}
                      {!isCritical && !isWarning && !isSuccess && (
                        <Info className="h-4 w-4 text-blue-500 flex-none" />
                      )}
                      <span className="font-semibold text-foreground truncate">{finding.title}</span>
                    </div>

                    <div className="flex items-center space-x-2 flex-none">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase ${
                          isCritical
                            ? "bg-rose-500/20 text-rose-500"
                            : isWarning
                            ? "bg-amber-500/20 text-amber-500"
                            : isSuccess
                            ? "bg-emerald-500/20 text-emerald-500"
                            : "bg-blue-500/20 text-blue-500"
                        }`}
                      >
                        {finding.type}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="px-3.5 pb-3.5 pt-1 space-y-2 border-t border-border/30 mt-1">
                      <div>
                        <span className="font-semibold text-muted-foreground text-[11px] block">
                          Kuvaus:
                        </span>
                        <p className="text-foreground/90 mt-0.5 leading-relaxed">{finding.detail}</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-background/60 border border-border/40">
                        <span className="font-semibold text-purple-400 text-[11px] flex items-center space-x-1">
                          <Zap className="h-3 w-3" />
                          <span>Suositeltu toimenpide:</span>
                        </span>
                        <p className="text-muted-foreground mt-0.5 leading-relaxed">
                          {finding.recommendation}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Status Message for disk saving */}
        {saveDiskMessage && (
          <div
            className={`flex-none p-2.5 rounded-lg text-xs font-medium flex items-center space-x-2 ${
              saveDiskMessage.type === "success"
                ? "bg-green-500/10 text-green-600 border border-green-500/30"
                : "bg-destructive/10 text-destructive border border-destructive/30"
            }`}
          >
            {saveDiskMessage.type === "success" ? (
              <Check className="h-4 w-4 text-green-500 flex-none" />
            ) : (
              <AlertCircle className="h-4 w-4 text-destructive flex-none" />
            )}
            <span className="truncate">{saveDiskMessage.text}</span>
          </div>
        )}

        {/* Footer actions */}
        <div className="flex-none pt-4 border-t border-border/50 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleCopy} className="text-xs h-8">
              {copied ? (
                <>
                  <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-500" />
                  Kopioitu!
                </>
              ) : (
                <>
                  <Copy className="mr-1.5 h-3.5 w-3.5" />
                  Kopioi
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveToDisk}
              disabled={isSavingToDisk}
              className="text-xs h-8 border-purple-500/30 hover:bg-purple-500/10 text-foreground"
              title={`Tallenna raportti tiedostoksi: ${targetDocName}`}
            >
              {isSavingToDisk ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <HardDrive className="mr-1.5 h-3.5 w-3.5 text-purple-500" />
              )}
              <span>Tallenna tiedostoksi</span>
            </Button>

            {onRerunAudit && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRerunAudit}
                disabled={isRerunning}
                className="text-xs h-8 text-muted-foreground hover:text-foreground"
                title="Suorita uusi tarkastus tekoälyllä"
              >
                {isRerunning ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                )}
                <span>Aja uusi tarkastus</span>
              </Button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="text-xs h-8">
              Sulje
            </Button>

            {onSendToAgent && (
              <Button
                size="sm"
                onClick={handleSendToAgent}
                className="text-xs h-8 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold shadow-md flex items-center space-x-1.5"
                title="Lähetä raportti suoraan AI Co-Pilotille analysoitavaksi ja korjattavaksi"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>🚀 Anna agentille korjattavaksi</span>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
