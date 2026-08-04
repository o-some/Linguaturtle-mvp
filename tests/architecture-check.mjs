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
    if (file !== 'src/v3/core/account.js' && code.includes("from '@supabase/supabase-js'")) failures.push(`${file}: Supabase-Zugriff muss im Account-Repository gekapselt bleiben.`);
  }
}

const migration = await readFile('supabase/migrations/202608030001_user_progress.sql', 'utf8');
for (const required of ['enable row level security', 'auth.uid()', 'save_progress', 'expected_revision']) {
  if (!migration.toLowerCase().includes(required.toLowerCase())) {
    failures.push(`Supabase-Migration: Sicherheitsbaustein "${required}" fehlt.`);
  }
}

const economyMigration = await readFile('supabase/migrations/202608030002_economy.sql', 'utf8');
for (const required of [
  'wallet_ledger',
  'purchase_transactions',
  'ad_reward_tickets',
  'credit_verified_purchase',
  'reverse_verified_purchase',
  'unique',
]) {
  if (!economyMigration.toLowerCase().includes(required.toLowerCase())) {
    failures.push(`Economy-Migration: Sicherheitsbaustein "${required}" fehlt.`);
  }
}

const economyClient = await readFile('src/v3/core/economy.js', 'utf8');
if (/[€$]\s*\d|\d+[,.]\d+\s*€/.test(economyClient)) {
  failures.push('Economy-Client: Echtgeldpreise dürfen nicht im Frontend fest codiert sein.');
}
if (!economyClient.includes('pendingRewards')) {
  failures.push('Economy-Client: Offline-Warteschlange für Lernbelohnungen fehlt.');
}

const accountRepository = await readFile('src/v3/core/account.js', 'utf8');
if (/service[_-]?role/i.test(accountRepository)) {
  failures.push('Account-Repository: Ein Service-Role-Key darf niemals im Browsercode referenziert werden.');
}

for (const file of [
  'index.html',
  'refactor-preview.html',
  'manifest.webmanifest',
  'capacitor.config.json',
  'android/app/src/main/res/values/strings.xml',
  'ios/App/App/Info.plist',
]) {
  const content = await readFile(file, 'utf8');
  if (/LinguaTurtle|Turtle Island|Toulas Island/.test(content)) {
    failures.push(`${file}: sichtbares Branding muss überall "Tulas Island" lauten.`);
  }
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log('Architekturprüfung bestanden.');
