export const STORAGE_VERSION = 8;
export const STORAGE_KEY = 'linguaturtle-v3-core';
export const SYNC_META_KEY = 'linguaturtle-v3-sync-meta';
const LANGUAGE_CODES = ['de','es','el','en'];
const DURABLE_KEYS = [
  'language',
  'languages',
  'profile',
  'progress',
  'settings',
  'inventory',
];

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

export function serializeDurableState(state) {
  const payload = { storageVersion: STORAGE_VERSION };
  for (const key of DURABLE_KEYS) {
    if (state[key] !== undefined) payload[key] = structuredClone(state[key]);
  }
  // The paid economy is authoritative in dedicated server tables. Never let
  // the generic progress blob overwrite wallet or purchasable entitlements.
  if (payload.progress) delete payload.progress.shells;
  if (payload.inventory) {
    delete payload.inventory.unlockedModes;
    delete payload.inventory.unlockedWords;
    delete payload.inventory.boosters;
    delete payload.inventory.homeOwned;
  }
  return payload;
}

export function hydrateDurableState(current, cloudPayload, fallback) {
  const migrated = migrateStorage(cloudPayload, fallback);
  const next = structuredClone(current);
  for (const key of DURABLE_KEYS) {
    if (migrated[key] !== undefined) next[key] = structuredClone(migrated[key]);
  }
  // These values belong to the dedicated economy tables. A generic progress
  // download must preserve the most recently loaded authoritative UI cache.
  next.progress.shells = current.progress.shells;
  next.inventory.unlockedModes = structuredClone(current.inventory.unlockedModes || []);
  next.inventory.unlockedWords = structuredClone(current.inventory.unlockedWords || []);
  next.inventory.boosters = structuredClone(current.inventory.boosters || {});
  next.inventory.homeOwned = structuredClone(current.inventory.homeOwned || []);
  const placeableItems = new Set([
    ...next.inventory.homeOwned,
    ...(next.inventory.relics || []),
  ]);
  next.inventory.homePlaced = (next.inventory.homePlaced || [])
    .filter(item => placeableItems.has(item));
  if (next.inventory.homeOutfit && !next.inventory.homeOwned.includes(next.inventory.homeOutfit)) {
    next.inventory.homeOutfit = null;
  }
  next.storageVersion = STORAGE_VERSION;
  return next;
}

export function durableStateFingerprint(state) {
  return JSON.stringify(serializeDurableState(state));
}

export function readSyncMeta() {
  const parsed = safeParse(localStorage.getItem(SYNC_META_KEY));
  return {
    ownerUserId: typeof parsed?.ownerUserId === 'string' ? parsed.ownerUserId : null,
    lastSyncedRevision: Number.isInteger(parsed?.lastSyncedRevision) ? parsed.lastSyncedRevision : 0,
    dirty: Boolean(parsed?.dirty),
    authPromptDismissed: Boolean(parsed?.authPromptDismissed),
  };
}

export function writeSyncMeta(patch) {
  const next = { ...readSyncMeta(), ...patch };
  localStorage.setItem(SYNC_META_KEY, JSON.stringify(next));
  return next;
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
    economy: {
      ...fallback.economy,
      ...(input.economy || {}),
      pendingRewards: Array.isArray(input.economy?.pendingRewards)
        ? input.economy.pendingRewards.slice(0, 100)
        : [],
    },
    session: { ...fallback.session, ...(input.session || {}) },
  };
  if (Number(input.storageVersion || 0) < 3 && Number(input.testShellGrantVersion || 0) > 0) {
    merged.progress.shells = 150;
  }
  if (Number(input.storageVersion || 0) < 5) {
    merged.progress.stars = { ...(merged.progress.stars || {}) };
    merged.progress.dungeons = { ...(merged.progress.dungeons || {}) };
    const legacyTimestamp = Number(input.updatedAt || 0) > 0
      ? new Date(Number(input.updatedAt)).toISOString()
      : new Date().toISOString();
    for (const [worldId, learnedCount] of Object.entries(merged.progress.learned || {})) {
      const earned = Number(learnedCount || 0) >= 4 ? 2 : Number(learnedCount || 0) > 0 ? 1 : 0;
      if (!earned || merged.progress.stars[worldId]?.explore) continue;
      merged.progress.stars[worldId] = {
        ...(merged.progress.stars[worldId] || {}),
        explore: {
          earned,
          bestAccuracy: earned >= 2 ? 1 : 0,
          completedAt: legacyTimestamp,
          masteryConfirmedAt: null,
        },
      };
    }
    merged.inventory.relics = Array.isArray(merged.inventory.relics) ? merged.inventory.relics : [];
  }
  if (Number(input.storageVersion || 0) < 6) {
    merged.progress.practice = {
      dayKey: '',
      totalStars: 0,
      runs: {},
      wordHistory: {},
      lastWordBatch: {},
      ...(merged.progress.practice || {}),
    };
  }
  if (Number(input.storageVersion || 0) < 8) {
    merged.progress.byLanguage = { ...(merged.progress.byLanguage || {}) };
    const current = merged.progress.byLanguage[target] || {};
    merged.progress.byLanguage[target] = {
      legacyDiscovered: Math.max(
        Number(current.legacyDiscovered || 0),
        Object.values(merged.progress.learned || {}).reduce((sum, value) => sum + Math.max(0, Number(value || 0)), 0)
      ),
      discovered: Array.isArray(current.discovered) ? current.discovered : [],
      activities: { ...(current.activities || {}) },
      cefr: { earned: [], assessments: {}, ...(current.cefr || {}) },
    };
    merged.inventory.languageBadges = Array.isArray(merged.inventory.languageBadges)
      ? merged.inventory.languageBadges
      : [];
  }
  delete merged.testShellGrantVersion;
  merged.storageVersion = STORAGE_VERSION;
  return merged;
}

export function clearStorage() {
  localStorage.removeItem(STORAGE_KEY);
}
