import { Component, signal, computed } from '@angular/core';
import { PDFDocument } from 'pdf-lib';

export interface PdfFile {
  id: string;
  name: string;
  size: number;
  file: File;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  readonly files = signal<PdfFile[]>([]);
  readonly isDragging = signal(false);
  readonly isMerging = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly canMerge = computed(() => this.files().length >= 2);

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave() {
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(false);
    this.addFiles(Array.from(event.dataTransfer?.files ?? []));
  }

  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    this.addFiles(Array.from(input.files ?? []));
    input.value = '';
  }

  private addFiles(files: File[]) {
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

  moveUp(index: number) {
    if (index === 0) return;
    this.files.update((files) => {
      const next = [...files];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }

  moveDown(index: number) {
    this.files.update((files) => {
      if (index === files.length - 1) return files;
      const next = [...files];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  }

  removeFile(id: string) {
    this.files.update((files) => files.filter((f) => f.id !== id));
  }

  clearAll() {
    this.files.set([]);
    this.errorMessage.set(null);
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

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
}
