import { getState, setState } from './store.js';

const LEGACY_KEY = 'linguaturtle-v3-preview';
const MIGRATION_FLAG = 'linguaturtle-v3-core-migrated';

export function migrateLegacyState() {
  if (localStorage.getItem(MIGRATION_FLAG) === '1') return false;
  let legacy = null;
  try { legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) || 'null'); } catch { legacy = null; }
  if (!legacy || typeof legacy !== 'object') {
    localStorage.setItem(MIGRATION_FLAG, '1');
    return false;
  }

  const current = getState();
  const untouched = current.progress.xp === 0 && current.progress.shells === 0;
  if (!untouched) {
    localStorage.setItem(MIGRATION_FLAG, '1');
    return false;
  }

  setState(draft => {
    draft.language = legacy.lang === 'es' ? 'es' : 'de';
    draft.progress.xp = Number(legacy.xp || 0);
    draft.progress.shells = Number(legacy.shells || 0);
    draft.progress.streak = Number(legacy.streak || 0);
    draft.progress.daily = Number(legacy.daily || 0);
    draft.progress.learned = legacy.learned || {};
    draft.inventory.unlockedModes = Array.isArray(legacy.unlocked) ? legacy.unlocked : [];
    draft.inventory.boosters = { ...draft.inventory.boosters, ...(legacy.boosters || {}) };
    draft.inventory.claimedMilestones = Array.isArray(legacy.claimed) ? legacy.claimed : [];
    draft.session.collectionId = legacy.collection || 'garden';
    return draft;
  });
  localStorage.setItem(MIGRATION_FLAG, '1');
  return true;
}
