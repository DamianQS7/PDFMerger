import { Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'app-merge-button',
  imports: [],
  styleUrl: './merge-button.css',
  template: `
    <div class="mt-6 flex justify-center">
      <button
        class="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        [class]="mergeBtnClasses()"
        [disabled]="!canMerge() || isMerging()"
        (click)="mergePdfs.emit()"
      >
        @if (isMerging()) {
          <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
          Merging...
        } @else {
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Merge &amp; Download
        }
      </button>
    </div>
  `,
})
export class MergeButton {
  public isMerging = input.required<boolean>();
  public canMerge = input.required<boolean>();
  protected mergeBtnClasses = computed(() => this.isMerging() ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700');
  protected mergePdfs = output<void>();
}
