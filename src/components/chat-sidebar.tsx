"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { Node, Edge } from "@xyflow/react";

interface ChatSidebarProps {
  initialPrompt?: string;
  externalPrompt?: string | null;
  onClearExternalPrompt?: () => void;
  onArchitectureUpdate: (data: { nodes: Node[]; edges: Edge[] }) => void;
}

export function ChatSidebar({
  initialPrompt,
  externalPrompt,
  onClearExternalPrompt,
  onArchitectureUpdate,
}: ChatSidebarProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chatHelpers = (useChat as any)({
    api: "/api/chat",
    initialMessages: initialPrompt
      ? [
          {
            id: "initial-prompt",
            role: "user",
            content: `Tässä on ohjelmistoideani / vaatimukseni:\n\n"${initialPrompt}"\n\nAnalysoi tämä, luo ensimmäinen versio arkkitehtuurikaaviosta kutsumalla update_architecture-työkalua ja kerro lyhyesti arkkitehtuurivalinnoistasi.`,
          },
        ]
      : [],
  }) as any;

  const messages = chatHelpers.messages || [];
  const isLoading = chatHelpers.status === "streaming" || chatHelpers.status === "submitted" || chatHelpers.isLoading;

  // Handle external prompts (e.g. from Node Inspector or Project AI Check)
  useEffect(() => {
    if (externalPrompt && !isLoading) {
      if (typeof chatHelpers.sendMessage === "function") {
        chatHelpers.sendMessage({ role: "user", content: externalPrompt });
      } else if (typeof chatHelpers.append === "function") {
        chatHelpers.append({ role: "user", content: externalPrompt });
      }
      onClearExternalPrompt?.();
    }
  }, [externalPrompt, isLoading, chatHelpers, onClearExternalPrompt]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    if (typeof chatHelpers.sendMessage === "function") {
      chatHelpers.sendMessage({ role: "user", content: input });
    } else if (typeof chatHelpers.append === "function") {
      chatHelpers.append({ role: "user", content: input });
    } else if (typeof chatHelpers.handleSubmit === "function") {
      chatHelpers.handleSubmit(e);
    }
    setInput("");
  };

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Sync tool calls to React Flow canvas
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== "assistant") return;

    const toolInvocations = lastMessage.toolInvocations;
    if (toolInvocations) {
      for (const invocation of toolInvocations) {
        if (
          invocation.toolName === "update_architecture" &&
          "result" in invocation &&
          invocation.result
        ) {
          onArchitectureUpdate(invocation.result);
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
          <h3 className="font-semibold text-sm">Arkkitehti Co-Pilot</h3>
        </div>
        <span className="text-xs text-muted-foreground bg-primary/10 px-2 py-0.5 rounded-full font-medium text-primary">
          Reaaliaikainen
        </span>
      </div>

      {/* Messages list */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 text-sm">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground text-center p-4 text-xs">
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
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-none mt-0.5">
                  <Bot className="h-4 w-4" />
                </div>
              )}
              <div
                className={`rounded-lg px-3 py-2 max-w-[85%] whitespace-pre-wrap ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/60 text-foreground border"
                }`}
              >
                {message.content}
                {message.toolInvocations?.map((tool: any) => (
                  <div key={tool.toolCallId} className="mt-2 text-xs text-muted-foreground italic border-t pt-1">
                    ⚡ Arkkitehtuurikaaviota päivitetty
                  </div>
                ))}
              </div>
              {message.role === "user" && (
                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground flex-none mt-0.5">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex items-center space-x-2 text-muted-foreground text-xs p-2">
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
          className="flex-1 bg-muted/40 text-sm px-3 py-2 rounded-md border border-input focus:outline-none focus:ring-1 focus:ring-ring"
          disabled={isLoading}
        />
        <Button type="submit" size="sm" disabled={isLoading || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
