import { describe, it, expect, vi } from "vitest";

vi.mock("pdf-parse", () => {
  class MockPDFParse {
    async getText() {
      return { text: "Mocked parsed PDF text content" };
    }
    async destroy() {}
  }
  return {
    PDFParse: MockPDFParse,
  };
});

import { parseUploadedFile } from "@/app/actions/file-parser";

describe("parseUploadedFile", () => {
  it("throws an error when no file is present in formData", async () => {
    const formData = new FormData();
    await expect(parseUploadedFile(formData)).rejects.toThrow("No file provided.");
  });

  it("successfully parses .txt files", async () => {
    const content = "Feature requirements: User auth and payment gateway";
    const file = new File([content], "specs.txt", { type: "text/plain" });
    const formData = new FormData();
    formData.append("file", file);

    const result = await parseUploadedFile(formData);
    expect(result.fileName).toBe("specs.txt");
    expect(result.text).toBe(content);
  });

  it("successfully parses .md files", async () => {
    const content = "# System Design\n\n- Tier 1: Next.js\n- Tier 2: Prisma";
    const file = new File([content], "README.md", { type: "text/markdown" });
    const formData = new FormData();
    formData.append("file", file);

    const result = await parseUploadedFile(formData);
    expect(result.fileName).toBe("README.md");
    expect(result.text).toBe(content);
  });

  it("successfully parses .pdf files using PDFParse", async () => {
    const file = new File(["dummy binary pdf"], "specification.pdf", { type: "application/pdf" });
    const formData = new FormData();
    formData.append("file", file);

    const result = await parseUploadedFile(formData);
    expect(result.fileName).toBe("specification.pdf");
    expect(result.text).toBe("Mocked parsed PDF text content");
  });

  it("throws an error for unsupported file formats (e.g. .png, .exe)", async () => {
    const file = new File(["fake binary"], "image.png", { type: "image/png" });
    const formData = new FormData();
    formData.append("file", file);

    await expect(parseUploadedFile(formData)).rejects.toThrow(
      "Tiedostomuotoa ei tueta. Käytä .pdf, .txt tai .md -tiedostoa."
    );
  });
});
