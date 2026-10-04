export interface DiffLine {
  type: "added" | "removed" | "unchanged";
  oldLineNumber?: number;
  newLineNumber?: number;
  text: string;
}

export interface DiffResult {
  isNewFile: boolean;
  isIdentical: boolean;
  additions: number;
  deletions: number;
  unchanged: number;
  lines: DiffLine[];
}

/**
 * Computes a line-by-line diff between original and new file content using LCS.
 */
export function computeLineDiff(
  originalContent: string | null | undefined,
  newContent: string
): DiffResult {
  if (originalContent === null || originalContent === undefined) {
    const newLines = newContent.split("\n");
    return {
      isNewFile: true,
      isIdentical: false,
      additions: newLines.length,
      deletions: 0,
      unchanged: 0,
      lines: newLines.map((text, idx) => ({
        type: "added",
        newLineNumber: idx + 1,
        text,
      })),
    };
  }

  // Normalize CRLF to LF for consistent comparison
  const origNorm = originalContent.replace(/\r\n/g, "\n");
  const newNorm = newContent.replace(/\r\n/g, "\n");

  if (origNorm === newNorm) {
    const lines = origNorm.split("\n");
    return {
      isNewFile: false,
      isIdentical: true,
      additions: 0,
      deletions: 0,
      unchanged: lines.length,
      lines: lines.map((text, idx) => ({
        type: "unchanged",
        oldLineNumber: idx + 1,
        newLineNumber: idx + 1,
        text,
      })),
    };
  }

  const origLines = origNorm.split("\n");
  const newLines = newNorm.split("\n");

  const m = origLines.length;
  const n = newLines.length;

  // Build LCS matrix
  // For safety with large files, cap matrix allocation
  if (m * n > 250000) {
    // Fallback simple line diff for very large inputs
    return fallbackDiff(origLines, newLines);
  }

  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (origLines[i] === newLines[j]) {
        dp[i + 1][j + 1] = dp[i][j] + 1;
      } else {
        dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  // Backtrack to assemble diff
  const diffLines: DiffLine[] = [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && origLines[i - 1] === newLines[j - 1]) {
      diffLines.push({
        type: "unchanged",
        oldLineNumber: i,
        newLineNumber: j,
        text: origLines[i - 1],
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      diffLines.push({
        type: "added",
        newLineNumber: j,
        text: newLines[j - 1],
      });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      diffLines.push({
        type: "removed",
        oldLineNumber: i,
        text: origLines[i - 1],
      });
      i--;
    }
  }

  diffLines.reverse();

  let additions = 0;
  let deletions = 0;
  let unchanged = 0;

  for (const line of diffLines) {
    if (line.type === "added") additions++;
    else if (line.type === "removed") deletions++;
    else unchanged++;
  }

  return {
    isNewFile: false,
    isIdentical: false,
    additions,
    deletions,
    unchanged,
    lines: diffLines,
  };
}

function fallbackDiff(origLines: string[], newLines: string[]): DiffResult {
  const lines: DiffLine[] = [];
  origLines.forEach((text, idx) => {
    lines.push({ type: "removed", oldLineNumber: idx + 1, text });
  });
  newLines.forEach((text, idx) => {
    lines.push({ type: "added", newLineNumber: idx + 1, text });
  });
  return {
    isNewFile: false,
    isIdentical: false,
    additions: newLines.length,
    deletions: origLines.length,
    unchanged: 0,
    lines,
  };
}
