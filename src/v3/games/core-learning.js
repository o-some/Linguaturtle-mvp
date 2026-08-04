import { collections } from '../content-multilingual.js';
import {
  getState, setState, registerAction, speak, grantReward,
  sourceLanguage, targetLanguage, languageMeta, languageValue, uiText, flagImage, pairBadge
} from '../core/index.js?build=cinematic-worlds-1';
import { assets } from '../../config/assets.js?build=cinematic-worlds-1';

const shuffle = list => [...list].sort(() => Math.random() - .5);
const tr = (de, es, el = de, en = null) => uiText(de, es, el, en);
const collection = () => collections.find(item => item.id === getState().session.collectionId) || collections[0];
const availableWords = () => {
  const current = collection();
  const unlocked = new Set(getState().inventory.unlockedWords || []);
  return current.words.filter((word, index) => index < 4 || unlocked.has(word.id));
};
const currencyIcon = (className = 'currency-shell') => `<img class="${className}" src="${assets.rewards.currencyShell}" alt="">`;

const sentences = [
  { de: ['Der', 'Hund', 'rennt', '.'], es: ['El', 'perro', 'corre', '.'], el: ['Ο', 'σκύλος', 'τρέχει', '.'], en: ['The', 'dog', 'runs', '.'] },
  { de: ['Die', 'Katze', 'schläft', '.'], es: ['El', 'gato', 'duerme', '.'], el: ['Η', 'γάτα', 'κοιμάται', '.'], en: ['The', 'cat', 'sleeps', '.'] },
  { de: ['Ich', 'esse', 'einen', 'Apfel', '.'], es: ['Yo', 'como', 'una', 'manzana', '.'], el: ['Εγώ', 'τρώω', 'ένα', 'μήλο', '.'], en: ['I', 'eat', 'an', 'apple', '.'] },
  { de: ['Das', 'Wasser', 'ist', 'kalt', '.'], es: ['El', 'agua', 'está', 'fría', '.'], el: ['Το', 'νερό', 'είναι', 'κρύο', '.'], en: ['The', 'water', 'is', 'cold', '.'] },
  { de: ['Wo', 'ist', 'mein', 'Buch', '?'], es: ['¿', 'Dónde', 'está', 'mi', 'libro', '?'], el: ['Πού', 'είναι', 'το', 'βιβλίο', 'μου', ';'], en: ['Where', 'is', 'my', 'book', '?'] },
  { de: ['Die', 'Blume', 'ist', 'gelb', '.'], es: ['La', 'flor', 'es', 'amarilla', '.'], el: ['Το', 'λουλούδι', 'είναι', 'κίτρινο', '.'], en: ['The', 'flower', 'is', 'yellow', '.'] }
];

const game = {
  explore: { worldId: null, itemIds: [], heard: [] },
  listening: { items: [], step: 0, score: 0, firstTryCorrect: 0, currentAttempted: false, current: null },
  sentence: { rounds: [], step: 0, score: 0, firstTryCorrect: 0, currentAttempted: false, feedback: '', bank: [], built: [] },
  lastReward: null,
  lastTitle: ''
};

function top(backRoute = 'world') {
  const state = getState();
  return `<header class="v3-top"><button class="icon" data-action="navigate" data-route="${backRoute}" aria-label="${tr('Zurück', 'Volver', 'Πίσω', 'Back')}"><i class="ph-bold ph-arrow-left" aria-hidden="true"></i></button><div class="v3-brand"><img class="brand-avatar" src="${assets.characters.tula.poses.profile}" alt=""><strong>Tulas Island</strong></div><div class="top-actions"><button class="chip language-pair-chip" data-action="navigate" data-route="language-select">${pairBadge()}</button><span class="wallet-mini">${currencyIcon()}<span>${state.progress.shells}</span></span></div></header>`;
}

function nav(active) {
  const items = [
    ['home', 'house', tr('Home', 'Inicio', 'Αρχική', 'Home')],
    ['island', 'island', tr('Insel', 'Isla', 'Νησί', 'Island')],
    ['words', 'book-open-text', tr('Wörter', 'Palabras', 'Λέξεις', 'Words')],
    ['shop', 'storefront', tr('Shop', 'Tienda', 'Κατάστημα', 'Shop')],
    ['profile', 'user-circle', tr('Profil', 'Perfil', 'Προφίλ', 'Profile')]
  ];
  return `<nav class="v3-nav">${items.map(([route, icon, label]) => `<button class="${active === route ? 'active' : ''}" data-action="navigate" data-route="${route}" aria-label="${label}"><span class="nav-icon" aria-hidden="true"><i class="${active === route ? 'ph-fill' : 'ph-bold'} ph-${icon}"></i></span><small>${label}</small></button>`).join('')}</nav>`;
}

function markLearned(id, count) {
  setState(draft => {
    draft.progress.learned[id] = Math.max(Number(draft.progress.learned[id] || 0), count);
    return draft;
  });
}

function masterStarStrip(earned = 0) {
  return `<span class="master-star-strip" aria-label="${earned} ${tr('von 3 Meistersternen', 'de 3 estrellas maestras', 'από 3 αστέρια δεξιοτεχνίας', 'of 3 mastery stars')}">${[1, 2, 3].map(index => `<img class="${index <= earned ? 'earned' : ''}" src="${assets.rewards.xpStar}" alt="">`).join('')}</span>`;
}

function completion(title, reward) {
  game.lastTitle = title;
  game.lastReward = reward;
  const stars = Number(reward.questStars || 0);
  const newStars = Number(reward.starsGained || 0);
  const starMessage = newStars
    ? newStars === 1
      ? tr('Du hast einen neuen Meisterstern gewonnen!', '¡Has ganado una nueva estrella maestra!', 'Κέρδισες ένα νέο αστέρι δεξιοτεχνίας!', 'You earned a new mastery star!')
      : tr(`Du hast ${newStars} neue Meistersterne gewonnen!`, `¡Has ganado ${newStars} nuevas estrellas maestras!`, `Κέρδισες ${newStars} νέα αστέρια δεξιοτεχνίας!`, `You earned ${newStars} new mastery stars!`)
    : tr('Deine Meistersterne bleiben für immer.', 'Tus estrellas maestras se quedan para siempre.', 'Τα αστέρια δεξιοτεχνίας σου μένουν για πάντα.', 'Your mastery stars are yours forever.');
  return `<div class="v3-shell page">${top('world')}<section class="celebration star-celebration"><img src="${assets.characters.tula.poses.celebrating}" alt="Tula"><h1>${title}</h1><p>${starMessage}</p>${masterStarStrip(stars)}${reward.dungeonUnlocked ? `<div class="dungeon-unlocked-note"><i class="ph-bold ph-door-open" aria-hidden="true"></i><strong>${tr('Das Sternentor ist jetzt offen!', '¡El portal estelar está abierto!', 'Η πύλη των αστεριών άνοιξε!', 'The Star Gate is now open!')}</strong></div>` : ''}<div class="reward-row reward-row-single"><div><img class="reward-art" src="${assets.rewards.currencyShell}" alt=""><strong>+${reward.shells}</strong><small>${tr('Muscheln', 'Conchas', 'Κοχύλια', 'Shells')}</small></div></div><button class="primary" data-action="navigate" data-route="world">${tr('Weitere Übung', 'Otro ejercicio', 'Άλλη άσκηση', 'Another exercise')}</button><button class="secondary" data-action="navigate" data-route="home"><i class="ph-bold ph-house" aria-hidden="true"></i> ${tr('Zur Startseite', 'Ir al inicio', 'Στην αρχική', 'Back home')}</button></section></div>`;
}

function ensureExploreRun() {
  const current = collection();
  const itemIds = availableWords().map(word => word.id);
  if (game.explore.worldId === current.id && JSON.stringify(game.explore.itemIds) === JSON.stringify(itemIds)) return;
  game.explore = { worldId: current.id, itemIds, heard: [] };
}

function exploreRoute() {
  ensureExploreRun();
  const current = collection();
  const words = availableWords();
  const source = sourceLanguage();
  const target = targetLanguage();
  const heard = new Set(game.explore.heard);
  return `<div class="v3-shell page cinematic-subpage cinematic-words"><img class="cinematic-subpage-bg" src="${assets.backgrounds.cinematic.words}" alt="">${top()}<section class="page-title"><h1>${languageValue(current, source)}</h1><p>${tr('Höre dir jedes Wort an und sammle bis zu drei Meistersterne.', 'Escucha cada palabra y consigue hasta tres estrellas maestras.', 'Άκουσε κάθε λέξη και κέρδισε έως τρία αστέρια δεξιοτεχνίας.', 'Listen to every word and earn up to three mastery stars.')}</p><div class="language-direction-line">${flagImage(source)} ${languageMeta(source).nativeName} <i class="ph-bold ph-arrow-right" aria-hidden="true"></i> ${flagImage(target)} ${languageMeta(target).nativeName}</div></section><div class="explore-grid">${words.map(word => `<button class="${heard.has(word.id) ? 'word-heard' : ''}" data-action="speak-word" data-word="${word.id}"><span>${word.emoji}</span><strong>${languageValue(word, target)}</strong><small>${languageValue(word, source)}</small><em><i class="ph-bold ${heard.has(word.id) ? 'ph-check' : 'ph-speaker-high'}" aria-hidden="true"></i></em></button>`).join('')}</div><button class="primary" data-action="finish-explore"><span>${tr('Lernrunde abschließen', 'Terminar ronda', 'Ολοκλήρωση', 'Finish learning round')}</span> · <span class="currency-amount">${currencyIcon()}<span>+6</span></span></button></div>${nav(current.id === 'library' ? 'words' : 'island')}`;
}

function listeningRoute(router) {
  if (!game.listening.items.length) startListening(router, false);
  const current = game.listening.current;
  if (!current) return completion(tr('Hör-Abenteuer geschafft!', '¡Aventura auditiva completada!', 'Η ακουστική περιπέτεια ολοκληρώθηκε!', 'Listening adventure complete!'), game.lastReward || { xp: 0, shells: 0 });
  const words = availableWords();
  const source = sourceLanguage();
  const target = targetLanguage();
  const options = shuffle([current, ...shuffle(words.filter(word => word.id !== current.id)).slice(0, 3)]);
  const progress = (game.listening.step / game.listening.items.length) * 100;
  setTimeout(() => speak(languageValue(current, target), languageMeta(target).voice, { rate: .78 }), 100);
  return `<div class="v3-shell page">${top()}<section class="quiz-head"><div class="bar"><i style="width:${progress}%"></i></div><span>${game.listening.step + 1}/${game.listening.items.length}</span></section><section class="listen-card lesson-tula-card"><img class="lesson-tula" src="${assets.characters.tula.poses.listening}" alt="Tula"><div><h2>${tr('Hör gut zu', 'Escucha con atención', 'Άκου προσεκτικά', 'Listen closely')}</h2><p>${tr('Welches Bild gehört zum Wort?', '¿Qué imagen corresponde?', 'Ποια εικόνα ταιριάζει στη λέξη;', 'Which picture matches the word?')}</p><button data-action="repeat-listening"><i class="ph-bold ph-speaker-high" aria-hidden="true"></i> ${tr('Noch einmal', 'Otra vez', 'Ξανά', 'Again')}</button></div></section><div class="quiz-grid">${options.map(word => `<button data-action="answer-listening" data-answer="${word.id}"><span>${word.emoji}</span><strong>${languageValue(word, source)}</strong></button>`).join('')}</div></div>`;
}

function sentenceRoute(router) {
  if (!game.sentence.rounds.length) startSentence(router, false);
  if (game.sentence.step >= game.sentence.rounds.length) return completion(tr('Satzwerkstatt geschafft!', '¡Taller de frases completado!', 'Το εργαστήριο προτάσεων ολοκληρώθηκε!', 'Sentence workshop complete!'), game.lastReward || { xp: 0, shells: 0 });
  const source = sourceLanguage();
  const round = game.sentence.rounds[game.sentence.step];
  const sourceText = round[source].join(' ');
  const tile = item => `<button class="sentence-tile" data-action="move-sentence-tile" data-tile="${item.id}"><i class="ph-bold ph-dots-six-vertical" aria-hidden="true"></i>${item.text}</button>`;
  return `<div class="v3-shell page">${top()}<section class="sentence-guide-v3"><img src="${assets.characters.tula.poses.thinking}" alt="Tula"><div><h1>${tr('Baue den Satz', 'Construye la frase', 'Φτιάξε την πρόταση', 'Build the sentence')}</h1><p>${tr('Tippe die Wörter in der richtigen Reihenfolge an.', 'Toca las palabras en el orden correcto.', 'Πάτησε τις λέξεις με τη σωστή σειρά.', 'Tap the words in the correct order.')}</p></div></section><section class="sentence-example">${flagImage(source, 'language-sentence-flag')}<div><small>${tr('DEINE VORLAGE', 'TU EJEMPLO', 'ΤΟ ΠΑΡΑΔΕΙΓΜΑ ΣΟΥ', 'YOUR EXAMPLE')}</small><strong>${sourceText}</strong></div><button data-action="speak-sentence-source" aria-label="${tr('Satz anhören', 'Escuchar frase', 'Άκουσε την πρόταση', 'Listen to sentence')}"><i class="ph-bold ph-speaker-high" aria-hidden="true"></i></button></section><section class="sentence-zone">${game.sentence.built.length ? game.sentence.built.map(tile).join('') : `<div class="sentence-empty"><i class="ph-bold ph-arrow-down" aria-hidden="true"></i><strong>${tr('Baue deinen Satz hier', 'Construye tu frase aquí', 'Φτιάξε εδώ την πρόταση', 'Build your sentence here')}</strong><small>${tr('Tippe unten auf die Wortkarten.', 'Toca las palabras de abajo.', 'Πάτησε τις λέξεις παρακάτω.', 'Tap the word cards below.')}</small></div>`}</section>${game.sentence.feedback ? `<p class="learning-feedback" role="status">${game.sentence.feedback}</p>` : ''}<section class="sentence-bank">${game.sentence.bank.map(tile).join('')}</section><div class="sentence-tools"><button data-action="reset-sentence"><i class="ph-bold ph-shuffle" aria-hidden="true"></i> ${tr('Neu mischen', 'Mezclar', 'Ανακάτεμα', 'Shuffle again')}</button></div><button class="primary" data-action="check-sentence" ${game.sentence.bank.length ? 'disabled' : ''}>${tr('Satz prüfen', 'Comprobar frase', 'Έλεγχος πρότασης', 'Check sentence')} <i class="ph-bold ph-check" aria-hidden="true"></i></button></div>`;
}

export function installCoreLearningGames(router) {
  router.register('explore', exploreRoute);
  router.register('listening', () => listeningRoute(router));
  router.register('sentence', () => sentenceRoute(router));
  router.register('game-complete', () => completion(game.lastTitle, game.lastReward || { xp: 0, shells: 0 }));

  registerAction('speak-word', ({ data, control }) => {
    const word = collection().words.find(item => item.id === data.word);
    const target = targetLanguage();
    if (!word) return;
    game.explore.heard = [...new Set([...game.explore.heard, word.id])];
    speak(languageValue(word, target), languageMeta(target).voice, { rate: .78 });
    control.classList.add('word-heard');
    control.querySelector('em i')?.classList.replace('ph-speaker-high', 'ph-check');
  });
  registerAction('finish-explore', () => {
    const current = collection();
    const allWordsHeard = game.explore.itemIds.every(id => game.explore.heard.includes(id));
    markLearned(current.id, availableWords().length);
    game.lastReward = grantReward({
      xp: 20,
      shells: 6,
      starResult: { worldId: current.id, questId: 'explore', accuracy: allWordsHeard ? 1 : 0, allWordsHeard }
    });
    game.lastTitle = tr('Wörter entdeckt!', '¡Palabras descubiertas!', 'Ανακάλυψες λέξεις!', 'Words discovered!');
    game.explore = { worldId: null, itemIds: [], heard: [] };
    router.navigate('game-complete');
  });
  registerAction('start-listening', () => startListening(router, true));
  registerAction('repeat-listening', () => {
    const current = game.listening.current;
    const target = targetLanguage();
    if (current) speak(languageValue(current, target), languageMeta(target).voice, { rate: .78 });
  });
  registerAction('answer-listening', ({ data }) => answerListening(router, data.answer));
  registerAction('start-sentence', () => startSentence(router, true));
  registerAction('move-sentence-tile', ({ data }) => moveSentenceTile(router, data.tile));
  registerAction('reset-sentence', () => resetSentence(router));
  registerAction('speak-sentence-source', () => {
    const round = game.sentence.rounds[game.sentence.step];
    const source = sourceLanguage();
    if (round) speak(round[source].join(' '), languageMeta(source).voice, { rate: .78 });
  });
  registerAction('check-sentence', () => checkSentence(router));
}

function startListening(router, navigate = true) {
  game.listening = {
    items: shuffle(availableWords()).slice(0, 6),
    step: 0,
    score: 0,
    firstTryCorrect: 0,
    currentAttempted: false,
    current: null
  };
  game.listening.current = game.listening.items[0] || null;
  if (navigate) router.navigate('listening');
}

function answerListening(router, id) {
  const current = game.listening.current;
  if (!current) return;
  if (id !== current.id) {
    game.listening.currentAttempted = true;
    return;
  }
  if (!game.listening.currentAttempted) game.listening.firstTryCorrect++;
  game.listening.score++;
  game.listening.step++;
  grantReward({ xp: 10, shells: 2, countDaily: false });
  markLearned(collection().id, game.listening.step);
  if (game.listening.step >= game.listening.items.length) {
    const accuracy = game.listening.items.length ? game.listening.firstTryCorrect / game.listening.items.length : 0;
    const bonus = grantReward({
      xp: 15,
      shells: 6,
      starResult: { worldId: collection().id, questId: 'listening', accuracy }
    });
    game.lastReward = { ...bonus, xp: game.listening.score * 10 + bonus.xp, shells: game.listening.score * 2 + bonus.shells };
    game.lastTitle = tr('Hör-Abenteuer geschafft!', '¡Aventura auditiva completada!', 'Η ακουστική περιπέτεια ολοκληρώθηκε!', 'Listening adventure complete!');
    game.listening.current = null;
    router.navigate('game-complete');
    return;
  }
  game.listening.current = game.listening.items[game.listening.step];
  game.listening.currentAttempted = false;
  router.renderCurrent();
}

function startSentence(router, navigate = true) {
  game.sentence = {
    rounds: shuffle(sentences).slice(0, 5),
    step: 0,
    score: 0,
    firstTryCorrect: 0,
    currentAttempted: false,
    feedback: '',
    bank: [],
    built: []
  };
  prepareSentenceRound();
  if (navigate) router.navigate('sentence');
}

function prepareSentenceRound() {
  const round = game.sentence.rounds[game.sentence.step];
  if (!round) return;
  game.sentence.built = [];
  game.sentence.feedback = '';
  game.sentence.bank = shuffle(round[targetLanguage()].map((text, index) => ({ id: `${game.sentence.step}-${index}`, text })));
}

function moveSentenceTile(router, id) {
  let index = game.sentence.bank.findIndex(item => item.id === id);
  if (index >= 0) game.sentence.built.push(game.sentence.bank.splice(index, 1)[0]);
  else {
    index = game.sentence.built.findIndex(item => item.id === id);
    if (index >= 0) game.sentence.bank.push(game.sentence.built.splice(index, 1)[0]);
  }
  router.renderCurrent();
}

function resetSentence(router) {
  game.sentence.currentAttempted = true;
  prepareSentenceRound();
  router.renderCurrent();
}

function checkSentence(router) {
  const round = game.sentence.rounds[game.sentence.step];
  if (!round) return;
  const target = targetLanguage();
  const expected = round[target];
  const actual = game.sentence.built.map(item => item.text);
  if (JSON.stringify(expected) !== JSON.stringify(actual)) {
    game.sentence.currentAttempted = true;
    game.sentence.feedback = tr('Fast! Probiere die Reihenfolge noch einmal.', '¡Casi! Prueba el orden otra vez.', 'Σχεδόν! Δοκίμασε ξανά τη σειρά.', 'Almost! Try the order again.');
    router.renderCurrent();
    return;
  }
  if (!game.sentence.currentAttempted) game.sentence.firstTryCorrect++;
  game.sentence.score++;
  grantReward({ xp: 18, shells: 4, countDaily: false });
  speak(expected.join(' '), languageMeta(target).voice, { rate: .78 });
  game.sentence.step++;
  if (game.sentence.step >= game.sentence.rounds.length) {
    const accuracy = game.sentence.rounds.length ? game.sentence.firstTryCorrect / game.sentence.rounds.length : 0;
    const bonus = grantReward({
      xp: 20,
      shells: 5,
      starResult: { worldId: collection().id, questId: 'sentence', accuracy }
    });
    game.lastReward = { ...bonus, xp: game.sentence.score * 18 + bonus.xp, shells: game.sentence.score * 4 + bonus.shells };
    game.lastTitle = tr('Satzwerkstatt geschafft!', '¡Taller de frases completado!', 'Το εργαστήριο προτάσεων ολοκληρώθηκε!', 'Sentence workshop complete!');
    router.navigate('game-complete');
    return;
  }
  game.sentence.currentAttempted = false;
  prepareSentenceRound();
  router.renderCurrent();
}
