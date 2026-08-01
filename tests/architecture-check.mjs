import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const roots = ['src/v3/core', 'src/v3/games', 'src/v3/screens'];
const allowedLocalStorage = new Set(['src/v3/core/storage.js', 'src/v3/core/legacy-migration.js']);
const failures = [];

async function files(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const out = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await files(path));
    else if (entry.name.endsWith('.js')) out.push(path);
  }
  return out;
}

for (const root of roots) {
  for (const file of await files(root)) {
    const code = await readFile(file, 'utf8');
    if (code.includes('MutationObserver')) failures.push(`${file}: MutationObserver ist im Refactor nicht erlaubt.`);
    if (/addEventListener\([^,]+,[^,]+,\s*true\s*\)/.test(code)) failures.push(`${file}: Capture-Listener ist nicht erlaubt.`);
    if (code.includes('stopImmediatePropagation')) failures.push(`${file}: stopImmediatePropagation ist nicht erlaubt.`);
    if (code.includes('localStorage') && !allowedLocalStorage.has(file)) failures.push(`${file}: direkter localStorage-Zugriff ist nicht erlaubt.`);
  }
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log('Architekturprüfung bestanden.');
