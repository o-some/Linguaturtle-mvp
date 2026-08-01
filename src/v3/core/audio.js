import { getState } from './store.js';

let activeUtterance = null;

export function speak(text, language = 'de', options = {}) {
  if (!getState().settings.sound || !('speechSynthesis' in window) || !text) return false;
  stopAudio();
  activeUtterance = new SpeechSynthesisUtterance(String(text));
  activeUtterance.lang = language === 'es' ? 'es-ES' : 'de-DE';
  activeUtterance.rate = options.slow ? 0.65 : (options.rate || 0.82);
  activeUtterance.pitch = options.pitch || 1;
  speechSynthesis.speak(activeUtterance);
  return true;
}

export function stopAudio() {
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  activeUtterance = null;
}

export function isAudioEnabled() {
  return Boolean(getState().settings.sound);
}
