"use client";

import { useState } from "react";
import { Copy, Check, FileCode } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CodeViewerProps {
  code: string;
  filename?: string;
  language?: string;
}

export function CodeViewer({
  code,
  filename = "prisma/schema.prisma",
}: CodeViewerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  return (
    <div className="flex flex-col h-full rounded-lg border bg-slate-950 text-slate-100 overflow-hidden shadow-sm">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs font-mono">
        <div className="flex items-center space-x-2 text-slate-400">
          <FileCode className="h-4 w-4 text-purple-400" />
          <span className="font-medium text-slate-200">{filename}</span>
          <span className="bg-purple-500/20 text-purple-300 text-[10px] px-2 py-0.5 rounded font-sans">
            Data Gate 1 • English
          </span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-7 text-xs text-slate-300 hover:text-white hover:bg-slate-800"
        >
          {copied ? (
            <>
              <Check className="mr-1.5 h-3.5 w-3.5 text-green-400" />
              Kopioitu!
            </>
          ) : (
            <>
              <Copy className="mr-1.5 h-3.5 w-3.5" />
              Kopioi koodi
            </>
          )}
        </Button>
      </div>

      {/* Code body */}
      <div className="flex-1 p-4 overflow-auto font-mono text-sm leading-relaxed text-slate-200 whitespace-pre">
        {code}
      </div>
    </div>
  );
}
