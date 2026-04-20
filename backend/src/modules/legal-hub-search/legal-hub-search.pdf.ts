import type { LegalSearchHit } from './legal-hub-search.types.js';

/**
 * Renders a minimal PDF of curated Legal Hub search hits (educational links only).
 * Dynamic import keeps cold-start smaller when PDF is unused.
 */
export async function renderLegalSearchPdfBuffer(params: {
  query: string;
  hits: LegalSearchHit[];
  scopeLabel: string;
  generatedAtIso: string;
}): Promise<Buffer> {
  const PDFDocument = (await import('pdfkit')).default;
  const doc = new PDFDocument({ size: 'A4', margin: 48 });
  const chunks: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => chunks.push(chunk));

  doc.fontSize(16).text('Legal Hub — search export', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(9).fillColor('#555555').text(`Generated: ${params.generatedAtIso}`, { align: 'left' });
  doc.fillColor('#000000');
  doc.moveDown();
  doc.fontSize(10).text(
    'Disclaimer: This PDF lists curated GOV.UK / ACAS / HMRC entry points for self-study. It is not legal advice. Verify current law and figures on official sites.',
    { align: 'left' },
  );
  doc.moveDown();
  doc.fontSize(11).text(`Search query: ${params.query}`, { continued: false });
  doc.fontSize(9).text(`Scope: ${params.scopeLabel}`, { continued: false });
  doc.moveDown();

  if (params.hits.length === 0) {
    doc.fontSize(10).text('No catalogue hits for this query.');
  } else {
    doc.fontSize(12).text('Official sources', { underline: true });
    doc.moveDown(0.4);
    for (const h of params.hits) {
      doc.fontSize(11).fillColor('#1e3a8a').text(h.title, { link: h.url, underline: true });
      doc.fillColor('#000000');
      doc.fontSize(9).text(h.url, { link: h.url });
      doc.fontSize(9).text(`${h.tier} · ${h.snippet}`);
      doc.moveDown(0.6);
    }
  }

  const finished = new Promise<void>((resolve, reject) => {
    doc.once('end', () => resolve());
    doc.once('error', reject);
  });
  doc.end();
  await finished;
  return Buffer.concat(chunks);
}
