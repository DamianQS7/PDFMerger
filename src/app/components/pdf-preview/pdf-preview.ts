import { Component, input, resource } from '@angular/core';
import { PdfFile } from '../../types/pdf-file.interface';
import * as pdfjsLib from 'pdfjs-dist';

@Component({
  selector: 'app-pdf-preview',
  imports: [],
  templateUrl: './pdf-preview.html',
})
export class PdfPreview {
  public files = input.required<PdfFile[]>();

  protected preview = resource<PageThumbnail[], PdfFile[]>({
    params: () => this.files(),
    loader: async ({ params: files, abortSignal }) => {
      if (files.length < 2) return [];

      const result: PageThumbnail[] = [];

      for (const pdfFile of files) {
        if (abortSignal.aborted) return result;

        const bytes = await pdfFile.file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;

        for (let i = 1; i <= pdf.numPages; i++) {
          if (abortSignal.aborted) return result;

          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 0.8 });

          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          await page.render({
            canvasContext: canvas.getContext('2d')!,
            canvas,
            viewport,
          }).promise;

          result.push({
            dataUrl: canvas.toDataURL(),
            pageLabel: `${pdfFile.name} — p. ${i}`,
          });
        }
      }

      return result;
    },
  });
}
