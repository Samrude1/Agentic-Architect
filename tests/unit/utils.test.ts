import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn utility", () => {
  it("merges class names correctly", () => {
    const result = cn("text-red-500", "bg-black");
    expect(result).toBe("text-red-500 bg-black");
  });

  it("handles conditional class names and falsy values", () => {
    const isHidden = false;
    const isBold = true;
    const result = cn("base-class", isHidden && "hidden", isBold && "font-bold", null, undefined);
    expect(result).toBe("base-class font-bold");
  });

  it("resolves conflicting Tailwind classes via tailwind-merge", () => {
    const result = cn("p-4", "p-8");
    expect(result).toBe("p-8");
  });
});
