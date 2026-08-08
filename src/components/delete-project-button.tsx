"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { deleteProject } from "@/app/actions/project";
import { Trash2, Loader2 } from "lucide-react";

interface DeleteProjectButtonProps {
  projectId: string;
  projectName?: string;
}

export function DeleteProjectButton({ projectId, projectName }: DeleteProjectButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = () => {
    startTransition(async () => {
      await deleteProject(projectId);
      router.push("/");
    });
  };

  if (showConfirm) {
    return (
      <div className="flex items-center space-x-2 bg-destructive/10 p-1.5 rounded-lg border border-destructive/20 text-xs">
        <span className="text-destructive font-medium px-1">
          Poistetaanko {projectName ? `"${projectName}"` : "projekti"}?
        </span>
        <Button
          variant="destructive"
          size="xs"
          onClick={handleDelete}
          disabled={isPending}
        >
          {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Kyllä, poista"}
        </Button>
        <Button
          variant="ghost"
          size="xs"
          onClick={() => setShowConfirm(false)}
          disabled={isPending}
        >
          Peruuta
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={() => setShowConfirm(true)}
    >
      <Trash2 className="mr-1.5 h-4 w-4" />
      Poista projekti
    </Button>
  );
}
