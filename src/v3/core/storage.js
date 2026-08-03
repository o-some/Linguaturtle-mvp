export const STORAGE_VERSION = 2;
export const STORAGE_KEY = 'linguaturtle-v3-core';
const LANGUAGE_CODES = ['de','es','el','en'];

const safeParse = value => {
  try { return JSON.parse(value); } catch { return null; }
};

export function readStorage(fallback) {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return structuredClone(fallback);
  const parsed = safeParse(raw);
  if (!parsed || typeof parsed !== 'object') return structuredClone(fallback);
  return migrateStorage(parsed, fallback);
}

export function writeStorage(state) {
  const payload = { ...state, storageVersion: STORAGE_VERSION, updatedAt: Date.now() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  return payload;
}

export function migrateStorage(input, fallback) {
  const legacySource = LANGUAGE_CODES.includes(input.language) ? input.language : fallback.languages.source;
  const source = LANGUAGE_CODES.includes(input.languages?.source) ? input.languages.source : legacySource;
  let target = LANGUAGE_CODES.includes(input.languages?.target) ? input.languages.target : (source === 'de' ? 'es' : 'de');
  if (source === target) target = LANGUAGE_CODES.find(code => code !== source) || 'es';

  const merged = {
    ...structuredClone(fallback),
    ...input,
    language: source,
    languages: { source, target },
    profile: { ...fallback.profile, ...(input.profile || {}) },
    progress: { ...fallback.progress, ...(input.progress || {}) },
    settings: { ...fallback.settings, ...(input.settings || {}) },
    inventory: { ...fallback.inventory, ...(input.inventory || {}) },
    session: { ...fallback.session, ...(input.session || {}) },
  };
  merged.storageVersion = STORAGE_VERSION;
  return merged;
}

export function clearStorage() {
  localStorage.removeItem(STORAGE_KEY);
}
