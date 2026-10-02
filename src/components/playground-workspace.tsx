"use client";

import { useState, useCallback, useTransition, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  Save,
  Loader2,
  Check,
  ShieldCheck,
  Database,
  LayoutGrid,
  HardDrive,
  Server,
  Zap,
  Key,
  Download,
  CheckCircle2,
  Circle,
  Bot,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { runSecurityAudit, runOptimizationAudit, AuditReport } from "@/app/actions/audit";
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
} from "@/app/actions/codegen";
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
  const [isWritingToDisk, setIsWritingToDisk] = useState(false);
  const [diskMessage, setDiskMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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

  // Generate initial architecture diagram immediately if canvas is empty and prompt exists
  useEffect(() => {
    if (initialPrompt && initialNodes.length === 0) {
      setIsGeneratingArch(true);
      setArchGenStep(1);

      const t1 = setTimeout(() => setArchGenStep(2), 700);
      const t2 = setTimeout(() => setArchGenStep(3), 1400);

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
          clearTimeout(t1);
          clearTimeout(t2);
        });
    }

    // Infer tech stack complexity and .env requirements
    if (initialPrompt) {
      inferTechStackAndEnv(initialPrompt)
        .then((profile) => setTechProfile(profile))
        .catch((err) => console.error("Failed to infer tech stack profile:", err));
    }
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

  const handleWriteToDisk = async () => {
    if (!currentProjectId) {
      setDiskMessage({ type: "error", text: "Tallenna projekti ensin ennen levylle kirjoittamista." });
      return;
    }
    if (!targetPath.trim()) {
      setDiskMessage({ type: "error", text: "Syötä projektin kotikansio (Project Homebase Directory) ensin." });
      return;
    }
    if (!prismaSchema.trim()) {
      setDiskMessage({ type: "error", text: "Generoi tietokantamalli ensin." });
      return;
    }

    setIsWritingToDisk(true);
    try {
      // Save targetPath to DB first
      await updateProjectTargetPath(currentProjectId, targetPath);

      const result = await writeProjectFileToDisk(currentProjectId, "prisma/schema.prisma", prismaSchema);
      if (result.success) {
        setDiskMessage({
          type: "success",
          text: `Tiedosto kirjoitettu onnistuneesti! (${result.fullPath})`,
        });
      } else {
        setDiskMessage({ type: "error", text: result.error || "Virhe kirjoitettaessa levylle." });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Tiedoston kirjoitus epäonnistui.";
      setDiskMessage({ type: "error", text: msg });
    } finally {
      setIsWritingToDisk(false);
      setTimeout(() => setDiskMessage(null), 5000);
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

  const handleWriteApiToDisk = async () => {
    if (!currentProjectId) {
      setDiskMessage({ type: "error", text: "Tallenna projekti ensin ennen levylle kirjoittamista." });
      return;
    }
    if (!targetPath.trim()) {
      setDiskMessage({ type: "error", text: "Syötä projektin kotikansio (Project Homebase Directory) ensin." });
      return;
    }
    if (!apiCode.trim()) {
      setDiskMessage({ type: "error", text: "Generoi taustajärjestelmän API-koodi ensin." });
      return;
    }

    setIsWritingToDisk(true);
    try {
      await updateProjectTargetPath(currentProjectId, targetPath);

      const result = await writeProjectFileToDisk(
        currentProjectId,
        "src/app/api/endpoints/route.ts",
        apiCode
      );
      if (result.success) {
        setDiskMessage({
          type: "success",
          text: `API-koodi kirjoitettu onnistuneesti! (${result.fullPath})`,
        });
      } else {
        setDiskMessage({ type: "error", text: result.error || "Virhe kirjoitettaessa levylle." });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Tiedoston kirjoitus epäonnistui.";
      setDiskMessage({ type: "error", text: msg });
    } finally {
      setIsWritingToDisk(false);
      setTimeout(() => setDiskMessage(null), 5000);
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

  const handleWriteUiToDisk = async () => {
    if (!currentProjectId) {
      setDiskMessage({ type: "error", text: "Tallenna projekti ensin ennen levylle kirjoittamista." });
      return;
    }
    if (!targetPath.trim()) {
      setDiskMessage({ type: "error", text: "Syötä projektin kotikansio (Project Homebase Directory) ensin." });
      return;
    }
    if (!uiCode.trim()) {
      setDiskMessage({ type: "error", text: "Generoi käyttöliittymäkomponentit ensin." });
      return;
    }

    setIsWritingToDisk(true);
    try {
      await updateProjectTargetPath(currentProjectId, targetPath);

      const result = await writeProjectFileToDisk(
        currentProjectId,
        "src/components/features/dashboard.tsx",
        uiCode
      );
      if (result.success) {
        setDiskMessage({
          type: "success",
          text: `UI-komponentti kirjoitettu onnistuneesti! (${result.fullPath})`,
        });
      } else {
        setDiskMessage({ type: "error", text: result.error || "Virhe kirjoitettaessa levylle." });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Tiedoston kirjoitus epäonnistui.";
      setDiskMessage({ type: "error", text: msg });
    } finally {
      setIsWritingToDisk(false);
      setTimeout(() => setDiskMessage(null), 5000);
    }
  };

  // Safe action triggers requiring user confirmation
  const triggerSecurityCheck = () => {
    setConfirmDialog({
      open: true,
      title: "Haluatko suorittaa tietoturvatarkastuksen?",
      description:
        "Tämä toiminto suorittaa automatisoidun OWASP-tietoturva-analyysin nykyiselle arkkitehtuurille, tietokantamallille ja taustajärjestelmän API-koodille.",
      confirmLabel: "Kyllä, tarkista tietoturva",
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

  const triggerOptimizationCheck = () => {
    setConfirmDialog({
      open: true,
      title: "Haluatko suorittaa koodin & suorituskyvyn optimoinnin?",
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

  const triggerWritePrismaToDiskConfirmation = () => {
    setConfirmDialog({
      open: true,
      title: "Kirjoitetaanko tietokantamalli levylle?",
      description: `Tämä toiminto luo tai ylikirjoittaa tiedoston 'prisma/schema.prisma' valitussa kotikansiossa:\n${targetPath || "Valittu kotikansio"}`,
      confirmLabel: "Kyllä, kirjoita tiedosto",
      variant: "purple",
      icon: <HardDrive className="h-5 w-5" />,
      consequences: [
        "Kirjoittaa suoraan paikalliseen tiedostojärjestelmään",
        "Varmista, että olet tallentanut mahdolliset aiemmat muutokset",
      ],
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, open: false }));
        await handleWriteToDisk();
      },
    });
  };

  const triggerWriteApiToDiskConfirmation = () => {
    setConfirmDialog({
      open: true,
      title: "Kirjoitetaanko API-koodi levylle?",
      description: `Tämä toiminto luo tai ylikirjoittaa tiedoston 'src/app/api/endpoints/route.ts' valitussa kotikansiossa:\n${targetPath || "Valittu kotikansio"}`,
      confirmLabel: "Kyllä, kirjoita tiedosto",
      variant: "purple",
      icon: <HardDrive className="h-5 w-5" />,
      consequences: [
        "Kirjoittaa suoraan paikalliseen tiedostojärjestelmään",
        "Luo tarvittavat hakemistot automaattisesti",
      ],
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, open: false }));
        await handleWriteApiToDisk();
      },
    });
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
    setConfirmDialog({
      open: true,
      title: "Kirjoitetaanko UI-komponentti levylle?",
      description: `Tämä toiminto luo tai ylikirjoittaa tiedoston 'src/components/features/dashboard.tsx' valitussa kotikansiossa:\n${targetPath || "Valittu kotikansio"}`,
      confirmLabel: "Kyllä, kirjoita tiedosto",
      variant: "purple",
      icon: <HardDrive className="h-5 w-5" />,
      consequences: [
        "Kirjoittaa suoraan paikalliseen tiedostojärjestelmään",
        "Luo tarvittavat hakemistot automaattisesti",
      ],
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, open: false }));
        await handleWriteUiToDisk();
      },
    });
  };

  return (
    <div className="h-screen flex flex-col bg-muted/20">
      {/* Top bar */}
      <header className="h-14 border-b bg-background px-4 lg:px-6 flex items-center justify-between flex-none gap-3 overflow-hidden">
        <div className="flex items-center space-x-3 min-w-0 shrink">
          <Button
            variant="ghost"
            size="icon-sm"
            render={<Link href={currentProjectId ? `/projects/${currentProjectId}` : "/"} />}
            nativeButton={false}
            className="shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center space-x-2 min-w-0">
            <Sparkles className="h-5 w-5 text-purple-500 shrink-0" />
            <h1
              className="font-bold text-sm sm:text-base md:text-lg tracking-tight truncate max-w-[140px] sm:max-w-[200px] md:max-w-[280px] lg:max-w-[380px]"
              title={currentProjectName ? `Ajatushautomo: ${currentProjectName}` : "Arkkitehtuurin Hiekkalaatikko"}
            >
              {currentProjectName ? `Ajatushautomo: ${currentProjectName}` : "Arkkitehtuurin Hiekkalaatikko"}
            </h1>
          </div>

          {/* View Mode Toggle Tabs */}
          <div className="hidden sm:flex ml-2 lg:ml-4 items-center bg-muted/50 p-1 rounded-lg border border-border/50 text-xs font-medium shrink-0">
            <button
              onClick={() => setActiveTab("canvas")}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-md transition-all ${
                activeTab === "canvas"
                  ? "bg-background text-foreground shadow-sm font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5 text-purple-500" />
              <span>Visuaalinen Kaavio</span>
            </button>
            <button
              onClick={() => setActiveTab("schema")}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-md transition-all ${
                activeTab === "schema"
                  ? "bg-background text-foreground shadow-sm font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Database className="h-3.5 w-3.5 text-purple-500" />
              <span>Tietokantamalli (Gate 1)</span>
            </button>
            <button
              onClick={() => setActiveTab("api")}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-md transition-all ${
                activeTab === "api"
                  ? "bg-background text-foreground shadow-sm font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Server className="h-3.5 w-3.5 text-purple-500" />
              <span>API & Actions (Gate 2)</span>
            </button>
            <button
              onClick={() => setActiveTab("ui")}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-md transition-all ${
                activeTab === "ui"
                  ? "bg-background text-foreground shadow-sm font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5 text-purple-500" />
              <span>UI-Komponentit (Gate 3)</span>
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {/* Canvas Export Dialog Button */}
          <Button
            onClick={() => setIsExportModalOpen(true)}
            variant="outline"
            size="sm"
            className="border-purple-500/30 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 font-medium"
          >
            <Download className="mr-1.5 h-4 w-4 text-purple-500" />
            Vie Kaavio
          </Button>

          {/* Quality & Security Suite Buttons */}
          <Button
            onClick={triggerSecurityCheck}
            variant="outline"
            size="sm"
            className="border-purple-500/30 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 font-medium"
          >
            <ShieldCheck className="mr-1.5 h-4 w-4 text-purple-500" />
            Security Check
          </Button>

          <Button
            onClick={triggerOptimizationCheck}
            variant="outline"
            size="sm"
            className="border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 font-medium"
          >
            <Zap className="mr-1.5 h-4 w-4 text-amber-500" />
            Optimize Code
          </Button>

          {/* Tech Stack & .env guidance button */}
          <Button
            onClick={() => setIsEnvDialogOpen(true)}
            variant="outline"
            size="sm"
            className="border-purple-500/30 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 font-medium"
          >
            <Key className="mr-1.5 h-4 w-4 text-purple-500" />
            {techProfile?.tierLabel ? `${techProfile.tierLabel.split(" ")[0]} Avaimet & .env` : "Avaimet & .env"}
          </Button>

          {currentProjectId ? (
            <Button onClick={handleSaveToDb} disabled={isPending} size="sm">
              {isPending ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : savedSuccess ? (
                <Check className="mr-1.5 h-4 w-4 text-green-400" />
              ) : (
                <Save className="mr-1.5 h-4 w-4" />
              )}
              {savedSuccess ? "Tallennettu!" : "Tallenna muutokset"}
            </Button>
          ) : (
            <Button
              onClick={handleCreateAndSaveProject}
              disabled={isPending}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white font-medium"
            >
              {isPending ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : savedSuccess ? (
                <Check className="mr-1.5 h-4 w-4 text-green-400" />
              ) : (
                <Save className="mr-1.5 h-4 w-4" />
              )}
              {savedSuccess ? "Tallennettu!" : "Tallenna Projekti"}
            </Button>
          )}
        </div>
      </header>

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
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3 p-3.5 bg-gradient-to-r from-purple-500/10 via-background to-emerald-500/10 border border-purple-500/30 rounded-xl shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold flex-none">
                      <Check className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                        <span>Arkkitehtuurikaavio valmis!</span>
                        <span className="text-xs font-normal text-muted-foreground">({nodes.length} komponenttia, {edges.length} yhteyttä)</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Järjestelmäkerrokset ja rajapinnat mallinnettu. Voit tutkia solmuja tai siirtyä seuraavaan vaiheeseen.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        setActiveTab("schema");
                        setShowArchCompleteBanner(false);
                      }}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs h-8 shadow-sm"
                    >
                      <Database className="mr-1.5 h-3.5 w-3.5" />
                      Luo Tietokantamalli (Gate 1) &rarr;
                    </Button>
                    <button
                      type="button"
                      onClick={() => setShowArchCompleteBanner(false)}
                      className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted"
                      title="Sulje ilmoitus"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
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
                {isGeneratingArch && (
                  <div className="absolute inset-0 z-20 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 transition-all duration-300 rounded-lg">
                    <div className="max-w-md w-full bg-card border border-purple-500/40 rounded-2xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                          <Bot className="h-5 w-5 animate-pulse" />
                        </div>
                        <div>
                          <h3 className="font-bold text-base text-foreground">Tekoäly-arkkitehti työskentelee</h3>
                          <p className="text-xs text-muted-foreground">Muodostetaan 4-tasoista järjestelmärakennetta...</p>
                        </div>
                      </div>

                      <div className="space-y-3 pt-1">
                        <div className="flex items-center space-x-3 text-xs">
                          {archGenStep > 1 ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-none" />
                          ) : archGenStep === 1 ? (
                            <Loader2 className="h-4 w-4 text-purple-500 animate-spin flex-none" />
                          ) : (
                            <Circle className="h-4 w-4 text-muted-foreground/40 flex-none" />
                          )}
                          <span className={archGenStep === 1 ? "font-semibold text-foreground" : "text-muted-foreground"}>
                            1. Puretaan vaatimusmäärittely ja tunnistetaan integraatiot
                          </span>
                        </div>

                        <div className="flex items-center space-x-3 text-xs">
                          {archGenStep > 2 ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-none" />
                          ) : archGenStep === 2 ? (
                            <Loader2 className="h-4 w-4 text-purple-500 animate-spin flex-none" />
                          ) : (
                            <Circle className="h-4 w-4 text-muted-foreground/40 flex-none" />
                          )}
                          <span className={archGenStep === 2 ? "font-semibold text-foreground" : "text-muted-foreground"}>
                            2. Muotoillaan 4-kerroksinen arkkitehtuuri (Client, API, Services, DB)
                          </span>
                        </div>

                        <div className="flex items-center space-x-3 text-xs">
                          {archGenStep >= 3 ? (
                            <Loader2 className="h-4 w-4 text-purple-500 animate-spin flex-none" />
                          ) : (
                            <Circle className="h-4 w-4 text-muted-foreground/40 flex-none" />
                          )}
                          <span className={archGenStep === 3 ? "font-semibold text-foreground" : "text-muted-foreground"}>
                            3. Sijoitetaan solmut ja kytketään tietovirrat
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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

      {/* Visual Audit Report Scorecard Modal */}
      <AuditModal
        report={auditReport}
        open={isAuditModalOpen}
        onOpenChange={setIsAuditModalOpen}
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
