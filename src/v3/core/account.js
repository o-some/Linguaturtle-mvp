import { createClient } from '@supabase/supabase-js';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { getState, setState, subscribe, initialState } from './store.js';
import {
  STORAGE_VERSION,
  durableStateFingerprint,
  hydrateDurableState,
  readSyncMeta,
  serializeDurableState,
  writeSyncMeta,
} from './storage.js';

const runtimeConfig = globalThis.__LINGUATURTLE_SUPABASE__ || {};
const viteEnv = import.meta.env || {};
const supabaseUrl = runtimeConfig.url || viteEnv.VITE_SUPABASE_URL || '';
const supabaseKey = runtimeConfig.publishableKey || viteEnv.VITE_SUPABASE_PUBLISHABLE_KEY || '';
const configured = Boolean(
  supabaseUrl
  && supabaseKey
  && !supabaseUrl.includes('YOUR_PROJECT')
  && !supabaseKey.includes('YOUR_KEY')
);

const listeners = new Set();
let client = null;
let initialized = false;
let suppressDirtyTracking = false;
let syncTimer = null;
let lastFingerprint = durableStateFingerprint(getState());
let activeUserId = null;

let accountState = {
  configured,
  initialized: false,
  user: null,
  authView: 'signin',
  recovery: false,
  authStatus: 'guest',
  syncStatus: 'guest',
  message: '',
  error: '',
  conflict: null,
  shouldPrompt: false,
  lastSyncedAt: null,
};

function emit(patch = {}) {
  accountState = { ...accountState, ...patch };
  listeners.forEach(listener => listener(accountState));
  window.dispatchEvent(new CustomEvent('linguaturtle:account-changed', { detail: accountState }));
  return accountState;
}

function publicUser(user) {
  return user ? { id: user.id, email: user.email || '' } : null;
}

function errorMessage(error, fallback) {
  if (!error) return fallback;
  if (error.code === 'invalid_credentials') return 'E-Mail oder Passwort ist nicht korrekt.';
  if (error.code === 'email_not_confirmed') return 'Bitte bestätige zuerst die E-Mail-Adresse.';
  if (error.status === 429) return 'Zu viele Versuche. Bitte warte kurz und versuche es erneut.';
  return error.message || fallback;
}

function setBusy(message = '') {
  emit({ authStatus: 'busy', message, error: '' });
}

function authRedirectUrl() {
  return Capacitor.isNativePlatform()
    ? 'com.linguaturtle.app://auth-callback'
    : `${location.origin}${location.pathname}`;
}

async function handleNativeAuthUrl(value) {
  if (!client || !value?.startsWith('com.linguaturtle.app://auth-callback')) return;
  const url = new URL(value);
  const code = url.searchParams.get('code');
  if (code) {
    const { error } = await client.auth.exchangeCodeForSession(code);
    if (error) emit({ error: errorMessage(error, 'Anmeldelink konnte nicht geöffnet werden.') });
    return;
  }
  const hash = new URLSearchParams(url.hash.replace(/^#/, ''));
  const accessToken = hash.get('access_token');
  const refreshToken = hash.get('refresh_token');
  if (accessToken && refreshToken) {
    const { error } = await client.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) emit({ error: errorMessage(error, 'Anmeldelink konnte nicht geöffnet werden.') });
  }
}

function isMeaningfulLocalProgress() {
  return durableStateFingerprint(getState()) !== durableStateFingerprint(initialState);
}

async function fetchCloudRow() {
  const { data, error } = await client
    .from('user_progress')
    .select('payload,schema_version,revision,updated_at')
    .maybeSingle();
  if (error) throw error;
  return data;
}

function applyCloudRow(row, userId) {
  suppressDirtyTracking = true;
  setState(current => hydrateDurableState(current, row.payload, initialState));
  lastFingerprint = durableStateFingerprint(getState());
  suppressDirtyTracking = false;
  writeSyncMeta({
    ownerUserId: userId,
    lastSyncedRevision: Number(row.revision),
    dirty: false,
  });
  emit({
    syncStatus: 'synced',
    conflict: null,
    error: '',
    lastSyncedAt: row.updated_at || new Date().toISOString(),
  });
}

async function insertFirstCloudRow(userId) {
  const payload = serializeDurableState(getState());
  const sentFingerprint = JSON.stringify(payload);
  const { data, error } = await client
    .from('user_progress')
    .insert({
      user_id: userId,
      payload,
      schema_version: STORAGE_VERSION,
    })
    .select('payload,schema_version,revision,updated_at')
    .single();
  if (error) throw error;
  const changedDuringRequest = durableStateFingerprint(getState()) !== sentFingerprint;
  writeSyncMeta({
    ownerUserId: userId,
    lastSyncedRevision: Number(data.revision),
    dirty: changedDuringRequest,
  });
  emit({
    syncStatus: changedDuringRequest ? 'pending' : 'synced',
    conflict: null,
    error: '',
    lastSyncedAt: data.updated_at,
  });
  if (changedDuringRequest) scheduleSync();
  return data;
}

function createConflict(row, localPayload, reason = 'concurrent') {
  emit({
    syncStatus: 'conflict',
    conflict: {
      reason,
      cloud: row,
      localPayload,
      localUpdatedAt: new Date().toISOString(),
    },
    error: '',
  });
}

async function reconcileUser(user) {
  const meta = readSyncMeta();
  emit({ syncStatus: navigator.onLine ? 'syncing' : 'offline', conflict: null, error: '' });
  if (!navigator.onLine) return;

  try {
    const row = await fetchCloudRow();
    if (!row) {
      await insertFirstCloudRow(user.id);
      return;
    }

    const belongsToThisUser = meta.ownerUserId === user.id;
    if (!belongsToThisUser) {
      if (isMeaningfulLocalProgress()) {
        createConflict(row, serializeDurableState(getState()), meta.ownerUserId ? 'different-account' : 'first-login');
      } else {
        applyCloudRow(row, user.id);
      }
      return;
    }

    if (meta.dirty) {
      if (Number(meta.lastSyncedRevision) === Number(row.revision)) {
        await pushLocalProgress();
      } else {
        createConflict(row, serializeDurableState(getState()));
      }
      return;
    }

    applyCloudRow(row, user.id);
  } catch (error) {
    emit({
      syncStatus: navigator.onLine ? 'error' : 'offline',
      error: `Cloud-Synchronisierung nicht möglich: ${errorMessage(error, 'Unbekannter Fehler')}`,
    });
  }
}

async function activateUser(user) {
  activeUserId = user.id;
  emit({
    user: publicUser(user),
    authStatus: 'authenticated',
    shouldPrompt: false,
    message: '',
    error: '',
  });
  await reconcileUser(user);
}

async function pushLocalProgress() {
  if (!client || !accountState.user || !navigator.onLine) {
    emit({ syncStatus: accountState.user ? 'offline' : 'guest' });
    return false;
  }

  const meta = readSyncMeta();
  if (meta.ownerUserId && meta.ownerUserId !== accountState.user.id) {
    const row = await fetchCloudRow();
    createConflict(row, serializeDurableState(getState()), 'different-account');
    return false;
  }

  emit({ syncStatus: 'syncing', error: '' });
  try {
    if (!meta.lastSyncedRevision) {
      const row = await fetchCloudRow();
      if (row) {
        createConflict(row, serializeDurableState(getState()), 'first-login');
        return false;
      }
      await insertFirstCloudRow(accountState.user.id);
      return true;
    }

    const payload = serializeDurableState(getState());
    const sentFingerprint = JSON.stringify(payload);
    const { data, error } = await client
      .rpc('save_progress', {
        new_payload: payload,
        expected_revision: meta.lastSyncedRevision,
        new_schema_version: STORAGE_VERSION,
      })
      .single();
    if (error) throw error;

    const changedDuringRequest = durableStateFingerprint(getState()) !== sentFingerprint;
    writeSyncMeta({
      ownerUserId: accountState.user.id,
      lastSyncedRevision: Number(data.revision),
      dirty: changedDuringRequest,
    });
    emit({
      syncStatus: changedDuringRequest ? 'pending' : 'synced',
      conflict: null,
      error: '',
      lastSyncedAt: data.updated_at,
    });
    if (changedDuringRequest) scheduleSync();
    return true;
  } catch (error) {
    if (error.code === '40001' || String(error.message).includes('progress_revision_conflict')) {
      const row = await fetchCloudRow();
      createConflict(row, serializeDurableState(getState()));
      return false;
    }
    emit({
      syncStatus: navigator.onLine ? 'error' : 'offline',
      error: `Lokaler Stand bleibt erhalten. Cloud-Fehler: ${errorMessage(error, 'Unbekannter Fehler')}`,
    });
    return false;
  }
}

function scheduleSync() {
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    pushLocalProgress();
  }, 1200);
}

function handleStoreChange(state) {
  const fingerprint = durableStateFingerprint(state);
  if (fingerprint === lastFingerprint) return;
  lastFingerprint = fingerprint;
  if (suppressDirtyTracking) return;

  writeSyncMeta({ dirty: true });
  if (accountState.user) {
    emit({ syncStatus: navigator.onLine ? 'pending' : 'offline' });
    if (navigator.onLine) scheduleSync();
  }
}

export function getAccountState() {
  return accountState;
}

export async function invokeAuthenticatedFunction(name, body) {
  if (!client || !accountState.user) throw new Error('authentication_required');
  const { data, error } = await client.functions.invoke(name, { body });
  if (error) throw error;
  return data;
}

export function subscribeAccount(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setAuthView(authView) {
  emit({ authView, message: '', error: '' });
}

export function dismissAuthPrompt() {
  writeSyncMeta({ authPromptDismissed: true });
  emit({ shouldPrompt: false });
}

export async function initializeAccount() {
  if (initialized) return accountState;
  initialized = true;
  lastFingerprint = durableStateFingerprint(getState());
  subscribe(handleStoreChange);

  window.addEventListener('online', () => {
    emit({ syncStatus: accountState.user ? 'pending' : 'guest' });
    if (accountState.user) reconcileUser(accountState.user);
  });
  window.addEventListener('offline', () => {
    emit({ syncStatus: accountState.user ? 'offline' : 'guest' });
  });
  window.addEventListener('focus', () => {
    if (accountState.user && navigator.onLine) reconcileUser(accountState.user);
  });

  if (!configured) {
    return emit({ initialized: true, authStatus: 'unconfigured', syncStatus: 'guest' });
  }

  client = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  if (Capacitor.isNativePlatform()) {
    App.addListener('appUrlOpen', event => handleNativeAuthUrl(event.url));
  }

  client.auth.onAuthStateChange((event, session) => {
    setTimeout(async () => {
      if (event === 'PASSWORD_RECOVERY') {
        emit({ recovery: true, authView: 'recovery', shouldPrompt: false });
      }
      if (!session?.user) {
        if (event === 'SIGNED_OUT') {
          activeUserId = null;
          emit({
            user: null,
            authStatus: 'guest',
            syncStatus: 'guest',
            conflict: null,
          });
        }
        return;
      }
      if (session.user.id !== activeUserId) await activateUser(session.user);
      else emit({ user: publicUser(session.user), authStatus: 'authenticated' });
    }, 0);
  });

  const { data: { session }, error } = await client.auth.getSession();
  if (error) {
    return emit({
      initialized: true,
      authStatus: 'guest',
      error: errorMessage(error, 'Gespeicherte Anmeldung konnte nicht geladen werden.'),
    });
  }

  if (session?.user) await activateUser(session.user);
  const meta = readSyncMeta();
  return emit({
    initialized: true,
    authStatus: session?.user ? 'authenticated' : 'guest',
    shouldPrompt: !session?.user && !meta.authPromptDismissed,
  });
}

export async function signUp(email, password) {
  if (!client) return emit({ error: 'Supabase ist noch nicht konfiguriert.' });
  setBusy('Konto wird erstellt …');
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: authRedirectUrl() },
  });
  if (error) return emit({ authStatus: 'guest', message: '', error: errorMessage(error, 'Registrierung fehlgeschlagen.') });
  if (data.session?.user) await activateUser(data.session.user);
  return emit({
    authStatus: data.session ? 'authenticated' : 'guest',
    message: data.session ? 'Elternkonto wurde erstellt.' : 'Bitte öffne die Bestätigungs-E-Mail. Danach kannst du dich anmelden.',
    error: '',
  });
}

export async function signIn(email, password) {
  if (!client) return emit({ error: 'Supabase ist noch nicht konfiguriert.' });
  setBusy('Anmeldung läuft …');
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) return emit({ authStatus: 'guest', message: '', error: errorMessage(error, 'Anmeldung fehlgeschlagen.') });
  await activateUser(data.user);
  return accountState;
}

export async function requestPasswordReset(email) {
  if (!client) return emit({ error: 'Supabase ist noch nicht konfiguriert.' });
  setBusy('E-Mail wird angefordert …');
  const redirectTo = authRedirectUrl();
  const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo });
  return emit(error
    ? { authStatus: 'guest', message: '', error: errorMessage(error, 'E-Mail konnte nicht gesendet werden.') }
    : { authStatus: 'guest', message: 'Wenn die Adresse registriert ist, wurde ein Link zum Zurücksetzen gesendet.', error: '' });
}

export async function updatePassword(password) {
  if (!client) return emit({ error: 'Supabase ist noch nicht konfiguriert.' });
  setBusy('Passwort wird gespeichert …');
  const { error } = await client.auth.updateUser({ password });
  return emit(error
    ? { authStatus: accountState.user ? 'authenticated' : 'guest', error: errorMessage(error, 'Passwort konnte nicht gespeichert werden.') }
    : { authStatus: 'authenticated', recovery: false, authView: 'signin', message: 'Das neue Passwort ist gespeichert.', error: '' });
}

export async function signOut() {
  if (!client) return;
  if (readSyncMeta().dirty && navigator.onLine) await pushLocalProgress();
  const { error } = await client.auth.signOut();
  if (error) return emit({ error: errorMessage(error, 'Abmeldung fehlgeschlagen.') });
  activeUserId = null;
  return emit({
    user: null,
    authStatus: 'guest',
    syncStatus: 'guest',
    message: 'Abgemeldet. Der Fortschritt bleibt auf diesem Gerät.',
    error: '',
    conflict: null,
  });
}

export async function deleteAccount() {
  if (!client || !accountState.user) return;
  setBusy('Konto und Cloud-Daten werden gelöscht …');
  const { error } = await client.functions.invoke('delete-account', { body: {} });
  if (error) return emit({ authStatus: 'authenticated', error: errorMessage(error, 'Konto konnte nicht gelöscht werden.') });

  writeSyncMeta({
    ownerUserId: null,
    lastSyncedRevision: 0,
    dirty: true,
    authPromptDismissed: true,
  });
  await client.auth.signOut({ scope: 'local' });
  activeUserId = null;
  return emit({
    user: null,
    authStatus: 'guest',
    syncStatus: 'guest',
    message: 'Konto und Cloud-Daten wurden gelöscht. Der lokale Fortschritt bleibt erhalten.',
    error: '',
    conflict: null,
  });
}

export async function syncNow() {
  if (!accountState.user) return false;
  const meta = readSyncMeta();
  if (meta.dirty) return pushLocalProgress();
  await reconcileUser(accountState.user);
  return accountState.syncStatus === 'synced';
}

export async function resolveConflict(choice) {
  const conflict = accountState.conflict;
  if (!conflict || !accountState.user) return;
  if (choice === 'cloud') {
    applyCloudRow(conflict.cloud, accountState.user.id);
    return;
  }

  writeSyncMeta({
    ownerUserId: accountState.user.id,
    lastSyncedRevision: Number(conflict.cloud.revision),
    dirty: true,
  });
  emit({ conflict: null, syncStatus: 'pending' });
  await pushLocalProgress();
}
