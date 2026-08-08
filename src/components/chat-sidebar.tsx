"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import { Send, Bot, User, Loader2 } from "lucide-react";
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
  const initialSentRef = useRef(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { messages = [], append, status, isLoading: isChatLoading } = (useChat as any)({
    api: "/api/chat",
  });

  const isLoading = isChatLoading || status === "streaming" || status === "submitted";
  const appendRef = useRef(append);

  useEffect(() => {
    appendRef.current = append;
  });

  // Auto-send initial prompt on mount if there is no existing architecture
  useEffect(() => {
    if (initialPrompt && !hasExistingArchitecture && !initialSentRef.current) {
      initialSentRef.current = true;
      const formattedContent = `Tässä on ohjelmistoideani / vaatimukseni:\n\n"${initialPrompt}"\n\nAnalysoi tämä, luo ensimmäinen versio arkkitehtuurikaaviosta kutsumalla update_architecture-työkalua ja kerro lyhyesti arkkitehtuurivalinnoistasi.`;

      if (typeof appendRef.current === "function") {
        appendRef.current({
          role: "user",
          content: formattedContent,
        });
      }
    }
  }, [initialPrompt, hasExistingArchitecture]);

  // Handle external prompts (e.g. from Node Inspector or Project AI Check)
  useEffect(() => {
    if (externalPrompt && !isLoading) {
      if (typeof appendRef.current === "function") {
        appendRef.current({
          role: "user",
          content: externalPrompt,
        });
      }
      onClearExternalPrompt?.();
    }
  }, [externalPrompt, isLoading, onClearExternalPrompt]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    if (typeof appendRef.current === "function") {
      appendRef.current({
        role: "user",
        content: input,
      });
    }
    setInput("");
  };

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Sync tool calls to React Flow canvas
  useEffect(() => {
    if (!messages || messages.length === 0) return;
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== "assistant") return;

    const toolInvocations = lastMessage.toolInvocations;
    if (toolInvocations) {
      for (const invocation of toolInvocations) {
        if (invocation.toolName === "update_architecture") {
          const graphData = invocation.result || invocation.args;
          if (graphData && graphData.nodes && graphData.edges) {
            onArchitectureUpdate(graphData);
          }
        }
      }
    }
  }, [messages, onArchitectureUpdate]);

  return (
    <div className="flex flex-col h-full border rounded-lg bg-background overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bot className="h-5 w-5 text-primary" />
          <h3 className="font-bold text-base">Arkkitehti Co-Pilot</h3>
        </div>
        <span className="text-xs text-muted-foreground bg-primary/10 px-2.5 py-1 rounded-full font-medium text-primary">
          Reaaliaikainen
        </span>
      </div>

      {/* Messages list */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 text-base">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground text-center p-4 text-sm">
            Anna ohjelmistoideasi tai kysy tekoälyltä ehdotuksia arkkitehtuurin hiomiseen.
          </div>
        ) : (
          messages.map((message: any) => (
            <div
              key={message.id}
              className={`flex items-start space-x-2 ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.role !== "user" && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-none mt-0.5">
                  <Bot className="h-4.5 w-4.5" />
                </div>
              )}
              <div
                className={`rounded-lg px-3.5 py-2.5 max-w-[85%] whitespace-pre-wrap text-base leading-relaxed ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground font-medium"
                    : "bg-muted/60 text-foreground border"
                }`}
              >
                {message.content}
                {message.toolInvocations?.map((tool: any) => (
                  <div key={tool.toolCallId} className="mt-2 text-sm text-muted-foreground italic border-t pt-1.5">
                    ⚡ Arkkitehtuurikaaviota päivitetty
                  </div>
                ))}
              </div>
              {message.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground flex-none mt-0.5">
                  <User className="h-4.5 w-4.5" />
                </div>
              )}
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex items-center space-x-2 text-muted-foreground text-sm p-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>Arkkitehti suunnittelee ja analysoi...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <form onSubmit={handleFormSubmit} className="p-3 border-t flex items-center space-x-2 bg-background">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Esim. 'Lisää Stripe-maksupalvelu'..."
          className="flex-1 bg-muted/40 text-base px-3.5 py-2.5 rounded-md border border-input focus:outline-none focus:ring-1 focus:ring-ring"
          disabled={isLoading}
        />
        <Button type="submit" size="default" disabled={isLoading || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
