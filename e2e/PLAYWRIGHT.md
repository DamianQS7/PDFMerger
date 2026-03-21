# End-to-End Testing with Playwright

## Setup for this project

### Configuration

The Playwright configuration lives in `playwright.config.ts` at the project root. Key settings:

- **`testDir: './e2e'`** — Playwright looks for test files inside the `e2e/` folder.
- **`baseURL: 'http://localhost:4200'`** — All `page.goto('/')` calls resolve to the Angular dev server.
- **`webServer`** — Playwright automatically runs `ng serve` before the tests start if the server is not already running. If the server is already up, it reuses it.
- **`projects: [{ name: 'chromium' }]`** — Tests run in Chromium only. Firefox and WebKit can be added later if cross-browser coverage is needed.

### Test Fixtures

The `e2e/fixtures/` folder contains minimal but valid PDF files used as test inputs:

| File | Purpose |
|---|---|
| `sample-a.pdf` | A single-page PDF labelled "Sample A" |
| `sample-b.pdf` | A single-page PDF labelled "Sample B" |
| `sample-c.pdf` | A single-page PDF labelled "Sample C" |

These were generated programmatically using `pdf-lib` (already a project dependency) so there is no dependency on external files.

### Running the Tests

```bash
# Run all e2e tests (headless, single pass)
npm run e2e

# Open the interactive Playwright UI (recommended for debugging)
npx playwright test --ui

# Run only a specific test file
npx playwright test e2e/pdf-merger.spec.ts

# Run in headed mode (watch the browser)
npx playwright test --headed
```

---

## What Is Being Tested

All tests live in `e2e/pdf-merger.spec.ts`. Each test navigates to the app's root URL before running (`beforeEach`).

### 1. Initial State (4 tests)

Verifies the app renders correctly on first load, before any user interaction.

| Test | What it checks |
|---|---|
| Shows the app title | The `PDF Merger` heading is visible |
| Shows the drop zone | The "Drag & drop PDF files here" text is visible |
| Does not show the file list | `app-files-list` is not present in the DOM |
| Does not show the preview panel | `app-pdf-preview` is not present in the DOM |

**Why e2e and not unit tests?** These tests confirm that the full component tree renders correctly in a real browser, including CSS visibility and layout.

---

### 2. Uploading Files (5 tests)

Covers the behaviour of the app as the user adds PDF files via the file input.

| Test | What it checks |
|---|---|
| Shows the file in the list after uploading one PDF | The filename appears in the file list after upload |
| Shows the merge hint when only one file is loaded | "Add at least one more file to merge." is visible |
| Does not show the preview panel with only one file | Preview stays hidden until 2+ files are loaded |
| Shows the preview panel once two files are loaded | `app-pdf-preview` becomes visible |
| Hides the merge hint once two files are loaded | The hint disappears when there are enough files to merge |

> **Note on non-PDF file filtering:** Testing what happens when a user uploads a non-PDF file is not feasible in e2e. The file input has an `accept=".pdf"` attribute that the browser enforces, preventing non-PDF files from being selected. This scenario is already covered by the `PdfMerger` unit tests in `src/app/features/pdf-merger/pdf-merger.spec.ts`.

---

### 3. Merging (2 tests)

Covers the core feature of the app: merging PDFs and downloading the result.

| Test | What it checks |
|---|---|
| Downloads a PDF when merge is clicked | After uploading 2 files and clicking Merge, a download with filename `merged.pdf` is triggered |
| Can merge three files | The same flow works correctly with 3 input files |

These tests use Playwright's `page.waitForEvent('download')` to intercept the file download before it hits the filesystem, allowing the test to inspect the filename without saving anything to disk.

---

### 4. Dark Mode (2 tests)

Covers the dark mode toggle button in the header.

| Test | What it checks |
|---|---|
| Toggles dark mode when the button is clicked | After clicking the toggle, the `<html>` element has the `dark` CSS class |
| Toggles back to light mode on second click | Clicking again removes the `dark` class |

---
