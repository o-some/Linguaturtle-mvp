import { collections } from '../content.js';
import {
  getState, setState, registerAction, speak, grantReward
} from '../core/index.js';

const shuffle = list => [...list].sort(() => Math.random() - 0.5);
const tr = (de, es) => getState().language === 'es' ? es : de;
const targetLanguage = () => getState().language === 'de' ? 'es' : 'de';
const collection = () => collections.find(item => item.id === getState().session.collectionId) || collections[0];

const sentences = [
  { de:['Der','Hund','rennt','.'], es:['El','perro','corre','.'] },
  { de:['Die','Katze','schläft','.'], es:['El','gato','duerme','.'] },
  { de:['Ich','esse','einen','Apfel','.'], es:['Yo','como','una','manzana','.'] },
  { de:['Das','Wasser','ist','kalt','.'], es:['El','agua','está','fría','.'] },
  { de:['Wo','ist','mein','Buch','?'], es:['¿','Dónde','está','mi','libro','?'] },
  { de:['Die','Blume','ist','gelb','.'], es:['La','flor','es','amarilla','.'] }
];

const game = {
  listening: { items:[], step:0, score:0, current:null },
  sentence: { rounds:[], step:0, score:0, bank:[], built:[] },
  lastReward: null,
  lastTitle: ''
};

function top(backRoute = 'world') {
  const state = getState();
  return `<header class="v3-top"><button class="icon" data-action="navigate" data-route="${backRoute}">←</button><div class="v3-brand"><i>🐢</i><strong>LinguaTurtle</strong></div><div class="top-actions"><button class="chip" data-action="toggle-language">${state.language==='de'?'🇩🇪 DE':'🇪🇸 ES'}</button><span class="wallet-mini">🐚 ${state.progress.shells}</span></div></header>`;
}

function nav(active) {
  const items=[['home','⌂',tr('Home','Inicio')],['island','◉',tr('Insel','Isla')],['words','▤',tr('Wörter','Palabras')],['shop','♛',tr('Shop','Tienda')],['profile','♙',tr('Profil','Perfil')]];
  return `<nav class="v3-nav">${items.map(([route,icon,label])=>`<button class="${active===route?'active':''}" data-action="navigate" data-route="${route}"><span>${icon}</span><small>${label}</small></button>`).join('')}</nav>`;
}

function markLearned(collectionId, count) {
  setState(draft => {
    draft.progress.learned[collectionId] = Math.max(Number(draft.progress.learned[collectionId] || 0), count);
    return draft;
  });
}

function completion(title, reward) {
  game.lastTitle = title;
  game.lastReward = reward;
  return `<div class="v3-shell page">${top('world')}<section class="celebration"><img src="assets/illustrations/tula-welcome.svg" alt="Tula"><span class="eyebrow">${tr('ABENTEUER GESCHAFFT','AVENTURA COMPLETADA')}</span><h1>${title}</h1><p>${tr('Tula ist stolz auf dich.','Tula está orgullosa de ti.')}</p><div class="reward-row"><div><span>✨</span><strong>+${reward.xp}</strong><small>XP</small></div><div><span>🐚</span><strong>+${reward.shells}</strong><small>${tr('Muscheln','Conchas')}</small></div></div><button class="primary" data-action="navigate" data-route="world">${tr('Weitere Übung','Otro ejercicio')}</button><button class="secondary" data-action="navigate" data-route="home">⌂ ${tr('Zur Startseite','Ir al inicio')}</button></section></div>`;
}

export function installCoreLearningGames(router) {
  router.register('explore', () => {
    const state=getState();
    const c=collection();
    return `<div class="v3-shell page">${top()}<section class="page-title"><span class="eyebrow">${tr('WÖRTER ENTDECKEN','DESCUBRIR PALABRAS')}</span><h1>${c[state.language]}</h1><p>${tr('Tippe eine Karte an, um das Wort zu hören.','Toca una tarjeta para escuchar la palabra.')}</p></section><div class="explore-grid">${c.words.map(word=>`<button data-action="speak-word" data-word="${word.id}"><span>${word.emoji}</span><strong>${word[targetLanguage()]}</strong><small>${word[state.language]}</small><em>🔊</em></button>`).join('')}</div><button class="primary" data-action="finish-explore">${tr('Lernrunde abschließen · 🐚 6','Terminar ronda · 🐚 6')}</button></div>${nav(c.id==='library'?'words':'island')}`;
  });

  router.register('listening', () => {
    if (!game.listening.items.length) startListening(router, false);
    const current=game.listening.current;
    if (!current) return completion(tr('Hör-Abenteuer geschafft!','¡Aventura auditiva completada!'), game.lastReward || {xp:0,shells:0});
    const c=collection();
    const options=shuffle([current,...shuffle(c.words.filter(word=>word.id!==current.id)).slice(0,3)]);
    const progress=(game.listening.step/game.listening.items.length)*100;
    setTimeout(()=>speak(current[targetLanguage()],targetLanguage(),{rate:.78}),100);
    return `<div class="v3-shell page">${top()}<section class="quiz-head"><div class="bar"><i style="width:${progress}%"></i></div><span>${game.listening.step+1}/${game.listening.items.length}</span></section><section class="listen-card"><span>🎧</span><h2>${tr('Hör gut zu','Escucha con atención')}</h2><p>${tr('Welches Bild gehört zum Wort?','¿Qué imagen corresponde?')}</p><button data-action="repeat-listening">🔊 ${tr('Noch einmal','Otra vez')}</button></section><div class="quiz-grid">${options.map(word=>`<button data-action="answer-listening" data-answer="${word.id}"><span>${word.emoji}</span><strong>${word[getState().language]}</strong></button>`).join('')}</div></div>`;
  });

  router.register('sentence', () => {
    if (!game.sentence.rounds.length) startSentence(router, false);
    if (game.sentence.step>=game.sentence.rounds.length) return completion(tr('Satzwerkstatt geschafft!','¡Taller de frases completado!'),game.lastReward||{xp:0,shells:0});
    const state=getState();
    const round=game.sentence.rounds[game.sentence.step];
    const source=round[state.language].join(' ');
    const tile=item=>`<button class="sentence-tile" data-action="move-sentence-tile" data-tile="${item.id}"><span>⠿</span>${item.text}</button>`;
    return `<div class="v3-shell page">${top()}<section class="sentence-guide-v3"><img src="assets/illustrations/tula-welcome.svg" alt="Tula"><div><span class="eyebrow">${tr('SATZWERKSTATT','TALLER DE FRASES')}</span><h1>${tr('Baue den Satz','Construye la frase')}</h1><p>${tr('Tippe die Wörter in der richtigen Reihenfolge an.','Toca las palabras en el orden correcto.')}</p></div></section><section class="sentence-example"><span>${state.language==='de'?'🇩🇪':'🇪🇸'}</span><div><small>${tr('DEINE VORLAGE','TU EJEMPLO')}</small><strong>${source}</strong></div><button data-action="speak-sentence-source">🔊</button></section><section class="sentence-zone">${game.sentence.built.length?game.sentence.built.map(tile).join(''):`<div class="sentence-empty"><b>↓</b><strong>${tr('Baue deinen Satz hier','Construye tu frase aquí')}</strong><small>${tr('Tippe unten auf die Wortkarten.','Toca las tarjetas de abajo.')}</small></div>`}</section><section class="sentence-bank">${game.sentence.bank.map(tile).join('')}</section><div class="sentence-tools"><button data-action="reset-sentence">↺ ${tr('Neu mischen','Mezclar')}</button></div><button class="primary" data-action="check-sentence" ${game.sentence.bank.length?'disabled':''}>${tr('Satz prüfen','Comprobar frase')} ✓</button></div>`;
  });

  router.register('game-complete', () => completion(game.lastTitle, game.lastReward || {xp:0,shells:0}));

  registerAction('speak-word', ({data}) => {
    const word=collection().words.find(item=>item.id===data.word);
    if(word) speak(word[targetLanguage()],targetLanguage(),{rate:.78});
  });

  registerAction('finish-explore', () => {
    const c=collection();
    markLearned(c.id,c.words.length);
    game.lastReward=grantReward({xp:20,shells:6});
    game.lastTitle=tr('Wörter entdeckt!','¡Palabras descubiertas!');
    router.navigate('game-complete');
  });

  registerAction('start-listening', () => startListening(router,true));
  registerAction('repeat-listening', () => {
    const current=game.listening.current;
    if(current) speak(current[targetLanguage()],targetLanguage(),{rate:.78});
  });
  registerAction('answer-listening', ({data}) => answerListening(router,data.answer));

  registerAction('start-sentence', () => startSentence(router,true));
  registerAction('move-sentence-tile', ({data}) => moveSentenceTile(router,data.tile));
  registerAction('reset-sentence', () => resetSentence(router));
  registerAction('speak-sentence-source', () => {
    const round=game.sentence.rounds[game.sentence.step];
    if(round) speak(round[getState().language].join(' '),getState().language,{rate:.78});
  });
  registerAction('check-sentence', () => checkSentence(router));
}

function startListening(router,navigate=true) {
  game.listening={items:shuffle(collection().words).slice(0,6),step:0,score:0,current:null};
  game.listening.current=game.listening.items[0]||null;
  if(navigate) router.navigate('listening');
}

function answerListening(router,id) {
  const current=game.listening.current;
  if(!current||id!==current.id) return;
  game.listening.score++;
  game.listening.step++;
  grantReward({xp:10,shells:2,countDaily:false});
  markLearned(collection().id,game.listening.step);
  if(game.listening.step>=game.listening.items.length){
    const bonus=grantReward({xp:15,shells:6});
    game.lastReward={xp:game.listening.score*10+bonus.xp,shells:game.listening.score*2+bonus.shells};
    game.lastTitle=tr('Hör-Abenteuer geschafft!','¡Aventura auditiva completada!');
    game.listening.current=null;
    router.navigate('game-complete');
    return;
  }
  game.listening.current=game.listening.items[game.listening.step];
  router.renderCurrent();
}

function startSentence(router,navigate=true) {
  game.sentence={rounds:shuffle(sentences).slice(0,5),step:0,score:0,bank:[],built:[]};
  prepareSentenceRound();
  if(navigate) router.navigate('sentence');
}

function prepareSentenceRound() {
  const round=game.sentence.rounds[game.sentence.step];
  if(!round) return;
  game.sentence.built=[];
  game.sentence.bank=shuffle(round[targetLanguage()].map((text,index)=>({id:`${game.sentence.step}-${index}`,text})));
}

function moveSentenceTile(router,id) {
  let index=game.sentence.bank.findIndex(item=>item.id===id);
  if(index>=0) game.sentence.built.push(game.sentence.bank.splice(index,1)[0]);
  else {
    index=game.sentence.built.findIndex(item=>item.id===id);
    if(index>=0) game.sentence.bank.push(game.sentence.built.splice(index,1)[0]);
  }
  router.renderCurrent();
}

function resetSentence(router) {
  prepareSentenceRound();
  router.renderCurrent();
}

function checkSentence(router) {
  const round=game.sentence.rounds[game.sentence.step];
  if(!round) return;
  const expected=round[targetLanguage()];
  const actual=game.sentence.built.map(item=>item.text);
  if(JSON.stringify(expected)!==JSON.stringify(actual)) return;
  game.sentence.score++;
  grantReward({xp:18,shells:4,countDaily:false});
  speak(expected.join(' '),targetLanguage(),{rate:.78});
  game.sentence.step++;
  if(game.sentence.step>=game.sentence.rounds.length){
    const bonus=grantReward({xp:20,shells:5});
    game.lastReward={xp:game.sentence.score*18+bonus.xp,shells:game.sentence.score*4+bonus.shells};
    game.lastTitle=tr('Satzwerkstatt geschafft!','¡Taller de frases completado!');
    router.navigate('game-complete');
    return;
  }
  prepareSentenceRound();
  router.renderCurrent();
}
