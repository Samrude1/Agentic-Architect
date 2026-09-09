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
} from "lucide-react";
import { AuditReport, AuditFinding } from "@/app/actions/audit";

interface AuditModalProps {
  report: AuditReport | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuditModal({ report, open, onOpenChange }: AuditModalProps) {
  const [copied, setCopied] = useState(false);
  const [filter, setFilter] = useState<"all" | "critical" | "warning" | "success">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!report) return null;

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

        {/* Footer actions */}
        <div className="flex-none pt-4 border-t border-border/50 flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={handleCopy} className="text-xs">
            {copied ? (
              <>
                <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-500" />
                Kopioitu leikepöydälle!
              </>
            ) : (
              <>
                <Copy className="mr-1.5 h-3.5 w-3.5" />
                Kopioi raportti
              </>
            )}
          </Button>

          <Button size="sm" onClick={() => onOpenChange(false)}>
            Sulje raportti
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
