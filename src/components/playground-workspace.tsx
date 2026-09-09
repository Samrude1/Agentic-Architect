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
  Folder,
  HardDrive,
  AlertCircle,
  Server,
  Zap,
  Key,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArchitectureCanvas } from "@/components/architecture-canvas";
import { ChatSidebar } from "@/components/chat-sidebar";
import { NodeInspector } from "@/components/node-inspector";
import { CodeViewer } from "@/components/code-viewer";
import { ConfirmActionDialog } from "@/components/confirm-action-dialog";
import { AuditModal } from "@/components/audit-modal";
import { EnvDialog } from "@/components/env-dialog";
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
  const [activeTab, setActiveTab] = useState<"canvas" | "schema" | "api">("canvas");
  const [targetPath, setTargetPath] = useState<string>(initialTargetPath);
  const [prismaSchema, setPrismaSchema] = useState<string>(initialPrismaSchema);
  const [apiCode, setApiCode] = useState<string>(initialApiCode);
  const [isGeneratingSchema, setIsGeneratingSchema] = useState(false);
  const [isGeneratingApi, setIsGeneratingApi] = useState(false);
  const [isWritingToDisk, setIsWritingToDisk] = useState(false);
  const [diskMessage, setDiskMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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
      generateRealArchitecture(initialPrompt)
        .then((data) => {
          if (data.nodes && data.nodes.length > 0) {
            setNodes(data.nodes);
            setEdges(data.edges);
          }
        })
        .catch((err) => {
          console.error("Failed to generate initial architecture diagram:", err);
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

  return (
    <div className="h-screen flex flex-col bg-muted/20">
      {/* Top bar */}
      <header className="h-14 border-b bg-background px-6 flex items-center justify-between flex-none">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon-sm"
            render={<Link href={currentProjectId ? `/projects/${currentProjectId}` : "/"} />}
            nativeButton={false}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            <h1 className="font-bold text-lg tracking-tight">
              {currentProjectName ? `Ajatushautomo: ${currentProjectName}` : "Arkkitehtuurin Hiekkalaatikko"}
            </h1>
          </div>

          {/* View Mode Toggle Tabs */}
          <div className="ml-4 flex items-center bg-muted/50 p-1 rounded-lg border border-border/50 text-xs font-medium">
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
          </div>
        </div>

        <div className="flex items-center space-x-2">
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
              className={`h-full flex flex-col transition-all duration-300 ${
                selectedNode ? "lg:col-span-6" : "lg:col-span-8"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base font-semibold text-foreground">Visuaalinen Kaavio</h2>
                <span className="text-sm text-muted-foreground font-medium">
                  {nodes.length} komponenttia kaaviossa{" "}
                  {selectedNode ? "• Valittuna: " + ((selectedNode.data?.label as string) || selectedNode.id) : ""}
                </span>
              </div>
              <div className="flex-1 min-h-0">
                <ArchitectureCanvas
                  nodes={nodes}
                  edges={edges}
                  selectedNodeId={selectedNode?.id}
                  onNodesChange={setNodes}
                  onEdgesChange={setEdges}
                  onNodeSelect={setSelectedNode}
                  hideHeader={true}
                />
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
            <div className="bg-background rounded-lg border p-4 shadow-sm space-y-3 flex-none">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Folder className="h-5 w-5 text-purple-500" />
                  <h3 className="font-semibold text-sm">Projektin Kotikansio (Project Homebase Directory)</h3>
                </div>
                <span className="text-xs text-muted-foreground">Koodikannan juuripolku levyllä</span>
              </div>

              <div className="flex items-center space-x-2">
                <Input
                  value={targetPath}
                  onChange={(e) => setTargetPath(e.target.value)}
                  placeholder="Esim. C:\Users\samru\DEVELOPER\PROJECTS\my-app"
                  className="font-mono text-xs"
                />
                <Button variant="outline" size="sm" onClick={handleSaveTargetPath}>
                  Aseta polku
                </Button>
              </div>
            </div>

            {/* Code Generator & Viewer Card - Gate 1 or Gate 2 */}
            {activeTab === "schema" ? (
              <div className="flex-1 min-h-0 flex flex-col bg-background border rounded-lg p-4 shadow-sm space-y-4">
                <div className="flex items-center justify-between flex-none">
                  <div>
                    <h3 className="font-bold text-base flex items-center space-x-2">
                      <Database className="h-5 w-5 text-purple-500" />
                      <span>Data Gate 1: Prisma Database Schema</span>
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Generoi tuotantovalmis Prisma-tietokantamalli kaaviossa määriteltyjen komponenttien pohjalta (Standard English).
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={triggerGenerateSchemaConfirmation}
                      disabled={isGeneratingSchema}
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700 text-white font-medium"
                    >
                      {isGeneratingSchema ? (
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="mr-1.5 h-4 w-4" />
                      )}
                      {prismaSchema ? "Päivitä kaavio AI:lla" : "Generoi tietokantamalli AI:lla"}
                    </Button>

                    {prismaSchema && (
                      <Button
                        onClick={triggerWritePrismaToDiskConfirmation}
                        disabled={isWritingToDisk}
                        variant="outline"
                        size="sm"
                        className="border-green-500/40 text-green-600 hover:bg-green-500/10 font-medium"
                      >
                        {isWritingToDisk ? (
                          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                        ) : (
                          <HardDrive className="mr-1.5 h-4 w-4 text-green-500" />
                        )}
                        Kirjoita levyarvoon (prisma/schema.prisma)
                      </Button>
                    )}
                  </div>
                </div>

                {/* Lightweight App Database Notice */}
                {techProfile && !techProfile.database.needed && (
                  <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-xs flex items-start space-x-2.5 flex-none">
                    <Sparkles className="h-4 w-4 text-emerald-500 flex-none mt-0.5" />
                    <div className="space-y-0.5">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        Kevyt sovellus ({techProfile.tierLabel}): Erillistä palvelintietokantaa ei tarvita!
                      </span>
                      <p className="text-foreground/80 leading-relaxed">
                        {techProfile.database.reason} Voit käyttää suoraan selaimen LocalStoragea tai siirtyä käyttöliittymäkehitykseen. Voit kuitenkin generoida Prisma-skeeman alla olevasta napista, jos haluat myöhemmin laajentaa sovellusta.
                      </p>
                    </div>
                  </div>
                )}

                {/* Status/Error Messages */}
                {diskMessage && (
                  <div
                    className={`p-3 rounded-md text-xs font-medium flex items-center space-x-2 ${
                      diskMessage.type === "success"
                        ? "bg-green-500/10 text-green-600 border border-green-500/30"
                        : "bg-destructive/10 text-destructive border border-destructive/30"
                    }`}
                  >
                    {diskMessage.type === "success" ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    )}
                    <span>{diskMessage.text}</span>
                  </div>
                )}

                {/* Code Display */}
                <div className="flex-1 min-h-0">
                  {prismaSchema ? (
                    <CodeViewer
                      code={prismaSchema}
                      filename="prisma/schema.prisma"
                      badge="Data Gate 1 • English"
                    />
                  ) : (
                    <div className="h-full border border-dashed rounded-lg flex flex-col items-center justify-center p-8 text-center bg-muted/20 space-y-3">
                      <Database className="h-10 w-10 text-muted-foreground/50" />
                      <div>
                        <h4 className="font-semibold text-sm">Ei vielä generoitua tietokantamallia</h4>
                        <p className="text-xs text-muted-foreground max-w-sm mt-1">
                          Paina &quot;Generoi tietokantamalli AI:lla&quot; -painiketta luodaksesi arkkitehtuurikaaviosi pohjalta tuotantovalmiin Prisma-skeeman.
                        </p>
                      </div>
                      <Button
                        onClick={triggerGenerateSchemaConfirmation}
                        disabled={isGeneratingSchema}
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700 text-white font-medium"
                      >
                        {isGeneratingSchema ? (
                          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="mr-1.5 h-4 w-4" />
                        )}
                        Generoi tietokantamalli AI:lla
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 min-h-0 flex flex-col bg-background border rounded-lg p-4 shadow-sm space-y-4">
                <div className="flex items-center justify-between flex-none">
                  <div>
                    <h3 className="font-bold text-base flex items-center space-x-2">
                      <Server className="h-5 w-5 text-purple-500" />
                      <span>Data Gate 2: API Endpoints & Server Actions</span>
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Generoi tuotantovalmiit Next.js Route Handlerit ja Server Actionit Zod-syötevalidoinnilla (Standard English).
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={triggerGenerateApiConfirmation}
                      disabled={isGeneratingApi}
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700 text-white font-medium"
                    >
                      {isGeneratingApi ? (
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="mr-1.5 h-4 w-4" />
                      )}
                      {apiCode ? "Päivitä API-koodi AI:lla" : "Generoi API-koodi AI:lla"}
                    </Button>

                    {apiCode && (
                      <Button
                        onClick={triggerWriteApiToDiskConfirmation}
                        disabled={isWritingToDisk}
                        variant="outline"
                        size="sm"
                        className="border-green-500/40 text-green-600 hover:bg-green-500/10 font-medium"
                      >
                        {isWritingToDisk ? (
                          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                        ) : (
                          <HardDrive className="mr-1.5 h-4 w-4 text-green-500" />
                        )}
                        Kirjoita levylle (src/app/api/endpoints/route.ts)
                      </Button>
                    )}
                  </div>
                </div>

                {/* Status/Error Messages */}
                {diskMessage && (
                  <div
                    className={`p-3 rounded-md text-xs font-medium flex items-center space-x-2 ${
                      diskMessage.type === "success"
                        ? "bg-green-500/10 text-green-600 border border-green-500/30"
                        : "bg-destructive/10 text-destructive border border-destructive/30"
                    }`}
                  >
                    {diskMessage.type === "success" ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    )}
                    <span>{diskMessage.text}</span>
                  </div>
                )}

                {/* Code Display */}
                <div className="flex-1 min-h-0">
                  {apiCode ? (
                    <CodeViewer
                      code={apiCode}
                      filename="src/app/api/endpoints/route.ts"
                      badge="Data Gate 2 • English"
                    />
                  ) : (
                    <div className="h-full border border-dashed rounded-lg flex flex-col items-center justify-center p-8 text-center bg-muted/20 space-y-3">
                      <Server className="h-10 w-10 text-muted-foreground/50" />
                      <div>
                        <h4 className="font-semibold text-sm">Ei vielä generoituja API-rajapintoja</h4>
                        <p className="text-xs text-muted-foreground max-w-sm mt-1">
                          Paina &quot;Generoi API-koodi AI:lla&quot; -painiketta luodaksesi arkkitehtuurikaaviosi (Layer 1 Gateway & Layer 2 Services) ja tietomallin pohjalta tuotantovalmiit rajapintareitit.
                        </p>
                      </div>
                      <Button
                        onClick={triggerGenerateApiConfirmation}
                        disabled={isGeneratingApi}
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700 text-white font-medium"
                      >
                        {isGeneratingApi ? (
                          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="mr-1.5 h-4 w-4" />
                        )}
                        Generoi API-koodi AI:lla
                      </Button>
                    </div>
                  )}
                </div>
              </div>
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
    </div>
  );
}
