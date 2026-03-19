import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme-service';

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThemeService);
  });

  afterEach(() => {
    // Prevent the 'dark' class from leaking into subsequent tests
    document.documentElement.classList.remove('dark');
  });

  // ─── Creation ─────────────────────────────────────────────────────────────

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ─── isDarkMode signal ────────────────────────────────────────────────────

  describe('isDarkMode signal', () => {
    it('is false by default', () => {
      expect(service.isDarkMode()).toBe(false);
    });

    it('becomes true after toggleDarkMode is called once', () => {
      service.toggleDarkMode();
      expect(service.isDarkMode()).toBe(true);
    });

    it('returns to false after toggleDarkMode is called twice', () => {
      service.toggleDarkMode();
      service.toggleDarkMode();
      expect(service.isDarkMode()).toBe(false);
    });
  });

  // ─── DOM effect ───────────────────────────────────────────────────────────

  describe('DOM effect', () => {
    it('does not add the "dark" class to <html> on initialisation', () => {
      TestBed.flushEffects();
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('adds the "dark" class to <html> when isDarkMode becomes true', () => {
      service.toggleDarkMode();
      TestBed.flushEffects();
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('removes the "dark" class from <html> when isDarkMode returns to false', () => {
      service.toggleDarkMode();
      TestBed.flushEffects();
      service.toggleDarkMode();
      TestBed.flushEffects();
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });
});
