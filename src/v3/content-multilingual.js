import { collections as baseCollections } from './content.js';
import { greekCollections, greekWords } from './content-el.js';
import { englishCollections, englishWords } from './content-en.js';

export const collections = baseCollections.map(collection => ({
  ...collection,
  ...(greekCollections[collection.id] || {}),
  ...(englishCollections[collection.id] || {}),
  words: collection.words.map(word => ({
    ...word,
    el: greekWords[word.id] || word.de,
    en: englishWords[word.id] || word.de,
  })),
}));

export const allWords = collections.flatMap(collection =>
  collection.words.map(word => ({ ...word, collection: collection.id }))
);
