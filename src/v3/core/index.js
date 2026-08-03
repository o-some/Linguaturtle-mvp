export { createRouter, register, navigate, renderCurrent, setNotFound } from './router.js';
export { getState, setState, patchState, subscribe, resetState, initialState } from './store.js';
export { registerAction, bindActions, clearActions } from './events.js';
export { speak, stopAudio, isAudioEnabled } from './audio.js';
export { grantReward, spendShells, levelFromXp, levelProgress } from './rewards.js';
export { migrateLegacyState } from './legacy-migration.js';
export {
  LANGUAGES, LANGUAGE_CODES, ensureLanguagePair, sourceLanguage, targetLanguage,
  uiLanguage, languageMeta, languageValue, uiText, pairBadge,
  setSourceLanguage, setTargetLanguage, swapLanguages
} from './languages.js?build=word-price-1';
