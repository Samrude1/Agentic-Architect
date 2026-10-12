"use client";

import { useChat } from "@ai-sdk/react";
import { isToolUIPart, getToolName } from "ai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "./ui/button";
import { Send, Bot, User, Loader2, RotateCcw, CheckCircle2, Code2, ShieldCheck, ChevronDown, ChevronUp } from "lucide-react";
import { Node, Edge } from "@xyflow/react";
import { WorkspaceContext, GateCodeUpdatePayload } from "@/types/workspace-context";
import { ChatMarkdown } from "./chat-markdown";

// Helper to universally parse tool parts across all AI SDK versions and stream protocols
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseToolPart(part: any) {
  let name = "";
  if (isToolUIPart(part)) {
    name = getToolName(part);
  } else if (typeof part.toolName === "string") {
    name = part.toolName;
  } else if (typeof part.type === "string" && part.type.startsWith("tool-")) {
    name = part.type.replace(/^tool-/, "");
  }

  const data = part.output ?? part.result ?? part.input ?? part.args ?? null;
  const toolCallId = part.toolCallId || part.id || `${name}_${Date.now()}`;
  return { name, data, toolCallId };
}

interface ChatSidebarProps {
  initialPrompt?: string;
  hasExistingArchitecture?: boolean;
  externalPrompt?: string | null;
  onClearExternalPrompt?: () => void;
  onArchitectureUpdate: (data: { nodes: Node[]; edges: Edge[] }) => void;
  workspaceContext?: WorkspaceContext;
  onCodeUpdate?: (data: GateCodeUpdatePayload) => void;
}

export function ChatSidebar({
  initialPrompt,
  hasExistingArchitecture = false,
  externalPrompt,
  onClearExternalPrompt,
  onArchitectureUpdate,
  workspaceContext,
  onCodeUpdate,
}: ChatSidebarProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const [loadingStep, setLoadingStep] = useState(1);
  const initialSentRef = useRef(false);
  const handledToolCallsRef = useRef<Set<string>>(new Set());
  const [expandedUserMsgId, setExpandedUserMsgId] = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chat = (useChat as any)({
    api: "/api/chat",
    body: {
      workspaceContext,
    },
  });

  const messages = useMemo(() => chat.messages || [], [chat.messages]);
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
  const sendPromptText = useCallback(
    (promptText: string) => {
      const text = promptText?.trim();
      if (!text) return;

      const payload = {
        workspaceContext,
      };

      if (typeof chat.sendMessage === "function") {
        chat.sendMessage({ text }, { body: payload });
      } else if (typeof chat.append === "function") {
        chat.append(
          {
            role: "user",
            content: text,
          },
          { body: payload }
        );
      }
    },
    [chat, workspaceContext]
  );

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
  }, [initialPrompt, hasExistingArchitecture, sendPromptText]);

  // Handle external prompts (e.g. from Node Inspector or Project AI Check or Audit Modal)
  useEffect(() => {
    if (externalPrompt && !isLoading) {
      sendPromptText(externalPrompt);
      onClearExternalPrompt?.();
    }
  }, [externalPrompt, isLoading, onClearExternalPrompt, sendPromptText]);

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

  // Sync tool calls (update_architecture, update_gate_code, apply_security_remediation) to workspace
  useEffect(() => {
    if (!messages || messages.length === 0) return;

    for (let i = messages.length - 1; i >= Math.max(0, messages.length - 5); i--) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const msg: any = messages[i];
      if (!msg || msg.role !== "assistant") continue;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const items: Array<{ name: string; data: any; toolCallId: string }> = [];

      // Check modern parts array (AI SDK 7 ToolUIPart & custom parts)
      if (Array.isArray(msg.parts)) {
        for (const part of msg.parts) {
          const parsed = parseToolPart(part);
          if (parsed.name && parsed.data) {
            items.push(parsed);
          }
        }
      }

      // Check legacy toolInvocations array
      if (Array.isArray(msg.toolInvocations)) {
        for (const inv of msg.toolInvocations) {
          const name = inv.toolName || "";
          const data = inv.result ?? inv.args ?? null;
          const toolCallId = inv.toolCallId || `${msg.id}_${name}`;
          if (name && data) {
            items.push({ name, data, toolCallId });
          }
        }
      }

      // Execute matched tools on the workspace
      for (const { name, data, toolCallId } of items) {
        if (handledToolCallsRef.current.has(toolCallId)) continue;

        if (name === "update_architecture") {
          if (data.nodes && data.edges) {
            handledToolCallsRef.current.add(toolCallId);
            onArchitectureUpdate(data);
          }
        } else if (name === "update_gate_code") {
          if (data.gate && data.code) {
            handledToolCallsRef.current.add(toolCallId);
            onCodeUpdate?.(data);
          }
        } else if (name === "apply_security_remediation") {
          if (data.success) {
            handledToolCallsRef.current.add(toolCallId);
            if (data.nodes && data.edges) {
              onArchitectureUpdate({ nodes: data.nodes, edges: data.edges });
            }
            if (data.gate1Code) {
              onCodeUpdate?.({
                gate: "gate1",
                code: data.gate1Code,
                summary: "Päivitetty PostgreSQL-skeema ja salasanatiivisteet.",
              });
            }
            if (data.gate2Code) {
              onCodeUpdate?.({
                gate: "gate2",
                code: data.gate2Code,
                summary: "Lisätty istunnon tarkistus ja Zod-validointi.",
              });
            }
          }
        }
      }
    }
  }, [messages, onArchitectureUpdate, onCodeUpdate]);

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

    // Check if message has tool calls
    if (Array.isArray(msg.parts)) {
      for (const part of msg.parts) {
        const { name } = parseToolPart(part);
        if (name === "apply_security_remediation") {
          return "🛡️ Tietoturvakorjaukset viety suoraan työtilaan (kaavio & koodi päivitetty).";
        }
        if (name === "update_gate_code") {
          return "⚡ Koodimuutokset viety työtilan Gate-välilehdelle.";
        }
        if (name === "update_architecture") {
          return "⚡ Arkkitehtuurikaavio päivitetty kankaalle.";
        }
      }
    }

    return "";
  };

  const getActiveTabLabel = (tab?: string) => {
    switch (tab) {
      case "schema":
        return "Gate 1 (Prisma)";
      case "api":
        return "Gate 2 (API)";
      case "ui":
        return "Gate 3 (UI)";
      default:
        return "Kaavio";
    }
  };

  return (
    <div className="flex flex-col h-full border rounded-lg bg-background overflow-hidden shadow-sm">
      {/* Header */}
      <div className="p-3 border-b bg-muted/30 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bot className="h-5 w-5 text-purple-500" />
          <div>
            <h3 className="font-bold text-xs tracking-tight leading-none">Arkkitehti Co-Pilot</h3>
            {workspaceContext?.activeTab && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1 font-mono">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Näkymä: {getActiveTabLabel(workspaceContext.activeTab)}
              </span>
            )}
          </div>
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
              className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted transition-colors flex items-center gap-1 border border-border/40"
              title="Aloita uusi keskustelu ja tyhjennä historia"
            >
              <RotateCcw className="h-3 w-3" />
              <span className="text-[10px]">Uusi</span>
            </button>
          )}
          <span className="text-xs text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full font-medium text-[10px]">
            Live Bridge
          </span>
        </div>
      </div>

      {/* Messages list */}
      <div className="flex-1 p-3 overflow-y-auto space-y-3 text-xs">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col justify-center items-center text-center p-2 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Bot className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-xs text-foreground">Co-Pilot valmiina työtilassa</h4>
              <p className="text-[11px] text-muted-foreground max-w-[240px]">
                Näen työtilasi tilanteen. Voit pyytää neuvoja tai suoria koodimuutoksia.
              </p>
            </div>

            <div className="w-full space-y-2 pt-1">
              <Button
                onClick={handleStartInitialAnalysis}
                disabled={isLoading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs h-8 shadow-sm"
              >
                ⚡ Käynnistä analyysi
              </Button>

              <div className="flex flex-col gap-1 w-full text-left pt-1">
                <button
                  type="button"
                  onClick={() =>
                    sendPromptText("Mitkä ovat tämän arkkitehtuurin kriittisimmät skaalautuvuushaasteet?")
                  }
                  className="text-[11px] text-left p-2 rounded-lg bg-muted/40 hover:bg-muted border border-border/40 text-foreground transition-colors"
                >
                  🚀 Skaalautuvuushaasteet?
                </button>
                <button
                  type="button"
                  onClick={() =>
                    sendPromptText(
                      "Päivitä arkkitehtuuri ja koodit tuotantovalmiiksi: lisää Auth Service, PostgreSQL ja NextAuth RBAC."
                    )
                  }
                  className="text-[11px] text-left p-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-600 dark:text-purple-300 font-medium transition-colors"
                >
                  ✨ Päivitä arkkitehtuuri & koodi tuotantoon
                </button>
              </div>
            </div>
          </div>
        ) : (
          messages.map(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (m: any) => {
              const textContent = extractMessageText(m);
              if (!textContent) return null;

              // Check if message has code tool
              const hasCodeTool =
                Array.isArray(m.parts) &&
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                m.parts.some((p: any) => {
                  const { name } = parseToolPart(p);
                  return name === "update_gate_code" || name === "apply_security_remediation";
                });

              const isUser = m.role === "user";
              const isLongAuditUserMsg =
                isUser &&
                (textContent.length > 150 ||
                  textContent.includes("auditointiraportti") ||
                  textContent.includes("Ohessa on järjestelmän"));
              const isExpanded = expandedUserMsgId === m.id;

              return (
                <div
                  key={m.id}
                  className={`flex items-start space-x-2 ${
                    isUser ? "flex-row-reverse space-x-reverse" : ""
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] ${
                      isUser
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "bg-purple-600 text-white shadow-sm"
                    }`}
                  >
                    {isUser ? <User className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
                  </div>

                  <div
                    className={`p-2.5 rounded-2xl max-w-[88%] text-xs leading-relaxed shadow-sm ${
                      isUser
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-muted/70 border border-border/50 text-foreground rounded-tl-sm"
                    }`}
                  >
                    {isUser ? (
                      isLongAuditUserMsg ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 font-semibold text-xs">
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
                            <span>Tietoturvaraportin korjauspyyntö</span>
                          </div>
                          <p className="text-[11px] opacity-85 leading-snug">
                            Pyydetty korjaamaan havaitut tietoturvapuutteet arkkitehtuuriin ja koodiin (Gate 1 & Gate 2).
                          </p>
                          <button
                            type="button"
                            onClick={() => setExpandedUserMsgId(isExpanded ? null : m.id)}
                            className="text-[10px] opacity-75 hover:opacity-100 flex items-center gap-1 pt-0.5 underline cursor-pointer"
                          >
                            <span>{isExpanded ? "Piilota teksti" : "Näytä koko pyyntö"}</span>
                            {isExpanded ? <ChevronUp className="h-2.5 w-2.5" /> : <ChevronDown className="h-2.5 w-2.5" />}
                          </button>
                          {isExpanded && (
                            <div className="mt-2 pt-2 border-t border-primary-foreground/20 text-[10px] whitespace-pre-wrap max-h-48 overflow-y-auto">
                              {textContent}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap">{textContent}</div>
                      )
                    ) : (
                      <ChatMarkdown content={textContent} />
                    )}

                    {hasCodeTool && (
                      <div className="mt-2 pt-1.5 border-t border-purple-500/20 flex items-center gap-1 text-[10px] text-purple-600 dark:text-purple-300 font-medium">
                        <Code2 className="h-3 w-3" />
                        <span>Koodit päivitetty suoraan työtilaan</span>
                        <CheckCircle2 className="h-3 w-3 text-emerald-500 ml-auto" />
                      </div>
                    )}
                  </div>
                </div>
              );
            }
          )
        )}

        {isLoading && (
          <div className="flex items-start space-x-2">
            <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <Bot className="h-3 w-3" />
            </div>
            <div className="p-2.5 rounded-2xl bg-muted/70 border border-border/50 rounded-tl-sm text-xs text-muted-foreground flex flex-col space-y-1 max-w-[88%] shadow-sm">
              <div className="flex items-center space-x-2">
                <Loader2 className="h-3 w-3 animate-spin text-purple-500" />
                <span className="font-semibold text-[11px] text-foreground">
                  {loadingStep === 1
                    ? "Co-Pilot analysoi..."
                    : loadingStep === 2
                    ? "Päivitetään kaaviota ja koodia..."
                    : "Viimeistellään muutoksia..."}
                </span>
              </div>
              <div className="w-full bg-background/50 h-1 rounded-full overflow-hidden">
                <div
                  className="bg-purple-500 h-full transition-all duration-500"
                  style={{ width: `${(loadingStep / 3) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <form onSubmit={handleFormSubmit} className="p-2.5 border-t bg-muted/10 flex items-center space-x-1.5">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Kysy tai pyydä koodimuutosta..."
          className="flex-1 bg-background border border-border/60 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 shadow-inner"
          disabled={isLoading}
        />
        <Button
          type="submit"
          size="sm"
          disabled={isLoading || !input.trim()}
          className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl h-7 px-2.5 shadow-sm transition-all"
        >
          {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
        </Button>
      </form>
    </div>
  );
}
