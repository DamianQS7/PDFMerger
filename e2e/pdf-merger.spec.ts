import { test, expect } from '@playwright/test';
import path from 'path';

const FIXTURES = path.join(__dirname, 'fixtures');
const PDF_A = path.join(FIXTURES, 'sample-a.pdf');
const PDF_B = path.join(FIXTURES, 'sample-b.pdf');
const PDF_C = path.join(FIXTURES, 'sample-c.pdf');

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function uploadFiles(page: import('@playwright/test').Page, filePaths: string[]) {
  const input = page.locator('input[type="file"]');
  await input.setInputFiles(filePaths);
}

// ─── Suite ────────────────────────────────────────────────────────────────────

test.describe('PDF Merger', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  // ─── Initial state ──────────────────────────────────────────────────────────

  test.describe('initial state', () => {
    test('shows the app title', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'PDF Merger' })).toBeVisible();
    });

    test('shows the drop zone', async ({ page }) => {
      await expect(page.getByText('Drag & drop PDF files here')).toBeVisible();
    });

    test('does not show the file list', async ({ page }) => {
      await expect(page.locator('app-files-list')).not.toBeVisible();
    });

    test('does not show the preview panel', async ({ page }) => {
      await expect(page.locator('app-pdf-preview')).not.toBeVisible();
    });
  });

  // ─── File upload ────────────────────────────────────────────────────────────

  test.describe('uploading files', () => {
    test('shows the file in the list after uploading one PDF', async ({ page }) => {
      await uploadFiles(page, [PDF_A]);
      await expect(page.getByText('sample-a.pdf')).toBeVisible();
    });

    test('shows the merge hint when only one file is loaded', async ({ page }) => {
      await uploadFiles(page, [PDF_A]);
      await expect(page.getByText('Add at least one more file to merge.')).toBeVisible();
    });

    test('does not show the preview panel with only one file', async ({ page }) => {
      await uploadFiles(page, [PDF_A]);
      await expect(page.locator('app-pdf-preview')).not.toBeVisible();
    });

    test('shows the preview panel once two files are loaded', async ({ page }) => {
      await uploadFiles(page, [PDF_A, PDF_B]);
      await expect(page.locator('app-pdf-preview')).toBeVisible();
    });

    test('hides the merge hint once two files are loaded', async ({ page }) => {
      await uploadFiles(page, [PDF_A, PDF_B]);
      await expect(page.getByText('Add at least one more file to merge.')).not.toBeVisible();
    });
  });

  // ─── Merge ──────────────────────────────────────────────────────────────────

  test.describe('merging', () => {
    test('downloads a PDF when merge is clicked', async ({ page }) => {
      await uploadFiles(page, [PDF_A, PDF_B]);

      const download = page.waitForEvent('download');
      await page.getByRole('button', { name: /merge/i }).click();

      const file = await download;
      expect(file.suggestedFilename()).toBe('merged.pdf');
    });

    test('can merge three files', async ({ page }) => {
      await uploadFiles(page, [PDF_A, PDF_B, PDF_C]);

      const download = page.waitForEvent('download');
      await page.getByRole('button', { name: /merge/i }).click();

      const file = await download;
      expect(file.suggestedFilename()).toBe('merged.pdf');
    });
  });

  // ─── Dark mode ──────────────────────────────────────────────────────────────

  test.describe('dark mode', () => {
    test('toggles dark mode when the button is clicked', async ({ page }) => {
      await page.getByRole('button', { name: /switch to dark mode/i }).click();
      await expect(page.locator('html')).toHaveClass(/dark/);
    });

    test('toggles back to light mode on second click', async ({ page }) => {
      await page.getByRole('button', { name: /switch to dark mode/i }).click();
      await page.getByRole('button', { name: /switch to light mode/i }).click();
      await expect(page.locator('html')).not.toHaveClass(/dark/);
    });
  });

});
