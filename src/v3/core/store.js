import { readStorage, writeStorage } from './storage.js';

const TEST_SHELL_GRANT_VERSION = 1;
const TEST_STARTING_SHELLS = 5000;

export const initialState = {
  storageVersion: 2,
  testShellGrantVersion: TEST_SHELL_GRANT_VERSION,
  route: { name: 'home', params: {} },
  language: 'de',
  languages: { source: 'de', target: 'es' },
  profile: { id: 'default', name: 'Kind', stage: 'preschool', goal: 'balanced', support: 'normal' },
  progress: { xp: 0, shells: TEST_STARTING_SHELLS, streak: 0, daily: 0, learned: {}, mastery: {} },
  settings: { sound: true, motion: true, music: false },
  inventory: {
    unlockedModes: [],
    boosters: { doubleXp: 0, hints: 0, jumps: 0 },
    claimedMilestones: [],
    homeLayoutVersion: 0,
    homeOwned: ['plant'],
    homePlaced: ['plant'],
    homeOutfit: null,
    homePositions: { plant: { x: 68, y: 22 } },
    tulaHomePosition: { x: 50, y: 70 },
  },
  session: { activeGame: null, collectionId: 'garden', busy: false, error: null },
};

let state = readStorage(initialState);

// One-time test grant for existing profiles. The version marker prevents shells
// from being replenished after every purchase or page reload.
if ((state.testShellGrantVersion || 0) < TEST_SHELL_GRANT_VERSION) {
  state = {
    ...state,
    testShellGrantVersion: TEST_SHELL_GRANT_VERSION,
    progress: {
      ...state.progress,
      shells: Math.max(Number(state.progress?.shells) || 0, TEST_STARTING_SHELLS),
    },
  };
  writeStorage(state);
}

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
