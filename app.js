const animals = [
  { id:'dog', emoji:'🐶', de:'Hund', es:'perro' },
  { id:'cat', emoji:'🐱', de:'Katze', es:'gato' },
  { id:'bird', emoji:'🐦', de:'Vogel', es:'pájaro' },
  { id:'fish', emoji:'🐟', de:'Fisch', es:'pez' },
  { id:'horse', emoji:'🐴', de:'Pferd', es:'caballo' },
  { id:'cow', emoji:'🐮', de:'Kuh', es:'vaca' },
  { id:'pig', emoji:'🐷', de:'Schwein', es:'cerdo' },
  { id:'rabbit', emoji:'🐰', de:'Kaninchen', es:'conejo' }
];

const state = {
  source: localStorage.getItem('lt-source') || 'de',
  screen: 'home',
  step: 0,
  score: 0,
  shells: Number(localStorage.getItem('lt-shells') || 0),
  order: []
};

const app = document.querySelector('#app');
const targetLang = () => state.source === 'de' ? 'es' : 'de';
const text = (animal, lang = targetLang()) => animal[lang];

function speak(value, lang = targetLang()) {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(value);
  utterance.lang = lang === 'de' ? 'de-DE' : 'es-ES';
  utterance.rate = .82;
  utterance.pitch = 1.08;
  speechSynthesis.speak(utterance);
}

function topbar() {
  return `<div class="topbar"><div class="brand">🐢 LinguaTurtle</div><button class="pill" data-action="home">🐚 ${state.shells}</button></div>`;
}

function renderHome() {
  app.innerHTML = `${topbar()}
    <section class="hero"><div class="tula">🐢</div><h1>Hallo, ich bin Tula!</h1><p>Wir entdecken gemeinsam erste Wörter auf Deutsch und Spanisch.</p></section>
    <section class="card"><h2>Welche Sprache sprichst du?</h2><div class="language-grid">
      <button class="big-button" data-language="de"><span class="flag">🇩🇪</span><strong>Deutsch</strong><span>Ich lerne Spanisch</span></button>
      <button class="big-button" data-language="es"><span class="flag">🇪🇸</span><strong>Español</strong><span>Aprendo alemán</span></button>
    </div></section>
    <p class="footer-note">Kostenloser MVP · ohne Anmeldung · Fortschritt bleibt auf diesem Gerät</p>`;
}

function startLesson() {
  state.order = [...animals].sort(() => Math.random() - .5).slice(0,5);
  state.step = 0; state.score = 0; state.screen = 'lesson'; renderLesson();
}

function renderLesson(feedback = null) {
  const current = state.order[state.step];
  const options = [current, ...animals.filter(a => a.id !== current.id).sort(() => Math.random()-.5).slice(0,3)].sort(() => Math.random()-.5);
  app.innerHTML = `${topbar()}
    <div class="lesson-title"><div class="progress-track"><div class="progress-bar" style="width:${(state.step/state.order.length)*100}%"></div></div><h2>Tula entdeckt die Tiere</h2><span class="small">Aufgabe ${state.step+1} von ${state.order.length}</span></div>
    <section class="card"><div class="prompt">Hör gut zu und tippe das richtige Tier an.</div><div style="text-align:center;margin-bottom:18px"><button class="audio-button" data-action="speak" aria-label="Wort wiederholen">🔊</button></div>
    <div class="animal-grid">${options.map(a => `<button class="animal-button ${feedback?.id===a.id ? feedback.className : ''}" data-animal="${a.id}"><span class="emoji">${a.emoji}</span><span class="label">${text(a, state.source)}</span></button>`).join('')}</div></section>`;
  setTimeout(() => speak(text(current)), 250);
}

function selectAnimal(id) {
  const current = state.order[state.step];
  if (id === current.id) {
    state.score++;
    renderLesson({id, className:'correct'});
    speak(text(current));
    setTimeout(() => { state.step++; state.step >= state.order.length ? finishLesson() : renderLesson(); }, 850);
  } else {
    renderLesson({id, className:'wrong'});
    setTimeout(() => renderLesson(), 650);
  }
}

function finishLesson() {
  state.shells += 1;
  localStorage.setItem('lt-shells', String(state.shells));
  state.screen = 'reward';
  app.innerHTML = `${topbar()}<section class="reward"><div class="shell">🐚</div><h1>Super gemacht!</h1><p>Du hast ${state.score} von ${state.order.length} Tieren richtig erkannt.</p><div class="stats"><span class="pill">⭐ ${state.score}</span><span class="pill">🐚 +1</span></div><button class="primary" data-action="restart">Noch einmal spielen</button></section>`;
  speak(state.source === 'de' ? 'Super gemacht!' : '¡Muy bien!', state.source);
}

app.addEventListener('click', e => {
  const language = e.target.closest('[data-language]')?.dataset.language;
  const action = e.target.closest('[data-action]')?.dataset.action;
  const animal = e.target.closest('[data-animal]')?.dataset.animal;
  if (language) { state.source = language; localStorage.setItem('lt-source', language); startLesson(); }
  if (action === 'home') { state.screen='home'; renderHome(); }
  if (action === 'restart') startLesson();
  if (action === 'speak') speak(text(state.order[state.step]));
  if (animal) selectAnimal(animal);
});

if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(()=>{});
renderHome();
