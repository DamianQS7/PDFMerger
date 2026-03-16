import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MergeButton } from './merge-button';

describe('MergeButton', () => {
  let component: MergeButton;
  let fixture: ComponentFixture<MergeButton>;

  function setup(isMerging: boolean, canMerge: boolean) {
    fixture.componentRef.setInput('isMerging', isMerging);
    fixture.componentRef.setInput('canMerge', canMerge);
    fixture.detectChanges();
  }

  function getButton(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('button');
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MergeButton],
    }).compileComponents();

    fixture = TestBed.createComponent(MergeButton);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    setup(false, true);
    expect(component).toBeTruthy();
  });

  describe('button label', () => {
    it('shows "Merge & Download" when not merging', () => {
      setup(false, true);
      expect(getButton().textContent?.trim()).toContain('Merge & Download');
    });

    it('shows "Merging..." when isMerging is true', () => {
      setup(true, true);
      expect(getButton().textContent?.trim()).toContain('Merging...');
    });
  });

  describe('disabled state', () => {
    it('is enabled when canMerge is true and isMerging is false', () => {
      setup(false, true);
      expect(getButton().disabled).toBe(false);
    });

    it('is disabled when canMerge is false', () => {
      setup(false, false);
      expect(getButton().disabled).toBe(true);
    });

    it('is disabled when isMerging is true', () => {
      setup(true, true);
      expect(getButton().disabled).toBe(true);
    });

    it('is disabled when both canMerge is false and isMerging is true', () => {
      setup(true, false);
      expect(getButton().disabled).toBe(true);
    });
  });

  describe('button styling', () => {
    it('applies active style when not merging', () => {
      setup(false, true);
      expect(getButton().className).toContain('bg-blue-600');
    });

    it('applies muted style when merging', () => {
      setup(true, true);
      expect(getButton().className).toContain('bg-blue-400');
    });
  });

  describe('mergePdfs output', () => {
    it('emits when the button is clicked and enabled', () => {
      setup(false, true);
      let emitted = false;
      (component as any).mergePdfs.subscribe(() => { emitted = true; });

      getButton().click();

      expect(emitted).toBe(true);
    });

    it('does not emit when the button is disabled due to canMerge being false', () => {
      setup(false, false);
      let emitted = false;
      (component as any).mergePdfs.subscribe(() => { emitted = true; });

      getButton().click();

      expect(emitted).toBe(false);
    });

    it('does not emit when the button is disabled due to isMerging being true', () => {
      setup(true, true);
      let emitted = false;
      (component as any).mergePdfs.subscribe(() => { emitted = true; });

      getButton().click();

      expect(emitted).toBe(false);
    });
  });
});
