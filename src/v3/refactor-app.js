import { collections } from './content.js';
import {
  createRouter, registerAction, bindActions, getState, setState,
  migrateLegacyState, levelFromXp, levelProgress
} from './core/index.js';

const app = document.querySelector('#app');
const router = createRouter(app);
migrateLegacyState();

const tr = (de, es) => getState().language === 'es' ? es : de;
const currentCollection = () => collections.find(item => item.id === getState().session.collectionId) || collections[0];

function top(backRoute = null) {
  const state = getState();
  return `<header class="v3-top">
    <button class="icon" data-action="${backRoute ? 'navigate' : 'menu'}" ${backRoute ? `data-route="${backRoute}"` : ''}>${backRoute ? '←' : '☰'}</button>
    <div class="v3-brand"><i>🐢</i><strong>LinguaTurtle</strong></div>
    <div class="top-actions">
      <button class="chip" data-action="toggle-language">${state.language === 'de' ? '🇩🇪 DE' : '🇪🇸 ES'}</button>
      <span class="wallet-mini">🐚 ${state.progress.shells}</span>
    </div>
  </header>`;
}

function nav(active) {
  const items = [
    ['home','⌂',tr('Home','Inicio')],
    ['island','◉',tr('Insel','Isla')],
    ['words','▤',tr('Wörter','Palabras')],
    ['shop','♛',tr('Shop','Tienda')],
    ['profile','♙',tr('Profil','Perfil')]
  ];
  return `<nav class="v3-nav">${items.map(([route,icon,label]) => `<button class="${active===route?'active':''}" data-action="navigate" data-route="${route}"><span>${icon}</span><small>${label}</small></button>`).join('')}</nav>`;
}

function progressCard() {
  const state = getState();
  const level = levelFromXp(state.progress.xp);
  const progress = levelProgress(state.progress.xp);
  return `<section class="progress-card"><div class="progress-head"><strong>${tr('Level','Nivel')} ${level}</strong><span>${tr(`Noch ${progress.missing} XP bis Level ${level+1}`,`Faltan ${progress.missing} XP para nivel ${level+1}`)}</span></div><div class="bar"><i style="width:${progress.percent}%"></i></div></section>`;
}

router.register('home', () => {
  const state = getState();
  return `<div class="v3-shell page">${top()}<section class="hero-v3"><div class="hero-copy"><span class="eyebrow">TURTLE ISLAND</span><h1>${tr('Komm mit auf die Insel!','¡Ven a la isla!')}</h1><p>${tr('Tula wartet auf dein nächstes Sprachabenteuer.','Tula espera tu próxima aventura lingüística.')}</p><button class="chip" data-action="navigate" data-route="island">${tr('Insel entdecken','Descubrir la isla')} →</button></div><img class="tula-art" src="assets/illustrations/tula-welcome.svg" alt="Tula"></section><section class="stats-v3"><div><span>✨</span><strong>${state.progress.xp}</strong><small>XP</small></div><div><span>🐚</span><strong>${state.progress.shells}</strong><small>${tr('Muscheln','Conchas')}</small></div><div><span>🔥</span><strong>${state.progress.streak}</strong><small>${tr('Lerntage','Días')}</small></div></section>${progressCard()}<div class="section-head"><div><span class="eyebrow">${tr('HEUTE','HOY')}</span><h2>${tr('Dein nächstes Abenteuer','Tu próxima aventura')}</h2></div></div><section class="journey-grid">${collections.map(c=>`<button data-action="open-world" data-collection="${c.id}"><span>${c.icon}</span><div><strong>${c[state.language]}</strong><small>${state.progress.learned[c.id]||0}/${c.words.length} ${tr('Wörter entdeckt','palabras descubiertas')}</small></div><b>→</b></button>`).join('')}</section></div>${nav('home')}`;
});

router.register('island', () => {
  const state = getState();
  return `<div class="v3-shell page">${top()}<section class="page-title"><span class="eyebrow">TURTLE ISLAND</span><h1>${tr('Wohin möchtest du?','¿Adónde quieres ir?')}</h1><p>${tr('Jeder Ort öffnet einen eigenen Teil deiner Sprachreise.','Cada lugar abre una parte distinta de tu viaje.')}</p></section><button class="island-card" type="button"><img src="assets/illustrations/turtle-island.svg" alt="Turtle Island"></button><div class="section-head"><div><span class="eyebrow">${tr('ORTE','LUGARES')}</span><h2>${tr('Wähle ein Abenteuer','Elige una aventura')}</h2></div></div><section class="places island-place-grid">${collections.map((c,index)=>`<button class="place" data-action="open-world" data-collection="${c.id}"><span>${c.icon}</span><strong>${c[state.language]}</strong><small>${c[state.language==='de'?'subtitleDe':'subtitleEs']}</small><span class="place-number">${String(index+1).padStart(2,'0')}</span></button>`).join('')}</section></div>${nav('island')}`;
});

router.register('world', () => {
  const state = getState();
  const c = currentCollection();
  return `<div class="v3-shell page">${top('island')}<section class="place-hero"><span>${c.icon}</span><div><span class="eyebrow">${tr('LERNWELT','MUNDO DE APRENDIZAJE')}</span><h1>${c[state.language]}</h1><p>${c[state.language==='de'?'subtitleDe':'subtitleEs']}</p></div></section><section class="world-instruction"><span class="world-step">1</span><div><strong>${tr('Wähle jetzt eine Übung','Elige ahora un ejercicio')}</strong><small>${tr('Wörter und Aufgaben erscheinen erst im gewählten Spielmodus.','Las palabras aparecen solo dentro del modo elegido.')}</small></div></section><section class="mode-picker"><button data-action="navigate" data-route="explore"><span>👀</span><div><strong>${tr('Wörter entdecken','Descubrir palabras')}</strong><small>${tr('Ansehen, hören und merken','Ver, escuchar y recordar')}</small></div><b>→</b></button><button data-action="navigate" data-route="listening"><span>🎧</span><div><strong>${tr('Hör-Abenteuer','Aventura auditiva')}</strong><small>${tr('Hören und das richtige Bild wählen','Escuchar y elegir la imagen correcta')}</small></div><b>→</b></button><button data-action="navigate" data-route="sentence"><span>✒️</span><div><strong>${tr('Satzwerkstatt','Taller de frases')}</strong><small>${tr('Wörter ordnen und Sätze bauen','Ordenar palabras y formar frases')}</small></div><b>→</b></button></section></div>${nav(c.id==='library'?'words':'island')}`;
});

['words','shop','profile','explore','listening','sentence'].forEach(name => {
  router.register(name, () => `<div class="v3-shell page">${top(name==='explore'||name==='listening'||name==='sentence'?'world':'home')}<section class="page-title"><span class="eyebrow">CORE REFACTOR</span><h1>${tr('Modul wird migriert','Módulo en migración')}</h1><p>${tr('Dieser Bereich wird als Nächstes an den neuen Core angeschlossen.','Esta sección será conectada al nuevo núcleo a continuación.')}</p></section></div>${nav(name==='words'?'words':name)}`);
});

router.setNotFound(() => `<div class="v3-shell page">${top('home')}<section class="page-title"><h1>${tr('Seite nicht gefunden','Página no encontrada')}</h1></section></div>`);

registerAction('navigate', ({ data }) => router.navigate(data.route));
registerAction('open-world', ({ data }) => {
  setState(draft => { draft.session.collectionId = data.collection; return draft; });
  router.navigate('world');
});
registerAction('toggle-language', () => {
  setState(draft => { draft.language = draft.language === 'de' ? 'es' : 'de'; return draft; });
  router.renderCurrent();
});
registerAction('menu', () => alert(tr('Elternbereich folgt nach der Core-Migration.','La zona de padres llegará tras la migración del núcleo.')));

bindActions(app);
router.renderCurrent();
