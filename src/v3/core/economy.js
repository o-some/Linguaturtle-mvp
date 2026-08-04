import { Capacitor, registerPlugin } from '@capacitor/core';
import { getState, setState } from './store.js';
import { readSyncMeta } from './storage.js';
import {
  getAccountState,
  invokeAuthenticatedFunction,
  subscribeAccount,
} from './account.js';

export const STORE_PRODUCTS = Object.freeze([
  { id: 'com.linguaturtle.shells.150', shells: 150 },
  { id: 'com.linguaturtle.shells.450', shells: 450 },
  { id: 'com.linguaturtle.shells.1000', shells: 1000 },
]);

const nativeMock = globalThis.__LINGUATURTLE_NATIVE_MOCK__ || null;
const nativeCommerce = nativeMock || registerPlugin('LinguaTurtleCommerce');
const listeners = new Set();
let initialized = false;
let rewardFlushPromise = null;
let activeEconomyUserId = null;

let economyState = {
  native: Boolean(nativeMock) || Capacitor.isNativePlatform(),
  platform: nativeMock?.platform || Capacitor.getPlatform(),
  loading: false,
  products: [],
  walletRevision: 0,
  reversalDebt: 0,
  adRemaining: 0,
  config: {
    ios_rewarded_ads_enabled: false,
    android_rewarded_ads_enabled: true,
    reward_amount: 15,
    reward_limit_24h: 3,
  },
  error: '',
};

const emit = patch => {
  economyState = { ...economyState, ...patch };
  listeners.forEach(listener => listener(economyState));
  window.dispatchEvent(new CustomEvent('linguaturtle:economy-changed', { detail: economyState }));
  return economyState;
};

const eventId = () => crypto.randomUUID();

function applyEntitlements(entitlements = []) {
  setState(draft => {
    draft.inventory.unlockedModes = entitlements
      .filter(item => item.item_type === 'mode' && item.quantity > 0)
      .map(item => item.item_id.replace(/^mode:/, ''));
    draft.inventory.unlockedWords = entitlements
      .filter(item => item.item_type === 'word' && item.quantity > 0)
      .map(item => item.item_id.replace(/^word:/, ''));
    Object.keys(draft.inventory.boosters || {}).forEach(key => {
      draft.inventory.boosters[key] = 0;
    });
    for (const item of entitlements.filter(value => value.item_type === 'booster')) {
      draft.inventory.boosters[item.item_id.replace(/^booster:/, '')] = Number(item.quantity || 0);
    }
    draft.inventory.homeOwned = [...new Set([
      'plant',
      ...entitlements.filter(item => item.item_type === 'home' && item.quantity > 0)
        .map(item => item.item_id.replace(/^home:/, '')),
    ])];
    draft.inventory.homePlaced = (draft.inventory.homePlaced || [])
      .filter(item => draft.inventory.homeOwned.includes(item));
    if (!draft.inventory.homePlaced.includes('plant')) draft.inventory.homePlaced.push('plant');
    if (draft.inventory.homeOutfit && !draft.inventory.homeOwned.includes(draft.inventory.homeOutfit)) {
      draft.inventory.homeOutfit = null;
    }
    return draft;
  });
}

function applySnapshot(snapshot) {
  if (!snapshot?.wallet) return snapshot;
  setState(draft => {
    draft.progress.shells = Math.max(0, Number(snapshot.wallet.balance || 0));
    return draft;
  });
  applyEntitlements(snapshot.entitlements || []);
  emit({
    walletRevision: Number(snapshot.wallet.revision || 0),
    reversalDebt: Number(snapshot.wallet.reversalDebt || 0),
    adRemaining: Number(snapshot.adRemaining || 0),
    config: { ...economyState.config, ...(snapshot.config || {}) },
    error: '',
  });
  return snapshot;
}

export function preserveGuestEconomy(nextUserId) {
  const state = getState();
  if (state.economy?.guestSnapshot) return state.economy.guestSnapshot;
  if (readSyncMeta().ownerUserId === nextUserId) return null;
  const snapshot = {
    shells: Math.max(0, Number(state.progress.shells || 0)),
    unlockedModes: [...(state.inventory.unlockedModes || [])],
    unlockedWords: [...(state.inventory.unlockedWords || [])],
    boosters: { ...(state.inventory.boosters || {}) },
    homeOwned: [...(state.inventory.homeOwned || [])],
    homePlaced: [...(state.inventory.homePlaced || [])],
    homeOutfit: state.inventory.homeOutfit || null,
  };
  setState(draft => {
    draft.economy ??= { pendingRewards: [], guestSnapshot: null };
    draft.economy.guestSnapshot = snapshot;
    return draft;
  });
  return snapshot;
}

export function restoreGuestEconomy() {
  const snapshot = getState().economy?.guestSnapshot;
  setState(draft => {
    if (snapshot) {
      draft.progress.shells = Math.max(0, Number(snapshot.shells || 0));
      draft.inventory.unlockedModes = [...(snapshot.unlockedModes || [])];
      draft.inventory.unlockedWords = [...(snapshot.unlockedWords || [])];
      draft.inventory.boosters = { ...(snapshot.boosters || {}) };
      draft.inventory.homeOwned = [...new Set(['plant', ...(snapshot.homeOwned || [])])];
      draft.inventory.homePlaced = (snapshot.homePlaced || [])
        .filter(item => draft.inventory.homeOwned.includes(item));
      if (!draft.inventory.homePlaced.includes('plant')) draft.inventory.homePlaced.push('plant');
      draft.inventory.homeOutfit = snapshot.homeOutfit
        && draft.inventory.homeOwned.includes(snapshot.homeOutfit)
        ? snapshot.homeOutfit
        : null;
    } else {
      draft.progress.shells = 150;
      draft.inventory.unlockedModes = [];
      draft.inventory.unlockedWords = [];
      draft.inventory.boosters = { doubleXp: 0, hints: 0, jumps: 0 };
      draft.inventory.homeOwned = ['plant'];
      draft.inventory.homePlaced = ['plant'];
      draft.inventory.homeOutfit = null;
    }
    draft.economy ??= { pendingRewards: [], guestSnapshot: null };
    draft.economy.guestSnapshot = null;
    return draft;
  });
  return snapshot || null;
}

export function getEconomyState() {
  return economyState;
}

export function subscribeEconomy(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function isNativeCommerce() {
  return economyState.native;
}

export async function loadWallet() {
  if (!getAccountState().user) return null;
  emit({ loading: true, error: '' });
  try {
    const snapshot = await invokeAuthenticatedFunction('economy', { action: 'snapshot' });
    applySnapshot(snapshot);
    return snapshot;
  } catch (error) {
    emit({ error: error.message || 'Wallet konnte nicht geladen werden.' });
    throw error;
  } finally {
    emit({ loading: false });
  }
}

export async function refreshEntitlements() {
  return loadWallet();
}

export async function loadStoreProducts() {
  if (!economyState.native) return [];
  try {
    const result = await nativeCommerce.getProducts({
      productIds: STORE_PRODUCTS.map(product => product.id),
    });
    const byId = new Map((result.products || []).map(product => [product.id, product]));
    const products = STORE_PRODUCTS
      .filter(product => byId.has(product.id))
      .map(product => ({ ...product, ...byId.get(product.id) }));
    emit({ products, error: '' });
    return products;
  } catch (error) {
    emit({ products: [], error: error.message || 'Store-Produkte sind nicht verfügbar.' });
    return [];
  }
}

async function verifyAndFinish(purchase) {
  if (purchase.state === 'pending') return { pending: true };
  const result = await invokeAuthenticatedFunction('verify-purchase', purchase);
  if (result.verified && result.finishRequired !== false) {
    await nativeCommerce.finishPurchase({
      transactionId: purchase.transactionId,
      purchaseToken: purchase.purchaseToken,
    });
  }
  await loadWallet();
  return result;
}

export async function purchaseShells(productId) {
  if (!economyState.native) throw new Error('mobile_app_required');
  if (!getAccountState().user) throw new Error('parent_account_required');
  if (!STORE_PRODUCTS.some(product => product.id === productId)) throw new Error('invalid_product');
  emit({ loading: true, error: '' });
  try {
    const purchase = await nativeCommerce.purchase({
      productId,
      accountId: getAccountState().user.id,
    });
    return await verifyAndFinish(purchase);
  } catch (error) {
    emit({ error: error.message || 'Kauf fehlgeschlagen.' });
    throw error;
  } finally {
    emit({ loading: false });
  }
}

export async function syncPurchases() {
  if (!economyState.native) throw new Error('mobile_app_required');
  if (!getAccountState().user) throw new Error('parent_account_required');
  emit({ loading: true, error: '' });
  try {
    const result = await nativeCommerce.syncPurchases();
    const outcomes = [];
    for (const purchase of result.purchases || []) {
      if (purchase.state === 'purchased') outcomes.push(await verifyAndFinish(purchase));
    }
    await loadWallet();
    return outcomes;
  } finally {
    emit({ loading: false });
  }
}

export async function spendShells(itemId, localCost) {
  if (!getAccountState().user) {
    const cost = Math.max(0, Number(localCost || 0));
    if (getState().progress.shells < cost) return { ok: false, local: true };
    setState(draft => { draft.progress.shells -= cost; return draft; });
    return { ok: true, local: true };
  }
  try {
    const snapshot = await invokeAuthenticatedFunction('economy', {
      action: 'spend',
      itemId,
      eventId: eventId(),
    });
    applySnapshot(snapshot);
    return { ok: true, local: false, snapshot };
  } catch (error) {
    emit({ error: error.message || 'Muscheln konnten nicht ausgegeben werden.' });
    return { ok: false, local: false, error };
  }
}

async function flushGameplayRewards() {
  if (rewardFlushPromise) return rewardFlushPromise;
  if (!getAccountState().user || !navigator.onLine) return null;
  rewardFlushPromise = (async () => {
    let credited = false;
    while (getAccountState().user) {
      const currentUserId = getAccountState().user.id;
      const queued = (getState().economy?.pendingRewards || [])
        .find(item => item.userId === currentUserId);
      if (!queued) break;
      await invokeAuthenticatedFunction('economy', {
        action: 'gameplay_reward',
        eventId: queued.eventId,
        amount: queued.amount,
        reason: queued.reason,
      });
      setState(draft => {
        draft.economy.pendingRewards = (draft.economy.pendingRewards || [])
          .filter(item => item.userId !== queued.userId || item.eventId !== queued.eventId);
        return draft;
      });
      credited = true;
    }
    if (credited) await loadWallet();
    return credited;
  })().finally(() => { rewardFlushPromise = null; });
  return rewardFlushPromise;
}

export async function creditGameplayShells(amount, reason = 'learning', idempotencyKey = null) {
  const value = Math.max(0, Math.floor(Number(amount || 0)));
  if (!value || !getAccountState().user) return null;
  const normalizedReason = String(reason).toLowerCase().replace(/[^a-z0-9_-]/g, '-').slice(0, 40) || 'learning';
  const rewardEventId = idempotencyKey || eventId();
  const userId = getAccountState().user.id;
  setState(draft => {
    draft.economy ??= { pendingRewards: [] };
    draft.economy.pendingRewards ??= [];
    if (!draft.economy.pendingRewards.some(item => item.userId === userId && item.eventId === rewardEventId)) {
      draft.economy.pendingRewards.push({
        userId,
        eventId: rewardEventId,
        amount: Math.min(value, 300),
        reason: normalizedReason,
        createdAt: new Date().toISOString(),
      });
    }
    return draft;
  });
  return flushGameplayRewards();
}

export async function requestRewardedAd(audience = 'child') {
  if (!economyState.native) throw new Error('mobile_app_required');
  if (!getAccountState().user) throw new Error('parent_account_required');
  const flag = economyState.platform === 'ios'
    ? economyState.config.ios_rewarded_ads_enabled
    : economyState.config.android_rewarded_ads_enabled;
  if (!flag) throw new Error('ads_disabled');

  const ticket = await invokeAuthenticatedFunction('economy', {
    action: 'create_ad_ticket',
    audience: audience === 'adult' ? 'adult' : 'child',
  });
  if (!ticket.allowed) {
    const error = new Error('ad_daily_limit');
    error.nextAvailableAt = ticket.nextAvailableAt;
    throw error;
  }

  const proof = await nativeCommerce.showRewarded({
    ticketId: ticket.ticketId,
    audience,
  });
  if (!proof.completed) return { credited: false, completed: false };

  const result = await invokeAuthenticatedFunction('economy', {
    action: 'complete_ad_ticket',
    ticketId: ticket.ticketId,
    proof: { ...proof, platform: economyState.platform },
  });
  await loadWallet();
  return result;
}

export async function initializeEconomy() {
  if (initialized) return economyState;
  initialized = true;
  subscribeAccount(account => {
    const userId = account.user?.id || null;
    if (userId && userId !== activeEconomyUserId) {
      preserveGuestEconomy(userId);
      activeEconomyUserId = userId;
      flushGameplayRewards()
        .catch(() => null)
        .finally(() => loadWallet().catch(() => {}));
      if (economyState.native) loadStoreProducts().catch(() => {});
    } else if (!userId && activeEconomyUserId) {
      activeEconomyUserId = null;
      restoreGuestEconomy();
      emit({ walletRevision: 0, reversalDebt: 0, adRemaining: 0, error: '' });
    }
  });
  window.addEventListener('online', () => flushGameplayRewards().catch(() => {}));
  if (getAccountState().user) {
    activeEconomyUserId = getAccountState().user.id;
    await flushGameplayRewards().catch(() => null);
    await loadWallet().catch(() => {});
    if (economyState.native) await loadStoreProducts();
  }
  return economyState;
}
