"use client";

import { Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface HomebasePathCardProps {
  targetPath: string;
  setTargetPath: (path: string) => void;
  onSaveTargetPath: () => void;
}

export function HomebasePathCard({
  targetPath,
  setTargetPath,
  onSaveTargetPath,
}: HomebasePathCardProps) {
  return (
    <div className="bg-background rounded-lg border p-4 shadow-sm space-y-3 flex-none">
      <div className="flex flex-wrap items-center justify-between gap-1">
        <div className="flex items-center space-x-2 min-w-0">
          <Folder className="h-4 w-4 text-purple-500 shrink-0" />
          <h3 className="font-semibold text-xs sm:text-sm truncate">
            Projektin Kotikansio <span className="hidden md:inline text-muted-foreground font-normal">(Homebase)</span>
          </h3>
        </div>
        <span className="text-xs text-muted-foreground hidden sm:inline">Koodikannan juuripolku levyllä</span>
      </div>

      <div className="flex items-center space-x-2">
        <Input
          value={targetPath}
          onChange={(e) => setTargetPath(e.target.value)}
          placeholder="Esim. C:\Users\samru\DEVELOPER\PROJECTS\my-app"
          className="font-mono text-xs"
        />
        <Button variant="outline" size="sm" onClick={onSaveTargetPath}>
          Aseta polku
        </Button>
      </div>
    </div>
  );
}
