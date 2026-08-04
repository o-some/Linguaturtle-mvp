import { collections } from './content-multilingual.js';
import {
  createRouter, registerAction, bindActions, getState, setState, subscribe,
  migrateLegacyState, levelFromXp, levelProgress, spendEconomyShells, creditGameplayShells, speak,
  MILESTONE_LEVELS, WEEKLY_GOAL_TARGET, WEEKLY_GOAL_REWARD,
  currentDayKey, ensureDailyGoalState, currentWeekKey, ensureWeeklyGoalState,
  LANGUAGES, LANGUAGE_CODES, ensureLanguagePair, sourceLanguage, targetLanguage,
  languageMeta, languageValue, uiText, flagImage, pairBadge,
  setSourceLanguage, setTargetLanguage, swapLanguages, nextPracticeStars, dailyPracticeSummary
} from './core/index.js?build=cinematic-worlds-1';
import { installCoreLearningGames } from './games/core-learning.js?build=cinematic-worlds-1';
import { registerAdvancedRoutes, registerAdvancedActions } from './games/advanced.js?build=cinematic-worlds-1';
import { registerExperienceRoutes, registerExperienceActions } from './games/experiences.js?build=cinematic-worlds-1';
import { registerStarDungeon, renderQuestStarBadge, renderStarGate } from './games/star-dungeon.js?build=master-stars-1';
import { renderShop, renderProfile, renderSettings, registerProgressionActions } from './screens/progression.js?build=cinematic-worlds-1';
import { renderChildProfile, registerChildProfileActions } from './screens/child-profile.js?build=cinematic-worlds-1';
import { assets } from '../config/assets.js?build=cinematic-worlds-1';
import { getAccountState, initializeAccount, subscribeAccount } from './core/account.js';
import { initializeEconomy, subscribeEconomy } from './core/economy.js';

const app=document.querySelector('#app');
const router=createRouter(app);
migrateLegacyState();
ensureLanguagePair();
ensureDailyGoalState();
ensureWeeklyGoalState();

const tr=(de,es,el=de,en=null)=>uiText(de,es,el,en);
const WORD_COST=1;
const STARTER_WORDS_PER_COLLECTION=4;
const currentCollection=()=>collections.find(c=>c.id===getState().session.collectionId)||collections[0];
const wordCatalogCollection=()=>collections.find(c=>c.id===(getState().session.wordCollectionId||'garden'))||collections[0];
const collectionName=c=>languageValue(c,sourceLanguage());
const collectionSubtitle=c=>c[`subtitle${sourceLanguage()==='de'?'De':sourceLanguage()==='es'?'Es':'El'}`]||c.subtitleDe;
const worldArtwork=id=>assets.backgrounds.worlds[id]||null;
const WORLD_LEVELS=Object.freeze(Object.fromEntries(collections.map((c,i)=>[c.id,i+1])));
const worldLevel=id=>WORLD_LEVELS[id]||1;
const levelLabel=level=>`${tr('Ab Level','Desde el nivel','Από το επίπεδο')} ${level}`;
const mapSpotClass=id=>`map-spot-${id}`;
const rewardArt=(src,alt='')=>`<img class="reward-art" src="${src}" alt="${alt}">`;
const currencyIcon=(className='currency-shell')=>`<img class="${className}" src="${assets.rewards.currencyShell}" alt="">`;
const currencyAmount=(amount,prefix='')=>`<span class="currency-amount">${currencyIcon()}<span>${prefix}${amount}</span></span>`;
const modeArt=(id,alt='')=>`<img class="mode-art" src="${assets.cards.modes[id]}" alt="${alt}">`;
const safeText=value=>String(value??'').replace(/[&<>"']/g,char=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[char]);
const cinematicBackground=(src)=>`<img class="cinematic-subpage-bg" src="${src}" alt="">`;
const milestoneChest=level=>level<=3
  ? assets.rewards.chests.bronze
  : level<=7
    ? assets.rewards.chests.silver
    : level<=15
      ? assets.rewards.chests.gold
      : assets.rewards.chests.jewel;
const placeArtwork=c=>{
  const image=worldArtwork(c.id);
  return image?`<img class="place-scene" src="${image}" alt="">`:`<span class="place-icon">${c.icon}</span>`;
};
const islandHotspot=(c,lv)=>{
  const required=worldLevel(c.id),locked=lv<required;
  return `<button class="island-hotspot ${mapSpotClass(c.id)} ${locked?'locked':''}" data-action="open-world" data-collection="${c.id}" ${locked?'data-locked="true"':''} aria-label="${collectionName(c)} · ${levelLabel(required)}">
    <span class="hotspot-pin" aria-hidden="true">${locked?'🔒':c.icon}</span>
    <span class="hotspot-copy"><strong>${collectionName(c)}</strong><small>${levelLabel(required)}</small></span>
  </button>`;
};
const islandPlaceCard=(c,i,lv)=>{
  const required=worldLevel(c.id),locked=lv<required;
  return `<button class="place ${worldArtwork(c.id)?'place-has-scene':''} ${locked?'locked':''}" data-action="open-world" data-collection="${c.id}" ${locked?'data-locked="true"':''}>
    ${placeArtwork(c)}
    <div class="place-copy"><strong>${collectionName(c)}</strong><small>${collectionSubtitle(c)}</small></div>
    <span class="place-number" aria-hidden="true">${String(i+1).padStart(2,'0')}</span>
    <em class="unlock-level">${locked?'🔒 ':''}${levelLabel(required)}</em>
  </button>`;
};
const homeWorldButton=(c,s,lv)=>{
  const required=worldLevel(c.id),locked=lv<required;
  const learned=Number(s.progress.learnedByLanguage?.[targetLanguage()]?.[c.id]||0);
  return `<button class="${locked?'world-locked':''}" data-action="open-world" data-collection="${c.id}" ${locked?'data-locked="true"':''}><span>${c.icon}</span><div><strong>${collectionName(c)}</strong><small>${locked?`🔒 ${levelLabel(required)}`:`${learned}/${c.words.length} ${tr('Wörter entdeckt','palabras descubiertas','λέξεις ανακαλύφθηκαν')}`}</small></div><b>${locked?'🔒':'→'}</b></button>`;
};

let toastTimer=null;
function showToast(message){
  let toast=document.querySelector('.v3-toast');
  if(!toast){
    toast=document.createElement('div');
    toast.className='v3-toast';
    toast.setAttribute('role','status');
    document.body.append(toast);
  }
  toast.textContent=message;
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>toast.remove(),2600);
}

function rewardNoticeMarkup(notice){
  if(!notice)return '';
  const isDaily=notice.type==='daily';
  const isWeekly=notice.type==='weekly';
  const isGoal=isDaily||isWeekly;
  const title=isDaily
    ? tr('Tagesziel geschafft!','¡Objetivo diario completado!','Ο ημερήσιος στόχος ολοκληρώθηκε!','Daily goal complete!')
    : isWeekly
      ? tr('Wochenziel geschafft!','¡Objetivo semanal completado!','Ο εβδομαδιαίος στόχος ολοκληρώθηκε!','Weekly goal complete!')
      : tr(`Level ${notice.level} erreicht!`,`¡Nivel ${notice.level} alcanzado!`,`Έφτασες στο επίπεδο ${notice.level}!`,`Level ${notice.level} reached!`);
  const body=isDaily
    ? tr('Drei Abenteuer sind geschafft. Öffne deine Schatztruhe und hol dir die Belohnung.','Has completado tres aventuras. Abre el cofre y recoge tu recompensa.','Ολοκλήρωσες τρεις περιπέτειες. Άνοιξε το σεντούκι και πάρε την ανταμοιβή.','You completed three adventures. Open the chest and claim your reward.')
    : isWeekly
      ? tr('Du hast 15 Abenteuer in dieser Woche geschafft. Deine große Muscheltruhe ist bereit.','Has completado 15 aventuras esta semana. Tu gran cofre de conchas está listo.','Ολοκλήρωσες 15 περιπέτειες αυτή την εβδομάδα. Το μεγάλο σεντούκι είναι έτοιμο.','You completed 15 adventures this week. Your big shell chest is ready.')
      : tr('Dein neuer Level-Schatz wartet im Profil auf dich.','Tu nuevo tesoro de nivel te espera en el perfil.','Ο νέος θησαυρός επιπέδου σε περιμένει στο προφίλ.','Your new level treasure is waiting in your profile.');
  const art=isDaily?assets.rewards.chests.gold:isWeekly?assets.rewards.chests.jewel:milestoneChest(notice.level);
  const key=noticeKey(notice);
  return `<section class="reward-notice-modal" data-reward-notice="${key}" role="dialog" aria-modal="true" aria-labelledby="reward-notice-title">
    <div class="reward-notice-card is-claimable">
      ${isGoal?'':`<button class="reward-notice-close" data-action="dismiss-reward-notice" data-notice="${key}" aria-label="${tr('Später','Más tarde','Αργότερα','Later')}"><i class="ph-bold ph-x" aria-hidden="true"></i></button>`}
      <span class="reward-notice-kicker">${tr('NEUER SCHATZ','NUEVO TESORO','ΝΕΟΣ ΘΗΣΑΥΡΟΣ','NEW TREASURE')}</span>
      <img class="reward-notice-art" src="${art}" alt="">
      <h2 id="reward-notice-title">${title}</h2>
      <p>${body}</p>
      ${isGoal
        ? `<div class="reward-notice-value">${currencyIcon()}<strong>+${notice.shells||(isWeekly?WEEKLY_GOAL_REWARD:25)}</strong><span>${tr('Muscheln','Conchas','Κοχύλια','Shells')}</span></div>
          <button class="reward-notice-primary" data-action="${isWeekly?'claim-weekly-goal':'claim-daily-goal'}">${tr('Belohnung abholen','Recoger recompensa','Πάρε την ανταμοιβή','Claim reward')}</button>`
        : `<button class="reward-notice-primary" data-action="open-level-reward" data-level="${notice.level}">${tr('Zum Profil-Schatz','Ir al tesoro del perfil','Στον θησαυρό προφίλ','Go to profile treasure')}</button>`}
      ${isGoal?'':`<button class="reward-notice-later" data-action="dismiss-reward-notice" data-notice="${key}">${tr('Später','Más tarde','Αργότερα','Later')}</button>`}
    </div>
  </section>`;
}

const noticeKey=notice=>notice.type==='daily'
  ?'daily'
  :notice.type==='weekly'
    ?`weekly-${notice.weekKey}`
    :`level-${notice.level}`;

function ensurePendingGoalNotices(){
  const s=getState(),weekKey=currentWeekKey();
  const notices=Array.isArray(s.session.rewardNotices)?s.session.rewardNotices:[];
  const needsDaily=Number(s.progress.daily||0)>=3
    && !s.inventory.dailyGoalClaimed
    && !notices.some(notice=>notice.type==='daily');
  const needsWeekly=s.progress.weekly?.weekKey===weekKey
    && Number(s.progress.weekly.completed||0)>=WEEKLY_GOAL_TARGET
    && !s.inventory.weeklyGoalClaimed
    && !notices.some(notice=>notice.type==='weekly'&&notice.weekKey===weekKey);
  if(!needsDaily&&!needsWeekly)return;
  setState(d=>{
    d.session.rewardNotices=Array.isArray(d.session.rewardNotices)?d.session.rewardNotices:[];
    if(needsDaily)d.session.rewardNotices.unshift({type:'daily',shells:25});
    if(needsWeekly)d.session.rewardNotices.push({type:'weekly',weekKey,shells:WEEKLY_GOAL_REWARD});
    return d;
  });
}

let rewardNoticeSyncQueued=false;
function syncRewardNotice(){
  rewardNoticeSyncQueued=false;
  const notice=(getState().session.rewardNotices||[])[0]||null;
  const current=app.querySelector('.reward-notice-modal');
  if(!notice){current?.remove();return}
  const key=noticeKey(notice);
  if(current?.dataset.rewardNotice===key)return;
  current?.remove();
  app.insertAdjacentHTML('beforeend',rewardNoticeMarkup(notice));
  requestAnimationFrame(()=>app.querySelector('.reward-notice-primary')?.focus({preventScroll:true}));
}
function scheduleRewardNoticeSync(){
  if(rewardNoticeSyncQueued)return;
  rewardNoticeSyncQueued=true;
  ensurePendingGoalNotices();
  queueMicrotask(syncRewardNotice);
}

function accountPromptMarkup(){
  return `<section class="account-prompt" role="dialog" aria-modal="true" aria-labelledby="account-prompt-title">
    <div class="account-prompt-card">
      <i class="ph-bold ph-cloud-arrow-up" aria-hidden="true"></i>
      <span class="eyebrow">${tr('OPTIONALE CLOUD-SICHERUNG','COPIA OPCIONAL EN LA NUBE','ΠΡΟΑΙΡΕΤΙΚΟ CLOUD','OPTIONAL CLOUD BACKUP')}</span>
      <h2 id="account-prompt-title">${tr('Fortschritt sichern?','¿Guardar tu progreso?','Αποθήκευση προόδου;','Back up progress?')}</h2>
      <p>${tr('Du kannst sofort ohne Login weitermachen. Ein Elternkonto sichert den Fortschritt zusätzlich für andere Geräte.','Puedes continuar sin iniciar sesión. Una cuenta parental también guarda el progreso para otros dispositivos.','Μπορείς να συνεχίσεις χωρίς σύνδεση. Ένας γονικός λογαριασμός αποθηκεύει την πρόοδο και για άλλες συσκευές.','Continue without signing in, or use a parent account to back up progress across devices.')}</p>
      <button class="primary" data-action="open-account-settings">${tr('Elternkonto einrichten','Configurar cuenta parental','Ρύθμιση γονικού λογαριασμού','Set up parent account')}</button>
      <button class="secondary" data-action="continue-without-account">${tr('Ohne Login weitermachen','Continuar sin iniciar sesión','Συνέχεια χωρίς σύνδεση','Continue without login')}</button>
    </div>
  </section>`;
}

function syncAccountPrompt(){
  const existing=app.querySelector('.account-prompt');
  if(!getAccountState().shouldPrompt){existing?.remove();return}
  if(!existing)app.insertAdjacentHTML('beforeend',accountPromptMarkup());
}

function syncAccountConflict(){
  const existing=app.querySelector('.account-conflict-global');
  const account=getAccountState();
  if(!account.conflict||getState().route.name==='settings'){existing?.remove();return}
  if(existing)return;
  app.insertAdjacentHTML('beforeend',`<section class="account-conflict account-conflict-global" role="dialog" aria-modal="true" aria-labelledby="global-account-conflict-title"><div class="account-conflict-card"><span class="eyebrow">${tr('SYNCHRONISIERUNG','SINCRONIZACIÓN','ΣΥΓΧΡΟΝΙΣΜΟΣ','SYNC')}</span><h2 id="global-account-conflict-title">${tr('Zwei Fortschritte gefunden','Se encontraron dos progresos','Βρέθηκαν δύο πρόοδοι','Two progress versions found')}</h2><p>${tr('Gerät und Cloud wurden unterschiedlich geändert. Wähle ausdrücklich, welcher Stand bleiben soll.','El dispositivo y la nube tienen cambios diferentes. Elige qué progreso conservar.','Η συσκευή και το cloud έχουν διαφορετικές αλλαγές. Διάλεξε ποια πρόοδο θα κρατήσεις.','Device and cloud have different changes. Choose which progress to keep.')}</p><button class="primary" data-action="resolve-sync-conflict" data-choice="local">${tr('Diesen Geräte-Stand verwenden','Usar este dispositivo','Χρήση αυτής της συσκευής','Use this device')}</button><button class="secondary" data-action="resolve-sync-conflict" data-choice="cloud">${tr('Cloud-Stand verwenden','Usar la nube','Χρήση cloud','Use cloud version')}</button></div></section>`);
}
function removeRewardNotice(key){
  setState(d=>{
    const notices=Array.isArray(d.session.rewardNotices)?d.session.rewardNotices:[];
    const index=notices.findIndex(notice=>noticeKey(notice)===key);
    if(index>=0)notices.splice(index,1);
    d.session.rewardNotices=notices;
    return d;
  });
}

function top(backRoute=null,variant='default'){
  const s=getState();
  const home=variant==='home';
  const brand=`<div class="v3-brand">
    ${home?`<button class="home-avatar-button" data-action="navigate" data-route="profile" aria-label="${tr('Profil öffnen','Abrir perfil','Άνοιγμα προφίλ','Open profile')}"><img src="${assets.characters.tula.poses.profile}" alt=""></button>`:`<img class="brand-avatar" src="${assets.characters.tula.poses.profile}" alt="">`}
    <strong>Tulas Island</strong>
  </div>`;
  return `<header class="v3-top ${home?'v3-top-cinematic':''}">
    ${home?'':`<button class="icon" data-action="${backRoute?'navigate':'menu'}" ${backRoute?`data-route="${backRoute}"`:''} aria-label="${backRoute?tr('Zurück','Volver','Πίσω'):tr('Menü','Menú','Μενού')}"><i class="ph-bold ${backRoute?'ph-arrow-left':'ph-list'}" aria-hidden="true"></i></button>`}
    ${brand}
    <div class="top-actions">
      <button class="chip language-pair-chip" data-action="navigate" data-route="language-select" aria-label="${languageMeta(sourceLanguage()).name} ${tr('nach','a','προς','to')} ${languageMeta(targetLanguage()).name}">${pairBadge()}</button>
      <span class="wallet-mini">${currencyIcon()}<span>${s.progress.shells}</span></span>
    </div>
  </header>`;
}

function nav(active){
  const s=getState(),lv=levelFromXp(s.progress.xp);
  const profileRewardReady=MILESTONE_LEVELS.some(level=>level<=lv&&!s.inventory.claimedMilestones.includes(level));
  const items=[
    ['home','house',tr('Home','Inicio','Αρχική')],
    ['island','island',tr('Insel','Isla','Νησί')],
    ['words','book-open-text',tr('Wörter','Palabras','Λέξεις')],
    ['shop','storefront',tr('Shop','Tienda','Κατάστημα')],
    ['profile','user-circle',tr('Profil','Perfil','Προφίλ')]
  ];
  return `<nav class="v3-nav" aria-label="${tr('Hauptnavigation','Navegación principal','Κύρια πλοήγηση')}">${items.map(([r,i,l])=>`<button class="${active===r?'active':''} ${r==='profile'&&profileRewardReady?'has-reward':''}" data-action="navigate" data-route="${r}" aria-label="${l}"><span class="nav-icon" aria-hidden="true"><i class="${active===r?'ph-fill':'ph-bold'} ph-${i}"></i>${r==='profile'&&profileRewardReady?'<i class="nav-reward-dot"></i>':''}</span><small>${l}</small></button>`).join('')}</nav>`;
}

function progressCard(){
  const s=getState(),lv=levelFromXp(s.progress.xp),p=levelProgress(s.progress.xp);
  return `<section class="progress-card"><div class="progress-head"><strong>${tr('Level','Nivel','Επίπεδο','Level')} ${lv}</strong><span>${tr('Jedes Abenteuer bringt dich weiter','Cada aventura te hace avanzar','Κάθε περιπέτεια σε προχωρά','Every adventure moves you forward')}</span></div><div class="bar" role="progressbar" aria-label="${tr(`Level ${lv} Fortschritt`,`Progreso del nivel ${lv}`,`Πρόοδος επιπέδου ${lv}`,`Level ${lv} progress`)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${p.current}"><i style="width:${p.percent}%"></i></div></section>`;
}

function renderComplete(title,reward,back='world',replayAction=''){
  const practiceStars=Math.max(0,Number(reward.practiceStars||0));
  return `<div class="v3-shell page">${top()}<section class="celebration"><img src="${assets.characters.tula.poses.celebrating}" alt="Tula"><h1>${title}</h1><p>${tr('Tula ist stolz auf dich. Dein Level wächst im Hintergrund weiter.','Tula está orgullosa de ti. Tu nivel sigue creciendo.','Η Τούλα είναι περήφανη για σένα. Το επίπεδό σου συνεχίζει να μεγαλώνει.','Tula is proud of you. Your level keeps growing in the background.')}</p>${practiceStars?`<div class="practice-star-reward"><img src="${assets.rewards.xpStar}" alt=""><div><small>${tr('Heute verdient','Ganadas hoy','Κερδήθηκαν σήμερα','Earned today')}</small><strong>+${practiceStars} ${tr('Übungssterne','estrellas de práctica','αστέρια εξάσκησης','practice stars')}</strong></div></div>`:''}<div class="reward-row reward-row-single"><div>${rewardArt(assets.rewards.currencyShell,tr('Muscheln','Conchas','Κοχύλια','Shells'))}<strong>+${reward.shells}</strong><small>${tr('Muscheln','Conchas','Κοχύλια','Shells')}</small></div></div>${replayAction?`<button class="primary" data-action="${replayAction}">${tr('Nochmal spielen','Jugar otra vez','Παίξε ξανά','Play again')} <i class="ph-bold ph-arrow-clockwise" aria-hidden="true"></i></button>`:''}<button class="secondary" data-action="navigate" data-route="${back}">${tr('Andere Übung wählen','Elegir otro ejercicio','Διάλεξε άλλη άσκηση','Choose another exercise')}</button><button class="secondary" data-action="navigate" data-route="home"><i class="ph-bold ph-house" aria-hidden="true"></i> ${tr('Zur Startseite','Ir al inicio','Στην αρχική','Back home')}</button></section></div>`;
}

function languageOption(code,selected,action){
  const lang=languageMeta(code);
  return `<button class="language-option ${selected?'selected':''}" data-action="${action}" data-language="${code}"><span class="language-flag">${flagImage(code)}</span><div><strong>${lang.nativeName}</strong><small>${lang.name}</small></div><b>${selected?'✓':'›'}</b></button>`;
}

router.register('language-select',()=>{
  const source=sourceLanguage(),target=targetLanguage();
  return `<div class="v3-shell page language-select-page cinematic-subpage cinematic-profile">${cinematicBackground(assets.backgrounds.cinematic.profile)}${top('home')}
    <section class="page-title"><span class="eyebrow">${tr('SPRACHEN','IDIOMAS','ΓΛΩΣΣΕΣ')}</span><h1>${tr('Welche Sprache möchtest du lernen?','¿Qué idioma quieres aprender?','Ποια γλώσσα θέλεις να μάθεις;')}</h1><p>${tr('Wähle zuerst deine Sprache und danach die Lernsprache.','Elige primero tu idioma y después el idioma que quieres aprender.','Διάλεξε πρώτα τη γλώσσα σου και μετά τη γλώσσα που θέλεις να μάθεις.')}</p></section>
    <section class="language-pair-summary"><div><small>${tr('VON','DESDE','ΑΠΟ')}</small><strong>${flagImage(source)} ${languageMeta(source).nativeName}</strong></div><button data-action="swap-languages" aria-label="Sprachen tauschen"><i class="ph-bold ph-arrows-left-right" aria-hidden="true"></i></button><div><small>${tr('NACH','HACIA','ΠΡΟΣ')}</small><strong>${flagImage(target)} ${languageMeta(target).nativeName}</strong></div></section>
    <section class="language-block"><h2>${tr('Meine Sprache','Mi idioma','Η γλώσσα μου')}</h2>${LANGUAGE_CODES.map(code=>languageOption(code,source===code,'select-source-language')).join('')}</section>
    <section class="language-block"><h2>${tr('Ich lerne','Estoy aprendiendo','Μαθαίνω')}</h2>${LANGUAGE_CODES.filter(code=>code!==source).map(code=>languageOption(code,target===code,'select-target-language')).join('')}</section>
    <button class="primary" data-action="confirm-language-pair">${tr('Sprachreise starten','Empezar el viaje','Έναρξη ταξιδιού')} →</button>
  </div>${nav('profile')}`;
});

router.register('home',()=>{
  const s=getState(),c=currentCollection(),lv=levelFromXp(s.progress.xp);
  const level=levelProgress(s.progress.xp);
  const daily=Math.max(0,Math.min(3,Number(s.progress.daily)||0)),dailyPercent=(daily/3)*100;
  const weekly=Math.max(0,Math.min(WEEKLY_GOAL_TARGET,Number(s.progress.weekly?.completed)||0));
  const weeklyPercent=(weekly/WEEKLY_GOAL_TARGET)*100;
  const name=safeText(s.profile?.name||tr('Kind','peque','παιδί'));
  return `<div class="v3-shell page cinematic-home">
    <img class="cinematic-home-bg" src="${assets.backgrounds.home.cinematic}" alt="">
    ${top(null,'home')}
    <section class="cinematic-home-stage">
      <div class="cinematic-home-copy">
        <span class="home-kicker">${tr('WILLKOMMEN AUF TULAS ISLAND','BIENVENIDO A TULAS ISLAND','ΚΑΛΩΣ ΗΡΘΕΣ ΣΤΟ TULAS ISLAND','WELCOME TO TULAS ISLAND')}</span>
        <h1>${tr(`Hallo ${name}!`,`¡Hola, ${name}!`,`Γεια σου, ${name}!`,`Hello ${name}!`)}</h1>
        <p>${tr('Bereit für dein nächstes Sprachabenteuer?','¿Listo para tu próxima aventura lingüística?','Έτοιμο για την επόμενη γλωσσική περιπέτεια;','Ready for your next language adventure?')}</p>
        <span class="home-next-label">${tr('NÄCHSTES ABENTEUER','PRÓXIMA AVENTURA','ΕΠΟΜΕΝΗ ΠΕΡΙΠΕΤΕΙΑ','NEXT ADVENTURE')} · ${collectionName(c)}</span>
        <button class="home-primary" data-action="open-world" data-collection="${c.id}">
          <span>${tr('Weiterlernen','Seguir aprendiendo','Συνέχισε','Continue learning')}</span>
          <i class="ph-bold ph-arrow-right" aria-hidden="true"></i>
        </button>
      </div>
      <img class="cinematic-home-tula" src="${assets.characters.tula.poses.waving}" alt="Tula">
      <section class="home-goal-panel" aria-label="${tr('Dein Fortschritt','Tu progreso','Η πρόοδός σου','Your progress')}">
        <div class="home-goal-badge">${rewardArt(assets.rewards.xpStar,'')}</div>
        <div class="home-goal-copy">
          <small>${tr('Tagesziel','Objetivo diario','Ημερήσιος στόχος')}</small>
          <strong>${daily} / 3</strong>
          <span>${daily===3?tr('Geschafft!','¡Completado!','Ολοκληρώθηκε!'):tr('heute geschafft','hechas hoy','σήμερα')}</span>
        </div>
        <div class="home-goal-meta">
          <span aria-label="${tr(`${s.progress.streak} Lerntage in Folge`,`${s.progress.streak} días seguidos`,`${s.progress.streak} συνεχόμενες ημέρες`,`${s.progress.streak} day streak`)}"><img src="${assets.rewards.streak}" alt="">${s.progress.streak}</span>
        </div>
        <button class="home-island-preview" data-action="navigate" data-route="island" aria-label="${tr('Insel öffnen','Abrir la isla','Άνοιγμα νησιού','Open island')}">
          <img src="${assets.island.overview}" alt="">
          <i class="ph-bold ph-arrow-right" aria-hidden="true"></i>
        </button>
        <div class="home-goal-bar" role="progressbar" aria-label="${tr('Tagesziel','Objetivo diario','Ημερήσιος στόχος','Daily goal')}" aria-valuemin="0" aria-valuemax="3" aria-valuenow="${daily}"><i style="width:${dailyPercent}%"></i></div>
        <div class="home-level-goal">
          <span class="home-level-label">${tr('Level','Nivel','Επίπεδο','Level')} <strong>${lv}</strong></span>
          <span class="home-level-track" role="progressbar" aria-label="${tr(`Level ${lv} Fortschritt`,`Progreso del nivel ${lv}`,`Πρόοδος επιπέδου ${lv}`,`Level ${lv} progress`)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${level.current}"><i style="width:${level.percent}%"></i></span>
          <span class="home-level-value">${level.percent}%</span>
        </div>
        <div class="home-weekly-goal">
          <span class="home-weekly-label">${tr('Wochenziel','Objetivo semanal','Εβδομαδιαίος στόχος','Weekly goal')} <strong>${weekly}/${WEEKLY_GOAL_TARGET}</strong></span>
          <span class="home-weekly-track" role="progressbar" aria-label="${tr('Wochenziel','Objetivo semanal','Εβδομαδιαίος στόχος','Weekly goal')}" aria-valuemin="0" aria-valuemax="${WEEKLY_GOAL_TARGET}" aria-valuenow="${weekly}"><i style="width:${weeklyPercent}%"></i></span>
          <span class="home-weekly-reward">${currencyIcon()}<strong>+${WEEKLY_GOAL_REWARD}</strong></span>
        </div>
      </section>
    </section>
  </div>${nav('home')}`;
});

router.register('island',()=>{
  const s=getState(),lv=levelFromXp(s.progress.xp);
  return `<div class="v3-shell page cinematic-subpage cinematic-island">${cinematicBackground(assets.backgrounds.cinematic.island)}${top()}<button class="tula-home-feature" data-action="navigate" data-route="tula-home"><img src="${assets.backgrounds.home.tropicalBay}" alt=""><span><small>${tr('TULAS ZUHAUSE','CASA DE TULA','ΤΟ ΣΠΙΤΙ ΤΗΣ ΤΟΥΛΑ')}</small><strong>${tr('Tulas Zuhause','Casa de Tula','Το σπίτι της Τούλα')}</strong><em>${tr('Einrichten & dekorieren','Decorar y organizar','Διακόσμηση')}</em></span><b>→</b></button><section class="island-card island-map" aria-label="${tr('Interaktive Inselkarte','Mapa interactivo','Διαδραστικός χάρτης')}"><img src="${assets.island.overview}" alt="Tulas Island">${collections.map(c=>islandHotspot(c,lv)).join('')}</section>
    <section class="section-head island-adventures-head"><div><span class="eyebrow">${tr('MIT TULA','CON TULA','ΜΕ ΤΗΝ ΤΟΥΛΑ')}</span><h2>${tr('Besondere Abenteuer','Aventuras especiales','Ξεχωριστές περιπέτειες')}</h2></div></section>
    <section class="journey-grid island-adventure-grid">
      <button data-action="start-adaptive"><img class="mode-art" src="${assets.characters.tula.poses.thinking}" alt=""><div><strong>${tr('Schlaue Wiederholung','Repaso inteligente','Έξυπνη επανάληψη')}</strong><small>${tr('Persönliche Übungsrunde','Ronda personalizada','Προσωπική εξάσκηση')}</small></div><b>→</b></button>
      <button data-action="navigate" data-route="speaking">${modeArt('speaking',tr('Sprechtrainer','Entrenador de voz','Εξάσκηση ομιλίας'))}<div><strong>${tr('Sprechtrainer','Entrenador de voz','Εξάσκηση ομιλίας')}</strong><small>${tr('Anhören und nachsprechen','Escuchar y repetir','Άκου και επανάλαβε')}</small></div><b>→</b></button>
      <button data-action="navigate" data-route="stories">${modeArt('stories',tr('Mini-Geschichten','Mini historias','Μικρές ιστορίες'))}<div><strong>${tr('Mini-Geschichten','Mini historias','Μικρές ιστορίες')}</strong><small>${tr('Lesen, hören und entdecken','Leer, escucha y explora','Διάβασε, άκου και ανακάλυψε')}</small></div><b>→</b></button>
    </section>
    <section class="places island-place-grid">${collections.map((c,i)=>islandPlaceCard(c,i,lv)).join('')}<button class="place place-has-scene special-place ${lv<7?'locked':''}" data-action="open-harbor"><img class="place-scene" src="${assets.backgrounds.worlds.harbor}" alt=""><div class="place-copy"><strong>${tr('Hafen','Puerto','Λιμάνι')}</strong><small>${tr('Reise & Dialoge','Viajes y diálogos','Ταξίδια και διάλογοι')}</small></div><em class="unlock-level">${lv<7?'🔒 ':''}${levelLabel(7)}</em></button><button class="place place-has-scene special-place ${lv<10?'locked':''}" data-action="open-castle"><img class="place-scene" src="${assets.backgrounds.worlds.castle}" alt=""><div class="place-copy"><strong>${tr('Schloss','Castillo','Κάστρο')}</strong><small>${tr('Goldene Sprachprüfung','Prueba dorada','Χρυσή δοκιμασία')}</small></div><em class="unlock-level">${lv<10?'🔒 ':''}${levelLabel(10)}</em></button></section></div>${nav('island')}`;
});

router.register('world',()=>{
  const s=getState(),c=currentCollection(),unlocked=s.inventory.unlockedModes;
  const artwork=worldArtwork(c.id),required=worldLevel(c.id),dailyStars=dailyPracticeSummary().totalStars;
  const practiceReward=id=>{
    const reward=nextPracticeStars(c.id,id);
    return `<span class="next-practice-reward"><img src="${assets.rewards.xpStar}" alt="">${tr(`Heute +${reward}`,`Hoy +${reward}`,`Σήμερα +${reward}`,`Today +${reward}`)}</span>`;
  };
  const coreMode=(id,title,description)=>{
    return `<button data-action="navigate" data-route="${id}">${modeArt(id,title)}<div><strong>${title}</strong><small>${description}</small>${renderQuestStarBadge(c.id,id)}${practiceReward(id)}</div><b><i class="ph-bold ph-arrow-right" aria-hidden="true"></i></b></button>`;
  };
  return `<div class="v3-shell page cinematic-subpage cinematic-island">${cinematicBackground(assets.backgrounds.cinematic.island)}${top('island')}
    <section class="place-hero ${artwork?'place-hero-art':''}">${artwork?`<img class="world-scene" src="${artwork}" alt="">`:`<span>${c.icon}</span>`}<div><h1>${collectionName(c)}</h1><p>${collectionSubtitle(c)}</p><span class="world-unlock-note"><i class="ph-bold ph-check" aria-hidden="true"></i> ${tr('Freigeschaltet ab Level','Disponible desde el nivel','Διαθέσιμο από το επίπεδο','Available from level')} ${required}</span></div></section>
    ${renderStarGate(c)}
    <section class="world-instruction"><span class="world-step"><i class="ph-bold ph-star" aria-hidden="true"></i></span><div><strong>${tr('Sammle Meistersterne','Consigue estrellas maestras','Μάζεψε αστέρια δεξιοτεχνίας','Collect mastery stars')}</strong><small>${flagImage(sourceLanguage(),'language-mini-flag')} ${languageMeta(sourceLanguage()).short} <i class="ph-bold ph-arrow-right" aria-hidden="true"></i> ${flagImage(targetLanguage(),'language-mini-flag')} ${languageMeta(targetLanguage()).short}</small></div><span class="daily-practice-total"><img src="${assets.rewards.xpStar}" alt=""><strong>${dailyStars}</strong><small>${tr('heute','hoy','σήμερα','today')}</small></span></section>
    <section class="mode-picker master-quest-picker">
      ${coreMode('explore',tr('Wörter entdecken','Descubrir palabras','Ανακάλυψε λέξεις','Discover words'),tr('Ansehen, hören und merken','Ver, escuchar y recordar','Δες, άκου και θυμήσου','Look, listen and remember'))}
      ${coreMode('listening',tr('Hör-Abenteuer','Aventura auditiva','Ακουστική περιπέτεια','Listening adventure'),tr('Hören und auswählen','Escuchar y elegir','Άκου και διάλεξε','Listen and choose'))}
      ${coreMode('sentence',tr('Satzwerkstatt','Taller de frases','Εργαστήριο προτάσεων','Sentence workshop'),tr('Sätze in Reihenfolge bringen','Ordenar frases','Βάλε τις λέξεις στη σειρά','Put sentences in order'))}
      <button data-action="${unlocked.includes('memory')?'start-memory':'navigate'}" ${unlocked.includes('memory')?'':'data-route="shop"'}>${modeArt('memory',tr('Palast-Memory','Memoria del palacio','Μνήμη του παλατιού','Palace Memory'))}<div><strong>${tr('Palast-Memory','Memoria del palacio','Μνήμη του παλατιού','Palace Memory')}</strong><small>${unlocked.includes('memory')?tr('Bild und Wort verbinden','Unir imagen y palabra','Ταίριαξε εικόνα και λέξη','Match picture and word'):tr('In der Boutique freischalten','Desbloquear en boutique','Ξεκλείδωσε στο κατάστημα','Unlock in the boutique')}</small>${unlocked.includes('memory')?practiceReward('memory'):''}</div><b><i class="ph-bold ${unlocked.includes('memory')?'ph-arrow-right':'ph-lock'}" aria-hidden="true"></i></b></button>
      <button data-action="${unlocked.includes('speed')?'start-speed':'navigate'}" ${unlocked.includes('speed')?'':'data-route="shop"'}>${modeArt('speed',tr('Goldene Minute','Minuto dorado','Χρυσό λεπτό','Golden Minute'))}<div><strong>${tr('Goldene Minute','Minuto dorado','Χρυσό λεπτό','Golden Minute')}</strong><small>${unlocked.includes('speed')?tr('45 Sekunden Sprachtempo','45 segundos de velocidad','45 δευτερόλεπτα ταχύτητας','45 seconds of language speed'):tr('In der Boutique freischalten','Desbloquear en boutique','Ξεκλείδωσε στο κατάστημα','Unlock in the boutique')}</small>${unlocked.includes('speed')?practiceReward('speed'):''}</div><b><i class="ph-bold ${unlocked.includes('speed')?'ph-arrow-right':'ph-lock'}" aria-hidden="true"></i></b></button>
    </section>
  </div>${nav(c.id==='library'?'words':'island')}`;
});

router.register('words',()=>{
  const s=getState(),c=wordCatalogCollection(),source=sourceLanguage(),target=targetLanguage();
  const unlocked=new Set(s.inventory.unlockedWords||[]);
  const ownedCount=collections.reduce((sum,item)=>sum+item.words.filter((word,index)=>index<STARTER_WORDS_PER_COLLECTION||unlocked.has(word.id)).length,0);
  const wordCard=(word,index)=>{
    const included=index<STARTER_WORDS_PER_COLLECTION,owned=included||unlocked.has(word.id);
    return `<article class="word-shop-card ${owned?'owned':'locked'}" data-word-card="${word.id}">
      <button class="word-sound" data-action="speak-catalog-word" data-word="${word.id}" aria-label="${tr('Wort anhören','Escuchar palabra','Άκουσε τη λέξη')}">🔊</button>
      <span class="word-emoji" aria-hidden="true">${word.emoji}</span>
      <strong>${languageValue(word,target)}</strong>
      <small>${languageValue(word,source)}</small>
      ${owned
        ? `<span class="word-owned">${included?tr('Startwort','Palabra inicial','Αρχική λέξη'):tr('Bereit zum Lernen','Lista para aprender','Έτοιμη για μάθηση')} ✓</span>`
        : `<button class="word-buy" data-action="buy-word" data-word="${word.id}"><span>${tr('Kaufen','Comprar','Αγορά')}</span>${currencyAmount(WORD_COST)}</button>`}
    </article>`;
  };
  return `<div class="v3-shell page words-page cinematic-subpage cinematic-words">${cinematicBackground(assets.backgrounds.cinematic.words)}${top()}
    <section class="page-title"><span class="eyebrow">${tr('WÖRTER','PALABRAS','ΛΕΞΕΙΣ')}</span><h1>${tr('Neue Wörter lernen','Aprende palabras nuevas','Μάθε νέες λέξεις')}</h1><p>${tr('Wähle eine Wortwelt. Neue Wörter kannst du mit deinen Muscheln freischalten.','Elige un mundo de palabras. Desbloquea palabras nuevas con tus conchas.','Διάλεξε έναν κόσμο λέξεων. Ξεκλείδωσε νέες λέξεις με τα κοχύλια σου.')}</p><div class="language-direction-line">${flagImage(source)} ${languageMeta(source).nativeName} <i class="ph-bold ph-arrow-right" aria-hidden="true"></i> ${flagImage(target)} ${languageMeta(target).nativeName}</div></section>
    <section class="word-wallet-summary"><div>${currencyIcon('currency-shell currency-shell-large')}<span><strong>${s.progress.shells}</strong><small>${tr('Muscheln verfügbar','conchas disponibles','διαθέσιμα κοχύλια')}</small></span></div><span><strong>${ownedCount}</strong><small>${tr('Wörter bereit','palabras listas','λέξεις έτοιμες')}</small></span></section>
    <div class="word-category-tabs" role="tablist" aria-label="${tr('Wortwelten','Mundos de palabras','Κόσμοι λέξεων')}">${collections.map(item=>`<button class="${item.id===c.id?'active':''}" data-action="select-word-collection" data-collection="${item.id}" role="tab" aria-selected="${item.id===c.id}"><span>${item.icon}</span>${collectionName(item)}</button>`).join('')}</div>
    <section class="word-catalog-head"><div><span>${c.icon}</span><div><h2>${collectionName(c)}</h2><small>${c.words.length} ${tr('Wörter','palabras','λέξεις')}</small></div></div><button data-action="open-catalog-practice">${tr('Jetzt üben','Practicar','Εξάσκηση')} →</button></section>
    <section class="word-shop-grid">${c.words.map(wordCard).join('')}</section>
  </div>${nav('words')}`;
});
router.register('shop',()=>renderShop({top,nav}));
router.register('profile',()=>renderProfile({top,nav,progressCard}));
router.register('settings',()=>renderSettings({top,nav}));
router.register('child-profile',()=>renderChildProfile({top,nav}));

installCoreLearningGames(router);
registerAdvancedRoutes(router,{top,nav,renderComplete});
registerExperienceRoutes(router,{top,nav});
registerStarDungeon(router,{top,showToast});
router.setNotFound(()=>`<div class="v3-shell page">${top('home')}<section class="page-title"><h1>${tr('Seite nicht gefunden','Página no encontrada','Η σελίδα δεν βρέθηκε')}</h1></section></div>`);

registerAction('navigate',({data})=>router.navigate(data.route));
registerAction('open-world',({data})=>{
  const required=worldLevel(data.collection),current=levelFromXp();
  if(current<required){
    showToast(`🔒 ${tr(`Diese Lernwelt öffnet sich ab Level ${required}.`,`Este mundo se abre en el nivel ${required}.`,`Αυτός ο κόσμος ανοίγει στο επίπεδο ${required}.`,`This learning world opens at level ${required}.`)}`);
    return;
  }
  setState(d=>{d.session.collectionId=data.collection;return d});
  router.navigate('world');
});
registerAction('menu',()=>router.navigate('settings'));
registerAction('select-source-language',({data})=>{setSourceLanguage(data.language);router.renderCurrent()});
registerAction('select-target-language',({data})=>{setTargetLanguage(data.language);router.renderCurrent()});
registerAction('swap-languages',()=>{swapLanguages();router.renderCurrent()});
registerAction('confirm-language-pair',()=>router.navigate('home'));
registerAction('dismiss-reward-notice',({data})=>removeRewardNotice(data.notice));
registerAction('claim-daily-goal',()=>{
  const s=getState();
  if(Number(s.progress.daily||0)<3||s.inventory.dailyGoalClaimed)return;
  const shells=Number((s.session.rewardNotices||[]).find(notice=>notice.type==='daily')?.shells||25);
  setState(d=>{
    d.inventory.dailyGoalClaimed=true;
    d.progress.shells+=shells;
    d.session.rewardNotices=(d.session.rewardNotices||[]).filter(notice=>notice.type!=='daily');
    return d;
  });
  creditGameplayShells(
    shells,
    'daily-goal',
    `daily-goal-${currentDayKey()}`
  ).catch(()=>{});
  showToast(tr(`Tagesziel-Belohnung: +${shells} Muscheln!`,`Recompensa diaria: ¡+${shells} conchas!`,`Ημερήσια ανταμοιβή: +${shells} κοχύλια!`,`Daily reward: +${shells} shells!`));
  router.renderCurrent();
});
registerAction('claim-weekly-goal',()=>{
  const s=getState(),weekKey=currentWeekKey();
  if(
    s.progress.weekly?.weekKey!==weekKey
    || Number(s.progress.weekly.completed||0)<WEEKLY_GOAL_TARGET
    || s.inventory.weeklyGoalClaimed
  )return;
  setState(d=>{
    d.inventory.weeklyGoalClaimed=true;
    d.progress.shells+=WEEKLY_GOAL_REWARD;
    d.session.rewardNotices=(d.session.rewardNotices||[])
      .filter(notice=>notice.type!=='weekly'||notice.weekKey!==weekKey);
    return d;
  });
  creditGameplayShells(
    WEEKLY_GOAL_REWARD,
    'weekly-goal',
    `weekly-goal-${weekKey}`
  ).catch(()=>{});
  showToast(tr(
    `Wochenziel-Belohnung: +${WEEKLY_GOAL_REWARD} Muscheln!`,
    `Recompensa semanal: ¡+${WEEKLY_GOAL_REWARD} conchas!`,
    `Εβδομαδιαία ανταμοιβή: +${WEEKLY_GOAL_REWARD} κοχύλια!`,
    `Weekly reward: +${WEEKLY_GOAL_REWARD} shells!`
  ));
  router.renderCurrent();
});
registerAction('open-level-reward',({data})=>{
  const level=Number(data.level);
  removeRewardNotice(`level-${level}`);
  setState(d=>{d.session.focusMilestone=level;return d});
  router.navigate('profile',{}, {scroll:false});
  setTimeout(()=>document.querySelector(`[data-milestone="${level}"]`)?.scrollIntoView({behavior:'smooth',block:'center'}),120);
});
registerAction('select-word-collection',({data})=>{setState(d=>{d.session.wordCollectionId=data.collection;return d});router.renderCurrent()});
registerAction('buy-word',async({data})=>{
  const word=collections.flatMap(c=>c.words).find(item=>item.id===data.word);
  if(!word)return;
  if((getState().inventory.unlockedWords||[]).includes(word.id))return;
  const result=await spendEconomyShells(`word:${word.id}`,WORD_COST);
  if(!result.ok){showToast(tr('Du brauchst mehr Muscheln.','Necesitas más conchas.','Χρειάζεσαι περισσότερα κοχύλια.','You need more shells.'));return}
  setState(d=>{d.inventory.unlockedWords=[...new Set([...(d.inventory.unlockedWords||[]),word.id])];return d});
  showToast(`${word.emoji} ${tr('Wort freigeschaltet!','¡Palabra desbloqueada!','Η λέξη ξεκλειδώθηκε!','Word unlocked!')}`);
  router.renderCurrent();
});
registerAction('speak-catalog-word',({data})=>{const word=collections.flatMap(c=>c.words).find(item=>item.id===data.word),target=targetLanguage();if(word)speak(languageValue(word,target),languageMeta(target).voice,{rate:.78})});
registerAction('open-catalog-practice',()=>{setState(d=>{d.session.collectionId=wordCatalogCollection().id;return d});router.navigate('explore')});
registerAdvancedActions(router,{renderComplete});
registerExperienceActions(router);
registerProgressionActions(router);
registerChildProfileActions(router);
bindActions(app);
subscribe(scheduleRewardNoticeSync);
subscribeAccount(()=>{
  syncAccountPrompt();
  syncAccountConflict();
  if(getState().route.name==='settings')router.renderCurrent();
});
subscribeEconomy(()=>{if(getState().route.name==='shop')router.renderCurrent()});
app.addEventListener('linguaturtle:route-rendered',scheduleRewardNoticeSync);
app.addEventListener('linguaturtle:route-rendered',syncAccountPrompt);
app.addEventListener('linguaturtle:route-rendered',syncAccountConflict);
router.renderCurrent();
scheduleRewardNoticeSync();
syncAccountPrompt();
syncAccountConflict();
initializeAccount();
initializeEconomy();

if('serviceWorker' in navigator){
  window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
}
