"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { parseUploadedFile } from "@/app/actions/file-parser";
import { Sparkles, FileText, Upload, Loader2, X } from "lucide-react";

export function IdeaInputForm() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>("");
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setParseError(null);
    setIsParsingFile(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      const result = await parseUploadedFile(formData);
      setExtractedText(result.text);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Tiedoston lukeminen epäonnistui.";
      setParseError(message);
      setFile(null);
      setExtractedText("");
    } finally {
      setIsParsingFile(false);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setExtractedText("");
    setParseError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() && !extractedText.trim()) return;

    startTransition(() => {
      let combined = prompt.trim();
      if (extractedText.trim()) {
        combined += `\n\n--- SISÄLTÖ TIEDOSTOSTA (${file?.name}) ---\n${extractedText.trim()}`;
      }

      const encoded = encodeURIComponent(combined);
      router.push(`/playground?prompt=${encoded}`);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-background p-6 rounded-xl border shadow-sm">
      <div className="space-y-2">
        <label htmlFor="prompt-input" className="text-sm font-medium">
          Kuvaile ohjelmistoideasi tai vaatimukset
        </label>
        <textarea
          id="prompt-input"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="esim. 'Tarvitsen SaaS-verkkokauppa-alustan, jossa on Stripe-maksut, Next.js frontend, PostgreSQL-tietokanta ja sähköposti-ilmoitukset...'"
          className="flex min-h-[120px] w-full rounded-md border border-input bg-muted/20 px-4 py-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isPending}
        />
      </div>

      {/* File Upload Area */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center space-x-3">
          <label className="cursor-pointer inline-flex items-center space-x-2 text-xs font-medium bg-muted hover:bg-muted/80 text-foreground px-3 py-2 rounded-md border transition-colors">
            {isParsingFile ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <Upload className="h-4 w-4 text-muted-foreground" />
            )}
            <span>{isParsingFile ? "Luetaan tiedostoa..." : "Lataa spesifikaatio (.pdf, .txt, .md)"}</span>
            <input
              type="file"
              accept=".pdf,.txt,.md"
              onChange={handleFileChange}
              className="hidden"
              disabled={isParsingFile || isPending}
            />
          </label>

          {file && (
            <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-3 py-1.5 rounded-md text-xs font-medium">
              <FileText className="h-3.5 w-3.5" />
              <span className="truncate max-w-[200px]">{file.name}</span>
              <button
                type="button"
                onClick={handleRemoveFile}
                className="hover:bg-primary/20 p-0.5 rounded text-primary"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        {parseError && (
          <p className="text-xs text-destructive">{parseError}</p>
        )}
      </div>

      <div className="pt-2 flex justify-end">
        <Button
          type="submit"
          size="lg"
          disabled={isPending || isParsingFile || (!prompt.trim() && !extractedText.trim())}
          className="w-full sm:w-auto"
        >
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4 text-purple-400" />
          )}
          Aloita Arkkitehtuurin Suunnittelu
        </Button>
      </div>
    </form>
  );
}
