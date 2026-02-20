import { PDFDocument } from "pdf-lib";

const PAGE_SIZES = {
  A4: { width: 595.28, height: 841.89 },
  Letter: { width: 612, height: 792 },
} as const;

export async function generateSinglePagePdf(
  imageDataUrl: string,
  pageSize: "A4" | "Letter"
): Promise<Blob> {
  const pdfDoc = await PDFDocument.create();
  const { width, height } = PAGE_SIZES[pageSize];
  const page = pdfDoc.addPage([width, height]);

  // Convert data URL to bytes
  const base64 = imageDataUrl.split(",")[1];
  if (!base64) throw new Error("Invalid image data URL");
  const imageBytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

  const image = await pdfDoc.embedPng(imageBytes);

  // Scale image to fit with margins (0.5 inch = 36pt)
  const margin = 36;
  const maxW = width - 2 * margin;
  const maxH = height - 2 * margin;
  const scale = Math.min(maxW / image.width, maxH / image.height);
  const drawW = image.width * scale;
  const drawH = image.height * scale;
  const x = (width - drawW) / 2;
  const y = (height - drawH) / 2;

  page.drawImage(image, { x, y, width: drawW, height: drawH });

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
}
