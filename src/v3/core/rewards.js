import { getState, setState } from './store.js';
import { creditGameplayShells } from './economy.js';
import { recordQuestCompletion } from './master-stars.js';
import { recordPracticeCompletion } from './practice-rewards.js';

export const MILESTONE_LEVELS = Object.freeze([3, 5, 7, 10, 15, 20, 30, 40, 50, 60, 70, 80, 90, 100]);
export const MAX_ISLAND_LEVEL = 100;
export const WEEKLY_GOAL_TARGET = 15;
export const WEEKLY_GOAL_REWARD = 250;

export function currentDayKey(date = new Date()) {
  const local = new Date(date);
  const year = local.getFullYear();
  const month = String(local.getMonth() + 1).padStart(2, '0');
  const day = String(local.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dayOrdinal(dayKey) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dayKey || ''));
  if (!match) return null;
  return Math.floor(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) / 86400000);
}

function dayDistance(fromDayKey, toDayKey) {
  const from = dayOrdinal(fromDayKey);
  const to = dayOrdinal(toDayKey);
  return from === null || to === null ? null : to - from;
}

export function ensureDailyGoalState(date = new Date()) {
  const dayKey = currentDayKey(date);
  const state = getState();
  const storedDayKey = state.progress.dailyDate || '';
  const learningGap = dayDistance(state.progress.lastLearningDate, dayKey);
  const staleStreak = learningGap !== null && learningGap > 1;
  if (storedDayKey === dayKey && !staleStreak) {
    return {
      dayKey,
      completed: Number(state.progress.daily || 0),
      streak: Number(state.progress.streak || 0),
    };
  }

  const next = setState(draft => {
    // Older installs did not store a date. Keep today's visible progress once
    // during migration, then use the date key for every future reset.
    if (storedDayKey && storedDayKey !== dayKey) {
      draft.progress.daily = 0;
      draft.inventory.dailyGoalClaimed = false;
      draft.session.rewardNotices = (draft.session.rewardNotices || [])
        .filter(notice => notice.type !== 'daily');
    }
    draft.progress.dailyDate = dayKey;
    if (!draft.progress.lastLearningDate && Number(draft.progress.streak || 0) > 0) {
      draft.progress.lastLearningDate = dayKey;
    }
    if (staleStreak) draft.progress.streak = 0;
    return draft;
  });
  return {
    dayKey,
    completed: Number(next.progress.daily || 0),
    streak: Number(next.progress.streak || 0),
  };
}

export function currentWeekKey(date = new Date()) {
  const monday = new Date(date);
  monday.setHours(12, 0, 0, 0);
  const daysSinceMonday = (monday.getDay() + 6) % 7;
  monday.setDate(monday.getDate() - daysSinceMonday);
  const year = monday.getFullYear();
  const month = String(monday.getMonth() + 1).padStart(2, '0');
  const day = String(monday.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function ensureWeeklyGoalState() {
  const weekKey = currentWeekKey();
  const state = getState();
  if (state.progress.weekly?.weekKey === weekKey) return state.progress.weekly;
  return setState(draft => {
    draft.progress.weekly = { weekKey, completed: 0 };
    draft.inventory.weeklyGoalClaimed = false;
    draft.session.rewardNotices = (draft.session.rewardNotices || [])
      .filter(notice => notice.type !== 'weekly');
    return draft;
  }).progress.weekly;
}

export function grantReward(reward = {}, date = new Date()) {
  ensureDailyGoalState(date);
  const baseXp = Math.max(0, Number(reward.xp || 0));
  const shells = Math.max(0, Number(reward.shells || 0));
  const state = getState();
  const previousDaily = Number(state.progress.daily || 0);
  const dayKey = currentDayKey(date);
  const weekKey = currentWeekKey(date);
  const previousWeekly = state.progress.weekly?.weekKey === weekKey
    ? Number(state.progress.weekly.completed || 0)
    : 0;
  const previousLevel = levelFromXp(state.progress.xp);
  const doubleXp = Number(state.inventory.boosters.doubleXp || 0) > 0;
  const xp = doubleXp ? baseXp * 2 : baseXp;

  setState(draft => {
    if (draft.progress.weekly?.weekKey !== weekKey) {
      draft.progress.weekly = { weekKey, completed: 0 };
      draft.inventory.weeklyGoalClaimed = false;
      draft.session.rewardNotices = (draft.session.rewardNotices || [])
        .filter(notice => notice.type !== 'weekly');
    }
    draft.progress.xp += xp;
    draft.progress.shells += shells;
    if (reward.countDaily !== false) {
      if (draft.progress.lastLearningDate !== dayKey) {
        const continuedYesterday = dayDistance(draft.progress.lastLearningDate, dayKey) === 1;
        draft.progress.streak = continuedYesterday
          ? Math.max(1, Number(draft.progress.streak || 0)) + 1
          : 1;
        draft.progress.lastLearningDate = dayKey;
      }
      draft.progress.daily = Math.min(5, draft.progress.daily + 1);
      draft.progress.weekly.completed = Math.min(
        WEEKLY_GOAL_TARGET,
        Number(draft.progress.weekly.completed || 0) + 1
      );
    }
    if (doubleXp) draft.inventory.boosters.doubleXp -= 1;
    draft.session.rewardNotices = Array.isArray(draft.session.rewardNotices) ? draft.session.rewardNotices : [];

    if (
      previousDaily < 3
      && draft.progress.daily >= 3
      && !draft.inventory.dailyGoalClaimed
      && !draft.session.rewardNotices.some(notice => notice.type === 'daily')
    ) {
      draft.session.rewardNotices.push({ type: 'daily', shells: 25 });
    }

    if (
      previousWeekly < WEEKLY_GOAL_TARGET
      && draft.progress.weekly.completed >= WEEKLY_GOAL_TARGET
      && !draft.inventory.weeklyGoalClaimed
      && !draft.session.rewardNotices.some(notice => notice.type === 'weekly' && notice.weekKey === weekKey)
    ) {
      draft.session.rewardNotices.push({
        type: 'weekly',
        weekKey,
        shells: WEEKLY_GOAL_REWARD,
      });
    }

    const currentLevel = levelFromXp(draft.progress.xp);
    MILESTONE_LEVELS
      .filter(level => level > previousLevel && level <= currentLevel)
      .filter(level => !draft.inventory.claimedMilestones.includes(level))
      .forEach(level => {
        if (!draft.session.rewardNotices.some(notice => notice.type === 'level' && notice.level === level)) {
          draft.session.rewardNotices.push({ type: 'level', level });
        }
      });
    return draft;
  });
  if (shells > 0) creditGameplayShells(
    shells,
    reward.reason || 'learning',
    reward.idempotencyKey || null
  ).catch(() => {});

  const starResult = reward.starResult
    ? recordQuestCompletion(reward.starResult, date)
    : { starsGained: 0, questStars: 0, totalWorldStars: 0, dungeonUnlocked: false };
  const practiceResult = reward.practiceResult
    ? recordPracticeCompletion(reward.practiceResult, date)
    : { practiceStars: 0, practiceRunCount: 0, dailyPracticeStars: 0 };
  return { xp, shells, doubled: doubleXp, ...starResult, ...practiceResult };
}

export function spendShells(amount) {
  const cost = Math.max(0, Number(amount || 0));
  if (getState().progress.shells < cost) return false;
  setState(draft => { draft.progress.shells -= cost; return draft; });
  return true;
}

export function levelFromXp(xp = getState().progress.xp) {
  return Math.min(MAX_ISLAND_LEVEL, Math.floor(Number(xp || 0) / 100) + 1);
}

export function levelProgress(xp = getState().progress.xp) {
  if (Number(xp || 0) >= (MAX_ISLAND_LEVEL - 1) * 100) {
    return { current: 100, missing: 0, percent: 100, maxed: true };
  }
  const current = Number(xp || 0) % 100;
  return { current, missing: current === 0 ? 100 : 100 - current, percent: current, maxed: false };
}
