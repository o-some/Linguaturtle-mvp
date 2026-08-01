import { getState, setState } from './store.js';
import { englishUi } from '../ui-en.js';
import { englishValue } from '../content-en.js';

export const LANGUAGES = {
  de: { code: 'de', flag: '🇩🇪', short: 'DE', name: 'Deutsch', nativeName: 'Deutsch', voice: 'de-DE' },
  es: { code: 'es', flag: '🇪🇸', short: 'ES', name: 'Español', nativeName: 'Español', voice: 'es-ES' },
  el: { code: 'el', flag: '🇬🇷', short: 'EL', name: 'Ελληνικά', nativeName: 'Ελληνικά', voice: 'el-GR' },
  en: { code: 'en', flag: '🇬🇧', short: 'EN', name: 'English', nativeName: 'English', voice: 'en-GB' },
};

export const LANGUAGE_CODES = Object.keys(LANGUAGES);

export function ensureLanguagePair() {
  const state = getState();
  const legacy = LANGUAGE_CODES.includes(state.language) ? state.language : 'de';
  const source = LANGUAGE_CODES.includes(state.languages?.source) ? state.languages.source : legacy;
  let target = LANGUAGE_CODES.includes(state.languages?.target) ? state.languages.target : (source === 'de' ? 'es' : 'de');
  if (source === target) target = LANGUAGE_CODES.find(code => code !== source) || 'es';
  if (state.languages?.source === source && state.languages?.target === target && state.language === source) return;
  setState(draft => {
    draft.languages = { source, target };
    draft.language = source;
    return draft;
  });
}

export const sourceLanguage = () => getState().languages?.source || getState().language || 'de';
export const targetLanguage = () => getState().languages?.target || (sourceLanguage() === 'de' ? 'es' : 'de');
export const uiLanguage = sourceLanguage;
export const languageMeta = code => LANGUAGES[code] || LANGUAGES.de;
export const languageValue = (item, code) => {
  if (!item) return '';
  if (item[code] != null) return item[code];
  if (code === 'en') return englishValue(item.de);
  return item.de ?? '';
};

export function uiText(de, es, el = de, en = null) {
  const values = { de, es, el, en: en ?? englishUi(de) };
  return values[uiLanguage()] ?? de;
}

export function pairBadge() {
  const source = languageMeta(sourceLanguage());
  const target = languageMeta(targetLanguage());
  return `${source.flag} ${source.short} → ${target.flag} ${target.short}`;
}

export function setSourceLanguage(code) {
  if (!LANGUAGE_CODES.includes(code)) return;
  setState(draft => {
    const currentTarget = draft.languages?.target || 'es';
    draft.languages = {
      source: code,
      target: currentTarget === code ? (LANGUAGE_CODES.find(item => item !== code) || 'de') : currentTarget,
    };
    draft.language = code;
    return draft;
  });
}

export function setTargetLanguage(code) {
  if (!LANGUAGE_CODES.includes(code) || code === sourceLanguage()) return;
  setState(draft => {
    draft.languages = { source: sourceLanguage(), target: code };
    return draft;
  });
}

export function swapLanguages() {
  setState(draft => {
    const source = draft.languages?.source || draft.language || 'de';
    const target = draft.languages?.target || (source === 'de' ? 'es' : 'de');
    draft.languages = { source: target, target: source };
    draft.language = target;
    return draft;
  });
}
