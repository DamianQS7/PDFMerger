import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FilesList } from './files-list';
import { PdfFile } from '../../types/pdf-file.interface';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function createMockPdfFile(name: string, sizeBytes: number = 1024, id: string = `id-${name}`): PdfFile {
  const file = new File([new Uint8Array(sizeBytes)], name, { type: 'application/pdf' });
  return { id, name, size: sizeBytes, file };
}

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('FilesList', () => {
  let component: FilesList;
  let fixture: ComponentFixture<FilesList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilesList],
    }).compileComponents();

    fixture = TestBed.createComponent(FilesList);
    component = fixture.componentInstance;
  });

  function setup(files: PdfFile[]): void {
    fixture.componentRef.setInput('files', files);
    fixture.detectChanges();
  }

  function getNativeElement(): HTMLElement {
    return fixture.nativeElement;
  }

  function getListItems(): NodeListOf<HTMLLIElement> {
    return getNativeElement().querySelectorAll('li');
  }

  function getButtonsForItem(itemIndex: number) {
    const item = getListItems()[itemIndex];
    const buttons = item.querySelectorAll<HTMLButtonElement>('button');
    return { moveUp: buttons[0], moveDown: buttons[1], remove: buttons[2] };
  }

  function getClearAllButton(): HTMLButtonElement {
    return getNativeElement().querySelector('button[class*="text-gray-400"]')!;
  }

  // ─── Creation ───────────────────────────────────────────────────────────────

  it('should create', () => {
    setup([]);
    expect(component).toBeTruthy();
  });

  // ─── Header ───────────────────────────────────────────────────────────────────

  describe('header', () => {
    it('shows "1 file queued" (singular) when there is one file', () => {
      setup([createMockPdfFile('a.pdf')]);
      const heading = getNativeElement().querySelector('h2');
      expect(heading?.textContent?.trim()).toBe('1 file queued');
    });

    it('shows "N files queued" (plural) when there are multiple files', () => {
      setup([createMockPdfFile('a.pdf'), createMockPdfFile('b.pdf'), createMockPdfFile('c.pdf')]);
      const heading = getNativeElement().querySelector('h2');
      expect(heading?.textContent?.trim()).toBe('3 files queued');
    });

    it('shows "0 files queued" when the list is empty', () => {
      setup([]);
      const heading = getNativeElement().querySelector('h2');
      expect(heading?.textContent?.trim()).toBe('0 files queued');
    });
  });

  // ─── List rendering ───────────────────────────────────────────────────────────

  describe('list rendering', () => {
    it('renders one list item per file', () => {
      setup([createMockPdfFile('a.pdf'), createMockPdfFile('b.pdf')]);
      expect(getListItems().length).toBe(2);
    });

    it('displays each file name', () => {
      setup([createMockPdfFile('report.pdf'), createMockPdfFile('appendix.pdf')]);
      const items = getListItems();
      expect(items[0].textContent).toContain('report.pdf');
      expect(items[1].textContent).toContain('appendix.pdf');
    });

    it('shows a 1-based order badge for each item', () => {
      setup([createMockPdfFile('a.pdf'), createMockPdfFile('b.pdf'), createMockPdfFile('c.pdf')]);
      const items = getListItems();
      expect(items[0].querySelector('span.font-mono')?.textContent?.trim()).toBe('1');
      expect(items[1].querySelector('span.font-mono')?.textContent?.trim()).toBe('2');
      expect(items[2].querySelector('span.font-mono')?.textContent?.trim()).toBe('3');
    });

    it('sets the title attribute on the file name span', () => {
      setup([createMockPdfFile('my-document.pdf')]);
      const nameSpan = getListItems()[0].querySelector<HTMLSpanElement>('span[title]');
      expect(nameSpan?.title).toBe('my-document.pdf');
    });
  });

  // ─── formatSize ───────────────────────────────────────────────────────────────

  describe('file size display', () => {
    it('formats sizes below 1 KB as bytes', () => {
      setup([createMockPdfFile('tiny.pdf', 512)]);
      expect(getListItems()[0].textContent).toContain('512.0 B');
    });

    it('formats sizes of exactly 0 bytes', () => {
      setup([createMockPdfFile('empty.pdf', 0)]);
      expect(getListItems()[0].textContent).toContain('0.0 B');
    });

    it('formats sizes in the KB range', () => {
      setup([createMockPdfFile('small.pdf', 2048)]);
      expect(getListItems()[0].textContent).toContain('2.0 KB');
    });

    it('formats fractional KB sizes to one decimal place', () => {
      setup([createMockPdfFile('medium.pdf', 1536)]); // 1.5 KB
      expect(getListItems()[0].textContent).toContain('1.5 KB');
    });

    it('formats sizes in the MB range', () => {
      setup([createMockPdfFile('large.pdf', 1024 * 1024)]);
      expect(getListItems()[0].textContent).toContain('1.0 MB');
    });

    it('formats fractional MB sizes to one decimal place', () => {
      setup([createMockPdfFile('big.pdf', 1024 * 1024 * 2.5)]);
      expect(getListItems()[0].textContent).toContain('2.5 MB');
    });
  });

  // ─── Button disabled states ───────────────────────────────────────────────────

  describe('button disabled states', () => {
    it('disables the "Move up" button for the first item', () => {
      setup([createMockPdfFile('a.pdf'), createMockPdfFile('b.pdf')]);
      expect(getButtonsForItem(0).moveUp.disabled).toBe(true);
    });

    it('enables the "Move up" button for non-first items', () => {
      setup([createMockPdfFile('a.pdf'), createMockPdfFile('b.pdf')]);
      expect(getButtonsForItem(1).moveUp.disabled).toBe(false);
    });

    it('disables the "Move down" button for the last item', () => {
      setup([createMockPdfFile('a.pdf'), createMockPdfFile('b.pdf')]);
      expect(getButtonsForItem(1).moveDown.disabled).toBe(true);
    });

    it('enables the "Move down" button for non-last items', () => {
      setup([createMockPdfFile('a.pdf'), createMockPdfFile('b.pdf')]);
      expect(getButtonsForItem(0).moveDown.disabled).toBe(false);
    });

    it('both move buttons are disabled when there is only one file', () => {
      setup([createMockPdfFile('a.pdf')]);
      const { moveUp, moveDown } = getButtonsForItem(0);
      expect(moveUp.disabled).toBe(true);
      expect(moveDown.disabled).toBe(true);
    });
  });

  // ─── Output emissions ─────────────────────────────────────────────────────────

  describe('output emissions', () => {
    let emitted: PdfFile[] | null;

    beforeEach(() => {
      emitted = null;
      (component as any).pdfsEmitter.subscribe((files: PdfFile[]) => { emitted = files; });
    });

    describe('"Clear all" button', () => {
      it('emits an empty array when clicked', () => {
        setup([createMockPdfFile('a.pdf'), createMockPdfFile('b.pdf')]);
        getClearAllButton().click();
        expect(emitted).toEqual([]);
      });
    });

    describe('"Remove" button', () => {
      it('emits the list without the removed file', () => {
        const [a, b, c] = [
          createMockPdfFile('a.pdf'),
          createMockPdfFile('b.pdf'),
          createMockPdfFile('c.pdf'),
        ];
        setup([a, b, c]);
        getButtonsForItem(1).remove.click();
        expect(emitted).toEqual([a, c]);
      });

      it('emits an empty array when the only file is removed', () => {
        const a = createMockPdfFile('a.pdf');
        setup([a]);
        getButtonsForItem(0).remove.click();
        expect(emitted).toEqual([]);
      });
    });

    describe('"Move up" button', () => {
      it('emits the list with the item swapped with its predecessor', () => {
        const [a, b, c] = [
          createMockPdfFile('a.pdf'),
          createMockPdfFile('b.pdf'),
          createMockPdfFile('c.pdf'),
        ];
        setup([a, b, c]);
        getButtonsForItem(1).moveUp.click(); // move b up
        expect(emitted).toEqual([b, a, c]);
      });

      it('does not emit a reordered list when the first item is moved up (button is disabled)', () => {
        const [a, b] = [createMockPdfFile('a.pdf'), createMockPdfFile('b.pdf')];
        setup([a, b]);
        getButtonsForItem(0).moveUp.click(); // disabled — click should be ignored
        expect(emitted).toBeNull();
      });
    });

    describe('"Move down" button', () => {
      it('emits the list with the item swapped with its successor', () => {
        const [a, b, c] = [
          createMockPdfFile('a.pdf'),
          createMockPdfFile('b.pdf'),
          createMockPdfFile('c.pdf'),
        ];
        setup([a, b, c]);
        getButtonsForItem(1).moveDown.click(); // move b down
        expect(emitted).toEqual([a, c, b]);
      });

      it('does not emit a reordered list when the last item is moved down (button is disabled)', () => {
        const [a, b] = [createMockPdfFile('a.pdf'), createMockPdfFile('b.pdf')];
        setup([a, b]);
        getButtonsForItem(1).moveDown.click(); // disabled — click should be ignored
        expect(emitted).toBeNull();
      });
    });
  });
});
