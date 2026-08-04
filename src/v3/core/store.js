import { readStorage, writeStorage } from './storage.js';

export const initialState = {
  storageVersion: 6,
  route: { name: 'home', params: {} },
  language: 'de',
  languages: { source: 'de', target: 'es' },
  profile: { id: 'default', name: 'Kind', stage: 'preschool', goal: 'balanced', support: 'normal', audience: 'child' },
  progress: {
    xp: 0,
    shells: 150,
    streak: 0,
    daily: 0,
    dailyDate: '',
    lastLearningDate: '',
    weekly: { weekKey: '', completed: 0 },
    learned: {},
    mastery: {},
    stars: {},
    dungeons: {},
    practice: {
      dayKey: '',
      totalStars: 0,
      runs: {},
      wordHistory: {},
      lastWordBatch: {},
    },
  },
  settings: { sound: true, motion: true, music: false },
  inventory: {
    unlockedModes: [],
    unlockedWords: [],
    boosters: { doubleXp: 0, hints: 0, jumps: 0 },
    claimedMilestones: [],
    dailyGoalClaimed: false,
    weeklyGoalClaimed: false,
    homeLayoutVersion: 0,
    homeOwned: ['plant'],
    homePlaced: ['plant'],
    homeOutfit: null,
    relics: [],
    homePositions: { plant: { x: 68, y: 22 } },
    tulaHomePosition: { x: 50, y: 70 },
  },
  economy: { pendingRewards: [], guestSnapshot: null },
  session: {
    activeGame: null,
    collectionId: 'garden',
    busy: false,
    error: null,
    rewardNotices: [],
    focusMilestone: null,
  },
};

let state = readStorage(initialState);

const listeners = new Set();

export function getState() { return state; }

export function setState(updater, options = {}) {
  const next = typeof updater === 'function' ? updater(structuredClone(state)) : { ...state, ...updater };
  state = next;
  if (options.persist !== false) writeStorage(state);
  listeners.forEach(listener => listener(state));
  return state;
}

export function patchState(path, value, options = {}) {
  return setState(draft => {
    const keys = path.split('.');
    let target = draft;
    keys.slice(0, -1).forEach(key => { target[key] ??= {}; target = target[key]; });
    target[keys.at(-1)] = value;
    return draft;
  }, options);
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function resetState() {
  state = structuredClone(initialState);
  writeStorage(state);
  listeners.forEach(listener => listener(state));
}
