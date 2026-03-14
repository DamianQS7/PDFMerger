import { Component, signal, computed, effect } from '@angular/core';
import { PDFDocument } from 'pdf-lib';
import { DropZone } from './components/drop-zone/drop-zone';
import { PdfFile } from './types/pdf-file.interface';
import { FilesList } from "./components/files-list/files-list";

@Component({
  selector: 'app-root',
  imports: [DropZone, FilesList],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  readonly files = signal<PdfFile[]>([]);
  readonly isMerging = signal(false);
  readonly errorMessage = signal<string | null>(null);

  protected canMerge = computed(() => this.files().length >= 2);

  addFiles(files: File[]) {
    this.errorMessage.set(null);
    const pdfs = files.filter((f) => f.type === 'application/pdf');
    const skipped = files.length - pdfs.length;

    if (skipped > 0) {
      this.errorMessage.set(
        `${skipped} file(s) skipped — only PDF files are supported.`
      );
    }

    this.files.update((current) => [
      ...current,
      ...pdfs.map((file) => ({
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        file,
      })),
    ]);
  }

  protected updateFilesInList = (files: PdfFile[]): void => this.files.set(files);

  async mergePdfs() {
    if (!this.canMerge()) return;
    this.isMerging.set(true);
    this.errorMessage.set(null);

    try {
      const merged = await PDFDocument.create();

      for (const pdfFile of this.files()) {
        const bytes = await pdfFile.file.arrayBuffer();
        const doc = await PDFDocument.load(bytes);
        const pages = await merged.copyPages(doc, doc.getPageIndices());
        pages.forEach((page) => merged.addPage(page));
      }

      const mergedBytes = await merged.save();
      const blob = new Blob([mergedBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = 'merged.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      this.errorMessage.set(
        'Failed to merge PDFs. Please ensure all files are valid, unencrypted PDFs.'
      );
    } finally {
      this.isMerging.set(false);
    }
  }

  private clearErrorMsgEff = effect(() => {
    if(this.files().length === 0)
      this.errorMessage.set(null);
  });
}
