import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DropZone } from './drop-zone';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function createFile(name: string): File {
  return new File([new Uint8Array(10)], name, { type: 'application/pdf' });
}

// jsdom does not implement DragEvent, so we build a plain object that satisfies
// the interface surface used by the component.
function createDragEvent(files: File[] = []): Partial<DragEvent> {
  return {
    preventDefault: vi.fn(),
    dataTransfer: { files } as unknown as DataTransfer,
  };
}

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('DropZone', () => {
  let component: DropZone;
  let fixture: ComponentFixture<DropZone>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DropZone],
    }).compileComponents();

    fixture = TestBed.createComponent(DropZone);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function getNativeElement(): HTMLElement {
    return fixture.nativeElement;
  }

  function getDropZone(): HTMLDivElement {
    return getNativeElement().querySelector('div')!;
  }

  function getFileInput(): HTMLInputElement {
    return getNativeElement().querySelector('input[type="file"]')!;
  }

  // ─── Creation ───────────────────────────────────────────────────────────────

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ─── Static template ──────────────────────────────────────────────────────────

  describe('static template', () => {
    it('renders the "Drag & drop PDF files here" label', () => {
      expect(getNativeElement().textContent).toContain('Drag & drop PDF files here');
    });

    it('renders the "click to browse" label', () => {
      expect(getNativeElement().textContent).toContain('click to browse');
    });

    it('has a hidden file input that accepts PDF files', () => {
      const input = getFileInput();
      expect(input).toBeTruthy();
      expect(input.accept).toContain('.pdf');
      expect(input.multiple).toBe(true);
    });
  });

  // ─── CSS classes ──────────────────────────────────────────────────────────────

  describe('CSS classes', () => {
    it('applies the default (non-dragging) classes on load', () => {
      expect(getDropZone().className).toContain('border-gray-300');
    });

    it('applies the dragging classes on dragover', () => {
      (component as any).onDragOver(createDragEvent());
      fixture.detectChanges();
      expect(getDropZone().className).toContain('border-blue-400');
    });

    it('restores the default classes after dragleave', () => {
      (component as any).onDragOver(createDragEvent());
      fixture.detectChanges();
      (component as any).onDragLeave();
      fixture.detectChanges();
      expect(getDropZone().className).toContain('border-gray-300');
    });

    it('restores the default classes after a drop', () => {
      (component as any).onDragOver(createDragEvent());
      fixture.detectChanges();
      (component as any).onDrop(createDragEvent());
      fixture.detectChanges();
      expect(getDropZone().className).toContain('border-gray-300');
    });
  });

  // ─── Drag events ──────────────────────────────────────────────────────────────

  describe('drag events', () => {
    it('calls preventDefault on dragover', () => {
      const event = createDragEvent();
      (component as any).onDragOver(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('calls preventDefault on drop', () => {
      const event = createDragEvent();
      (component as any).onDrop(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });
  });

  // ─── Output emissions ─────────────────────────────────────────────────────────

  describe('output emissions', () => {
    let emitted: File[] | null;

    beforeEach(() => {
      emitted = null;
      (component as any).filesSelected.subscribe((files: File[]) => { emitted = files; });
    });

    describe('via drag-and-drop', () => {
      it('emits the dropped files', () => {
        const files = [createFile('a.pdf'), createFile('b.pdf')];
        (component as any).onDrop(createDragEvent(files));
        expect(emitted).toEqual(files);
      });

      it('emits an empty array when dropped with no files', () => {
        (component as any).onDrop(createDragEvent([]));
        expect(emitted).toEqual([]);
      });

      it('emits an empty array when dataTransfer is absent', () => {
        (component as any).onDrop({ preventDefault: vi.fn(), dataTransfer: undefined });
        expect(emitted).toEqual([]);
      });
    });

    describe('via file input', () => {
      it('emits the selected files on change', () => {
        const files = [createFile('x.pdf'), createFile('y.pdf')];
        const input = getFileInput();
        Object.defineProperty(input, 'files', { value: files, configurable: true });
        input.dispatchEvent(new Event('change'));
        expect(emitted).toEqual(files);
      });

      it('emits an empty array when no files are selected', () => {
        const input = getFileInput();
        Object.defineProperty(input, 'files', { value: [], configurable: true });
        input.dispatchEvent(new Event('change'));
        expect(emitted).toEqual([]);
      });

      it('emits an empty array when input.files is null', () => {
        const input = getFileInput();
        Object.defineProperty(input, 'files', { value: null, configurable: true });
        input.dispatchEvent(new Event('change'));
        expect(emitted).toEqual([]);
      });
    });
  });

  // ─── Click to browse ──────────────────────────────────────────────────────────

  describe('click to browse', () => {
    it('triggers a click on the hidden file input when the drop zone is clicked', () => {
      const input = getFileInput();
      const spy = vi.spyOn(input, 'click');
      getDropZone().click();
      expect(spy).toHaveBeenCalled();
    });
  });
});
