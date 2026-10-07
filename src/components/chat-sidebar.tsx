"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import { Send, Bot, User, Loader2, RotateCcw } from "lucide-react";
import { Node, Edge } from "@xyflow/react";

interface ChatSidebarProps {
  initialPrompt?: string;
  hasExistingArchitecture?: boolean;
  externalPrompt?: string | null;
  onClearExternalPrompt?: () => void;
  onArchitectureUpdate: (data: { nodes: Node[]; edges: Edge[] }) => void;
}

export function ChatSidebar({
  initialPrompt,
  hasExistingArchitecture = false,
  externalPrompt,
  onClearExternalPrompt,
  onArchitectureUpdate,
}: ChatSidebarProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const [loadingStep, setLoadingStep] = useState(1);
  const initialSentRef = useRef(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chat = (useChat as any)({
    api: "/api/chat",
  });

  const messages = chat.messages || [];
  const status = chat.status;
  const isLoading = status === "streaming" || status === "submitted" || !!chat.isLoading;

  // Cycle loading step description during AI processing
  useEffect(() => {
    if (!isLoading) {
      const t = setTimeout(() => setLoadingStep(1), 0);
      return () => clearTimeout(t);
    }
    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev % 3) + 1);
    }, 1800);
    return () => clearInterval(interval);
  }, [isLoading]);

  // Safe universal sender supporting both modern AI SDK 4/7 (sendMessage) and legacy (append)
  const sendPromptText = (promptText: string) => {
    const text = promptText?.trim();
    if (!text) return;

    if (typeof chat.sendMessage === "function") {
      chat.sendMessage({ text });
    } else if (typeof chat.append === "function") {
      chat.append({
        role: "user",
        content: text,
      });
    }
  };

  const handleStartInitialAnalysis = () => {
    const promptToSend =
      initialPrompt && initialPrompt.trim()
        ? `Tässä on ohjelmistoideani / vaatimukseni:\n\n"${initialPrompt}"\n\nAnalysoi tämä, arvioi järjestelmän kerrokset ja anna tiivis suomenkielinen arkkitehtuurikatsaus sekä suositellut jatkoaskeleet.`
        : "Analysoi nykyisen arkkitehtuurikaavion rakenne, arvioi kerrosjako ja anna tiivis suomenkielinen katsaus sekä suositellut jatkoaskeleet.";
    sendPromptText(promptToSend);
  };

  // Auto-send initial prompt on mount if there is no existing architecture
  useEffect(() => {
    if (initialPrompt && !hasExistingArchitecture && !initialSentRef.current) {
      initialSentRef.current = true;
      const formattedContent = `Tässä on ohjelmistoideani / vaatimukseni:\n\n"${initialPrompt}"\n\nAnalysoi tämä, luo ensimmäinen versio arkkitehtuurikaaviosta kutsumalla update_architecture-työkalua ja kerro lyhyesti arkkitehtuurivalinnoistasi.`;
      sendPromptText(formattedContent);
    }
  }, [initialPrompt, hasExistingArchitecture]);

  // Handle external prompts (e.g. from Node Inspector or Project AI Check)
  useEffect(() => {
    if (externalPrompt && !isLoading) {
      sendPromptText(externalPrompt);
      onClearExternalPrompt?.();
    }
  }, [externalPrompt, isLoading, onClearExternalPrompt]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendPromptText(input);
    setInput("");
  };

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Sync tool calls to React Flow canvas
  useEffect(() => {
    if (!messages || messages.length === 0) return;

    for (let i = messages.length - 1; i >= Math.max(0, messages.length - 3); i--) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const msg: any = messages[i];
      if (!msg || msg.role !== "assistant") continue;

      // Check modern parts array
      if (Array.isArray(msg.parts)) {
        for (const part of msg.parts) {
          if (
            (part.type === "tool-call" || part.type === "tool-input-available") &&
            part.toolName === "update_architecture"
          ) {
            const graphData = part.args || part.input;
            if (graphData && graphData.nodes && graphData.edges) {
              onArchitectureUpdate(graphData);
              return;
            }
          }
          if (
            (part.type === "tool-result" || part.type === "tool-output-available") &&
            part.toolName === "update_architecture"
          ) {
            const graphData = part.result || part.output;
            if (graphData && graphData.nodes && graphData.edges) {
              onArchitectureUpdate(graphData);
              return;
            }
          }
        }
      }

      // Check legacy toolInvocations array
      const toolInvocations = msg.toolInvocations;
      if (Array.isArray(toolInvocations)) {
        for (const invocation of toolInvocations) {
          if (invocation.toolName === "update_architecture") {
            const graphData = invocation.result || invocation.args;
            if (graphData && graphData.nodes && graphData.edges) {
              onArchitectureUpdate(graphData);
              return;
            }
          }
        }
      }
    }
  }, [messages, onArchitectureUpdate]);

  // Extract human-readable text from either modern parts or classic content
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const extractMessageText = (msg: any): string => {
    if (typeof msg.content === "string" && msg.content.trim()) {
      return msg.content;
    }
    if (Array.isArray(msg.parts)) {
      const text = msg.parts
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((p: any) => p.type === "text" && typeof p.text === "string")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((p: any) => p.text)
        .join("");
      if (text.trim()) return text;
    }
    // Check if message has tool calls or invocations
    const hasTool =
      (Array.isArray(msg.parts) &&
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        msg.parts.some((p: any) => p.type === "tool-call" || p.toolName === "update_architecture")) ||
      (Array.isArray(msg.toolInvocations) && msg.toolInvocations.length > 0);
    if (hasTool) {
      return "⚡ Arkkitehtuurikaavio päivitetty kankaalle.";
    }
    return "";
  };

  return (
    <div className="flex flex-col h-full border rounded-lg bg-background overflow-hidden shadow-sm">
      {/* Header */}
      <div className="p-3.5 border-b bg-muted/30 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bot className="h-5 w-5 text-purple-500" />
          <h3 className="font-bold text-sm tracking-tight">Arkkitehti Co-Pilot</h3>
        </div>
        <div className="flex items-center space-x-1.5">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (typeof chat.setMessages === "function") {
                  chat.setMessages([]);
                }
              }}
              className="text-xs text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted transition-colors flex items-center gap-1"
              title="Aloita uusi keskustelu ja tyhjennä historia"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="text-[10px]">Uusi</span>
            </button>
          )}
          <span className="text-xs text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-full font-medium">
            Reaaliaikainen
          </span>
        </div>
      </div>

      {/* Messages list */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 text-sm">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col justify-center items-center text-center p-2 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Bot className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-sm text-foreground">Co-Pilot valmiina</h4>
              <p className="text-xs text-muted-foreground max-w-[240px]">
                Arkkitehtuuriprojekti on luotu. Voit käynnistää kattavan analyysin ja sparrauksen.
              </p>
            </div>

            <div className="w-full space-y-2 pt-2">
              <Button
                onClick={handleStartInitialAnalysis}
                disabled={isLoading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs h-9 shadow-sm"
              >
                ⚡ Käynnistä Co-Pilot -analyysi
              </Button>

              <div className="text-[11px] text-muted-foreground pt-1">Tai kysy suoraan:</div>
              <div className="flex flex-col gap-1.5 w-full text-left">
                <button
                  type="button"
                  onClick={() =>
                    sendPromptText("Mitkä ovat tämän arkkitehtuurin kriittisimmät skaalautuvuushaasteet?")
                  }
                  className="text-xs text-left p-2 rounded-md bg-muted/40 hover:bg-muted border border-border/40 text-foreground transition-colors"
                >
                  🚀 Kriittisimmät skaalautuvuushaasteet?
                </button>
                <button
                  type="button"
                  onClick={() =>
                    sendPromptText("Miten tietoturva ja käyttäjätodennus kannattaa ratkaista tässä?")
                  }
                  className="text-xs text-left p-2 rounded-md bg-muted/40 hover:bg-muted border border-border/40 text-foreground transition-colors"
                >
                  🔒 Tietoturvan ja autentikaation arviointi
                </button>
                <button
                  type="button"
                  onClick={() =>
                    sendPromptText("Tarvitseeko järjestelmä välimuistia tai taustajonoja (Queue/Workers)?")
                  }
                  className="text-xs text-left p-2 rounded-md bg-muted/40 hover:bg-muted border border-border/40 text-foreground transition-colors"
                >
                  ⚡ Välimuistin ja asynkronisten jonojen tarve
                </button>
              </div>
            </div>
          </div>
        ) : (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          messages.map((message: any, index: number) => {
            const isLastMessage = index === messages.length - 1;
            const isAssistant = message.role !== "user";
            const textContent = extractMessageText(message);

            return (
              <div
                key={message.id || index}
                className={`flex items-start space-x-2 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {isAssistant && (
                  <div className="w-7 h-7 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 flex-none mt-0.5">
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                <div
                  className={`rounded-xl px-3.5 py-2.5 max-w-[88%] whitespace-pre-wrap text-sm leading-relaxed ${
                    message.role === "user"
                      ? "bg-purple-600 text-white font-medium shadow-sm"
                      : "bg-muted/60 text-foreground border border-border/60"
                  }`}
                >
                  {textContent || (
                    <span className="text-xs text-muted-foreground italic">
                      {isAssistant
                        ? isLoading && isLastMessage
                          ? "Valmistellaan vastausta..."
                          : "⚡ Arkkitehtuurikaavio päivitetty kankaalle."
                        : ""}
                    </span>
                  )}

                  {/* Tool Call notifications */}
                  {Array.isArray(message.parts) &&
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    message.parts.some((p: any) => p.type === "tool-call" || p.toolName === "update_architecture") && (
                      <div className="mt-2 text-xs text-purple-600 dark:text-purple-400 font-medium italic border-t pt-1.5 flex items-center gap-1.5">
                        <span>⚡</span> Arkkitehtuurikaaviota päivitetty kankaalle
                      </div>
                    )}

                  {/* Completion confirmation on last assistant message when not loading */}
                  {isAssistant && isLastMessage && !isLoading && textContent && (
                    <div className="mt-2.5 pt-2 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                        ✓ Analyysi valmis
                      </span>
                      <span>Co-Pilot aktiivinen</span>
                    </div>
                  )}
                </div>
                {message.role === "user" && (
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground flex-none mt-0.5">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Live dynamic progress HUD */}
        {isLoading && (
          <div className="p-3.5 rounded-xl border border-purple-500/40 bg-purple-500/10 text-purple-700 dark:text-purple-300 shadow-sm space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 font-semibold text-xs tracking-tight">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-500" />
                <span>⚡ Tekoäly-arkkitehti työskentelee...</span>
              </div>
              <span className="text-[10px] bg-purple-500/20 px-2 py-0.5 rounded-full font-bold">
                Vaihe {loadingStep}/3
              </span>
            </div>
            <p className="text-xs text-muted-foreground font-medium pl-5">
              {loadingStep === 1 && "1/3 Puretaan vaatimusmäärittelyä ja tunnistetaan kerrokset..."}
              {loadingStep === 2 && "2/3 Lasketaan integraatioita ja riippuvuuksia..."}
              {loadingStep === 3 && "3/3 Viimeistellään arkkitehtuurikatsausta ja suosituksia..."}
            </p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <form onSubmit={handleFormSubmit} className="p-3 border-t flex items-center space-x-2 bg-background">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Kysy arkkitehdiltä tai ehdota muutosta..."
          className="flex-1 bg-muted/40 text-sm px-3.5 py-2 rounded-md border border-input focus:outline-none focus:ring-1 focus:ring-purple-500"
          disabled={isLoading}
        />
        <Button
          type="submit"
          size="default"
          disabled={isLoading || !input.trim()}
          className="bg-purple-600 hover:bg-purple-700 text-white h-9 px-3"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
