import { Component } from '@angular/core';
import { PdfMerger } from './features/pdf-merger/pdf-merger';

@Component({
  selector: 'app-root',
  imports: [PdfMerger],
  template: '<app-pdf-merger />',
})
export class App {}
