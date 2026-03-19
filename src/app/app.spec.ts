import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { App } from './app';

// ─── Module mock ──────────────────────────────────────────────────────────────
// pdfjs-dist requires browser APIs (DOMMatrix, canvas workers) that are
// unavailable in the jsdom test environment, so we mock the entire module.

vi.mock('pdfjs-dist', () => ({
  getDocument: vi.fn(),
}));

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('renders the pdf-merger component', () => {
    const fixture = TestBed.createComponent(App);
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-pdf-merger')).toBeTruthy();
  });
});
