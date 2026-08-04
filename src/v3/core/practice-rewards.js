import { getState, setState } from './store.js';

const practiceDayKey = value => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const exerciseKey = (worldId, exerciseId) => `${worldId || 'global'}:${exerciseId || 'practice'}`;
const shuffle = list => [...list].sort(() => Math.random() - .5);

const normalizedPractice = (date = new Date(), state = getState()) => {
  const today = practiceDayKey(date);
  const stored = state.progress.practice || {};
  return {
    dayKey: today,
    totalStars: stored.dayKey === today ? Math.max(0, Number(stored.totalStars || 0)) : 0,
    runs: stored.dayKey === today ? { ...(stored.runs || {}) } : {},
    wordHistory: { ...(stored.wordHistory || {}) },
    lastWordBatch: { ...(stored.lastWordBatch || {}) },
  };
};

export function nextPracticeStars(worldId, exerciseId, date = new Date(), state = getState()) {
  const practice = normalizedPractice(date, state);
  const runs = Math.max(0, Number(practice.runs[exerciseKey(worldId, exerciseId)] || 0));
  return runs === 0 ? 3 : runs === 1 ? 2 : 1;
}

export function dailyPracticeSummary(date = new Date(), state = getState()) {
  const practice = normalizedPractice(date, state);
  return {
    dayKey: practice.dayKey,
    totalStars: practice.totalStars,
    runs: { ...practice.runs },
  };
}

export function recordPracticeCompletion(result = {}, date = new Date()) {
  const worldId = String(result.worldId || 'global');
  const exerciseId = String(result.exerciseId || 'practice');
  const key = exerciseKey(worldId, exerciseId);
  const practiceStars = nextPracticeStars(worldId, exerciseId, date);
  const today = practiceDayKey(date);

  const next = setState(draft => {
    const current = normalizedPractice(date, draft);
    current.runs[key] = Math.max(0, Number(current.runs[key] || 0)) + 1;
    current.totalStars += practiceStars;
    draft.progress.practice = current;
    return draft;
  });

  return {
    practiceStars,
    practiceRunCount: Number(next.progress.practice.runs[key] || 0),
    dailyPracticeStars: Number(next.progress.practice.totalStars || 0),
    practiceDayKey: today,
  };
}

export function takePracticeWordIds(worldId, exerciseId, wordIds, limit) {
  const pool = [...new Set((wordIds || []).filter(Boolean).map(String))];
  if (!pool.length) return [];
  const take = Math.max(1, Math.min(pool.length, Number(limit || pool.length)));
  const key = exerciseKey(worldId, exerciseId);
  const practice = normalizedPractice(new Date());
  const history = (practice.wordHistory[key] || []).filter(id => pool.includes(id));
  const lastBatch = new Set((practice.lastWordBatch[key] || []).filter(id => pool.includes(id)));
  const unseen = shuffle(pool.filter(id => !history.includes(id)));
  let selected = unseen.slice(0, take);
  let nextHistory = [...history, ...selected];

  if (selected.length < take) {
    const preferred = shuffle(pool.filter(id => !selected.includes(id) && !lastBatch.has(id)));
    const fallback = shuffle(pool.filter(id => !selected.includes(id) && lastBatch.has(id)));
    const fromNewCycle = [...preferred, ...fallback].slice(0, take - selected.length);
    selected = [...selected, ...fromNewCycle];
    nextHistory = fromNewCycle;
  } else if (nextHistory.length >= pool.length) {
    nextHistory = [];
  }

  setState(draft => {
    const current = normalizedPractice(new Date(), draft);
    current.wordHistory[key] = nextHistory;
    current.lastWordBatch[key] = selected;
    draft.progress.practice = current;
    return draft;
  });
  return selected;
}
