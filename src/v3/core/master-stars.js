import { getState, setState } from './store.js';

export const STAR_QUESTS = Object.freeze(['explore', 'listening', 'sentence']);
export const STARS_PER_QUEST = 3;
export const STARS_PER_WORLD = STAR_QUESTS.length * STARS_PER_QUEST;
export const DUNGEON_UNLOCK_STARS = 6;
export const DUNGEON_SECRET_STARS = 8;
export const DUNGEON_GOLD_STARS = 9;
export const STAR_ACCURACY_TARGET = 0.8;

const blankQuest = () => ({
  earned: 0,
  bestAccuracy: 0,
  completedAt: null,
  masteryConfirmedAt: null,
});

const dayKey = value => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const questState = (state, worldId, questId) => ({
  ...blankQuest(),
  ...(state.progress.stars?.[worldId]?.[questId] || {}),
});

export function questStars(worldId, questId, state = getState()) {
  return Math.max(0, Math.min(STARS_PER_QUEST, Number(questState(state, worldId, questId).earned || 0)));
}

export function worldStarTotal(worldId, state = getState()) {
  return STAR_QUESTS.reduce((total, questId) => total + questStars(worldId, questId, state), 0);
}

export function totalMasterStars(state = getState()) {
  return Object.keys(state.progress.stars || {}).reduce((total, worldId) => total + worldStarTotal(worldId, state), 0);
}

export function isMasteryEligible(worldId, questId, date = new Date(), state = getState()) {
  const quest = questState(state, worldId, questId);
  return quest.earned >= 2
    && !quest.masteryConfirmedAt
    && Boolean(quest.completedAt)
    && dayKey(quest.completedAt) < dayKey(date);
}

export function recordQuestCompletion(result = {}, date = new Date()) {
  const worldId = String(result.worldId || '');
  const questId = String(result.questId || '');
  if (!worldId || !STAR_QUESTS.includes(questId)) {
    return { starsGained: 0, questStars: 0, totalWorldStars: 0, dungeonUnlocked: false };
  }

  const accuracy = Math.max(0, Math.min(1, Number(result.accuracy || 0)));
  const qualifiesForSecond = questId === 'explore'
    ? Boolean(result.allWordsHeard)
    : accuracy >= STAR_ACCURACY_TARGET;
  const state = getState();
  const before = questState(state, worldId, questId);
  const totalBefore = worldStarTotal(worldId, state);
  let target = Math.max(1, before.earned);
  if (qualifiesForSecond) target = Math.max(2, target);
  if (qualifiesForSecond && isMasteryEligible(worldId, questId, date, state)) target = 3;
  const now = date instanceof Date ? date : new Date(date);
  const timestamp = now.toISOString();

  setState(draft => {
    draft.progress.stars ??= {};
    draft.progress.stars[worldId] ??= {};
    const current = {
      ...blankQuest(),
      ...(draft.progress.stars[worldId][questId] || {}),
    };
    current.earned = Math.max(Number(current.earned || 0), target);
    current.bestAccuracy = Math.max(Number(current.bestAccuracy || 0), accuracy);
    current.completedAt ||= timestamp;
    if (current.earned >= 3) current.masteryConfirmedAt ||= timestamp;
    draft.progress.stars[worldId][questId] = current;

    const total = STAR_QUESTS.reduce((sum, id) => sum + Math.max(
      0,
      Math.min(STARS_PER_QUEST, Number(draft.progress.stars[worldId]?.[id]?.earned || 0))
    ), 0);
    if (total >= DUNGEON_UNLOCK_STARS) {
      draft.progress.dungeons ??= {};
      draft.progress.dungeons[worldId] = {
        ...(draft.progress.dungeons[worldId] || {}),
        unlockedAt: draft.progress.dungeons[worldId]?.unlockedAt || timestamp,
      };
    }
    return draft;
  });

  const afterState = getState();
  const totalAfter = worldStarTotal(worldId, afterState);
  return {
    starsGained: Math.max(0, questStars(worldId, questId, afterState) - Number(before.earned || 0)),
    questStars: questStars(worldId, questId, afterState),
    totalWorldStars: totalAfter,
    dungeonUnlocked: totalBefore < DUNGEON_UNLOCK_STARS && totalAfter >= DUNGEON_UNLOCK_STARS,
  };
}

export function dungeonStatus(worldId, state = getState()) {
  const stars = worldStarTotal(worldId, state);
  const stored = state.progress.dungeons?.[worldId] || {};
  return {
    ...stored,
    stars,
    unlocked: stars >= DUNGEON_UNLOCK_STARS || Boolean(stored.unlockedAt),
    secretAvailable: stars >= DUNGEON_SECRET_STARS,
    goldAvailable: stars >= DUNGEON_GOLD_STARS,
  };
}

export function recordDungeonCompletion(worldId, score, date = new Date()) {
  const status = dungeonStatus(worldId);
  if (!status.unlocked) return { ok: false, xp: 0, shells: 0, firstClear: false };
  const now = date instanceof Date ? date : new Date(date);
  const timestamp = now.toISOString();
  const today = dayKey(now);
  const firstClear = !status.firstClearedAt;
  const dailyReplay = !firstClear && status.lastReplayRewardDate !== today;
  const reward = firstClear
    ? { xp: 60, shells: 50 }
    : dailyReplay
      ? { xp: 15, shells: 5 }
      : { xp: 0, shells: 0 };

  setState(draft => {
    draft.progress.dungeons ??= {};
    const current = draft.progress.dungeons[worldId] || {};
    draft.progress.dungeons[worldId] = {
      ...current,
      unlockedAt: current.unlockedAt || timestamp,
      firstClearedAt: current.firstClearedAt || timestamp,
      bestScore: Math.max(Number(current.bestScore || 0), Number(score || 0)),
      lastReplayRewardDate: firstClear ? current.lastReplayRewardDate || null : (dailyReplay ? today : current.lastReplayRewardDate || null),
      secretClaimed: Boolean(current.secretClaimed || status.secretAvailable),
      goldClaimed: Boolean(current.goldClaimed || status.goldAvailable),
    };
    if (firstClear) {
      draft.inventory.relics ??= [];
      const relicId = `${worldId}-star-relic`;
      if (!draft.inventory.relics.includes(relicId)) draft.inventory.relics.push(relicId);
      if (worldId === 'garden') {
        draft.inventory.homePlaced ??= [];
        if (!draft.inventory.homePlaced.includes(relicId)) draft.inventory.homePlaced.push(relicId);
        draft.inventory.homePositions ??= {};
        draft.inventory.homePositions[relicId] ||= { x: 23, y: 29 };
      }
    }
    return draft;
  });

  return {
    ok: true,
    ...reward,
    firstClear,
    dailyReplay,
    secretClaimed: status.secretAvailable,
    goldClaimed: status.goldAvailable,
    idempotencyKey: firstClear ? `dungeon-${worldId}-first` : `dungeon-${worldId}-replay-${today}`,
  };
}
