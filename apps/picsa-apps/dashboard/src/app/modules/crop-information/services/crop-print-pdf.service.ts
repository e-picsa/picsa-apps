import { Injectable } from '@angular/core';
import { renderAsync } from 'docx-preview';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Converts generated Word blobs to PDF by rendering the actual docx output
 * (via docx-preview) and printing the rendered pages to PDF.
 *
 * The docx blob remains the single source of truth for formatting - no
 * hand-rebuilt table layout lives here. Libraries are statically imported so
 * Vite pre-bundles them at dev-server start; runtime dynamic imports of these
 * large CJS/UMD bundles trigger Vite "504 Outdated Optimize Dep" responses
 * that fail every file in a bulk export with no actionable error.
 */
@Injectable({ providedIn: 'root' })
export class CropPrintPdfService {
  /**
   * Render a docx blob exactly as Word would display it, then print each
   * rendered page to a portrait A4 PDF. Rejects (rather than hanging) when
   * rendering or canvas capture fails, so bulk exports can record the
   * failure and continue with remaining files.
   */
  public async convertDocxBlobToPdf(docxBlob: Blob): Promise<Blob> {
    const container = document.createElement('div');
    // A4 at 96dpi with small side padding; kept offscreen so export never flashes on screen
    container.style.cssText = 'position:fixed;left:-10000px;top:0;width:794px;background:#ffffff;overflow:hidden;';
    document.body.appendChild(container);
    try {
      await withTimeout(renderAsync(docxBlob, container, undefined, { breakPages: true }), 60000, 'Word render');

      const pageEls = selectPrintPages(container);
      const pdf = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < pageEls.length; i++) {
        const canvas = await withTimeout(
          html2canvas(pageEls[i], { scale: 2, backgroundColor: '#ffffff', logging: false }),
          60000,
          `Page capture ${i + 1}/${pageEls.length}`,
        );
        const imgData = canvas.toDataURL('image/jpeg', 0.92);
        const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height);
        const width = canvas.width * ratio;
        const height = canvas.height * ratio;
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', (pageWidth - width) / 2, (pageHeight - height) / 2, width, height);
      }
      return pdf.output('blob');
    } finally {
      container.remove();
    }
  }
}

/** Prefer paginated docx sections; fall back to whole-container capture when none exist */
function selectPrintPages(container: HTMLElement): HTMLElement[] {
  const sections = Array.from(container.querySelectorAll<HTMLElement>('.docx-wrapper > section.docx'));
  if (sections.length > 0) return sections;
  const wrapperChildren = Array.from(container.querySelectorAll<HTMLElement>('.docx-wrapper > *'));
  if (wrapperChildren.length > 1) return wrapperChildren;
  return [container];
}

/** Reject with a descriptive error instead of hanging silently on stalled rendering */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}
