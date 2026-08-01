import { collections as baseCollections } from './content.js';
import { greekCollections, greekWords } from './content-el.js';
import { englishCollections, englishWords } from './content-en.js';
import { sourceLanguage } from './core/languages.js';

export const collections = baseCollections.map(collection => {
  const merged = {
    ...collection,
    ...(greekCollections[collection.id] || {}),
    ...(englishCollections[collection.id] || {}),
    words: collection.words.map(word => ({
      ...word,
      el: greekWords[word.id] || word.de,
      en: englishWords[word.id] || word.de,
    })),
  };
  const greekSubtitle = merged.subtitleEl;
  Object.defineProperty(merged, 'subtitleEl', {
    enumerable: true,
    configurable: true,
    get() {
      return sourceLanguage() === 'en' ? merged.subtitleEn : greekSubtitle;
    },
  });
  return merged;
});

export const allWords = collections.flatMap(collection =>
  collection.words.map(word => ({ ...word, collection: collection.id }))
);
