"use client";

import { useState, useCallback, useTransition, useEffect, useMemo } from "react";
import {
  Database,
  LayoutGrid,
  Server,
  ShieldCheck,
  Zap,
  Sparkles,
  ArrowRight,
  HardDrive,
  Loader2,
} from "lucide-react";
import { ArchitectureCanvas } from "@/components/architecture-canvas";
import { ChatSidebar } from "@/components/chat-sidebar";
import { NodeInspector } from "@/components/node-inspector";
import { ConfirmActionDialog } from "@/components/confirm-action-dialog";
import { AuditModal } from "@/components/audit-modal";
import { EnvDialog } from "@/components/env-dialog";
import { ExportModal } from "@/components/export-modal";
import { HomebasePathCard } from "@/components/workspace/homebase-path-card";
import { Gate1SchemaTab } from "@/components/workspace/gate1-schema-tab";
import { Gate2ApiTab } from "@/components/workspace/gate2-api-tab";
import { Gate3UiTab } from "@/components/workspace/gate3-ui-tab";
import { WorkspaceHeader } from "@/components/workspace/workspace-header";
import { CompletionBanner } from "@/components/workspace/completion-banner";
import { AgentWorkingHud } from "@/components/workspace/agent-working-hud";
import { runSecurityAudit, runOptimizationAudit, getLatestAuditReportAction, AuditReport } from "@/app/actions/audit";
import { inferTechStackAndEnv, TechStackProfile } from "@/app/actions/tech-stack";
import { useRouter } from "next/navigation";
import {
  updateProjectArchitecture,
  generateRealArchitecture,
  createProjectWithArchitecture,
  updateProjectTargetPath,
  updateProjectPrismaSchema,
  updateProjectApiCode,
  updateProjectUiCode,
} from "@/app/actions/project";
import { WorkspaceContext, GateCodeUpdatePayload } from "@/types/workspace-context";
import {
  generatePrismaSchemaForProject,
  generateApiRoutesForProject,
  generateUiComponentsForProject,
  writeProjectFileToDisk,
  previewProjectFileWrite,
} from "@/app/actions/codegen";
import { DiffPreviewDialog } from "@/components/diff-preview-dialog";
import type { DiffResult } from "@/lib/diff";
import { Node, Edge } from "@xyflow/react";

interface PlaygroundWorkspaceProps {
  projectId?: string;
  projectName?: string;
  initialPrompt?: string;
  initialNodes?: Node[];
  initialEdges?: Edge[];
  initialTargetPath?: string;
  initialPrismaSchema?: string;
  initialApiCode?: string;
  initialUiCode?: string;
}

export function PlaygroundWorkspace({
  projectId,
  projectName,
  initialPrompt = "",
  initialNodes = [],
  initialEdges = [],
  initialTargetPath = "",
  initialPrismaSchema = "",
  initialApiCode = "",
  initialUiCode = "",
}: PlaygroundWorkspaceProps) {
  const router = useRouter();
  const [currentProjectId, setCurrentProjectId] = useState<string | undefined>(projectId);
  const [currentProjectName, setCurrentProjectName] = useState<string | undefined>(projectName);
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [externalPrompt, setExternalPrompt] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Data Gates & Homebase State
  const [activeTab, setActiveTab] = useState<"canvas" | "schema" | "api" | "ui">("canvas");
  const [targetPath, setTargetPath] = useState<string>(initialTargetPath);
  const [prismaSchema, setPrismaSchema] = useState<string>(initialPrismaSchema);
  const [apiCode, setApiCode] = useState<string>(initialApiCode);
  const [uiCode, setUiCode] = useState<string>(initialUiCode);
  const [isGeneratingSchema, setIsGeneratingSchema] = useState(false);
  const [isGeneratingApi, setIsGeneratingApi] = useState(false);
  const [isGeneratingUi, setIsGeneratingUi] = useState(false);
  const [isGeneratingArch, setIsGeneratingArch] = useState(false);
  const [archGenStep, setArchGenStep] = useState<number>(0);
  const [showArchCompleteBanner, setShowArchCompleteBanner] = useState<boolean>(
    initialNodes.length > 0 && !initialPrismaSchema
  );
  const [diskMessage, setDiskMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [savedGates, setSavedGates] = useState<{ gate1?: boolean; gate2?: boolean; gate3?: boolean }>({
    gate1: !!initialPrismaSchema,
    gate2: !!initialApiCode,
    gate3: !!initialUiCode,
  });

  // Export Diagram Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Quality & Security Audit Suite States
  const [auditReport, setAuditReport] = useState<AuditReport | null>(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizingStatus, setOptimizingStatus] = useState<string | null>(null);
  const [isAuditingSecurity, setIsAuditingSecurity] = useState(false);

  // Agent Live Code Notification State
  const [agentCodeNotification, setAgentCodeNotification] = useState<{
    gate: "gate1" | "gate2" | "gate3";
    label: string;
    summary: string;
    timestamp: number;
  } | null>(null);

  // Track unwritten AI updates per gate
  const [agentUpdatedGates, setAgentUpdatedGates] = useState<{
    gate1?: { summary: string; timestamp: number };
    gate2?: { summary: string; timestamp: number };
    gate3?: { summary: string; timestamp: number };
  }>({});

  // Tech Stack & .env Inference States
  const [techProfile, setTechProfile] = useState<TechStackProfile | null>(null);
  const [isEnvDialogOpen, setIsEnvDialogOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: "default" | "destructive" | "warning" | "purple";
    icon?: React.ReactNode;
    isLoading?: boolean;
    consequences?: string[];
    onConfirm: () => Promise<void> | void;
  }>({
    open: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });

  const [diffDialog, setDiffDialog] = useState<{
    open: boolean;
    title: string;
    relativePath: string;
    fullPath?: string;
    diff: DiffResult | null;
    isLoadingPreview: boolean;
    isWriting: boolean;
    contentToWrite: string;
    writeResult?: {
      success: boolean;
      fullPath?: string;
      backupCreated?: boolean;
      backupPath?: string;
    } | null;
  }>({
    open: false,
    title: "",
    relativePath: "",
    diff: null,
    isLoadingPreview: false,
    isWriting: false,
    contentToWrite: "",
    writeResult: null,
  });

  const isWritingToDisk = diffDialog.isWriting;

  // Generate initial architecture diagram immediately if canvas is empty and prompt exists
  useEffect(() => {
    let initTimer: NodeJS.Timeout | undefined;
    let t1: NodeJS.Timeout | undefined;
    let t2: NodeJS.Timeout | undefined;

    if (initialPrompt && initialNodes.length === 0) {
      initTimer = setTimeout(() => {
        setIsGeneratingArch(true);
        setArchGenStep(1);
      }, 0);

      t1 = setTimeout(() => setArchGenStep(2), 700);
      t2 = setTimeout(() => setArchGenStep(3), 1400);

      generateRealArchitecture(initialPrompt)
        .then((data) => {
          if (data.nodes && data.nodes.length > 0) {
            setNodes(data.nodes);
            setEdges(data.edges);
            setShowArchCompleteBanner(true);
          }
        })
        .catch((err) => {
          console.error("Failed to generate initial architecture diagram:", err);
        })
        .finally(() => {
          setIsGeneratingArch(false);
          if (initTimer) clearTimeout(initTimer);
          if (t1) clearTimeout(t1);
          if (t2) clearTimeout(t2);
        });
    }

    // Infer tech stack complexity and .env requirements
    if (initialPrompt) {
      inferTechStackAndEnv(initialPrompt)
        .then((profile) => setTechProfile(profile))
        .catch((err) => console.error("Failed to infer tech stack profile:", err));
    }

    return () => {
      if (initTimer) clearTimeout(initTimer);
      if (t1) clearTimeout(t1);
      if (t2) clearTimeout(t2);
    };
  }, [initialPrompt, initialNodes.length]);

  const handleArchitectureUpdate = useCallback(
    (data: { nodes: Node[]; edges: Edge[] }) => {
      if (!data || !data.nodes || data.nodes.length === 0) return;

      const currentNodes = nodes;
      const isPartialUpdate = currentNodes.length > 0 && data.nodes.length < currentNodes.length;

      let resolvedNodes: Node[] = [];
      if (isPartialUpdate) {
        const incomingMap = new Map(data.nodes.map((n) => [n.id, n]));
        resolvedNodes = currentNodes.map((existing) => {
          const incoming = incomingMap.get(existing.id);
          if (!incoming) return existing;
          return {
            ...existing,
            ...incoming,
            data: { ...existing.data, ...incoming.data },
            position:
              incoming.position && typeof incoming.position.x === "number" && typeof incoming.position.y === "number"
                ? incoming.position
                : existing.position,
          };
        });
      } else {
        // Full graph update: ensure every node has valid position coordinates
        resolvedNodes = data.nodes.map((n, idx) => {
          const existing = currentNodes.find((e) => e.id === n.id);
          const validPosition =
            n.position && typeof n.position.x === "number" && typeof n.position.y === "number"
              ? n.position
              : existing?.position || { x: 160 + (idx % 3) * 260, y: 100 + Math.floor(idx / 3) * 150 };

          return {
            ...n,
            position: validPosition,
          };
        });
      }

      const resolvedEdges = data.edges && data.edges.length > 0 ? data.edges : edges;

      setNodes(resolvedNodes);
      setEdges(resolvedEdges);

      if (selectedNode) {
        const found = resolvedNodes.find((n) => n.id === selectedNode.id);
        setSelectedNode(found || null);
      }

      if (currentProjectId && resolvedNodes.length > 0) {
        startTransition(async () => {
          try {
            await updateProjectArchitecture(
              currentProjectId,
              JSON.stringify({ nodes: resolvedNodes, edges: resolvedEdges })
            );
          } catch (err) {
            console.error("Failed to persist updated architecture:", err);
          }
        });
      }
    },
    [currentProjectId, nodes, edges, selectedNode]
  );

  const handleSingleNodeUpdate = (updatedNode: Node) => {
    const updatedNodes = nodes.map((n) => (n.id === updatedNode.id ? updatedNode : n));
    setNodes(updatedNodes);
    setSelectedNode(updatedNode);

    if (currentProjectId) {
      startTransition(async () => {
        await updateProjectArchitecture(currentProjectId, JSON.stringify({ nodes: updatedNodes, edges }));
      });
    }
  };

  // Bidirectional Workspace Context for Co-Pilot
  const workspaceContext: WorkspaceContext = useMemo(() => {
    return {
      activeTab,
      projectId: currentProjectId,
      projectName: currentProjectName,
      targetPath,
      nodes,
      edges,
      gateStatus: {
        hasSchema: !!prismaSchema,
        hasApi: !!apiCode,
        hasUi: !!uiCode,
        schemaPreview: prismaSchema ? prismaSchema.slice(0, 1500) : undefined,
        apiPreview: apiCode ? apiCode.slice(0, 1500) : undefined,
        uiPreview: uiCode ? uiCode.slice(0, 1500) : undefined,
      },
      latestAudit: auditReport
        ? {
            type: auditReport.type,
            grade: auditReport.grade,
            score: auditReport.score,
            title: auditReport.title,
            summary: auditReport.summary,
            criticalFindings: auditReport.findings
              .filter((f) => f.type === "critical" || f.type === "warning")
              .map((f) => ({
                title: f.title,
                detail: f.detail,
                recommendation: f.recommendation,
              })),
          }
        : null,
    };
  }, [
    activeTab,
    currentProjectId,
    currentProjectName,
    targetPath,
    nodes,
    edges,
    prismaSchema,
    apiCode,
    uiCode,
    auditReport,
  ]);

  // Handle live code update triggered by Co-Pilot
  const handleAgentCodeUpdate = useCallback(
    (data: GateCodeUpdatePayload) => {
      if (data.gate === "gate1") {
        setPrismaSchema(data.code);
        setSavedGates((prev) => ({ ...prev, gate1: true }));
        if (currentProjectId) {
          updateProjectPrismaSchema(currentProjectId, data.code).catch(console.error);
        }
      } else if (data.gate === "gate2") {
        setApiCode(data.code);
        setSavedGates((prev) => ({ ...prev, gate2: true }));
        if (currentProjectId) {
          updateProjectApiCode(currentProjectId, data.code).catch(console.error);
        }
      } else if (data.gate === "gate3") {
        setUiCode(data.code);
        setSavedGates((prev) => ({ ...prev, gate3: true }));
        if (currentProjectId) {
          updateProjectUiCode(currentProjectId, data.code).catch(console.error);
        }
      }

      const gateLabels: Record<string, string> = {
        gate1: "Gate 1 (Prisma)",
        gate2: "Gate 2 (API)",
        gate3: "Gate 3 (UI)",
      };

      setAgentCodeNotification({
        gate: data.gate,
        label: gateLabels[data.gate] || data.gate,
        summary: data.summary || "Agentti päivitti koodin tuotantovalmiiksi.",
        timestamp: Date.now(),
      });

      setAgentUpdatedGates((prev) => ({
        ...prev,
        [data.gate]: {
          summary: data.summary || "Agentti päivitti koodin tuotantovalmiiksi.",
          timestamp: Date.now(),
        },
      }));
    },
    [currentProjectId]
  );

  const handleSaveToDb = () => {
    if (!currentProjectId) return;
    startTransition(async () => {
      await updateProjectArchitecture(currentProjectId, JSON.stringify({ nodes, edges }));
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    });
  };

  const handleCreateAndSaveProject = () => {
    startTransition(async () => {
      const generatedName = initialPrompt
        ? initialPrompt.slice(0, 30).trim() + (initialPrompt.length > 30 ? "..." : "")
        : "Uusi Arkkitehtuuriprojekti";

      const newProject = await createProjectWithArchitecture(
        generatedName,
        initialPrompt,
        JSON.stringify({ nodes, edges })
      );

      setCurrentProjectId(newProject.id);
      setCurrentProjectName(newProject.name);
      setSavedSuccess(true);
      router.replace(`/playground?projectId=${newProject.id}`);
      setTimeout(() => setSavedSuccess(false), 2500);
    });
  };

  const handleSaveTargetPath = async () => {
    if (!currentProjectId) return;
    await updateProjectTargetPath(currentProjectId, targetPath);
    setDiskMessage({ type: "success", text: "Kotikansio (Target Path) tallennettu." });
    setTimeout(() => setDiskMessage(null), 3000);
  };

  const handleGenerateSchema = async () => {
    setIsGeneratingSchema(true);
    try {
      const res = await generatePrismaSchemaForProject(
        currentProjectId || "",
        initialPrompt,
        JSON.stringify({ nodes, edges })
      );
      if (res.schema) {
        setPrismaSchema(res.schema);
      }
    } catch (err) {
      console.error("Failed to generate schema:", err);
    } finally {
      setIsGeneratingSchema(false);
    }
  };

  const handleGenerateApiRoutes = async () => {
    setIsGeneratingApi(true);
    try {
      const res = await generateApiRoutesForProject(
        currentProjectId || "",
        initialPrompt,
        JSON.stringify({ nodes, edges }),
        prismaSchema
      );
      if (res.code) {
        setApiCode(res.code);
      }
    } catch (err) {
      console.error("Failed to generate API routes:", err);
    } finally {
      setIsGeneratingApi(false);
    }
  };

  const handleGenerateUiComponents = async () => {
    setIsGeneratingUi(true);
    try {
      const res = await generateUiComponentsForProject(
        currentProjectId || "",
        initialPrompt,
        JSON.stringify({ nodes, edges }),
        prismaSchema,
        apiCode
      );
      if (res.code) {
        setUiCode(res.code);
      }
    } catch (err) {
      console.error("Failed to generate UI components:", err);
    } finally {
      setIsGeneratingUi(false);
    }
  };

  // Pre-load existing saved security audit report on mount so Security button opens instantly
  useEffect(() => {
    if (currentProjectId) {
      getLatestAuditReportAction(currentProjectId, "security")
        .then((res) => {
          if (res.success && res.report) {
            setAuditReport(res.report);
          }
        })
        .catch(() => {});
    }
  }, [currentProjectId]);

  // Safe action triggers requiring user confirmation for new LLM runs
  const triggerSecurityCheck = () => {
    setConfirmDialog({
      open: true,
      title: "Haluatko suorittaa uuden tietoturvatarkastuksen?",
      description:
        "Tämä toiminto suorittaa automatisoidun OWASP-tietoturva-analyysin nykyiselle arkkitehtuurille, tietokantamallille ja taustajärjestelmän API-koodille.",
      confirmLabel: "Kyllä, suorita uusi tarkistus",
      variant: "purple",
      icon: <ShieldCheck className="h-5 w-5" />,
      consequences: [
        "Analysoi autentikaation, syötevalidoinnit ja tietoturvariskit",
        "Ei tee muutoksia koodiisi eikä kirjoita tiedostoja levylle ilman lupaasi",
      ],
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isLoading: true }));
        try {
          const report = await runSecurityAudit(
            currentProjectId,
            JSON.stringify({ nodes, edges }),
            prismaSchema,
            apiCode
          );
          setAuditReport(report);
          setConfirmDialog((prev) => ({ ...prev, open: false, isLoading: false }));
          setIsAuditModalOpen(true);
        } catch (err) {
          console.error("Security audit failed:", err);
          setConfirmDialog((prev) => ({ ...prev, isLoading: false }));
        }
      },
    });
  };

  // Click handler: opens cached/saved report instantly at 0 token cost, or triggers audit if none exists
  const handleSecurityClick = async () => {
    if (isAuditingSecurity) return;
    if (auditReport && auditReport.type === "security") {
      setIsAuditModalOpen(true);
      return;
    }

    if (currentProjectId) {
      try {
        const res = await getLatestAuditReportAction(currentProjectId, "security");
        if (res.success && res.report) {
          setAuditReport(res.report);
          setIsAuditModalOpen(true);
          return;
        }
      } catch (err) {
        console.warn("Could not load cached security report:", err);
      }
    }

    setIsAuditingSecurity(true);
    try {
      const report = await runSecurityAudit(
        currentProjectId,
        JSON.stringify({ nodes, edges }),
        prismaSchema,
        apiCode
      );
      setAuditReport(report);
      setIsAuditModalOpen(true);
    } catch (err) {
      console.error("Security audit failed:", err);
    } finally {
      setIsAuditingSecurity(false);
    }
  };

  const executeOptimizationAudit = async () => {
    if (isOptimizing) return;
    setIsOptimizing(true);
    setOptimizingStatus("Käynnistetään optimointityökalu ja luetaan PulseDeskin tiedostot...");

    const t1 = setTimeout(() => {
      setOptimizingStatus("Skannataan koodipohjan tiedostokokoja (> 1 000 riviä) ja tarkastetaan spagettikoodi...");
    }, 400);

    const t2 = setTimeout(() => {
      setOptimizingStatus("Analysoidaan tietokantamallien yhdistelmäindeksit ja Next.js-välimuisti...");
    }, 900);

    try {
      const report = await runOptimizationAudit(
        currentProjectId,
        JSON.stringify({ nodes, edges }),
        prismaSchema,
        apiCode,
        uiCode
      );
      setOptimizingStatus("Analyysi valmis! Avataan optimointiraportti...");
      setAuditReport(report);
      setIsAuditModalOpen(true);
    } catch (err) {
      console.error("Optimization audit failed:", err);
      setOptimizingStatus("Optimointianalyysi epäonnistui.");
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
      setIsOptimizing(false);
      setTimeout(() => setOptimizingStatus(null), 1500);
    }
  };

  const handleOptimizationClick = () => {
    if (isOptimizing) return;

    setConfirmDialog({
      open: true,
      title: "Haluatko ajaa optimoinnin läpi?",
      description:
        "Tämä toiminto suorittaa PulseDeskin koodipohjan analyysin: tarkastaa turvonneet tiedostot (> 1 000 riviä), etsii spagettikoodin, sekä tutkii tietokantaindeksit ja välimuististrategiat.",
      confirmLabel: "Kyllä, aja läpi",
      cancelLabel: "Peruuta",
      variant: "warning",
      icon: <Zap className="h-5 w-5" />,
      consequences: [
        "Skannaa projektin lähdekooditiedostot ja hälyttää yli 1 000 rivin tiedostoista",
        "Tarkastaa arkkitehtuurin ja kerrosjaon spagettikoodin varalta",
        "Analysoi tietokantamallien indeksit ja Next.js-välimuistin",
        "Antaa selkeät parannusehdotukset ilman suoria koodimuutoksia",
      ],
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, open: false }));
        await executeOptimizationAudit();
      },
    });
  };

  const triggerGenerateSchemaConfirmation = () => {
    if (prismaSchema.trim()) {
      setConfirmDialog({
        open: true,
        title: "Generoidaanko tietokantamalli uudelleen?",
        description:
          "Projektilla on jo generoitu Prisma-skeema. Uudelleengenerointi korvaa nykyisen luonnoksen tekoälyn luomalla uudella versiolla.",
        confirmLabel: "Kyllä, generoi uudelleen",
        variant: "warning",
        icon: <Database className="h-5 w-5" />,
        consequences: [
          "Nykyinen näytöllä oleva Prisma-skeemaluonnos korvataan uudella",
          "Levyllä olevat tiedostot eivät muutu ennen kuin painat 'Kirjoita levylle'",
        ],
        onConfirm: async () => {
          setConfirmDialog((prev) => ({ ...prev, open: false }));
          await handleGenerateSchema();
        },
      });
    } else {
      handleGenerateSchema();
    }
  };

  const triggerGenerateApiConfirmation = () => {
    if (apiCode.trim()) {
      setConfirmDialog({
        open: true,
        title: "Generoidaanko API-koodi uudelleen?",
        description:
          "Projektilla on jo generoitu taustajärjestelmän API-koodi. Uudelleengenerointi korvaa nykyisen koodiluonnoksen.",
        confirmLabel: "Kyllä, generoi uudelleen",
        variant: "warning",
        icon: <Server className="h-5 w-5" />,
        consequences: [
          "Nykyinen näytöllä oleva API-koodiluonnos korvataan uudella",
          "Levyllä olevat tiedostot eivät muutu ennen kuin painat 'Kirjoita levylle'",
        ],
        onConfirm: async () => {
          setConfirmDialog((prev) => ({ ...prev, open: false }));
          await handleGenerateApiRoutes();
        },
      });
    } else {
      handleGenerateApiRoutes();
    }
  };

  const handleOpenDiffPreview = async (
    relativePath: string,
    content: string,
    title: string
  ) => {
    if (!currentProjectId) {
      setDiskMessage({ type: "error", text: "Tallenna projekti ensin ennen levylle kirjoittamista." });
      return;
    }
    if (!targetPath.trim()) {
      setDiskMessage({ type: "error", text: "Syötä projektin kotikansio (Project Homebase Directory) ensin." });
      return;
    }
    if (!content.trim()) {
      setDiskMessage({ type: "error", text: "Ei kirjoitettavaa koodia." });
      return;
    }

    setDiffDialog({
      open: true,
      title,
      relativePath,
      fullPath: undefined,
      diff: null,
      isLoadingPreview: true,
      isWriting: false,
      contentToWrite: content,
      writeResult: null,
    });

    try {
      await updateProjectTargetPath(currentProjectId, targetPath);

      const previewRes = await previewProjectFileWrite(
        currentProjectId,
        relativePath,
        content
      );

      if (!previewRes.success || !previewRes.diff) {
        setDiffDialog((prev) => ({ ...prev, open: false }));
        setDiskMessage({
          type: "error",
          text: previewRes.error || "Esikatselun laskeminen epäonnistui.",
        });
        return;
      }

      setDiffDialog((prev) => ({
        ...prev,
        diff: previewRes.diff || null,
        fullPath: previewRes.fullPath,
        isLoadingPreview: false,
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Esikatselu epäonnistui.";
      setDiffDialog((prev) => ({ ...prev, open: false }));
      setDiskMessage({ type: "error", text: msg });
    }
  };

  const handleConfirmDiffWrite = async () => {
    if (!currentProjectId || !diffDialog.relativePath || !diffDialog.contentToWrite) {
      return;
    }

    setDiffDialog((prev) => ({ ...prev, isWriting: true }));
    try {
      const result = await writeProjectFileToDisk(
        currentProjectId,
        diffDialog.relativePath,
        diffDialog.contentToWrite
      );

      if (result.success) {
        const backupNote = result.backupCreated
          ? ` (Varmuuskopio tallennettu: ${result.backupPath})`
          : "";
        setDiskMessage({
          type: "success",
          text: `Tiedosto tallennettu onnistuneesti! (${result.fullPath})${backupNote}`,
        });
        setDiffDialog((prev) => ({
          ...prev,
          isWriting: false,
          writeResult: {
            success: true,
            fullPath: result.fullPath,
            backupCreated: result.backupCreated,
            backupPath: result.backupPath,
          },
        }));

        if (diffDialog.relativePath === "prisma/schema.prisma") {
          setSavedGates((prev) => ({ ...prev, gate1: true }));
          setAgentUpdatedGates((prev) => {
            const next = { ...prev };
            delete next.gate1;
            return next;
          });
        } else if (diffDialog.relativePath === "src/app/api/endpoints/route.ts") {
          setSavedGates((prev) => ({ ...prev, gate2: true }));
          setAgentUpdatedGates((prev) => {
            const next = { ...prev };
            delete next.gate2;
            return next;
          });
        } else if (diffDialog.relativePath === "src/components/features/dashboard.tsx") {
          setSavedGates((prev) => ({ ...prev, gate3: true }));
          setAgentUpdatedGates((prev) => {
            const next = { ...prev };
            delete next.gate3;
            return next;
          });
        }
      } else {
        setDiskMessage({
          type: "error",
          text: result.error || "Tiedoston kirjoitus epäonnistui.",
        });
        setDiffDialog((prev) => ({ ...prev, isWriting: false }));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Tiedoston kirjoitus epäonnistui.";
      setDiskMessage({ type: "error", text: msg });
      setDiffDialog((prev) => ({ ...prev, isWriting: false }));
    } finally {
      setTimeout(() => setDiskMessage(null), 8000);
    }
  };

  const triggerWritePrismaToDiskConfirmation = () => {
    handleOpenDiffPreview(
      "prisma/schema.prisma",
      prismaSchema,
      "Data Gate 1: Prisma Database Schema"
    );
  };

  const triggerWriteApiToDiskConfirmation = () => {
    handleOpenDiffPreview(
      "src/app/api/endpoints/route.ts",
      apiCode,
      "Data Gate 2: Next.js API Endpoints"
    );
  };

  const triggerGenerateUiConfirmation = () => {
    if (uiCode.trim()) {
      setConfirmDialog({
        open: true,
        title: "Generoidaanko UI-komponentit uudelleen?",
        description:
          "Projektilla on jo generoitu käyttöliittymäkomponenttiluonnos. Uudelleengenerointi korvaa nykyisen koodin tekoälyn luomalla uudella versiolla.",
        confirmLabel: "Kyllä, generoi uudelleen",
        variant: "warning",
        icon: <LayoutGrid className="h-5 w-5" />,
        consequences: [
          "Nykyinen näytöllä oleva UI-koodiluonnos korvataan uudella",
          "Levyllä olevat tiedostot eivät muutu ennen kuin painat 'Kirjoita levylle'",
        ],
        onConfirm: async () => {
          setConfirmDialog((prev) => ({ ...prev, open: false }));
          await handleGenerateUiComponents();
        },
      });
    } else {
      handleGenerateUiComponents();
    }
  };

  const triggerWriteUiToDiskConfirmation = () => {
    handleOpenDiffPreview(
      "src/components/features/dashboard.tsx",
      uiCode,
      "Data Gate 3: UI Dashboard Component"
    );
  };

  return (
    <div className="h-screen flex flex-col bg-muted/20">
      {/* Modular Top Bar Header */}
      <WorkspaceHeader
        currentProjectId={currentProjectId}
        currentProjectName={currentProjectName}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        savedGates={savedGates}
        techProfile={techProfile}
        isPending={isPending}
        savedSuccess={savedSuccess}
        isOptimizing={isOptimizing}
        isAuditingSecurity={isAuditingSecurity}
        onExportClick={() => setIsExportModalOpen(true)}
        onSecurityCheck={handleSecurityClick}
        onOptimizationCheck={handleOptimizationClick}
        onEnvClick={() => setIsEnvDialogOpen(true)}
        onSave={currentProjectId ? handleSaveToDb : handleCreateAndSaveProject}
      />

      {/* Live Background Optimization Banner */}
      {isOptimizing && (
        <div className="mx-4 mt-3 mb-1 p-3.5 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent border border-amber-500/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-500 shrink-0 relative">
              <Zap className="h-5 w-5 animate-pulse" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
            </div>
            <div>
              <div className="text-xs font-bold text-foreground flex items-center gap-2">
                <span>⚡ Ammattimainen koodin optimointityökalu käynnissä</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 font-semibold border border-amber-500/30 uppercase tracking-wider">
                  Live Audit
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
                {optimizingStatus || "Skannataan koodipohjaa taustalla..."}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3 w-full sm:w-64 shrink-0">
            <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden border border-border/40 relative">
              <div className="h-full bg-gradient-to-r from-amber-500 via-orange-400 to-amber-500 animate-pulse rounded-full w-3/4" />
            </div>
            <Loader2 className="h-4 w-4 text-amber-500 animate-spin shrink-0" />
          </div>
        </div>
      )}

      {/* Live Background Security Banner */}
      {isAuditingSecurity && (
        <div className="mx-4 mt-3 mb-1 p-3.5 bg-gradient-to-r from-purple-500/15 via-indigo-500/10 to-transparent border border-purple-500/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-purple-500/20 text-purple-500 shrink-0 relative">
              <ShieldCheck className="h-5 w-5 animate-pulse" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-500"></span>
              </span>
            </div>
            <div>
              <div className="text-xs font-bold text-foreground flex items-center gap-2">
                <span>🛡️ OWASP Tietoturva-auditointi käynnissä</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-600 dark:text-purple-400 font-semibold border border-purple-500/30 uppercase tracking-wider">
                  Live Security Check
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
                Tarkastetaan autentikaatio, syötevalidointi ja tietoturvariskit...
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3 w-full sm:w-64 shrink-0">
            <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden border border-border/40 relative">
              <div className="h-full bg-gradient-to-r from-purple-500 via-indigo-400 to-purple-500 animate-pulse rounded-full w-3/4" />
            </div>
            <Loader2 className="h-4 w-4 text-purple-500 animate-spin shrink-0" />
          </div>
        </div>
      )}

      {/* Agent Live Code Update Notification Banner */}
      {agentCodeNotification && (
        <div className="mx-4 mt-3 mb-1 p-3 bg-gradient-to-r from-purple-500/15 via-indigo-500/10 to-transparent border border-purple-500/30 rounded-xl flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <span>⚡ Co-Pilot päivitti koodin:</span>
                <span className="text-purple-400 font-bold">{agentCodeNotification.label}</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">{agentCodeNotification.summary}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {((agentCodeNotification.gate === "gate1" && activeTab === "schema") ||
              (agentCodeNotification.gate === "gate2" && activeTab === "api") ||
              (agentCodeNotification.gate === "gate3" && activeTab === "ui")) ? (
              <button
                onClick={() => {
                  if (agentCodeNotification.gate === "gate1") triggerWritePrismaToDiskConfirmation();
                  else if (agentCodeNotification.gate === "gate2") triggerWriteApiToDiskConfirmation();
                  else if (agentCodeNotification.gate === "gate3") triggerWriteUiToDiskConfirmation();
                }}
                className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5 shadow-sm transition-all"
              >
                <HardDrive className="h-3.5 w-3.5" />
                <span>Tallenna muutokset levylle</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  if (agentCodeNotification.gate === "gate1") setActiveTab("schema");
                  else if (agentCodeNotification.gate === "gate2") setActiveTab("api");
                  else if (agentCodeNotification.gate === "gate3") setActiveTab("ui");
                }}
                className="text-xs px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium flex items-center gap-1 shadow-sm transition-all"
              >
                <span>Siirry katsomaan</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={() => setAgentCodeNotification(null)}
              className="text-xs text-muted-foreground hover:text-foreground px-2 py-1"
            >
              Sulje
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="flex-1 min-h-0 p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left/Main Area based on activeTab */}
        {activeTab === "canvas" ? (
          <>
            <div
              className={`h-full flex flex-col transition-all duration-300 relative ${
                selectedNode ? "lg:col-span-6" : "lg:col-span-8"
              }`}
            >
              {/* Completion Banner */}
              {showArchCompleteBanner && nodes.length > 0 && (
                <CompletionBanner
                  nodeCount={nodes.length}
                  edgeCount={edges.length}
                  onNextStep={() => {
                    setActiveTab("schema");
                    setShowArchCompleteBanner(false);
                  }}
                  onDismiss={() => setShowArchCompleteBanner(false)}
                />
              )}

              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base font-semibold text-foreground">Visuaalinen Kaavio</h2>
                <span className="text-sm text-muted-foreground font-medium">
                  {nodes.length} komponenttia kaaviossa{" "}
                  {selectedNode ? "• Valittuna: " + ((selectedNode.data?.label as string) || selectedNode.id) : ""}
                </span>
              </div>
              <div className="flex-1 min-h-0 relative">
                <ArchitectureCanvas
                  nodes={nodes}
                  edges={edges}
                  selectedNodeId={selectedNode?.id}
                  onNodesChange={setNodes}
                  onEdgesChange={setEdges}
                  onNodeSelect={setSelectedNode}
                  hideHeader={true}
                />

                {/* Animated Agent Working HUD Overlay */}
                {isGeneratingArch && <AgentWorkingHud step={archGenStep} />}
              </div>
            </div>

            {selectedNode && (
              <div className="lg:col-span-3 h-full flex flex-col">
                <NodeInspector
                  selectedNode={selectedNode}
                  onNodeUpdate={handleSingleNodeUpdate}
                  onClose={() => setSelectedNode(null)}
                  onTriggerAICheck={setExternalPrompt}
                />
              </div>
            )}
          </>
        ) : (
          <div className="lg:col-span-8 h-full flex flex-col space-y-4 min-h-0">
            {/* Project Homebase Folder Directory Settings Card */}
            <HomebasePathCard
              targetPath={targetPath}
              setTargetPath={setTargetPath}
              onSaveTargetPath={handleSaveTargetPath}
            />

            {/* Code Generator & Viewer Card - Gate 1, Gate 2, or Gate 3 */}
            {activeTab === "schema" ? (
              <Gate1SchemaTab
                prismaSchema={prismaSchema}
                isGeneratingSchema={isGeneratingSchema}
                isWritingToDisk={isWritingToDisk}
                diskMessage={diskMessage}
                techProfile={techProfile}
                agentUpdate={agentUpdatedGates.gate1}
                onGenerateSchema={triggerGenerateSchemaConfirmation}
                onWriteToDisk={triggerWritePrismaToDiskConfirmation}
                onDismissAgentUpdate={() =>
                  setAgentUpdatedGates((prev) => {
                    const next = { ...prev };
                    delete next.gate1;
                    return next;
                  })
                }
              />
            ) : activeTab === "api" ? (
              <Gate2ApiTab
                apiCode={apiCode}
                isGeneratingApi={isGeneratingApi}
                isWritingToDisk={isWritingToDisk}
                diskMessage={diskMessage}
                agentUpdate={agentUpdatedGates.gate2}
                onGenerateApi={triggerGenerateApiConfirmation}
                onWriteToDisk={triggerWriteApiToDiskConfirmation}
                onDismissAgentUpdate={() =>
                  setAgentUpdatedGates((prev) => {
                    const next = { ...prev };
                    delete next.gate2;
                    return next;
                  })
                }
              />
            ) : (
              <Gate3UiTab
                uiCode={uiCode}
                isGeneratingUi={isGeneratingUi}
                isWritingToDisk={isWritingToDisk}
                diskMessage={diskMessage}
                agentUpdate={agentUpdatedGates.gate3}
                onGenerateUi={triggerGenerateUiConfirmation}
                onWriteToDisk={triggerWriteUiToDiskConfirmation}
                onDismissAgentUpdate={() =>
                  setAgentUpdatedGates((prev) => {
                    const next = { ...prev };
                    delete next.gate3;
                    return next;
                  })
                }
              />
            )}
          </div>
        )}

        {/* Right: AI Chat Co-Pilot */}
        <div
          className={`h-full flex flex-col transition-all duration-300 ${
            activeTab === "canvas"
              ? selectedNode
                ? "lg:col-span-3"
                : "lg:col-span-4"
              : "lg:col-span-4"
          }`}
        >
          <ChatSidebar
            initialPrompt={initialPrompt}
            hasExistingArchitecture={initialNodes.length > 0}
            externalPrompt={externalPrompt}
            onClearExternalPrompt={() => setExternalPrompt(null)}
            onArchitectureUpdate={handleArchitectureUpdate}
            workspaceContext={workspaceContext}
            onCodeUpdate={handleAgentCodeUpdate}
          />
        </div>
      </div>

      {/* Confirmation Dialog ("Oletko varma?") */}
      <ConfirmActionDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmLabel={confirmDialog.confirmLabel}
        cancelLabel={confirmDialog.cancelLabel}
        variant={confirmDialog.variant}
        icon={confirmDialog.icon}
        isLoading={confirmDialog.isLoading}
        consequences={confirmDialog.consequences}
        onConfirm={confirmDialog.onConfirm}
      />

      {/* Diff Preview & File Write Dialog */}
      <DiffPreviewDialog
        open={diffDialog.open}
        onOpenChange={(open) => setDiffDialog((prev) => ({ ...prev, open }))}
        title={diffDialog.title}
        relativePath={diffDialog.relativePath}
        fullPath={diffDialog.fullPath}
        diff={diffDialog.diff}
        isLoadingPreview={diffDialog.isLoadingPreview}
        isWriting={diffDialog.isWriting}
        writeResult={diffDialog.writeResult}
        onConfirmWrite={handleConfirmDiffWrite}
        onNextStep={
          diffDialog.relativePath === "prisma/schema.prisma"
            ? () => setActiveTab("api")
            : diffDialog.relativePath === "src/app/api/endpoints/route.ts"
            ? () => setActiveTab("ui")
            : undefined
        }
        nextStepLabel={
          diffDialog.relativePath === "prisma/schema.prisma"
            ? "Siirry Data Gate 2:een (API) →"
            : diffDialog.relativePath === "src/app/api/endpoints/route.ts"
            ? "Siirry Data Gate 3:een (UI) →"
            : "Valmis"
        }
      />

      {/* Visual Audit Report Scorecard Modal */}
      <AuditModal
        report={auditReport}
        open={isAuditModalOpen}
        onOpenChange={setIsAuditModalOpen}
        projectId={currentProjectId}
        targetPath={targetPath}
        onRerunAudit={() => {
          setIsAuditModalOpen(false);
          if (auditReport?.type === "optimization") {
            handleOptimizationClick();
          } else {
            handleSecurityClick();
          }
        }}
        isRerunning={isOptimizing || isAuditingSecurity}
        onSendToAgent={(agentPrompt) => {
          setActiveTab("canvas");
          setExternalPrompt(agentPrompt);
          setIsAuditModalOpen(false);
        }}
      />

      {/* Tech Stack & .env.local.example Dialog */}
      <EnvDialog
        open={isEnvDialogOpen}
        onOpenChange={setIsEnvDialogOpen}
        profile={techProfile}
        projectId={currentProjectId}
        targetPath={targetPath}
      />

      {/* Canvas Export Modal (PNG, SVG, Mermaid.js) */}
      <ExportModal
        open={isExportModalOpen}
        onOpenChange={setIsExportModalOpen}
        nodes={nodes}
        edges={edges}
        projectName={currentProjectName}
      />
    </div>
  );
}
