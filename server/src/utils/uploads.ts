import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const uploadsDir = path.resolve(__dirname, '../../uploads');

export function ensureUploadsDir() {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
