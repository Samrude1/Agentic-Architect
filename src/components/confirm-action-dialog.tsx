"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Info, Loader2 } from "lucide-react";

interface ConfirmActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive" | "warning" | "purple";
  icon?: React.ReactNode;
  isLoading?: boolean;
  consequences?: string[];
  onConfirm: () => void | Promise<void>;
}

export function ConfirmActionDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Kyllä, suorita",
  cancelLabel = "Peruuta",
  variant = "default",
  icon,
  isLoading = false,
  consequences,
  onConfirm,
}: ConfirmActionDialogProps) {
  const getButtonClass = () => {
    switch (variant) {
      case "destructive":
        return "bg-red-600 hover:bg-red-700 text-white";
      case "warning":
        return "bg-amber-600 hover:bg-amber-700 text-white";
      case "purple":
        return "bg-purple-600 hover:bg-purple-700 text-white";
      default:
        return "bg-primary text-primary-foreground hover:bg-primary/90";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-6 bg-card border-border shadow-2xl rounded-2xl">
        <DialogHeader className="gap-3">
          <div className="flex items-center space-x-3">
            <div
              className={`p-2.5 rounded-xl flex-none ${
                variant === "destructive"
                  ? "bg-red-500/10 text-red-500"
                  : variant === "warning"
                  ? "bg-amber-500/10 text-amber-500"
                  : variant === "purple"
                  ? "bg-purple-500/10 text-purple-500"
                  : "bg-primary/10 text-primary"
              }`}
            >
              {icon || (variant === "warning" ? <AlertTriangle className="h-5 w-5" /> : <Info className="h-5 w-5" />)}
            </div>
            <div>
              <DialogTitle className="text-lg font-bold tracking-tight">{title}</DialogTitle>
              <div className="text-xs text-muted-foreground font-normal mt-0.5">
                Vahvistus vaaditaan ennen suoritusta
              </div>
            </div>
          </div>
          <DialogDescription className="text-sm text-foreground/80 leading-relaxed mt-2">
            {description}
          </DialogDescription>
        </DialogHeader>

        {consequences && consequences.length > 0 && (
          <div className="bg-muted/40 rounded-xl p-3 border border-border/40 text-xs space-y-1.5 mt-1">
            <div className="font-semibold text-foreground flex items-center space-x-1.5">
              <span>Huomioitavaa:</span>
            </div>
            <ul className="space-y-1 text-muted-foreground pl-4 list-disc">
              {consequences.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>
        )}

        <DialogFooter className="mt-4 gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="flex-1 sm:flex-initial"
          >
            {cancelLabel}
          </Button>
          <Button
            onClick={async () => {
              await onConfirm();
            }}
            disabled={isLoading}
            className={`flex-1 sm:flex-initial font-medium ${getButtonClass()}`}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Suoritetaan...
              </>
            ) : (
              confirmLabel
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
