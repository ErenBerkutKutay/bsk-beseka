import fs from "fs";
import path from "path";
import type { jsPDF } from "jspdf";

export const TURKISH_PDF_FONT = "DejaVuSans";

let regularFontBase64: string | undefined;
let boldFontBase64: string | undefined;

function readFontBase64(filename: string): string {
  const fontPath = path.join(process.cwd(), "node_modules/dejavu-fonts-ttf/ttf", filename);
  return fs.readFileSync(fontPath).toString("base64");
}

function getRegularFontBase64() {
  regularFontBase64 ??= readFontBase64("DejaVuSans.ttf");
  return regularFontBase64;
}

function getBoldFontBase64() {
  boldFontBase64 ??= readFontBase64("DejaVuSans-Bold.ttf");
  return boldFontBase64;
}

export function registerTurkishPdfFont(doc: jsPDF) {
  doc.addFileToVFS("DejaVuSans.ttf", getRegularFontBase64());
  doc.addFileToVFS("DejaVuSans-Bold.ttf", getBoldFontBase64());
  doc.addFont("DejaVuSans.ttf", TURKISH_PDF_FONT, "normal");
  doc.addFont("DejaVuSans-Bold.ttf", TURKISH_PDF_FONT, "bold");
  doc.setFont(TURKISH_PDF_FONT, "normal");
}

export const turkishPdfTableFont = {
  font: TURKISH_PDF_FONT,
  fontStyle: "normal" as const,
};
