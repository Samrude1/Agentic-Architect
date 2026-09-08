"use server";

import { PDFParse } from "pdf-parse";

export async function parseUploadedFile(formData: FormData): Promise<{ text: string; fileName: string }> {
  const file = formData.get("file") as File | null;
  if (!file) {
    throw new Error("No file provided.");
  }

  const fileName = file.name;
  const extension = fileName.split(".").pop()?.toLowerCase();

  const buffer = Buffer.from(await file.arrayBuffer());

  if (extension === "pdf") {
    try {
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      await parser.destroy();
      return { text: result.text || "", fileName };
    } catch (error) {
      console.error("PDF parsing error:", error);
      throw new Error("PDF-tiedoston lukeminen epäonnistui.");
    }
  } else if (extension === "txt" || extension === "md") {
    const text = buffer.toString("utf-8");
    return { text, fileName };
  } else {
    throw new Error("Tiedostomuotoa ei tueta. Käytä .pdf, .txt tai .md -tiedostoa.");
  }
}
