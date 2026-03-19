import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { PdfPreview } from './pdf-preview';
import { PdfFile } from '../../types/pdf-file.interface';

// ─── Module mock ─────────────────────────────────────────────────────────────
// pdfjs-dist requires browser APIs (DOMMatrix, canvas workers) that are
// unavailable in the jsdom test environment, so we mock the entire module.

vi.mock('pdfjs-dist', () => ({
  getDocument: vi.fn(),
}));

// Retrieve the mock after hoisting so tests can control its behaviour.
const pdfjsMock = await import('pdfjs-dist');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function createMockPdfFile(name: string, id: string = `id-${name}`): PdfFile {
  const file = new File([new Uint8Array(10)], name, { type: 'application/pdf' });
  return { id, name, size: file.size, file };
}

function buildMockPdf(numPages: number) {
  const mockPage = {
    getViewport: vi.fn().mockReturnValue({ width: 100, height: 150 }),
    render: vi.fn().mockReturnValue({ promise: Promise.resolve() }),
  };
  const mockPdf = {
    numPages,
    getPage: vi.fn().mockResolvedValue(mockPage),
  };
  return { mockPdf, mockPage };
}

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('PdfPreview', () => {
  let component: PdfPreview;
  let fixture: ComponentFixture<PdfPreview>;

  beforeEach(async () => {
    const { mockPdf } = buildMockPdf(1);

    vi.mocked(pdfjsMock.getDocument).mockReturnValue(
      { promise: Promise.resolve(mockPdf) } as any
    );

    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({} as any);
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,mock');

    await TestBed.configureTestingModule({
      imports: [PdfPreview],
    }).compileComponents();

    fixture = TestBed.createComponent(PdfPreview);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  function setup(files: PdfFile[]): void {
    fixture.componentRef.setInput('files', files);
    fixture.detectChanges();
  }

  function getNativeElement(): HTMLElement {
    return fixture.nativeElement;
  }

  // ─── Creation ───────────────────────────────────────────────────────────────

  it('should create', () => {
    setup([]);
    expect(component).toBeTruthy();
  });

  // ─── Empty state ─────────────────────────────────────────────────────────────

  describe('empty state', () => {
    it('shows the "preview will appear here" message when no files are provided', async () => {
      setup([]);
      await fixture.whenStable();
      fixture.detectChanges();
      expect(getNativeElement().textContent).toContain('Your merged preview will appear here');
    });

    it('shows the "Add at least 2 PDFs" hint when only one file is provided', async () => {
      setup([createMockPdfFile('a.pdf')]);
      await fixture.whenStable();
      fixture.detectChanges();
      expect(getNativeElement().textContent).toContain('Add at least 2 PDFs to get started');
    });

    it('does not show the page count badge when there are no thumbnails', () => {
      setup([]);
      const panelHeader = getNativeElement().querySelector('.flex.items-center.justify-between');
      expect(panelHeader?.querySelector('span')?.textContent?.trim()).toBeFalsy();
    });
  });

  // ─── Loading state ────────────────────────────────────────────────────────────

  describe('loading state', () => {
    it('shows the loading spinner immediately after 2+ files are set', () => {
      setup([createMockPdfFile('a.pdf'), createMockPdfFile('b.pdf')]);
      // Resource hasn't resolved yet — spinner should be visible
      const spinner = getNativeElement().querySelector('.animate-spin');
      expect(spinner).toBeTruthy();
    });

    it('shows the "Generating preview" label while loading', () => {
      setup([createMockPdfFile('a.pdf'), createMockPdfFile('b.pdf')]);
      expect(getNativeElement().textContent).toContain('Generating preview');
    });
  });

  // ─── Thumbnail rendering ──────────────────────────────────────────────────────

  describe('thumbnail rendering', () => {
    it('renders one <img> per page after loading completes', async () => {
      // 2 files × 1 page each → 2 thumbnails
      setup([createMockPdfFile('a.pdf'), createMockPdfFile('b.pdf')]);
      await fixture.whenStable();
      fixture.detectChanges();

      const images = getNativeElement().querySelectorAll('img');
      expect(images.length).toBe(2);
    });

    it('binds the dataUrl as the image src', async () => {
      setup([createMockPdfFile('a.pdf'), createMockPdfFile('b.pdf')]);
      await fixture.whenStable();
      fixture.detectChanges();

      const img: HTMLImageElement = getNativeElement().querySelector('img')!;
      expect(img.src).toContain('data:image/png;base64,mock');
    });

    it('sets the page label as the image alt text', async () => {
      setup([createMockPdfFile('first.pdf'), createMockPdfFile('second.pdf')]);
      await fixture.whenStable();
      fixture.detectChanges();

      const images: NodeListOf<HTMLImageElement> = getNativeElement().querySelectorAll('img');
      expect(images[0].alt).toBe('first.pdf — p. 1');
      expect(images[1].alt).toBe('second.pdf — p. 1');
    });

    it('shows a 1-based index overlay on each thumbnail', async () => {
      setup([createMockPdfFile('a.pdf'), createMockPdfFile('b.pdf')]);
      await fixture.whenStable();
      fixture.detectChanges();

      const overlays = getNativeElement().querySelectorAll<HTMLSpanElement>('div.relative span');
      expect(overlays.length).toBe(2);
      expect(overlays[0].textContent?.trim()).toBe('1');
      expect(overlays[1].textContent?.trim()).toBe('2');
    });
  });

  // ─── Header badge ──────────────────────────────────────────────────────────────

  describe('page count badge', () => {
    it('shows "N pages" (plural) when there are multiple pages', async () => {
      // 2 files × 1 page each = 2 pages
      setup([createMockPdfFile('a.pdf'), createMockPdfFile('b.pdf')]);
      await fixture.whenStable();
      fixture.detectChanges();

      const badge = getNativeElement().querySelector<HTMLSpanElement>(
        '.flex.items-center.justify-between span'
      );
      expect(badge?.textContent?.trim()).toBe('2 pages');
    });

    it('shows "1 page" (singular) when there is exactly one page', async () => {
      const { mockPdf: singlePage } = buildMockPdf(1);
      const { mockPdf: noPages } = buildMockPdf(0);

      // First file: 1 page; second file: 0 pages → 1 total thumbnail
      vi.mocked(pdfjsMock.getDocument)
        .mockReturnValueOnce({ promise: Promise.resolve(singlePage) } as any)
        .mockReturnValueOnce({ promise: Promise.resolve(noPages) } as any);

      setup([createMockPdfFile('x.pdf'), createMockPdfFile('y.pdf')]);
      await fixture.whenStable();
      fixture.detectChanges();

      const badge = getNativeElement().querySelector<HTMLSpanElement>(
        '.flex.items-center.justify-between span'
      );
      expect(badge?.textContent?.trim()).toBe('1 page');
    });
  });

  // ─── Resource loader logic ────────────────────────────────────────────────────

  describe('resource loader', () => {
    it('does not call pdfjs when fewer than 2 files are provided', async () => {
      setup([createMockPdfFile('only.pdf')]);
      await fixture.whenStable();

      expect(pdfjsMock.getDocument).not.toHaveBeenCalled();
    });

    it('calls getDocument once per file when 2+ files are provided', async () => {
      setup([createMockPdfFile('a.pdf'), createMockPdfFile('b.pdf')]);
      await fixture.whenStable();

      expect(pdfjsMock.getDocument).toHaveBeenCalledTimes(2);
    });

    it('passes the file bytes to getDocument', async () => {
      setup([createMockPdfFile('a.pdf'), createMockPdfFile('b.pdf')]);
      await fixture.whenStable();

      expect(pdfjsMock.getDocument).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.any(ArrayBuffer) })
      );
    });

    it('renders multiple pages per file when a PDF has more than one page', async () => {
      const { mockPdf } = buildMockPdf(3); // 3 pages per file
      vi.mocked(pdfjsMock.getDocument).mockReturnValue(
        { promise: Promise.resolve(mockPdf) } as any
      );

      setup([createMockPdfFile('multi.pdf'), createMockPdfFile('also-multi.pdf')]);
      await fixture.whenStable();
      fixture.detectChanges();

      // 2 files × 3 pages = 6 thumbnails
      const images = getNativeElement().querySelectorAll('img');
      expect(images.length).toBe(6);
    });

    it('requests viewport at scale 0.8', async () => {
      const { mockPdf, mockPage } = buildMockPdf(1);
      vi.mocked(pdfjsMock.getDocument).mockReturnValue(
        { promise: Promise.resolve(mockPdf) } as any
      );

      setup([createMockPdfFile('a.pdf'), createMockPdfFile('b.pdf')]);
      await fixture.whenStable();

      expect(mockPage.getViewport).toHaveBeenCalledWith({ scale: 0.8 });
    });

    it('formats page labels as "<filename> — p. <number>"', async () => {
      const { mockPdf } = buildMockPdf(2); // 2 pages per file
      vi.mocked(pdfjsMock.getDocument).mockReturnValue(
        { promise: Promise.resolve(mockPdf) } as any
      );

      setup([createMockPdfFile('report.pdf'), createMockPdfFile('appendix.pdf')]);
      await fixture.whenStable();
      fixture.detectChanges();

      const images: NodeListOf<HTMLImageElement> = getNativeElement().querySelectorAll('img');
      expect(images[0].alt).toBe('report.pdf — p. 1');
      expect(images[1].alt).toBe('report.pdf — p. 2');
      expect(images[2].alt).toBe('appendix.pdf — p. 1');
      expect(images[3].alt).toBe('appendix.pdf — p. 2');
    });
  });
});
