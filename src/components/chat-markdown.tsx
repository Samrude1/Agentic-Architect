"use client";

import React, { useMemo } from "react";
import { CheckCircle2, ShieldAlert, Sparkles, FileCode2 } from "lucide-react";

interface ChatMarkdownProps {
  content: string;
}

/**
 * Lightweight, robust, and elegant Markdown renderer tailored for AI Co-Pilot responses.
 * Formats headers, bullet lists, bold highlights, code tags, and action steps into clean modern UI.
 */
export function ChatMarkdown({ content }: ChatMarkdownProps) {
  const renderedElements = useMemo(() => {
    if (!content) return null;

    const lines = content.split("\n");
    const elements: React.ReactNode[] = [];
    let listBuffer: string[] = [];
    let keyIdx = 0;

    const flushList = () => {
      if (listBuffer.length > 0) {
        elements.push(
          <div key={`list-${keyIdx++}`} className="space-y-1.5 my-2">
            {listBuffer.map((item, idx) => {
              const cleanItem = item.replace(/^[-*•]\s+/, "").replace(/^\d+\.\s+/, "");
              return (
                <div key={idx} className="flex items-start gap-2 text-xs text-foreground/90 leading-relaxed">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 flex-shrink-0" />
                  <div>{formatInline(cleanItem)}</div>
                </div>
              );
            })}
          </div>
        );
        listBuffer = [];
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (!line) {
        flushList();
        continue;
      }

      // Headers (### or ## or #)
      if (line.startsWith("### ")) {
        flushList();
        elements.push(
          <h4 key={`h4-${keyIdx++}`} className="text-xs font-bold text-foreground mt-3 mb-1.5 tracking-tight flex items-center gap-1.5">
            <span className="w-1.5 h-3 bg-purple-500 rounded-sm inline-block" />
            {line.replace(/^###\s+/, "")}
          </h4>
        );
        continue;
      }

      if (line.startsWith("## ")) {
        flushList();
        const title = line.replace(/^##\s+/, "");
        const isActionPlan = title.toLowerCase().includes("korjaus") || title.toLowerCase().includes("action plan");
        const isAnalysis = title.toLowerCase().includes("analyysi");

        elements.push(
          <div
            key={`h2-${keyIdx++}`}
            className="flex items-center gap-2 text-xs font-bold text-purple-600 dark:text-purple-400 mt-3.5 mb-1.5 pb-1 border-b border-border/40 uppercase tracking-wider"
          >
            {isActionPlan ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            ) : isAnalysis ? (
              <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
            ) : (
              <Sparkles className="h-3.5 w-3.5 text-purple-500" />
            )}
            <span>{title}</span>
          </div>
        );
        continue;
      }

      // Numbered items or bullet items
      if (line.match(/^(\d+\.|[-*•])\s+/)) {
        listBuffer.push(line);
        continue;
      }

      // Callout / Action Step notice
      if (line.startsWith("👉 ") || line.startsWith("⚡ ") || line.startsWith("🛡️ ")) {
        flushList();
        elements.push(
          <div
            key={`callout-${keyIdx++}`}
            className="my-2.5 p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-foreground font-medium flex items-start gap-2"
          >
            <span className="text-sm flex-shrink-0">{line.slice(0, 2)}</span>
            <div className="leading-relaxed">{formatInline(line.slice(2).trim())}</div>
          </div>
        );
        continue;
      }

      // Normal paragraph
      flushList();
      elements.push(
        <p key={`p-${keyIdx++}`} className="text-xs text-foreground/90 leading-relaxed my-1.5">
          {formatInline(line)}
        </p>
      );
    }

    flushList();
    return elements;
  }, [content]);

  return <div className="space-y-1">{renderedElements}</div>;
}

/**
 * Formats inline bold text (**text**), backtick code (`code`), and key terms
 */
function formatInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      const boldText = part.slice(2, -2);
      return (
        <strong key={index} className="font-semibold text-foreground">
          {boldText}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      const codeText = part.slice(1, -1);
      return (
        <code
          key={index}
          className="px-1.5 py-0.5 rounded bg-muted text-purple-600 dark:text-purple-300 font-mono text-[11px] font-medium border border-border/50"
        >
          {codeText}
        </code>
      );
    }
    return part;
  });
}
