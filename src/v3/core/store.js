import { readStorage, writeStorage } from './storage.js';

export const initialState = {
  storageVersion: 2,
  route: { name: 'home', params: {} },
  language: 'de',
  languages: { source: 'de', target: 'es' },
  profile: { id: 'default', name: 'Kind', stage: 'preschool', goal: 'balanced', support: 'normal' },
  progress: { xp: 0, shells: 0, streak: 0, daily: 0, learned: {}, mastery: {} },
  settings: { sound: true, motion: true, music: false },
  inventory: { unlockedModes: [], boosters: { doubleXp: 0, hints: 0, jumps: 0 }, claimedMilestones: [] },
  session: { activeGame: null, collectionId: 'garden', busy: false, error: null },
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
