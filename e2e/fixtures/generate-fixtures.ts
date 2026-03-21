import { PDFDocument } from 'pdf-lib';
import { writeFileSync } from 'fs';
import { join } from 'path';

async function createPdf(filename: string, title: string): Promise<void> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([400, 300]);
  page.drawText(title, { x: 50, y: 150, size: 24 });
  const bytes = await doc.save();
  const filePath = join(__dirname, filename);
  writeFileSync(filePath, bytes);
  console.log(`Created ${filePath}`);
}

await Promise.all([
  createPdf('sample-a.pdf', 'Sample A'),
  createPdf('sample-b.pdf', 'Sample B'),
  createPdf('sample-c.pdf', 'Sample C'),
]);
