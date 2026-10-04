import { describe, it, expect } from "vitest";
import { computeLineDiff } from "@/lib/diff";

describe("computeLineDiff", () => {
  it("treats null originalContent as completely new file with additions", () => {
    const newContent = "model User {\n  id String @id\n}";
    const diff = computeLineDiff(null, newContent);

    expect(diff.isNewFile).toBe(true);
    expect(diff.isIdentical).toBe(false);
    expect(diff.additions).toBe(3);
    expect(diff.deletions).toBe(0);
    expect(diff.lines.every((l) => l.type === "added")).toBe(true);
  });

  it("identifies identical content correctly", () => {
    const content = "model User {\n  id String @id\n}";
    const diff = computeLineDiff(content, content);

    expect(diff.isNewFile).toBe(false);
    expect(diff.isIdentical).toBe(true);
    expect(diff.additions).toBe(0);
    expect(diff.deletions).toBe(0);
    expect(diff.unchanged).toBe(3);
  });

  it("handles line endings differences gracefully (CRLF vs LF)", () => {
    const orig = "line1\r\nline2\r\nline3";
    const next = "line1\nline2\nline3";
    const diff = computeLineDiff(orig, next);

    expect(diff.isIdentical).toBe(true);
  });

  it("calculates additions, deletions, and unchanged lines accurately", () => {
    const orig = "const a = 1;\nconst b = 2;\nconst c = 3;";
    const next = "const a = 1;\nconst b = 99;\nconst c = 3;\nconst d = 4;";
    const diff = computeLineDiff(orig, next);

    expect(diff.isNewFile).toBe(false);
    expect(diff.isIdentical).toBe(false);
    expect(diff.additions).toBe(2); // b=99 and d=4
    expect(diff.deletions).toBe(1); // b=2
    expect(diff.unchanged).toBe(2); // a=1 and c=3

    const addedLines = diff.lines.filter((l) => l.type === "added");
    expect(addedLines.map((l) => l.text)).toContain("const b = 99;");
    expect(addedLines.map((l) => l.text)).toContain("const d = 4;");

    const removedLines = diff.lines.filter((l) => l.type === "removed");
    expect(removedLines.map((l) => l.text)).toContain("const b = 2;");
  });
});
