const lessons = [
  {
    id: 'animals',
    title: { de: 'Tiere', es: 'Animales' },
    subtitle: { de: 'Entdecke deine tierischen Freunde', es: 'Descubre tus amigos animales' },
    icon: '🦊',
    accent: 'sage',
    words: [
      { id:'dog', emoji:'🐶', de:'Hund', es:'perro' },
      { id:'cat', emoji:'🐱', de:'Katze', es:'gato' },
      { id:'bird', emoji:'🐦', de:'Vogel', es:'pájaro' },
      { id:'fish', emoji:'🐟', de:'Fisch', es:'pez' },
      { id:'horse', emoji:'🐴', de:'Pferd', es:'caballo' },
      { id:'cow', emoji:'🐮', de:'Kuh', es:'vaca' },
      { id:'pig', emoji:'🐷', de:'Schwein', es:'cerdo' },
      { id:'rabbit', emoji:'🐰', de:'Kaninchen', es:'conejo' }
    ]
  },
  {
    id: 'food',
    title: { de: 'Essen', es: 'Comida' },
    subtitle: { de: 'Leckere Wörter für jeden Tag', es: 'Palabras deliciosas para cada día' },
    icon: '🍓',
    accent: 'coral',
    words: [
      { id:'apple', emoji:'🍎', de:'Apfel', es:'manzana' },
      { id:'banana', emoji:'🍌', de:'Banane', es:'plátano' },
      { id:'bread', emoji:'🍞', de:'Brot', es:'pan' },
      { id:'milk', emoji:'🥛', de:'Milch', es:'leche' },
      { id:'cheese', emoji:'🧀', de:'Käse', es:'queso' },
      { id:'water', emoji:'💧', de:'Wasser', es:'agua' }
    ]
  },
  {
    id: 'colors',
    title: { de: 'Farben', es: 'Colores' },
    subtitle: { de: 'Eine Welt voller Farben', es: 'Un mundo lleno de colores' },
    icon: '🎨',
    accent: 'sky',
    words: [
      { id:'red', emoji:'🔴', de:'Rot', es:'rojo' },
      { id:'blue', emoji:'🔵', de:'Blau', es:'azul' },
      { id:'yellow', emoji:'🟡', de:'Gelb', es:'amarillo' },
      { id:'green', emoji:'🟢', de:'Grün', es:'verde' },
      { id:'black', emoji:'⚫', de:'Schwarz', es:'negro' },
      { id:'white', emoji:'⚪', de:'Weiß', es:'blanco' }
    ]
  }
];

const STORAGE = 'linguaturtle-v2';
const saved = JSON.parse(localStorage.getItem(STORAGE) || '{}');
const state = {
  source: saved.source || 'de',
  screen: 'home',
  lessonId: saved.lessonId || 'animals',
  mode: 'learn',
  step: 0,
  score: 0,
  streak: saved.streak || 1,
  xp: saved.xp || 0,
  shells: saved.shells || 0,
  completed: saved.completed || {},
  dailyProgress: saved.dailyProgress || 0,
  order: [],
  missed: [],
  locked: false,
  muted: saved.muted || false
};

const app = document.querySelector('#app');
const targetLang = () => state.source === 'de' ? 'es' : 'de';
const lesson = () => lessons.find(item => item.id === state.lessonId) || lessons[0];
const ui = {
  de: {
    greeting: 'Hallo, Entdecker!', sub: 'Was möchtest du heute lernen?', daily:'Tagesziel', xp:'Lernpunkte', streak:'Lerntage', continue:'Weiterlernen', explore:'Wörter entdecken', quiz:'Hör-Quiz', match:'Paare finden', journey:'Dein Lernpfad', choose:'Wähle eine Lernwelt', back:'Zurück', hear:'Anhören', next:'Weiter', correct:'Großartig!', tryAgain:'Fast geschafft', finish:'Lektion geschafft!', restart:'Noch einmal', home:'Zur Übersicht', instructionLearn:'Tippe auf das Wort und höre genau zu.', instructionQuiz:'Hör gut zu und wähle das richtige Bild.', instructionMatch:'Finde das passende Wort zum Bild.', earned:'Du hast neue Muscheln gesammelt.', question:'Aufgabe', of:'von', level:'Level', settings:'Audio', done:'Geschafft'
  },
  es: {
    greeting: '¡Hola, explorador!', sub: '¿Qué quieres aprender hoy?', daily:'Meta diaria', xp:'Puntos', streak:'Días', continue:'Seguir aprendiendo', explore:'Descubrir palabras', quiz:'Quiz de audio', match:'Encontrar parejas', journey:'Tu camino', choose:'Elige un mundo', back:'Atrás', hear:'Escuchar', next:'Siguiente', correct:'¡Genial!', tryAgain:'Casi', finish:'¡Lección completada!', restart:'Otra vez', home:'Vista general', instructionLearn:'Toca la palabra y escucha con atención.', instructionQuiz:'Escucha y elige la imagen correcta.', instructionMatch:'Encuentra la palabra que corresponde.', earned:'Has recogido nuevas conchas.', question:'Pregunta', of:'de', level:'Nivel', settings:'Audio', done:'Hecho'
  }
};
const t = key => ui[state.source][key];

function persist() {
  localStorage.setItem(STORAGE, JSON.stringify({
    source: state.source, lessonId: state.lessonId, streak: state.streak,
    xp: state.xp, shells: state.shells, completed: state.completed,
    dailyProgress: state.dailyProgress, muted: state.muted
  }));
}

function speak(value, lang = targetLang()) {
  if (state.muted || !('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(value);
  utterance.lang = lang === 'de' ? 'de-DE' : 'es-ES';
  utterance.rate = .78;
  utterance.pitch = 1.05;
  speechSynthesis.speak(utterance);
}

function shuffle(items) { return [...items].sort(() => Math.random() - .5); }
function level() { return Math.floor(state.xp / 100) + 1; }
function levelProgress() { return state.xp % 100; }

function topbar(showBack = false) {
  return `<header class="topbar">
    <button class="icon-button ${showBack ? '' : 'ghost-hidden'}" data-action="home" aria-label="${t('back')}">←</button>
    <div class="brand"><span class="brand-mark">🐢</span><span>LinguaTurtle</span></div>
    <button class="icon-button" data-action="mute" aria-label="${t('settings')}">${state.muted ? '🔇' : '🔊'}</button>
  </header>`;
}

function statsRow() {
  return `<section class="stats-row">
    <div class="stat-chip"><span>🔥</span><div><strong>${state.streak}</strong><small>${t('streak')}</small></div></div>
    <div class="stat-chip"><span>✨</span><div><strong>${state.xp}</strong><small>${t('xp')}</small></div></div>
    <div class="stat-chip"><span>🐚</span><div><strong>${state.shells}</strong><small>Muscheln</small></div></div>
  </section>`;
}

function renderHome() {
  state.screen = 'home';
  const current = lesson();
  app.innerHTML = `${topbar(false)}
    <section class="welcome-panel">
      <div class="welcome-copy"><span class="eyebrow">${t('level')} ${level()}</span><h1>${t('greeting')}</h1><p>${t('sub')}</p></div>
      <div class="tula-scene"><div class="sun-orb"></div><div class="tula">🐢</div><span class="sparkle s1">✦</span><span class="sparkle s2">✧</span></div>
    </section>
    ${statsRow()}
    <section class="goal-card">
      <div class="goal-head"><div><span>${t('daily')}</span><strong>${Math.min(state.dailyProgress, 5)} / 5</strong></div><span class="goal-badge">+${Math.max(0, 5-state.dailyProgress)} Aufgaben</span></div>
      <div class="progress-track"><div class="progress-bar" style="width:${Math.min(100,(state.dailyProgress/5)*100)}%"></div></div>
    </section>
    <section class="section-heading"><div><span class="eyebrow">${t('journey')}</span><h2>${t('choose')}</h2></div></section>
    <div class="world-list">
      ${lessons.map(item => {
        const done = state.completed[item.id] || 0;
        return `<button class="world-card ${item.accent}" data-lesson="${item.id}">
          <div class="world-icon">${item.icon}</div>
          <div class="world-copy"><strong>${item.title[state.source]}</strong><span>${item.subtitle[state.source]}</span><div class="mini-progress"><i style="width:${Math.min(100,done*25)}%"></i></div></div>
          <div class="world-meta"><span>${done ? `${done}× ${t('done')}` : 'Neu'}</span><b>›</b></div>
        </button>`;
      }).join('')}
    </div>
    <button class="continue-card" data-lesson="${current.id}"><span class="continue-icon">▶</span><div><small>${t('continue')}</small><strong>${current.title[state.source]}</strong></div><span>→</span></button>
    <p class="footer-note">Kostenlos · ohne Anmeldung · kindgerecht · lokal gespeichert</p>`;
}

function renderLessonMenu() {
  state.screen = 'menu';
  const current = lesson();
  app.innerHTML = `${topbar(true)}
    <section class="lesson-hero ${current.accent}">
      <div><span class="eyebrow">Lernwelt</span><h1>${current.title[state.source]}</h1><p>${current.subtitle[state.source]}</p></div>
      <div class="lesson-mascot">${current.icon}</div>
    </section>
    <section class="mode-grid">
      <button class="mode-card" data-mode="learn"><span class="mode-icon mint">◉</span><div><strong>${t('explore')}</strong><small>${current.words.length} Wörter ansehen und anhören</small></div><b>›</b></button>
      <button class="mode-card" data-mode="quiz"><span class="mode-icon blue">♫</span><div><strong>${t('quiz')}</strong><small>Hören, erkennen und Punkte sammeln</small></div><b>›</b></button>
      <button class="mode-card" data-mode="match"><span class="mode-icon gold">◇</span><div><strong>${t('match')}</strong><small>Bild und Wort richtig verbinden</small></div><b>›</b></button>
    </section>
    <section class="word-preview"><h2>Wörter in dieser Welt</h2><div class="preview-row">${current.words.slice(0,6).map(w => `<div><span>${w.emoji}</span><small>${w[state.source]}</small></div>`).join('')}</div></section>`;
}

function startMode(mode) {
  state.mode = mode;
  state.step = 0;
  state.score = 0;
  state.missed = [];
  state.locked = false;
  state.order = mode === 'learn' ? [...lesson().words] : shuffle(lesson().words).slice(0, Math.min(6, lesson().words.length));
  renderActivity();
}

function activityHeader() {
  const total = state.order.length;
  return `${topbar(true)}<section class="activity-head"><div class="progress-track"><div class="progress-bar" style="width:${(state.step/total)*100}%"></div></div><div><span>${t('question')} ${Math.min(state.step+1,total)} ${t('of')} ${total}</span><strong>⭐ ${state.score}</strong></div></section>`;
}

function renderActivity(feedback = null) {
  if (state.step >= state.order.length) return finishLesson();
  state.screen = 'activity';
  state.locked = false;
  const current = state.order[state.step];
  if (state.mode === 'learn') return renderLearn(current);
  if (state.mode === 'quiz') return renderQuiz(current, feedback);
  return renderMatch(current, feedback);
}

function renderLearn(current) {
  app.innerHTML = `${activityHeader()}
    <section class="instruction"><span class="instruction-icon">👂</span><p>${t('instructionLearn')}</p></section>
    <section class="flashcard">
      <span class="card-kicker">${lesson().title[state.source]}</span>
      <div class="flash-emoji">${current.emoji}</div>
      <h1>${current[targetLang()]}</h1>
      <p>${current[state.source]}</p>
      <button class="speak-large" data-action="speak" aria-label="${t('hear')}">🔊 <span>${t('hear')}</span></button>
    </section>
    <button class="primary-button" data-action="next">${t('next')} <span>→</span></button>`;
  setTimeout(() => speak(current[targetLang()]), 250);
}

function optionsFor(current) {
  return shuffle([current, ...shuffle(lesson().words.filter(w => w.id !== current.id)).slice(0,3)]);
}

function renderQuiz(current, feedback) {
  const options = optionsFor(current);
  app.innerHTML = `${activityHeader()}
    <section class="instruction"><span class="instruction-icon">🎧</span><p>${t('instructionQuiz')}</p></section>
    <button class="audio-orb" data-action="speak" aria-label="${t('hear')}"><span>🔊</span><small>${t('hear')}</small></button>
    <div class="answer-grid">${options.map(w => `<button class="answer-card ${feedback?.id===w.id ? feedback.type : ''}" data-word="${w.id}"><span>${w.emoji}</span><strong>${w[state.source]}</strong></button>`).join('')}</div>
    ${feedback ? feedbackPanel(feedback) : ''}`;
  if (!feedback) setTimeout(() => speak(current[targetLang()]), 250);
}

function renderMatch(current, feedback) {
  const options = optionsFor(current);
  app.innerHTML = `${activityHeader()}
    <section class="instruction"><span class="instruction-icon">🧩</span><p>${t('instructionMatch')}</p></section>
    <section class="match-focus"><span>${current.emoji}</span><small>${current[state.source]}</small></section>
    <div class="word-options">${options.map(w => `<button class="word-button ${feedback?.id===w.id ? feedback.type : ''}" data-word="${w.id}">${w[targetLang()]}</button>`).join('')}</div>
    ${feedback ? feedbackPanel(feedback) : ''}`;
}

function feedbackPanel(feedback) {
  return `<section class="feedback-panel ${feedback.type}"><span>${feedback.type === 'correct' ? '✓' : '↻'}</span><div><strong>${feedback.type === 'correct' ? t('correct') : t('tryAgain')}</strong><small>${feedback.message}</small></div></section>`;
}

function answerWord(id) {
  if (state.locked) return;
  state.locked = true;
  const current = state.order[state.step];
  const correct = id === current.id;
  if (correct) {
    state.score += 1;
    state.xp += 10;
    state.dailyProgress += 1;
    persist();
    renderActivity({ id, type:'correct', message:`${current[state.source]} = ${current[targetLang()]}` });
    speak(state.source === 'de' ? 'Großartig!' : '¡Genial!', state.source);
    setTimeout(() => { state.step += 1; renderActivity(); }, 1050);
  } else {
    state.missed.push(current.id);
    renderActivity({ id, type:'wrong', message:`${current[state.source]} = ${current[targetLang()]}` });
    setTimeout(() => renderActivity(), 900);
  }
}

function nextLearn() {
  state.xp += 5;
  state.dailyProgress += 1;
  state.score += 1;
  state.step += 1;
  persist();
  if (state.step < state.order.length) renderActivity(); else finishLesson();
}

function finishLesson() {
  state.screen = 'reward';
  const gainedShells = Math.max(1, Math.ceil(state.score / 3));
  state.shells += gainedShells;
  state.completed[state.lessonId] = (state.completed[state.lessonId] || 0) + 1;
  persist();
  const accuracy = Math.round((state.score / Math.max(1,state.order.length)) * 100);
  app.innerHTML = `${topbar(false)}
    <section class="reward-screen">
      <div class="reward-halo"><span>🐢</span><i>✨</i></div>
      <span class="eyebrow">${t('finish')}</span>
      <h1>${accuracy >= 80 ? t('correct') : t('finish')}</h1>
      <p>${t('earned')}</p>
      <div class="reward-stats">
        <div><span>⭐</span><strong>${state.score}/${state.order.length}</strong><small>Richtig</small></div>
        <div><span>✨</span><strong>+${state.mode==='learn' ? state.score*5 : state.score*10}</strong><small>XP</small></div>
        <div><span>🐚</span><strong>+${gainedShells}</strong><small>Muscheln</small></div>
      </div>
      <section class="level-card"><div><span>${t('level')} ${level()}</span><strong>${levelProgress()} / 100 XP</strong></div><div class="progress-track"><div class="progress-bar" style="width:${levelProgress()}%"></div></div></section>
      <button class="primary-button" data-action="restart">${t('restart')} <span>↻</span></button>
      <button class="secondary-button" data-action="home">${t('home')}</button>
    </section>`;
  speak(state.source === 'de' ? 'Super gemacht!' : '¡Muy bien!', state.source);
}

app.addEventListener('click', event => {
  const action = event.target.closest('[data-action]')?.dataset.action;
  const lessonId = event.target.closest('[data-lesson]')?.dataset.lesson;
  const mode = event.target.closest('[data-mode]')?.dataset.mode;
  const wordId = event.target.closest('[data-word]')?.dataset.word;

  if (lessonId) { state.lessonId = lessonId; persist(); renderLessonMenu(); }
  if (mode) startMode(mode);
  if (wordId) answerWord(wordId);
  if (action === 'home') renderHome();
  if (action === 'mute') { state.muted = !state.muted; persist(); state.screen === 'home' ? renderHome() : state.screen === 'menu' ? renderLessonMenu() : renderActivity(); }
  if (action === 'speak') { const current = state.order[state.step]; if (current) speak(current[targetLang()]); }
  if (action === 'next') nextLearn();
  if (action === 'restart') startMode(state.mode);
});

app.addEventListener('dblclick', event => {
  if (event.target.closest('.brand')) {
    state.source = state.source === 'de' ? 'es' : 'de';
    persist();
    renderHome();
  }
});

if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(()=>{});
renderHome();
