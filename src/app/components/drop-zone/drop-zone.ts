import { Component, computed, output, signal } from '@angular/core';

@Component({
  selector: 'app-drop-zone',
  imports: [],
  template: `
    <div
      class="border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors duration-200 select-none"
      [class]="dropZoneClasses()"
      (dragover)="onDragOver($event)"
      (dragleave)="onDragLeave()"
      (drop)="onDrop($event)"
      (click)="fileInput.click()"
    >
      <input #fileInput type="file" accept=".pdf,application/pdf" multiple class="hidden" (change)="onFileSelect($event)">
      <svg class="mx-auto mb-3 w-10 h-10 text-gray-400" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
      </svg>
      <p class="text-gray-600 font-medium">Drag &amp; drop PDF files here</p>
      <p class="text-gray-400 text-sm mt-1">or <span class="text-blue-500 underline">click to browse</span></p>
    </div>
  `,
})
export class DropZone {
  // Properties
  protected readonly isDragging = signal(false);

  protected dropZoneClasses = computed(() =>
    this.isDragging()
      ? 'border-blue-400 bg-blue-50'
      : 'border-gray-300 bg-white hover:bg-gray-50'
  );

  protected readonly filesSelected = output<File[]>();

  // Methods
  protected onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(true);
  }

  protected onDragLeave() {
    this.isDragging.set(false);
  }

  protected onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(false);
    this.filesSelected.emit(Array.from(event.dataTransfer?.files ?? []));
  }

  protected onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    this.filesSelected.emit(Array.from(input.files ?? []));
    input.value = '';
  }
}
