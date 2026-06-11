import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = path.join(root, 'img');
const destDir = path.join(root, 'client', 'public', 'img');

fs.mkdirSync(srcDir, { recursive: true });
fs.mkdirSync(destDir, { recursive: true });

let copied = 0;

for (const file of fs.readdirSync(srcDir)) {
  if (file.startsWith('.')) continue;
  const stat = fs.statSync(path.join(srcDir, file));
  if (!stat.isFile()) continue;
  fs.copyFileSync(path.join(srcDir, file), path.join(destDir, file));
  copied += 1;
}

console.log(copied > 0 ? `Copied ${copied} image(s) from img/ to client/public/img/` : 'img/ is empty — add nav-*.jpg files for Quick Choice');
