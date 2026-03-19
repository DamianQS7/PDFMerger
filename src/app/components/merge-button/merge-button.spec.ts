import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MergeButton } from './merge-button';

describe('MergeButton', () => {
  let component: MergeButton;
  let fixture: ComponentFixture<MergeButton>;

  function signalsSetup(isMerging: boolean, canMerge: boolean) {
    fixture.componentRef.setInput('isMerging', isMerging);
    fixture.componentRef.setInput('canMerge', canMerge);
    fixture.detectChanges();
  }

  function getButtonElement(): HTMLButtonElement {
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
    signalsSetup(false, true);
    expect(component).toBeTruthy();
  });

  describe('button label', () => {
    it('shows "Merge & Download" when not merging', () => {
      signalsSetup(false, true);
      expect(getButtonElement().textContent?.trim()).toContain('Merge & Download');
    });

    it('shows "Merging..." when isMerging is true', () => {
      signalsSetup(true, true);
      expect(getButtonElement().textContent?.trim()).toContain('Merging...');
    });
  });

  describe('disabled state', () => {
    it('is enabled when canMerge is true and isMerging is false', () => {
      signalsSetup(false, true);
      expect(getButtonElement().disabled).toBe(false);
    });

    it('is disabled when canMerge is false', () => {
      signalsSetup(false, false);
      expect(getButtonElement().disabled).toBe(true);
    });

    it('is disabled when isMerging is true', () => {
      signalsSetup(true, true);
      expect(getButtonElement().disabled).toBe(true);
    });

    it('is disabled when canMerge is false and isMerging is true', () => {
      signalsSetup(true, false);
      expect(getButtonElement().disabled).toBe(true);
    });
  });

  describe('button styling', () => {
    it('applies active style when not merging', () => {
      signalsSetup(false, true);
      expect(getButtonElement().className).toContain('bg-blue-600');
    });

    it('applies muted style when merging', () => {
      signalsSetup(true, true);
      expect(getButtonElement().className).toContain('bg-blue-400');
    });
  });

  describe('mergePdfs output', () => {
    it('emits when the button is clicked and enabled', () => {
      signalsSetup(false, true);
      let emitted = false;
      (component as any).mergePdfs.subscribe(() => { emitted = true; });

      getButtonElement().click();

      expect(emitted).toBe(true);
    });

    it('does not emit when the button is disabled due to canMerge being false', () => {
      signalsSetup(false, false);
      let emitted = false;
      (component as any).mergePdfs.subscribe(() => { emitted = true; });

      getButtonElement().click();

      expect(emitted).toBe(false);
    });

    it('does not emit when the button is disabled due to isMerging being true', () => {
      signalsSetup(true, true);
      let emitted = false;
      (component as any).mergePdfs.subscribe(() => { emitted = true; });

      getButtonElement().click();

      expect(emitted).toBe(false);
    });
  });
});
