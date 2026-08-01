import { getState, setState } from './store.js';

export function grantReward(reward = {}) {
  const baseXp = Math.max(0, Number(reward.xp || 0));
  const shells = Math.max(0, Number(reward.shells || 0));
  const state = getState();
  const doubleXp = Number(state.inventory.boosters.doubleXp || 0) > 0;
  const xp = doubleXp ? baseXp * 2 : baseXp;

  setState(draft => {
    draft.progress.xp += xp;
    draft.progress.shells += shells;
    if (reward.countDaily !== false) draft.progress.daily = Math.min(5, draft.progress.daily + 1);
    if (doubleXp) draft.inventory.boosters.doubleXp -= 1;
    return draft;
  });

  return { xp, shells, doubled: doubleXp };
}

export function spendShells(amount) {
  const cost = Math.max(0, Number(amount || 0));
  if (getState().progress.shells < cost) return false;
  setState(draft => { draft.progress.shells -= cost; return draft; });
  return true;
}

export function levelFromXp(xp = getState().progress.xp) {
  return Math.floor(Number(xp || 0) / 100) + 1;
}

export function levelProgress(xp = getState().progress.xp) {
  const current = Number(xp || 0) % 100;
  return { current, missing: current === 0 ? 100 : 100 - current, percent: current };
}
