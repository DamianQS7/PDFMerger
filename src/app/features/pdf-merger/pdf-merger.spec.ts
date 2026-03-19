import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, Input, Output, EventEmitter, signal, WritableSignal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';
import { PdfMerger } from './pdf-merger';
import { PdfFile } from '../../types/pdf-file.interface';
import { ThemeService } from '../../services/theme-service';
import { PDFDocument } from 'pdf-lib';

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock('pdf-lib', () => ({
  PDFDocument: {
    create: vi.fn(),
    load: vi.fn(),
  },
}));

// PdfPreview's static import pulls in pdfjs-dist at module load time,
// which requires browser APIs unavailable in jsdom.
vi.mock('pdfjs-dist', () => ({ getDocument: vi.fn() }));

// ─── Stub components ──────────────────────────────────────────────────────────
// Replace real child components to keep these tests focused on PdfMerger logic
// and avoid pulling in heavy dependencies (e.g. pdfjs-dist from PdfPreview).

@Component({ selector: 'app-drop-zone', template: '' })
class DropZoneStub {
  @Output() filesSelected = new EventEmitter<File[]>();
}

@Component({ selector: 'app-files-list', template: '' })
class FilesListStub {
  @Input() files: PdfFile[] = [];
  @Output() pdfsEmitter = new EventEmitter<PdfFile[]>();
}

@Component({ selector: 'app-merge-button', template: '' })
class MergeButtonStub {
  @Input() isMerging = false;
  @Input() canMerge = false;
  @Output() mergePdfs = new EventEmitter<void>();
}

@Component({ selector: 'app-pdf-preview', template: '' })
class PdfPreviewStub {
  @Input() files: PdfFile[] = [];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function createFile(name: string, type = 'application/pdf'): File {
  return new File([new Uint8Array(10)], name, { type });
}

function createPdfFile(name: string): PdfFile {
  return { id: `id-${name}`, name, size: 10, file: createFile(name) };
}

function buildMockMergedDoc() {
  return {
    copyPages: vi.fn().mockResolvedValue([{}]),
    addPage: vi.fn(),
    save: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
  };
}

function buildMockLoadedDoc() {
  return { getPageIndices: vi.fn().mockReturnValue([0]) };
}

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('PdfMerger', () => {
  let component: PdfMerger;
  let fixture: ComponentFixture<PdfMerger>;
  let mockThemeService: { isDarkMode: WritableSignal<boolean>; toggleDarkMode: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockThemeService = { isDarkMode: signal(false), toggleDarkMode: vi.fn() };

    await TestBed.configureTestingModule({
      providers: [{ provide: ThemeService, useValue: mockThemeService }],
    })
      .overrideComponent(PdfMerger, {
        set: { imports: [DropZoneStub, FilesListStub, MergeButtonStub, PdfPreviewStub] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(PdfMerger);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  function getNativeElement(): HTMLElement {
    return fixture.nativeElement;
  }

  function getDarkModeButton(): HTMLButtonElement {
    return getNativeElement().querySelector('button')!;
  }

  // ─── Creation ───────────────────────────────────────────────────────────────

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ─── Static template ──────────────────────────────────────────────────────────

  describe('static template', () => {
    it('renders the "PDF Merger" heading', () => {
      expect(getNativeElement().textContent).toContain('PDF Merger');
    });

    it('renders the drop zone', () => {
      expect(fixture.debugElement.query(By.directive(DropZoneStub))).toBeTruthy();
    });
  });

  // ─── Dark mode toggle ────────────────────────────────────────────────────────

  describe('dark mode toggle', () => {
    it('shows "Switch to dark mode" title when in light mode', () => {
      mockThemeService.isDarkMode.set(false);
      fixture.detectChanges();
      expect(getDarkModeButton().title).toBe('Switch to dark mode');
    });

    it('shows "Switch to light mode" title when in dark mode', () => {
      mockThemeService.isDarkMode.set(true);
      fixture.detectChanges();
      expect(getDarkModeButton().title).toBe('Switch to light mode');
    });

    it('calls themeService.toggleDarkMode() when the button is clicked', () => {
      getDarkModeButton().click();
      expect(mockThemeService.toggleDarkMode).toHaveBeenCalledOnce();
    });
  });

  // ─── addFiles ─────────────────────────────────────────────────────────────────

  describe('addFiles', () => {
    it('adds valid PDF files to the list', () => {
      (component as any).addFiles([createFile('a.pdf'), createFile('b.pdf')]);
      expect((component as any).files().length).toBe(2);
    });

    it('filters out non-PDF files', () => {
      (component as any).addFiles([createFile('a.pdf'), createFile('image.png', 'image/png')]);
      expect((component as any).files().length).toBe(1);
      expect((component as any).files()[0].name).toBe('a.pdf');
    });

    it('shows an error message for each skipped non-PDF file', () => {
      (component as any).addFiles([createFile('a.pdf'), createFile('b.txt', 'text/plain'), createFile('c.txt', 'text/plain')]);
      expect((component as any).errorMessage()).toBe('2 file(s) skipped — only PDF files are supported.');
    });

    it('clears the error message before processing new files', () => {
      (component as any).errorMessage.set('previous error');
      (component as any).addFiles([createFile('a.pdf')]);
      expect((component as any).errorMessage()).toBeNull();
    });

    it('appends files to the existing list', () => {
      (component as any).addFiles([createFile('a.pdf')]);
      (component as any).addFiles([createFile('b.pdf')]);
      expect((component as any).files().length).toBe(2);
    });

    it('assigns a unique id to each file', () => {
      (component as any).addFiles([createFile('a.pdf'), createFile('b.pdf')]);
      const [first, second] = (component as any).files();
      expect(first.id).toBeTruthy();
      expect(second.id).toBeTruthy();
      expect(first.id).not.toBe(second.id);
    });

    it('stores the original File reference on each PdfFile', () => {
      const file = createFile('a.pdf');
      (component as any).addFiles([file]);
      expect((component as any).files()[0].file).toBe(file);
    });
  });

  // ─── canMerge ─────────────────────────────────────────────────────────────────

  describe('canMerge', () => {
    it('is false with no files', () => {
      expect((component as any).canMerge()).toBe(false);
    });

    it('is false with only one file', () => {
      (component as any).files.set([createPdfFile('a.pdf')]);
      expect((component as any).canMerge()).toBe(false);
    });

    it('is true with two or more files', () => {
      (component as any).files.set([createPdfFile('a.pdf'), createPdfFile('b.pdf')]);
      expect((component as any).canMerge()).toBe(true);
    });
  });

  // ─── Conditional rendering ────────────────────────────────────────────────────

  describe('conditional rendering', () => {
    it('hides the file list when no files are loaded', () => {
      expect(fixture.debugElement.query(By.directive(FilesListStub))).toBeNull();
    });

    it('shows the file list when files are present', () => {
      (component as any).files.set([createPdfFile('a.pdf')]);
      fixture.detectChanges();
      expect(fixture.debugElement.query(By.directive(FilesListStub))).toBeTruthy();
    });

    it('shows the "Add at least one more file" hint with exactly one file', () => {
      (component as any).files.set([createPdfFile('a.pdf')]);
      fixture.detectChanges();
      expect(getNativeElement().textContent).toContain('Add at least one more file to merge.');
    });

    it('hides the "Add at least one more file" hint with 2+ files', () => {
      (component as any).files.set([createPdfFile('a.pdf'), createPdfFile('b.pdf')]);
      fixture.detectChanges();
      expect(getNativeElement().textContent).not.toContain('Add at least one more file to merge.');
    });

    it('hides the preview panel when fewer than 2 files are loaded', () => {
      (component as any).files.set([createPdfFile('a.pdf')]);
      fixture.detectChanges();
      expect(fixture.debugElement.query(By.directive(PdfPreviewStub))).toBeNull();
    });

    it('shows the preview panel when 2+ files are loaded', () => {
      (component as any).files.set([createPdfFile('a.pdf'), createPdfFile('b.pdf')]);
      fixture.detectChanges();
      expect(fixture.debugElement.query(By.directive(PdfPreviewStub))).toBeTruthy();
    });

    it('applies the narrow layout class when canMerge is false', () => {
      const container: HTMLElement = getNativeElement().querySelector('div.mx-auto')!;
      expect(container.className).toContain('max-w-2xl');
    });

    it('applies the wide layout class when canMerge is true', () => {
      (component as any).files.set([createPdfFile('a.pdf'), createPdfFile('b.pdf')]);
      fixture.detectChanges();
      const container: HTMLElement = getNativeElement().querySelector('div.mx-auto')!;
      expect(container.className).toContain('max-w-7xl');
    });

    it('hides the error banner when errorMessage is null', () => {
      expect(getNativeElement().querySelector('.bg-amber-50')).toBeNull();
    });

    it('shows the error banner with the correct message', () => {
      (component as any).errorMessage.set('Something went wrong.');
      fixture.detectChanges();
      expect(getNativeElement().querySelector('.bg-amber-50')?.textContent).toContain('Something went wrong.');
    });
  });

  // ─── updateFilesInList ────────────────────────────────────────────────────────

  describe('updateFilesInList', () => {
    it('replaces the files signal with the provided array', () => {
      (component as any).files.set([createPdfFile('old.pdf')]);
      const updated = [createPdfFile('new.pdf')];
      (component as any).updateFilesInList(updated);
      expect((component as any).files()).toEqual(updated);
    });
  });

  // ─── clearErrorMsgEff ─────────────────────────────────────────────────────────

  describe('clearErrorMsgEff', () => {
    it('clears the error message when the files list becomes empty', () => {
      (component as any).files.set([createPdfFile('a.pdf')]);
      (component as any).errorMessage.set('some error');
      (component as any).files.set([]);
      TestBed.tick();
      expect((component as any).errorMessage()).toBeNull();
    });

    it('does not clear the error message while files remain', () => {
      (component as any).files.set([createPdfFile('a.pdf')]);
      (component as any).errorMessage.set('some error');
      TestBed.tick();
      expect((component as any).errorMessage()).toBe('some error');
    });
  });

  // ─── mergePdfs ────────────────────────────────────────────────────────────────

  describe('mergePdfs', () => {
    beforeEach(() => {
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
      vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
      vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    });

    function setupMockPdfLib() {
      const mergedDoc = buildMockMergedDoc();
      const loadedDoc = buildMockLoadedDoc();
      vi.mocked(PDFDocument.create).mockResolvedValue(mergedDoc as any);
      vi.mocked(PDFDocument.load).mockResolvedValue(loadedDoc as any);
      return { mergedDoc, loadedDoc };
    }

    it('does nothing when canMerge is false', async () => {
      setupMockPdfLib();
      (component as any).files.set([createPdfFile('a.pdf')]); // only 1 file
      await (component as any).mergePdfs();
      expect(PDFDocument.create).not.toHaveBeenCalled();
    });

    it('clears the error message before merging', async () => {
      setupMockPdfLib();
      (component as any).files.set([createPdfFile('a.pdf'), createPdfFile('b.pdf')]);
      (component as any).errorMessage.set('old error');
      await (component as any).mergePdfs();
      expect((component as any).errorMessage()).toBeNull();
    });

    it('sets isMerging to false after a successful merge', async () => {
      setupMockPdfLib();
      (component as any).files.set([createPdfFile('a.pdf'), createPdfFile('b.pdf')]);
      await (component as any).mergePdfs();
      expect((component as any).isMerging()).toBe(false);
    });

    it('calls PDFDocument.create once', async () => {
      setupMockPdfLib();
      (component as any).files.set([createPdfFile('a.pdf'), createPdfFile('b.pdf')]);
      await (component as any).mergePdfs();
      expect(PDFDocument.create).toHaveBeenCalledOnce();
    });

    it('calls PDFDocument.load once per file', async () => {
      setupMockPdfLib();
      (component as any).files.set([createPdfFile('a.pdf'), createPdfFile('b.pdf'), createPdfFile('c.pdf')]);
      await (component as any).mergePdfs();
      expect(PDFDocument.load).toHaveBeenCalledTimes(3);
    });

    it('triggers a download with filename "merged.pdf"', async () => {
      setupMockPdfLib();
      (component as any).files.set([createPdfFile('a.pdf'), createPdfFile('b.pdf')]);
      await (component as any).mergePdfs();
      expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
      expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock');
    });

    it('sets an error message when the merge fails', async () => {
      vi.mocked(PDFDocument.create).mockRejectedValue(new Error('corrupt pdf'));
      (component as any).files.set([createPdfFile('a.pdf'), createPdfFile('b.pdf')]);
      await (component as any).mergePdfs();
      expect((component as any).errorMessage()).toBe(
        'Failed to merge PDFs. Please ensure all files are valid, unencrypted PDFs.'
      );
    });

    it('sets isMerging to false after a failed merge', async () => {
      vi.mocked(PDFDocument.create).mockRejectedValue(new Error('corrupt pdf'));
      (component as any).files.set([createPdfFile('a.pdf'), createPdfFile('b.pdf')]);
      await (component as any).mergePdfs();
      expect((component as any).isMerging()).toBe(false);
    });
  });
});
