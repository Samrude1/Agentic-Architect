"use client";

import { useState, useCallback, useTransition, useEffect } from "react";
import {
  Database,
  LayoutGrid,
  Server,
  ShieldCheck,
  Zap,
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
} from "@/app/actions/project";
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
      if (data.nodes) setNodes(data.nodes);
      if (data.edges) setEdges(data.edges);

      if (selectedNode && data.nodes) {
        const found = data.nodes.find((n) => n.id === selectedNode.id);
        setSelectedNode(found || null);
      }

      if (currentProjectId && data.nodes && data.edges) {
        startTransition(async () => {
          await updateProjectArchitecture(currentProjectId, JSON.stringify(data));
        });
      }
    },
    [currentProjectId, selectedNode]
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
    if (auditReport && auditReport.type === "security") {
      setIsAuditModalOpen(true);
      return;
    }

    if (currentProjectId) {
      try {
        setIsAuditModalOpen(true);
        const res = await getLatestAuditReportAction(currentProjectId, "security");
        if (res.success && res.report) {
          setAuditReport(res.report);
          return;
        }
      } catch (err) {
        console.warn("Could not load cached security report:", err);
      }
    }

    setIsAuditModalOpen(false);
    triggerSecurityCheck();
  };

  const triggerOptimizationCheck = () => {
    setConfirmDialog({
      open: true,
      title: "Haluatko suorittaa uuden koodin & suorituskyvyn optimoinnin?",
      description:
        "Tämä toiminto etsii arkkitehtuurin ja koodin suorituskykypullonkaulat, tarkastaa tietokantaindeksit ja välimuististrategiat.",
      confirmLabel: "Kyllä, optimoi ja tarkista",
      variant: "warning",
      icon: <Zap className="h-5 w-5" />,
      consequences: [
        "Tarkistaa tietokantamallien indeksit ja N+1 -kyselyriskit",
        "Etsii suorituskyky- ja välimuistiparannuksia taustajärjestelmään",
        "Antaa selkeät parannusehdotukset ilman suoria koodimuutoksia",
      ],
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isLoading: true }));
        try {
          const report = await runOptimizationAudit(
            currentProjectId,
            JSON.stringify({ nodes, edges }),
            prismaSchema,
            apiCode
          );
          setAuditReport(report);
          setConfirmDialog((prev) => ({ ...prev, open: false, isLoading: false }));
          setIsAuditModalOpen(true);
        } catch (err) {
          console.error("Optimization audit failed:", err);
          setConfirmDialog((prev) => ({ ...prev, isLoading: false }));
        }
      },
    });
  };

  const handleOptimizationClick = async () => {
    if (auditReport && auditReport.type === "optimization") {
      setIsAuditModalOpen(true);
      return;
    }

    if (currentProjectId) {
      try {
        setIsAuditModalOpen(true);
        const res = await getLatestAuditReportAction(currentProjectId, "optimization");
        if (res.success && res.report) {
          setAuditReport(res.report);
          return;
        }
      } catch (err) {
        console.warn("Could not load cached optimization report:", err);
      }
    }

    setIsAuditModalOpen(false);
    triggerOptimizationCheck();
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
        } else if (diffDialog.relativePath === "src/app/api/endpoints/route.ts") {
          setSavedGates((prev) => ({ ...prev, gate2: true }));
        } else if (diffDialog.relativePath === "src/components/features/dashboard.tsx") {
          setSavedGates((prev) => ({ ...prev, gate3: true }));
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
        onExportClick={() => setIsExportModalOpen(true)}
        onSecurityCheck={handleSecurityClick}
        onOptimizationCheck={handleOptimizationClick}
        onEnvClick={() => setIsEnvDialogOpen(true)}
        onSave={currentProjectId ? handleSaveToDb : handleCreateAndSaveProject}
      />

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
                onGenerateSchema={triggerGenerateSchemaConfirmation}
                onWriteToDisk={triggerWritePrismaToDiskConfirmation}
              />
            ) : activeTab === "api" ? (
              <Gate2ApiTab
                apiCode={apiCode}
                isGeneratingApi={isGeneratingApi}
                isWritingToDisk={isWritingToDisk}
                diskMessage={diskMessage}
                onGenerateApi={triggerGenerateApiConfirmation}
                onWriteToDisk={triggerWriteApiToDiskConfirmation}
              />
            ) : (
              <Gate3UiTab
                uiCode={uiCode}
                isGeneratingUi={isGeneratingUi}
                isWritingToDisk={isWritingToDisk}
                diskMessage={diskMessage}
                onGenerateUi={triggerGenerateUiConfirmation}
                onWriteToDisk={triggerWriteUiToDiskConfirmation}
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
          triggerSecurityCheck();
        }}
        isRerunning={confirmDialog.open && confirmDialog.isLoading}
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
