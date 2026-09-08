import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock Next.js cache revalidation globally in tests
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache: vi.fn((fn) => fn),
}));

// Polyfill DOMMatrix if needed by libraries
if (typeof global !== "undefined" && !(global as any).DOMMatrix) {
  (global as any).DOMMatrix = class DOMMatrix {};
}
if (typeof window !== "undefined" && !(window as any).DOMMatrix) {
  (window as any).DOMMatrix = (global as any).DOMMatrix;
}
