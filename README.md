# PDF Merger

A browser-based tool for merging multiple PDF files into a single document. All processing happens entirely on the client — no files are uploaded to any server.

## Features

- **Drag & drop or click to browse** — add PDF files via drag-and-drop or the native file picker
- **File queue management** — reorder files up/down and remove individual files or clear the entire list
- **Live preview** — thumbnail previews of all queued pages update as files are added or reordered
- **One-click merge & download** — combines all queued PDFs and triggers an instant download
- **Dark mode** — toggle between light and dark themes
- **Fully local** — no backend, no uploads; every operation runs in the browser

## Technology Stack

| Layer | Technology |
|---|---|
| Framework | [Angular 21](https://angular.dev) (standalone components, signals, resource API) |
| PDF merging | [pdf-lib](https://pdf-lib.js.org) |
| PDF preview | [pdfjs-dist](https://mozilla.github.io/pdf.js) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) |
| Unit testing | [Vitest](https://vitest.dev) via `@angular/build` |
| Language | TypeScript |

## Project Structure

```
src/app/
├── features/
│   └── pdf-merger/          # Main feature component (page-level)
├── components/              # Reusable UI components
│   ├── drop-zone/           # File input via drag-and-drop or click
│   ├── files-list/          # Queued files with reorder and remove controls
│   ├── merge-button/        # Merge & download trigger
│   └── pdf-preview/         # Live page thumbnail panel
├── services/
│   └── theme-service        # Light/dark mode state
└── types/                   # Shared TypeScript interfaces
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) v20 or later
- npm v11 or later

### Installation

```bash
# Clone the repository
git clone https://github.com/DamianQS7/PdfMerger.git
cd PdfMerger

# Install dependencies
npm install
```

### Running locally

```bash
npm start
```

Open your browser at `http://localhost:4200`. The app reloads automatically on file changes.

### Running unit tests

```bash
npm test
```

To run tests for a single file:

```bash
npx ng test --include="**/drop-zone.spec.ts" --watch=false
```

### Production build

```bash
npm run build
```

Build artifacts are placed in the `dist/` directory.

## Usage

1. **Add files** — drag PDF files onto the drop zone, or click it to open the file picker. Non-PDF files are skipped with a warning.
2. **Reorder** — use the up/down arrows on each file card to change the merge order.
3. **Remove** — click the × button on a file card to remove it, or use **Clear all** to reset the queue.
4. **Preview** — once 2 or more files are queued, a live thumbnail panel appears on the right.
5. **Merge** — click **Merge & Download** to combine the files and download the result as `merged.pdf`.
