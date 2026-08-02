import { collections } from './content-multilingual.js';
import {
  createRouter, registerAction, bindActions, getState, setState,
  migrateLegacyState, levelFromXp, levelProgress,
  LANGUAGES, LANGUAGE_CODES, ensureLanguagePair, sourceLanguage, targetLanguage,
  languageMeta, languageValue, uiText, pairBadge,
  setSourceLanguage, setTargetLanguage, swapLanguages
} from './core/index.js';
import { installCoreLearningGames } from './games/core-learning.js';
import { registerAdvancedRoutes, registerAdvancedActions } from './games/advanced.js';
import { registerExperienceRoutes, registerExperienceActions } from './games/experiences.js';
import { renderShop, renderProfile, renderSettings, registerProgressionActions } from './screens/progression.js';
import { renderChildProfile, registerChildProfileActions } from './screens/child-profile.js';

const app=document.querySelector('#app');
const router=createRouter(app);
migrateLegacyState();
ensureLanguagePair();

const tr=(de,es,el=de)=>uiText(de,es,el);
const currentCollection=()=>collections.find(c=>c.id===getState().session.collectionId)||collections[0];
const collectionName=c=>languageValue(c,sourceLanguage());
const collectionSubtitle=c=>c[`subtitle${sourceLanguage()==='de'?'De':sourceLanguage()==='es'?'Es':'El'}`]||c.subtitleDe;

function top(backRoute=null){
  const s=getState();
  return `<header class="v3-top">
    <button class="icon" data-action="${backRoute?'navigate':'menu'}" ${backRoute?`data-route="${backRoute}"`:''}>${backRoute?'←':'☰'}</button>
    <div class="v3-brand"><i>🐢</i><strong>Chelonaki - Toulas Island</strong></div>
    <div class="top-actions">
      <button class="chip language-pair-chip" data-action="navigate" data-route="language-select">${pairBadge()}</button>
      <span class="wallet-mini">🐚 ${s.progress.shells}</span>
    </div>
  </header>`;
}

function nav(active){
  const items=[
    ['home','⌂',tr('Home','Inicio','Αρχική')],
    ['island','◉',tr('Insel','Isla','Νησί')],
    ['words','▤',tr('Wörter','Palabras','Λέξεις')],
    ['shop','♛',tr('Shop','Tienda','Κατάστημα')],
    ['profile','♙',tr('Profil','Perfil','Προφίλ')]
  ];
  return `<nav class="v3-nav">${items.map(([r,i,l])=>`<button class="${active===r?'active':''}" data-action="navigate" data-route="${r}"><span>${i}</span><small>${l}</small></button>`).join('')}</nav>`;
}

function progressCard(){
  const s=getState(),lv=levelFromXp(s.progress.xp),p=levelProgress(s.progress.xp);
  return `<section class="progress-card"><div class="progress-head"><strong>${tr('Level','Nivel','Επίπεδο')} ${lv}</strong><span>${tr(`Noch ${p.missing} XP bis Level ${lv+1}`,`Faltan ${p.missing} XP para nivel ${lv+1}`,`Απομένουν ${p.missing} XP για το επίπεδο ${lv+1}`)}</span></div><div class="bar"><i style="width:${p.percent}%"></i></div></section>`;
}

function renderComplete(title,reward,back='world'){
  return `<div class="v3-shell page">${top()}<section class="celebration"><img src="assets/illustrations/tula-welcome.svg" alt="Tula"><span class="eyebrow">${tr('ABENTEUER GESCHAFFT','AVENTURA COMPLETADA','Η ΠΕΡΙΠΕΤΕΙΑ ΟΛΟΚΛΗΡΩΘΗΚΕ')}</span><h1>${title}</h1><p>${tr('Tula ist stolz auf dich.','Tula está orgullosa de ti.','Η Τούλα είναι περήφανη για σένα.')}</p><div class="reward-row"><div><span>✨</span><strong>+${reward.xp}</strong><small>XP</small></div><div><span>🐚</span><strong>+${reward.shells}</strong><small>${tr('Muscheln','Conchas','Κοχύλια')}</small></div></div><button class="primary" data-action="navigate" data-route="home">⌂ ${tr('Zur Startseite','Ir al inicio','Στην αρχική')}</button><button class="secondary" data-action="navigate" data-route="${back}">${tr('Weitere Übung','Otro ejercicio','Άλλη άσκηση')}</button></section></div>`;
}

function languageOption(code,selected,action){
  const lang=languageMeta(code);
  return `<button class="language-option ${selected?'selected':''}" data-action="${action}" data-language="${code}"><span>${lang.flag}</span><div><strong>${lang.nativeName}</strong><small>${lang.name}</small></div><b>${selected?'✓':'›'}</b></button>`;
}

router.register('language-select',()=>{
  const source=sourceLanguage(),target=targetLanguage();
  return `<div class="v3-shell page language-select-page">${top('home')}
    <section class="page-title"><span class="eyebrow">${tr('SPRACHEN','IDIOMAS','ΓΛΩΣΣΕΣ')}</span><h1>${tr('Welche Sprache möchtest du lernen?','¿Qué idioma quieres aprender?','Ποια γλώσσα θέλεις να μάθεις;')}</h1><p>${tr('Wähle zuerst deine Sprache und danach die Lernsprache.','Elige primero tu idioma y después el idioma que quieres aprender.','Διάλεξε πρώτα τη γλώσσα σου και μετά τη γλώσσα που θέλεις να μάθεις.')}</p></section>
    <section class="language-pair-summary"><div><small>${tr('VON','DESDE','ΑΠΟ')}</small><strong>${languageMeta(source).flag} ${languageMeta(source).nativeName}</strong></div><button data-action="swap-languages" aria-label="Sprachen tauschen">⇄</button><div><small>${tr('NACH','HACIA','ΠΡΟΣ')}</small><strong>${languageMeta(target).flag} ${languageMeta(target).nativeName}</strong></div></section>
    <section class="language-block"><h2>${tr('Meine Sprache','Mi idioma','Η γλώσσα μου')}</h2>${LANGUAGE_CODES.map(code=>languageOption(code,source===code,'select-source-language')).join('')}</section>
    <section class="language-block"><h2>${tr('Ich lerne','Estoy aprendiendo','Μαθαίνω')}</h2>${LANGUAGE_CODES.filter(code=>code!==source).map(code=>languageOption(code,target===code,'select-target-language')).join('')}</section>
    <button class="primary" data-action="confirm-language-pair">${tr('Sprachreise starten','Empezar el viaje','Έναρξη ταξιδιού')} →</button>
  </div>${nav('profile')}`;
});

router.register('home',()=>{
  const s=getState();
  return `<div class="v3-shell page">${top()}<section class="hero-v3"><div class="hero-copy"><span class="eyebrow">TURTLE ISLAND</span><h1>${tr('Komm mit auf die Insel!','¡Ven a la isla!','Έλα μαζί μας στο νησί!')}</h1><p>${tr('Tula wartet auf dein nächstes Sprachabenteuer.','Tula espera tu próxima aventura lingüística.','Η Τούλα περιμένει την επόμενη γλωσσική σου περιπέτεια.')}</p><button class="chip" data-action="navigate" data-route="island">${tr('Insel entdecken','Descubrir la isla','Ανακάλυψε το νησί')} →</button></div><img class="tula-art" src="assets/illustrations/tula-welcome.svg" alt="Tula"></section><section class="stats-v3"><div><span>✨</span><strong>${s.progress.xp}</strong><small>XP</small></div><div><span>🐚</span><strong>${s.progress.shells}</strong><small>${tr('Muscheln','Conchas','Κοχύλια')}</small></div><div><span>🔥</span><strong>${s.progress.streak}</strong><small>${tr('Lerntage','Días','Ημέρες')}</small></div></section>${progressCard()}<section class="journey-grid">${collections.map(c=>`<button data-action="open-world" data-collection="${c.id}"><span>${c.icon}</span><div><strong>${collectionName(c)}</strong><small>${s.progress.learned[c.id]||0}/${c.words.length} ${tr('Wörter entdeckt','palabras descubiertas','λέξεις ανακαλύφθηκαν')}</small></div><b>→</b></button>`).join('')}<button data-action="start-adaptive"><span>🧠</span><div><strong>${tr('Schlaue Wiederholung','Repaso inteligente','Έξυπνη επανάληψη')}</strong><small>${tr('Persönliche Übungsrunde','Ronda personalizada','Προσωπική εξάσκηση')}</small></div><b>→</b></button><button data-action="navigate" data-route="speaking"><span>🎙️</span><div><strong>${tr('Sprechtrainer','Entrenador de voz','Εξάσκηση ομιλίας')}</strong><small>${tr('Anhören und nachsprechen','Escuchar y repetir','Άκου και επανάλαβε')}</small></div><b>→</b></button><button data-action="navigate" data-route="stories"><span>📖</span><div><strong>${tr('Mini-Geschichten','Mini historias','Μικρές ιστορίες')}</strong><small>${tr('Lesen, hören und entdecken','Leer, escuchar y descubrir','Διάβασε, άκου και ανακάλυψε')}</small></div><b>→</b></button></section></div>${nav('home')}`;
});

router.register('island',()=>{
  const s=getState(),lv=levelFromXp(s.progress.xp);
  return `<div class="v3-shell page">${top()}<section class="page-title"><span class="eyebrow">TURTLE ISLAND</span><h1>${tr('Wohin möchtest du?','¿Adónde quieres ir?','Πού θέλεις να πας;')}</h1></section><button class="island-card"><img src="assets/illustrations/turtle-island.svg" alt="Turtle Island"></button><section class="places island-place-grid"><button class="place" data-action="navigate" data-route="tula-home"><span>🏡</span><strong>${tr('Tulas Zuhause','Casa de Tula','Το σπίτι της Τούλα')}</strong><small>${tr('Einrichten & dekorieren','Decorar y organizar','Διακόσμηση')}</small></button>${collections.map((c,i)=>`<button class="place" data-action="open-world" data-collection="${c.id}"><span>${c.icon}</span><strong>${collectionName(c)}</strong><small>${collectionSubtitle(c)}</small><span class="place-number">${String(i+1).padStart(2,'0')}</span></button>`).join('')}<button class="place ${lv<7?'locked':''}" data-action="open-harbor"><span>⚓</span><strong>${tr('Hafen','Puerto','Λιμάνι')}</strong><small>${lv>=7?tr('Reise & Dialoge','Viajes y diálogos','Ταξίδια και διάλογοι'):tr('Ab Level 7','Desde nivel 7','Από επίπεδο 7')}</small></button><button class="place ${lv<10?'locked':''}" data-action="open-castle"><span>🏰</span><strong>${tr('Schloss','Castillo','Κάστρο')}</strong><small>${lv>=10?tr('Goldene Sprachprüfung','Prueba dorada','Χρυσή δοκιμασία'):tr('Ab Level 10','Desde nivel 10','Από επίπεδο 10')}</small></button></section></div>${nav('island')}`;
});

router.register('world',()=>{
  const s=getState(),c=currentCollection(),unlocked=s.inventory.unlockedModes;
  return `<div class="v3-shell page">${top('island')}<section class="place-hero"><span>${c.icon}</span><div><span class="eyebrow">${tr('LERNWELT','MUNDO DE APRENDIZAJE','ΚΟΣΜΟΣ ΜΑΘΗΣΗΣ')}</span><h1>${collectionName(c)}</h1><p>${collectionSubtitle(c)}</p></div></section><section class="world-instruction"><span class="world-step">1</span><div><strong>${tr('Wähle jetzt eine Übung','Elige ahora un ejercicio','Διάλεξε μια άσκηση')}</strong><small>${languageMeta(sourceLanguage()).flag} ${languageMeta(sourceLanguage()).short} → ${languageMeta(targetLanguage()).flag} ${languageMeta(targetLanguage()).short}</small></div></section><section class="mode-picker"><button data-action="navigate" data-route="explore"><span>👀</span><div><strong>${tr('Wörter entdecken','Descubrir palabras','Ανακάλυψε λέξεις')}</strong><small>${tr('Ansehen, hören und merken','Ver, escuchar y recordar','Δες, άκου και θυμήσου')}</small></div><b>→</b></button><button data-action="navigate" data-route="listening"><span>🎧</span><div><strong>${tr('Hör-Abenteuer','Aventura auditiva','Ακουστική περιπέτεια')}</strong><small>${tr('Hören und auswählen','Escuchar y elegir','Άκου και διάλεξε')}</small></div><b>→</b></button><button data-action="navigate" data-route="sentence"><span>✒️</span><div><strong>${tr('Satzwerkstatt','Taller de frases','Εργαστήριο προτάσεων')}</strong><small>${tr('Sätze in Reihenfolge bringen','Ordenar frases','Βάλε τις λέξεις στη σειρά')}</small></div><b>→</b></button><button data-action="${unlocked.includes('memory')?'start-memory':'navigate'}" ${unlocked.includes('memory')?'':'data-route="shop"'}><span>🏛️</span><div><strong>${tr('Palast-Memory','Memoria del palacio','Μνήμη του παλατιού')}</strong><small>${unlocked.includes('memory')?tr('Bild und Wort verbinden','Unir imagen y palabra','Ταίριαξε εικόνα και λέξη'):tr('In der Boutique freischalten','Desbloquear en boutique','Ξεκλείδωσε στο κατάστημα')}</small></div><b>${unlocked.includes('memory')?'→':'🔒'}</b></button><button data-action="${unlocked.includes('speed')?'start-speed':'navigate'}" ${unlocked.includes('speed')?'':'data-route="shop"'}><span>⏱️</span><div><strong>${tr('Goldene Minute','Minuto dorado','Χρυσό λεπτό')}</strong><small>${unlocked.includes('speed')?tr('45 Sekunden Sprachtempo','45 segundos de velocidad','45 δευτερόλεπτα ταχύτητας'):tr('In der Boutique freischalten','Desbloquear en boutique','Ξεκλείδωσε στο κατάστημα')}</small></div><b>${unlocked.includes('speed')?'→':'🔒'}</b></button></section></div>${nav(c.id==='library'?'words':'island')}`;
});

router.register('words',()=>{setState(d=>{d.session.collectionId='library';d.route={name:'world',params:{}};return d});return router.renderCurrent()});
router.register('shop',()=>renderShop({top,nav}));
router.register('profile',()=>renderProfile({top,nav,progressCard}));
router.register('settings',()=>renderSettings({top,nav}));
router.register('child-profile',()=>renderChildProfile({top,nav}));

installCoreLearningGames(router);
registerAdvancedRoutes(router,{top,nav,renderComplete});
registerExperienceRoutes(router,{top,nav});
router.setNotFound(()=>`<div class="v3-shell page">${top('home')}<section class="page-title"><h1>${tr('Seite nicht gefunden','Página no encontrada','Η σελίδα δεν βρέθηκε')}</h1></section></div>`);

registerAction('navigate',({data})=>router.navigate(data.route));
registerAction('open-world',({data})=>{setState(d=>{d.session.collectionId=data.collection;return d});router.navigate('world')});
registerAction('menu',()=>router.navigate('settings'));
registerAction('select-source-language',({data})=>{setSourceLanguage(data.language);router.renderCurrent()});
registerAction('select-target-language',({data})=>{setTargetLanguage(data.language);router.renderCurrent()});
registerAction('swap-languages',()=>{swapLanguages();router.renderCurrent()});
registerAction('confirm-language-pair',()=>router.navigate('home'));
registerAdvancedActions(router,{renderComplete});
registerExperienceActions(router);
registerProgressionActions(router);
registerChildProfileActions(router);
bindActions(app);
router.renderCurrent();
