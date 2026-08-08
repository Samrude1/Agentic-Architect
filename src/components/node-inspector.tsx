"use client";

import { useState, useEffect } from "react";
import { Node } from "@xyflow/react";
import { X, Sparkles, Save, CheckCircle2, Layers, Cpu, FileText } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface NodeInspectorProps {
  selectedNode: Node | null;
  onNodeUpdate: (updatedNode: Node) => void;
  onClose: () => void;
  onTriggerAICheck: (prompt: string) => void;
}

export function NodeInspector({
  selectedNode,
  onNodeUpdate,
  onClose,
  onTriggerAICheck,
}: NodeInspectorProps) {
  const [label, setLabel] = useState("");
  const [tech, setTech] = useState("");
  const [description, setDescription] = useState("");
  const [saveAnimation, setSaveAnimation] = useState(false);

  useEffect(() => {
    if (selectedNode) {
      setLabel((selectedNode.data?.label as string) || "");
      setTech((selectedNode.data?.tech as string) || "");
      setDescription((selectedNode.data?.description as string) || "");
    }
  }, [selectedNode]);

  if (!selectedNode) return null;

  const handleSave = () => {
    const updated: Node = {
      ...selectedNode,
      data: {
        ...selectedNode.data,
        label,
        tech,
        description,
      },
    };
    onNodeUpdate(updated);
    setSaveAnimation(true);
    setTimeout(() => setSaveAnimation(false), 2000);
  };

  const handleAICheck = () => {
    const prompt = `Suorita node-kohtainen tarkistus (Audit) tälle komponentille:
- Nimi: "${label}"
- Tyyppi/Kerros: ${selectedNode.type || "default"}
- Teknologia: "${tech || "Ei määritelty"}"
- Kuvaus: "${description || "Ei kuvausta"}"

Arvioi tämä komponentti: Onko sen määrittelyssä puutteita, tietoturvariskejä tai suositeltavia lisäyksiä? Jos näet aiheelliseksi muuttaa kaaviota, kutsu update_architecture-työkalua.`;

    onTriggerAICheck(prompt);
  };

  return (
    <div className="flex flex-col h-full border rounded-lg bg-background overflow-hidden shadow-sm">
      {/* Header */}
      <div className="p-4 border-b bg-muted/40 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm leading-tight">Node Inspector</h3>
            <p className="text-xs text-muted-foreground font-mono">ID: {selectedNode.id}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onClose} title="Sulje paneeli">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Form Content */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 text-sm">
        {/* Label */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Komponentin Nimi
          </label>
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="esim. PostgreSQL Database"
            className="bg-background"
          />
        </div>

        {/* Tech */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Cpu className="h-3.5 w-3.5" />
            Teknologia / Työkalu
          </label>
          <Input
            value={tech}
            onChange={(e) => setTech(e.target.value)}
            placeholder="esim. Prisma / PostgreSQL"
            className="bg-background"
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Kuvaus & Rooli</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Määritä komponentin tehtävä arkkitehtuurissa..."
            rows={3}
            className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        {/* Layer Info */}
        <div className="p-3 rounded-lg border bg-muted/20 space-y-1 text-xs">
          <div className="font-semibold text-muted-foreground">Arkkitehtuurikerros:</div>
          <div className="text-foreground font-mono">
            {selectedNode.type === "input"
              ? "Layer 0 — Client / UI"
              : selectedNode.type === "output"
              ? "Layer 3 — Data / Storage / Ulkoinen API"
              : "Layer 1/2 — Gateway & Business Logic"}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 space-y-2">
          <Button onClick={handleSave} className="w-full" size="sm">
            {saveAnimation ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4 text-green-400 animate-bounce" />
                Tallennettu!
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Tallenna muutokset nodeen
              </>
            )}
          </Button>

          <Button
            onClick={handleAICheck}
            variant="outline"
            className="w-full border-purple-500/30 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10"
            size="sm"
          >
            <Sparkles className="mr-2 h-4 w-4 text-purple-500" />
            AI Tarkista tämä node
          </Button>
        </div>
      </div>
    </div>
  );
}
