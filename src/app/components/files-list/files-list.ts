import { Component, input, output } from '@angular/core';
import { PdfFile } from '../../types/pdf-file.interface';

@Component({
  selector: 'app-files-list',
  imports: [],
  templateUrl: './files-list.html',
  styleUrl: './files-list.css',
})
export class FilesList {
  public files = input.required<PdfFile[]>();
  protected pdfsEmitter = output<PdfFile[]>();

  protected formatSize = (bytes: number): string => {
    const units = [
      { threshold: 1024 * 1024, unit: 'MB', divisor: 1024 * 1024 },
      { threshold: 1024, unit: 'KB', divisor: 1024 },
      { threshold: 0, unit: 'B', divisor: 1 }
    ];
    
    const { unit, divisor } = units.find(u => bytes >= u.threshold)!;
    return `${(bytes / divisor).toFixed(1)} ${unit}`;
  }

  protected emitPdfs = (callback: () => PdfFile[]) => this.pdfsEmitter.emit(callback());

  protected clearAllPdfs = (): PdfFile[] => [];

  protected removeFile = (fileId: string): PdfFile[] => this.files().filter(f => f.id !== fileId);

  protected moveUpInList = (index: number): PdfFile[] => 
      index === 0 
      ? this.files()
      : this.swapElementsInArray(this.files(), index, index - 1);
    

  protected moveDownInList = (index: number): PdfFile[] => 
    index === this.files().length - 1 
      ? this.files() 
      : this.swapElementsInArray(this.files(), index, index + 1);

  private swapElementsInArray = (files: PdfFile[], i: number, j: number): PdfFile[] => {
    const swapped = [...files];
    [swapped[i], swapped[j]] = [swapped[j], swapped[i]];
    return swapped;
  }
}
