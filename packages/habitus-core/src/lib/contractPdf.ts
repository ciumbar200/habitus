import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

export type ContractPdfParty = {
  label: string;
  name: string;
  acceptedAt?: string | null;
};

export type ContractPdfInput = {
  type: "habitacion" | "piso";
  reference: string;
  title: string;
  propertyName: string;
  propertyLocation?: string | null;
  parties: ContractPdfParty[];
  monthlyRent: number;
  depositLabel: string;
  startDate: string;
  endDate?: string | null;
  specialConditions?: string | null;
  generatedAt?: string;
  templateVersion?: string;
  jurisdiction?: string;
};

export const CONTRACT_PDF_TEMPLATE_VERSION = "moon-contract-template-es-2026-06";
export const CONTRACT_PDF_LEGAL_NOTICE =
  "Plantilla operativa generada por moon. Debe revisarse legalmente antes de usarse como contrato definitivo.";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 56;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const LINE_HEIGHT = 15;

function formatDate(date: string | null | undefined): string {
  if (!date) return "Indefinido";
  return new Intl.DateTimeFormat("es-ES").format(new Date(date));
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

function normalizeText(text: string): string {
  return text
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/€/g, "EUR")
    .replace(/→/g, "->")
    .replace(/\s+/g, " ")
    .trim();
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = normalizeText(text).split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      current = next;
      continue;
    }
    if (current) lines.push(current);
    current = word;
  }

  if (current) lines.push(current);
  return lines;
}

function addPage(doc: PDFDocument): PDFPage {
  return doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
}

function drawFooter(page: PDFPage, font: PDFFont, pageNumber: number) {
  page.drawText(`moon shared living · Contrato generado digitalmente · Pagina ${pageNumber}`, {
    x: MARGIN,
    y: 28,
    size: 8,
    font,
    color: rgb(0.45, 0.43, 0.39),
  });
}

export async function generateContractPdf(input: ContractPdfInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(normalizeText(input.title));
  doc.setSubject("Contrato operativo moon shared living");
  doc.setCreator(": moon shared living");
  doc.setProducer(`moon contract generator ${input.templateVersion ?? CONTRACT_PDF_TEMPLATE_VERSION}`);
  doc.setCreationDate(new Date(input.generatedAt ?? new Date().toISOString()));

  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  let page = addPage(doc);
  let pageNumber = 1;
  let y = PAGE_HEIGHT - MARGIN;

  const ensureSpace = (height: number) => {
    if (y - height > 48) return;
    drawFooter(page, regular, pageNumber);
    page = addPage(doc);
    pageNumber += 1;
    y = PAGE_HEIGHT - MARGIN;
  };

  const heading = (text: string) => {
    ensureSpace(32);
    page.drawText(normalizeText(text), {
      x: MARGIN,
      y,
      size: 13,
      font: bold,
      color: rgb(0.05, 0.06, 0.06),
    });
    y -= 22;
  };

  const paragraph = (text: string, size = 10) => {
    const lines = wrapText(text, regular, size, CONTENT_WIDTH);
    ensureSpace(lines.length * LINE_HEIGHT + 6);
    for (const line of lines) {
      page.drawText(line, {
        x: MARGIN,
        y,
        size,
        font: regular,
        color: rgb(0.16, 0.15, 0.14),
      });
      y -= LINE_HEIGHT;
    }
    y -= 6;
  };

  const keyValue = (label: string, value: string) => {
    ensureSpace(18);
    page.drawText(`${normalizeText(label)}:`, {
      x: MARGIN,
      y,
      size: 10,
      font: bold,
      color: rgb(0.12, 0.11, 0.1),
    });
    page.drawText(normalizeText(value), {
      x: MARGIN + 130,
      y,
      size: 10,
      font: regular,
      color: rgb(0.16, 0.15, 0.14),
    });
    y -= 16;
  };

  page.drawText(": moon", {
    x: MARGIN,
    y,
    size: 22,
    font: bold,
    color: rgb(0.04, 0.42, 0.39),
  });
  y -= 28;
  page.drawText(normalizeText(input.title), {
    x: MARGIN,
    y,
    size: 20,
    font: bold,
    color: rgb(0.05, 0.06, 0.06),
  });
  y -= 24;
  paragraph(
    `Referencia ${input.reference}. Documento generado el ${formatDate(input.generatedAt ?? new Date().toISOString())}. Plantilla ${input.templateVersion ?? CONTRACT_PDF_TEMPLATE_VERSION}. Jurisdiccion prevista: ${input.jurisdiction ?? "Espana"}.`,
    9,
  );

  heading("1. Partes");
  for (const party of input.parties) {
    keyValue(party.label, party.name || "Pendiente de identificar");
  }

  heading("2. Vivienda");
  keyValue(input.type === "habitacion" ? "Habitacion" : "Piso", input.propertyName);
  if (input.propertyLocation) keyValue("Direccion", input.propertyLocation);

  heading("3. Terminos economicos");
  keyValue("Renta mensual", formatCurrency(input.monthlyRent));
  keyValue("Fianza", input.depositLabel);
  keyValue("Fecha de inicio", formatDate(input.startDate));
  keyValue("Fecha de fin", formatDate(input.endDate));

  heading("4. Clausulas basicas");
  [
    "Las partes declaran que los datos indicados son correctos y que este documento recoge los terminos economicos principales del acuerdo.",
    "La renta mensual debera abonarse en los plazos y por los medios acordados entre las partes fuera de esta plantilla.",
    "La fianza respondera de los importes legalmente aplicables, desperfectos imputables y obligaciones pendientes al final de la estancia.",
    "La convivencia se regira por las normas acordadas por las partes y por la normativa aplicable en la ciudad donde se encuentre la vivienda.",
    CONTRACT_PDF_LEGAL_NOTICE,
  ].forEach((clause, index) => paragraph(`${index + 1}. ${clause}`));

  if (input.specialConditions) {
    heading("5. Condiciones especiales");
    paragraph(input.specialConditions);
  }

  heading(input.specialConditions ? "6. Aceptacion digital" : "5. Aceptacion digital");
  for (const party of input.parties) {
    keyValue(
      party.label,
      party.acceptedAt ? `${party.name} acepto el ${formatDate(party.acceptedAt)}` : `${party.name || "Parte"} pendiente de firma`,
    );
  }

  drawFooter(page, regular, pageNumber);
  return doc.save();
}

export function downloadPdfBytes(filename: string, bytes: Uint8Array): void {
  if (typeof document === "undefined") return;
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  const blob = new Blob([buffer], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
