/**
 * pdf-generator.service.ts
 *
 * Generates a PDF interview report from PdfReportPayload.
 *
 * PDF encoding notes:
 * - PDFKit uses FlateDecode (zlib/deflate) for stream compression automatically.
 * - Text is encoded via built-in font metrics; for non-Latin characters use
 *   registerFont() with a TTF that has a ToUnicode CMap.
 * - Images are embedded via DCTDecode (JPEG) or FlateDecode (PNG).
 * - All stream filters are applied by PDFKit internally — no manual xref needed.
 */

import PDFDocument from 'pdfkit';
import type { PdfReportPayload } from './pdf-report.service.js';

// ─── Colour palette ───────────────────────────────────────────────────────────

const C = {
  bg:        '#050a14',
  surface:   '#0f172a',
  border:    '#1e293b',
  text:      '#f1f5f9',
  muted:     '#64748b',
  accent:    '#6366f1',
  accentAlt: '#3b82f6',
  green:     '#34d399',
  amber:     '#f59e0b',
  white:     '#ffffff',
} as const;

// ─── Layout constants ─────────────────────────────────────────────────────────

const PAGE_W   = 595.28;   // A4 width  in pt
const PAGE_H   = 841.89;   // A4 height in pt
const MARGIN   = 48;
const COL_W    = PAGE_W - MARGIN * 2;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function fillRect(
  doc: PDFKit.PDFDocument,
  x: number, y: number, w: number, h: number,
  color: string,
): void {
  doc.save().rect(x, y, w, h).fillColor(hexToRgb(color)).fill().restore();
}

function sectionTitle(doc: PDFKit.PDFDocument, title: string, y: number): number {
  fillRect(doc, MARGIN, y, COL_W, 28, C.surface);
  doc
    .fontSize(10)
    .fillColor(hexToRgb(C.accent))
    .font('Helvetica-Bold')
    .text(title.toUpperCase(), MARGIN + 12, y + 9, { width: COL_W - 24 });
  return y + 28 + 10;
}

function bulletList(
  doc: PDFKit.PDFDocument,
  items: string[],
  y: number,
  color: string = C.text,
): number {
  let cy = y;
  for (const item of items) {
    doc
      .fontSize(10)
      .fillColor(hexToRgb(C.accent))
      .font('Helvetica-Bold')
      .text('·', MARGIN + 8, cy)
      .fillColor(hexToRgb(color))
      .font('Helvetica')
      .text(item, MARGIN + 20, cy, { width: COL_W - 28 });
    cy += doc.heightOfString(item, { width: COL_W - 28 }) + 6;
  }
  return cy + 4;
}

function divider(doc: PDFKit.PDFDocument, y: number): number {
  doc.save().moveTo(MARGIN, y).lineTo(PAGE_W - MARGIN, y)
    .strokeColor(hexToRgb(C.border)).lineWidth(1).stroke().restore();
  return y + 16;
}

function ensurePage(doc: PDFKit.PDFDocument, y: number, needed = 60): number {
  if (y + needed > PAGE_H - MARGIN) {
    doc.addPage();
    return MARGIN + 16;
  }
  return y;
}

// ─── Page 1 — Session overview ────────────────────────────────────────────────

function renderCover(doc: PDFKit.PDFDocument, payload: PdfReportPayload): void {
  const { sessionMetadata: m, interviewFeedback: f } = payload;

  // Background
  fillRect(doc, 0, 0, PAGE_W, PAGE_H, C.bg);

  // Header band
  fillRect(doc, 0, 0, PAGE_W, 72, C.surface);
  doc
    .fontSize(18).font('Helvetica-Bold').fillColor(hexToRgb(C.white))
    .text('Interview Practice Report', MARGIN, 24, { width: COL_W });
  doc
    .fontSize(10).font('Helvetica').fillColor(hexToRgb(C.muted))
    .text(`${m.role}  ·  ${m.level}  ·  ${m.persona}  ·  ${m.date}`, MARGIN, 46);

  // Overall summary box
  let y = 100;
  fillRect(doc, MARGIN, y, COL_W, 2, C.accent);
  y += 10;
  doc
    .fontSize(13).font('Helvetica-Bold').fillColor(hexToRgb(C.text))
    .text(f.overallSummary, MARGIN, y, { width: COL_W });
  y += doc.heightOfString(f.overallSummary, { width: COL_W }) + 24;

  // Recruiter perspective
  y = sectionTitle(doc, 'Recruiter Perspective', y);
  doc
    .fontSize(10).font('Helvetica').fillColor(hexToRgb(C.text))
    .text(f.recruiterPerspective, MARGIN + 12, y, { width: COL_W - 24, lineGap: 3 });
  y += doc.heightOfString(f.recruiterPerspective, { width: COL_W - 24 }) + 20;

  // Two columns: strengths + improve
  y = divider(doc, y);
  const halfW = (COL_W - 16) / 2;

  doc.fontSize(10).font('Helvetica-Bold').fillColor(hexToRgb(C.green))
    .text('Strongest signals', MARGIN, y);
  doc.fontSize(10).font('Helvetica-Bold').fillColor(hexToRgb(C.amber))
    .text('What to strengthen', MARGIN + halfW + 16, y);
  y += 18;

  const strengthLines = f.topStrengths.map((s: string) => `· ${s}`).join('\n');
  const improveLines  = f.areasToStrengthen.map((s: string) => `· ${s}`).join('\n');

  doc.fontSize(10).font('Helvetica').fillColor(hexToRgb(C.text))
    .text(strengthLines, MARGIN, y, { width: halfW, lineGap: 4 });
  doc.fontSize(10).font('Helvetica').fillColor(hexToRgb(C.text))
    .text(improveLines, MARGIN + halfW + 16, y, { width: halfW, lineGap: 4 });
}

// ─── Page 2 — Next session focus + Coach modules ──────────────────────────────

function renderNextSteps(doc: PDFKit.PDFDocument, payload: PdfReportPayload): void {
  doc.addPage();
  fillRect(doc, 0, 0, PAGE_W, PAGE_H, C.bg);

  let y = MARGIN;

  // Next interview focus
  y = sectionTitle(doc, 'For Your Next Interview', y);
  y = bulletList(doc, payload.interviewFeedback.nextInterviewFocus, y);
  y = divider(doc, y + 8);

  // Coach modules
  y = ensurePage(doc, y, 80);
  y = sectionTitle(doc, 'Recommended Training Modules', y);
  y = bulletList(doc, payload.coachHandoff.recommendedCoachModules, y, C.accent);
  y = divider(doc, y + 8);

  // Footer note
  y = ensurePage(doc, y, 40);
  doc
    .fontSize(9).font('Helvetica').fillColor(hexToRgb(C.muted))
    .text(
      'This report evaluates interview communication and answer quality only. ' +
      'It is not a hiring assessment or suitability judgement.',
      MARGIN, y, { width: COL_W, lineGap: 2 },
    );
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generates a PDF buffer from the interview report payload.
 *
 * Encoding path:
 *   Text objects  → WinAnsiEncoding (PDFKit default, Latin-1 safe)
 *   Stream data   → FlateDecode (zlib, applied automatically by PDFKit)
 *   Output        → Buffer via collect-stream pattern
 */
export function generateInterviewReportPdf(payload: PdfReportPayload): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 0,
      compress: true,   // enables FlateDecode on all streams
      info: {
        Title:   `Interview Report — ${payload.sessionMetadata.role}`,
        Author:  'MultivoHub AI',
        Subject: 'AI Interview Practice Report',
        Creator: 'MultivoHub',
      },
    });

    const chunks: Buffer[] = [];
    doc.on('data',  (chunk: Buffer) => chunks.push(chunk));
    doc.on('end',   () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    renderCover(doc, payload);
    renderNextSteps(doc, payload);

    doc.end();
  });
}

// ─── Class wrapper for orchestrator injection ─────────────────────────────────

export class PdfGeneratorService {
  generateReportPdf(payload: PdfReportPayload): Promise<Buffer> {
    return generateInterviewReportPdf(payload);
  }
}
