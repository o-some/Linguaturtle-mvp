export const STORAGE_VERSION = 1;
export const STORAGE_KEY = 'linguaturtle-v3-core';

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
  const merged = {
    ...structuredClone(fallback),
    ...input,
    profile: { ...fallback.profile, ...(input.profile || {}) },
    progress: { ...fallback.progress, ...(input.progress || {}) },
    settings: { ...fallback.settings, ...(input.settings || {}) },
    inventory: { ...fallback.inventory, ...(input.inventory || {}) },
  };
  merged.storageVersion = STORAGE_VERSION;
  return merged;
}

export function clearStorage() {
  localStorage.removeItem(STORAGE_KEY);
}
