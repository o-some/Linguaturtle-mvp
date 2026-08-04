import { collections } from '../content-multilingual.js';
import {
  getState,setState,registerAction,speak,grantReward,spendEconomyShells,levelFromXp,
  sourceLanguage,targetLanguage,languageMeta,languageValue,uiText
} from '../core/index.js?build=cinematic-worlds-1';
import { profileConfig } from '../screens/child-profile.js?build=cinematic-worlds-1';
import { assets } from '../../config/assets.js?build=cinematic-worlds-1';

const tr=(de,es,el=de)=>uiText(de,es,el);
const shuffle=a=>[...a].sort(()=>Math.random()-.5);
const allWords=()=>collections.flatMap(c=>c.words.map(w=>({...w,collection:c.id})));
const rewardArt=(src,alt='')=>`<img class="reward-art" src="${src}" alt="${alt}">`;
const currencyIcon=(className='currency-shell')=>`<img class="${className}" src="${assets.rewards.currencyShell}" alt="">`;
const currencyAmount=amount=>`<span class="currency-amount">${currencyIcon()}<span>${amount}</span></span>`;
let adaptive={items:[],step:0,score:0,current:null};
let story={index:0,step:0,score:0};
let travel={mode:'harbor',items:[],step:0,score:0,current:null};

const stories=[
 {de:'Tula sucht einen Apfel',es:'Tula busca una manzana',el:'Η Τούλα ψάχνει ένα μήλο',icon:'🍎',pages:[
  {de:'Tula geht in den Garten.',es:'Tula va al jardín.',el:'Η Τούλα πηγαίνει στον κήπο.'},
  {de:'Sie sieht einen roten Apfel.',es:'Ve una manzana roja.',el:'Βλέπει ένα κόκκινο μήλο.'},
  {de:'Tula teilt den Apfel mit einem Freund.',es:'Tula comparte la manzana con un amigo.',el:'Η Τούλα μοιράζεται το μήλο με έναν φίλο.'}]},
 {de:'Ein Tag am Hafen',es:'Un día en el puerto',el:'Μια μέρα στο λιμάνι',icon:'⚓',pages:[
  {de:'Tula hört die Möwen.',es:'Tula escucha las gaviotas.',el:'Η Τούλα ακούει τους γλάρους.'},
  {de:'Ein kleines Schiff kommt an.',es:'Llega un barco pequeño.',el:'Ένα μικρό πλοίο φτάνει.'},
  {de:'Tula sagt freundlich Hallo.',es:'Tula saluda amablemente.',el:'Η Τούλα χαιρετάει ευγενικά.'}]},
 {de:'Ein gemütlicher Abend',es:'Una tarde acogedora',el:'Ένα ήσυχο βράδυ',icon:'🌙',pages:[
  {de:'Tula liest ein Buch.',es:'Tula lee un libro.',el:'Η Τούλα διαβάζει ένα βιβλίο.'},
  {de:'Die Lampe leuchtet warm.',es:'La lámpara brilla cálidamente.',el:'Η λάμπα φωτίζει ζεστά.'},
  {de:'Dann schläft Tula ein.',es:'Entonces Tula se duerme.',el:'Μετά η Τούλα αποκοιμιέται.'}]}
];

const phrases=[
 {de:'Guten Morgen',es:'Buenos días',el:'Καλημέρα',emoji:'☀️'},
 {de:'Wo ist der Hafen?',es:'¿Dónde está el puerto?',el:'Πού είναι το λιμάνι;',emoji:'⚓'},
 {de:'Ich möchte eine Fahrkarte',es:'Quiero un billete',el:'Θέλω ένα εισιτήριο',emoji:'🎫'},
 {de:'Wann fährt das Schiff?',es:'¿Cuándo sale el barco?',el:'Πότε φεύγει το πλοίο;',emoji:'⛴️'},
 {de:'Danke',es:'Gracias',el:'Ευχαριστώ',emoji:'🙏'},
 {de:'Auf Wiedersehen',es:'Adiós',el:'Αντίο',emoji:'👋'}
];

const homeCatalog=[
 {id:'plant',icon:'🪴',cost:25,type:'decor',de:'Olivenbaum',es:'Olivo',el:'Ελιά',position:{x:68,y:22}},
 {id:'bed',icon:'🛏️',cost:60,type:'decor',de:'Wolkenbett',es:'Cama nube',el:'Κρεβάτι σύννεφο',position:{x:77,y:77}},
 {id:'lamp',icon:'🪔',cost:35,type:'decor',de:'Goldene Lampe',es:'Lámpara dorada',el:'Χρυσή λάμπα',position:{x:82,y:43}},
 {id:'books',icon:'📚',cost:40,type:'decor',de:'Bücherregal',es:'Estantería',el:'Βιβλιοθήκη',position:{x:43,y:24}},
 {id:'aquarium',icon:'🐠',cost:90,type:'decor',de:'Aquarium',es:'Acuario',el:'Ενυδρείο',position:{x:18,y:54}},
 {id:'crown',icon:'👑',cost:110,type:'outfit',de:'Goldene Krone',es:'Corona dorada',el:'Χρυσό στέμμα'}
];
const HOME_LAYOUT_VERSION=2;
const defaultTulaPosition={x:50,y:70};
const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
const safePoint=(point,fallback)=>({
 x:clamp(Number(point?.x)||fallback.x,7,93),
 y:clamp(Number(point?.y)||fallback.y,15,88)
});
function homeViewState(state){
 const legacy=Array.isArray(state.inventory.homeEquipped)?state.inventory.homeEquipped:[];
 const owned=Array.isArray(state.inventory.homeOwned)?state.inventory.homeOwned:['plant'];
 const placed=Array.isArray(state.inventory.homePlaced)?state.inventory.homePlaced:(legacy.length?legacy.filter(id=>homeCatalog.find(item=>item.id===id)?.type==='decor'):['plant']);
 const legacyOutfit=legacy.find(id=>homeCatalog.find(item=>item.id===id)?.type==='outfit')||null;
 return {
  owned,
  placed,
  outfit:state.inventory.homeOutfit||legacyOutfit,
  positions:state.inventory.homePositions||{},
  tulaPosition:safePoint(state.inventory.tulaHomePosition,defaultTulaPosition)
 };
}
function roomObject(item,positions){
 const point=safePoint(positions[item.id],item.position);
 return `<button class="home-room-object home-object-${item.id}" data-home-object="${item.id}" style="left:${point.x}%;top:${point.y}%" aria-label="${languageValue(item,sourceLanguage())} ${tr('verschieben','mover','μετακίνηση')}"><span aria-hidden="true">${item.icon}</span></button>`;
}
function migrateHomeLayout(){
 const state=getState();
 if(Number(state.inventory.homeLayoutVersion||0)>=HOME_LAYOUT_VERSION)return;
 setState(d=>{
  const home=homeViewState(d);
  d.inventory.homePositions={...home.positions,...Object.fromEntries(homeCatalog.filter(item=>item.type==='decor'&&home.placed.includes(item.id)).map(item=>[item.id,item.position]))};
  d.inventory.homeLayoutVersion=HOME_LAYOUT_VERSION;
  return d;
 });
}

function adaptivePool(){const s=getState(),mastery=s.progress.mastery||{};return shuffle(allWords()).sort((a,b)=>(mastery[a.id]?.right||0)-(mastery[b.id]?.right||0)).slice(0,10)}
function adaptiveRoute({top,nav}){
 if(!adaptive.items.length){adaptive.items=adaptivePool();adaptive.step=0;adaptive.score=0}
 if(adaptive.step>=adaptive.items.length){const r=grantReward({xp:25+adaptive.score*4,shells:8+adaptive.score,countDaily:true});adaptive={items:[],step:0,score:0,current:null};return `<div class="v3-shell page">${top()}<section class="celebration"><img src="${assets.characters.tula.poses.celebrating}" alt="Tula"><h1>${tr('Wiederholung geschafft!','¡Repaso completado!','Η επανάληψη ολοκληρώθηκε!')}</h1><div class="reward-row"><div>${rewardArt(assets.rewards.xpStar,'XP')}<strong>+${r.xp}</strong><small>XP</small></div><div>${rewardArt(assets.rewards.currencyShell,tr('Muscheln','Conchas','Κοχύλια'))}<strong>+${r.shells}</strong><small>${tr('Muscheln','Conchas','Κοχύλια')}</small></div></div><button class="primary" data-action="navigate" data-route="home">${tr('Zur Startseite','Ir al inicio','Στην αρχική')}</button></section></div>`}
 const w=adaptive.items[adaptive.step];adaptive.current=w;const cfg=profileConfig(),source=sourceLanguage(),target=targetLanguage();const opts=shuffle([w,...shuffle(allWords().filter(x=>x.id!==w.id)).slice(0,cfg.answers-1)]);return `<div class="v3-shell page">${top('home')}<section class="quiz-head"><div class="bar"><i style="width:${adaptive.step/adaptive.items.length*100}%"></i></div><span>${adaptive.step+1}/${adaptive.items.length}</span></section><section class="listen-card"><span>${w.emoji}</span><h2>${languageValue(w,source)}</h2><button data-action="adaptive-speak">🔊</button></section><div class="quiz-grid">${opts.map(x=>`<button data-action="adaptive-answer" data-id="${x.id}"><span>${x.emoji}</span><strong>${languageValue(x,target)}</strong></button>`).join('')}</div></div>${nav('home')}`}
function speakingRoute({top,nav}){const cfg=profileConfig(),items=allWords().slice(0,cfg.wordLimit),target=targetLanguage();return `<div class="v3-shell page">${top('home')}<section class="experience-hero"><div><span class="eyebrow">${tr('SPRECHTRAINER','ENTRENADOR DE VOZ','ΕΞΑΣΚΗΣΗ ΟΜΙΛΙΑΣ')}</span><h1>${tr('Sprich mit Tula','Habla con Tula','Μίλα με την Τούλα')}</h1><p>${tr('Höre ein Wort und sprich es laut nach.','Escucha una palabra y repítela en voz alta.','Άκου μια λέξη και πες την δυνατά.')}</p></div><img src="${assets.characters.tula.poses.speaking}" alt="Tula"></section><div class="explore-grid">${items.map(w=>`<button data-action="speaking-word" data-id="${w.id}"><span>${w.emoji}</span><strong>${languageValue(w,target)}</strong><small>${tr('Anhören & nachsprechen','Escuchar y repetir','Άκου και επανάλαβε')}</small></button>`).join('')}</div></div>${nav('home')}`}
function storiesRoute({top,nav}){const source=sourceLanguage();return `<div class="v3-shell page">${top('home')}<section class="experience-hero experience-mode-hero"><img class="experience-mode-art" src="${assets.cards.modes.stories}" alt=""><div><span class="eyebrow">${tr('MINI-GESCHICHTEN','MINI HISTORIAS','ΜΙΚΡΕΣ ΙΣΤΟΡΙΕΣ')}</span><h1>${tr('Tulas Geschichten','Historias de Tula','Οι ιστορίες της Τούλα')}</h1></div></section><section class="journey-grid">${stories.map((s,i)=>`<button data-action="open-story" data-index="${i}"><span>${s.icon}</span><div><strong>${languageValue(s,source)}</strong><small>3 ${tr('Kapitel','capítulos','κεφάλαια')}</small></div><b>→</b></button>`).join('')}</section></div>${nav('home')}`}
function storyRoute({top,nav}){const s=stories[story.index],p=s.pages[story.step],source=sourceLanguage(),target=targetLanguage();if(!p){const r=grantReward({xp:30,shells:10,countDaily:true});story={index:0,step:0,score:0};return `<div class="v3-shell page">${top()}<section class="celebration"><img src="${assets.characters.tula.poses.celebrating}" alt="Tula"><h1>${tr('Geschichte geschafft!','¡Historia completada!','Η ιστορία ολοκληρώθηκε!')}</h1><div class="reward-row"><div>${rewardArt(assets.rewards.xpStar,'XP')}<strong>+${r.xp}</strong></div><div>${rewardArt(assets.rewards.currencyShell,tr('Muscheln','Conchas','Κοχύλια'))}<strong>+${r.shells}</strong></div></div><button class="primary" data-action="navigate" data-route="stories">${tr('Weitere Geschichte','Otra historia','Άλλη ιστορία')}</button></section></div>`}const pose=story.index===2?assets.characters.tula.poses.sleeping:assets.characters.tula.poses.happy;return `<div class="v3-shell page">${top('stories')}<section class="story-card story-card-with-tula"><img class="story-tula" src="${pose}" alt="Tula"><div><span>${s.icon}</span><small>${story.step+1}/3</small><h1>${languageValue(s,source)}</h1><p>${languageValue(p,target)}</p><small>${languageValue(p,source)}</small><button data-action="story-speak">🔊 ${tr('Vorlesen','Leer en voz alta','Ανάγνωση')}</button><button class="primary" data-action="story-next">${tr('Weiter','Continuar','Συνέχεια')} →</button></div></section></div>${nav('home')}`}
function travelRoute({top,nav}){if(travel.step>=travel.items.length){const mode=travel.mode,base=mode==='castle'?{xp:60,shells:25}:{xp:40,shells:14};const r=grantReward({...base,countDaily:true});travel={mode:'harbor',items:[],step:0,score:0,current:null};return `<div class="v3-shell page">${top()}<section class="celebration"><img src="${assets.characters.tula.poses.celebrating}" alt="Tula"><h1>${tr('Abenteuer geschafft!','¡Aventura completada!','Η περιπέτεια ολοκληρώθηκε!')}</h1><div class="reward-row"><div>${rewardArt(assets.rewards.xpStar,'XP')}<strong>+${r.xp}</strong></div><div>${rewardArt(assets.rewards.currencyShell,tr('Muscheln','Conchas','Κοχύλια'))}<strong>+${r.shells}</strong></div></div><button class="primary" data-action="navigate" data-route="island">${tr('Zur Insel','Volver a la isla','Πίσω στο νησί')}</button></section></div>`}
 const x=travel.items[travel.step];travel.current=x;const source=sourceLanguage(),target=targetLanguage(),scene=travel.mode==='castle'?assets.backgrounds.worlds.castle:assets.backgrounds.worlds.harbor;const opts=shuffle([x,...shuffle(phrases.filter(p=>p!==x)).slice(0,travel.mode==='castle'?3:2)]);return `<div class="v3-shell page expansion-page">${top('island')}<section class="${travel.mode==='castle'?'castle-hero':'harbor-hero'} expansion-art-hero"><img class="expansion-scene" src="${scene}" alt=""><div><small>${travel.mode==='castle'?tr('BOSS-LEVEL','NIVEL JEFE','ΤΕΛΙΚΟ ΕΠΙΠΕΔΟ'):tr('REISE & DIALOGE','VIAJES Y DIÁLOGOS','ΤΑΞΙΔΙΑ ΚΑΙ ΔΙΑΛΟΓΟΙ')}</small><h1>${languageValue(x,source)}</h1></div></section><div class="dialog-options">${opts.map(o=>`<button data-action="travel-answer" data-value="${languageValue(o,target)}">${languageValue(o,target)}</button>`).join('')}</div></div>${nav('island')}`}
function homeRoute({top,nav}){
 migrateHomeLayout();
 const s=getState(),home=homeViewState(s),source=sourceLanguage(),tula=home.tulaPosition;
 const status=item=>{
  if(!home.owned.includes(item.id))return currencyAmount(item.cost);
  if(item.type==='outfit')return home.outfit===item.id?tr('Tula trägt es','Tula lo lleva','Η Τούλα το φοράει'):tr('Gekauft','Comprado','Αγορασμένο');
  return home.placed.includes(item.id)?tr('Aufgestellt','Colocado','Τοποθετημένο'):tr('Im Inventar','En el inventario','Στο απόθεμα');
 };
 const action=item=>{
  if(!home.owned.includes(item.id))return tr('Kaufen','Comprar','Αγορά');
  if(item.type==='outfit')return home.outfit===item.id?tr('Ausziehen','Quitar','Αφαίρεση'):tr('Anziehen','Poner','Φόρεμα');
  return home.placed.includes(item.id)?'✓':tr('Aufstellen','Colocar','Τοποθέτηση');
 };
 return `<div class="v3-shell page tula-home-page">${top('island')}
 <section class="page-title"><span class="eyebrow">${tr('TULAS ZUHAUSE','CASA DE TULA','ΤΟ ΣΠΙΤΙ ΤΗΣ ΤΟΥΛΑ')}</span><h1>${tr('Mach es dir gemütlich','Ponte cómodo','Νιώσε σαν στο σπίτι σου')}</h1></section>
 <section class="home-room-card">
  <header class="home-room-toolbar"><div><span>☝️</span><p><strong>${tr('Ziehen & abstellen','Arrastra y coloca','Σύρε και τοποθέτησε')}</strong><small>${tr('Die Positionen bleiben gespeichert','Las posiciones se guardan','Οι θέσεις αποθηκεύονται')}</small></p></div><button data-action="home-reset">${tr('Aufräumen','Ordenar','Τακτοποίηση')}</button></header>
  <div class="tula-room" data-home-room>
   <img class="home-room-scene" src="${assets.backgrounds.home.interior}" alt="">
   <div class="room-items">${homeCatalog.filter(i=>i.type==='decor'&&home.placed.includes(i.id)).map(i=>roomObject(i,home.positions)).join('')}</div>
   <button class="room-tula home-room-object" data-home-object="tula" style="left:${tula.x}%;top:${tula.y}%" aria-label="Tula ${tr('verschieben','mover','μετακίνηση')}"><img src="${assets.characters.tula.poses.neutral}" alt=""><span class="tula-outfit" aria-hidden="true">${homeCatalog.find(i=>i.id===home.outfit)?.icon||''}</span></button>
   <span class="home-room-status">${home.outfit?`${tr('Tula trägt','Tula lleva','Η Τούλα φοράει')}: ${languageValue(homeCatalog.find(i=>i.id===home.outfit),source)}`:tr('Wähle ein Outfit für Tula','Elige un atuendo para Tula','Διάλεξε ρούχο για την Τούλα')}</span>
  </div>
 </section>
 <section class="shop-section home-shop-section">${homeCatalog.map(i=>`<article class="shop-card-v3 ${home.placed.includes(i.id)||home.outfit===i.id?'home-active':''}"><span>${i.icon}</span><div><strong>${languageValue(i,source)}</strong><small>${status(i)}</small></div><button data-action="home-item" data-id="${i.id}">${action(i)}</button></article>`).join('')}</section>
 </div>${nav('island')}`;
}

export function registerExperienceRoutes(router,ui){router.register('adaptive',()=>adaptiveRoute(ui));router.register('speaking',()=>speakingRoute(ui));router.register('stories',()=>storiesRoute(ui));router.register('story',()=>storyRoute(ui));router.register('harbor',()=>travelRoute(ui));router.register('castle',()=>travelRoute(ui));router.register('tula-home',()=>homeRoute(ui))}
export function registerExperienceActions(router){
 migrateHomeLayout();
 registerAction('start-adaptive',()=>{adaptive={items:[],step:0,score:0,current:null};router.navigate('adaptive')});
 registerAction('adaptive-speak',()=>{const target=targetLanguage();speak(languageValue(adaptive.current,target),languageMeta(target).voice)});
 registerAction('adaptive-answer',({data})=>{const ok=data.id===adaptive.current.id;setState(d=>{const m=d.progress.mastery[adaptive.current.id]||{right:0,wrong:0};ok?m.right++:m.wrong++;d.progress.mastery[adaptive.current.id]=m;return d});if(ok)adaptive.score++;adaptive.step++;router.renderCurrent()});
 registerAction('speaking-word',({data})=>{const w=allWords().find(x=>x.id===data.id),target=targetLanguage();if(w)speak(languageValue(w,target),languageMeta(target).voice,{slow:true})});
 registerAction('open-story',({data})=>{story={index:Number(data.index),step:0,score:0};router.navigate('story')});
 registerAction('story-speak',()=>{const p=stories[story.index].pages[story.step],target=targetLanguage();speak(languageValue(p,target),languageMeta(target).voice,{slow:true})});
 registerAction('story-next',()=>{story.step++;router.renderCurrent()});
 registerAction('open-harbor',()=>{if(levelFromXp()<7)return alert(tr('Der Hafen öffnet ab Level 7.','El puerto se abre en nivel 7.','Το λιμάνι ανοίγει στο επίπεδο 7.'));travel={mode:'harbor',items:[...phrases],step:0,score:0,current:null};router.navigate('harbor')});
 registerAction('open-castle',()=>{if(levelFromXp()<10)return alert(tr('Das Schloss öffnet ab Level 10.','El castillo se abre en nivel 10.','Το κάστρο ανοίγει στο επίπεδο 10.'));travel={mode:'castle',items:shuffle(phrases).slice(0,5),step:0,score:0,current:null};router.navigate('castle')});
 registerAction('travel-answer',({data})=>{if(data.value===languageValue(travel.current,targetLanguage()))travel.score++;travel.step++;router.renderCurrent()});
 registerAction('home-item',async({data})=>{
  const item=homeCatalog.find(i=>i.id===data.id);if(!item)return;
  const before=homeViewState(getState()),isNew=!before.owned.includes(item.id);
  if(isNew){const result=await spendEconomyShells(`home:${item.id}`,item.cost);if(!result.ok)return alert(tr('Nicht genug Muscheln.','No hay suficientes conchas.','Δεν έχεις αρκετά κοχύλια.'))}
  setState(d=>{
   const current=homeViewState(d);
   d.inventory.homeLayoutVersion=HOME_LAYOUT_VERSION;
   d.inventory.homeOwned=[...new Set([...current.owned,item.id])];
   d.inventory.homePlaced=item.type==='decor'
    ?current.placed.includes(item.id)?current.placed.filter(id=>id!==item.id):[...current.placed,item.id]
    :current.placed;
   if(item.type==='outfit')d.inventory.homeOutfit=current.outfit===item.id?null:item.id;
   if(item.type==='decor'&&isNew){
    d.inventory.homePlaced=[...new Set([...current.placed,item.id])];
    d.inventory.homePositions={...current.positions,[item.id]:item.position};
   }
   return d;
  });
  router.renderCurrent();
 });
 registerAction('home-reset',()=>{
  setState(d=>{
   d.inventory.homeLayoutVersion=HOME_LAYOUT_VERSION;
   d.inventory.homePositions=Object.fromEntries(homeCatalog.filter(item=>item.type==='decor').map(item=>[item.id,item.position]));
   d.inventory.tulaHomePosition=defaultTulaPosition;
   return d;
  });
  router.renderCurrent();
 });
 installHomeDragging();
}

let homeDraggingInstalled=false;
let homeDrag=null;
function installHomeDragging(){
 if(homeDraggingInstalled)return;homeDraggingInstalled=true;
 document.addEventListener('pointerdown',event=>{
  const object=event.target.closest('[data-home-object]'),room=object?.closest('[data-home-room]');
  if(!object||!room)return;
  event.preventDefault();
  const rect=room.getBoundingClientRect();
  homeDrag={id:object.dataset.homeObject,pointerId:event.pointerId,object,rect,moved:false,startX:event.clientX,startY:event.clientY};
  object.classList.add('dragging');
  object.setPointerCapture?.(event.pointerId);
 });
 document.addEventListener('pointermove',event=>{
  if(!homeDrag||event.pointerId!==homeDrag.pointerId)return;
  if(Math.hypot(event.clientX-homeDrag.startX,event.clientY-homeDrag.startY)>4)homeDrag.moved=true;
  if(!homeDrag.moved)return;
  const x=clamp((event.clientX-homeDrag.rect.left)/homeDrag.rect.width*100,homeDrag.id==='tula'?11:7,homeDrag.id==='tula'?89:93);
  const y=clamp((event.clientY-homeDrag.rect.top)/homeDrag.rect.height*100,homeDrag.id==='tula'?25:15,homeDrag.id==='tula'?84:88);
  homeDrag.object.style.left=`${x}%`;homeDrag.object.style.top=`${y}%`;
 });
 document.addEventListener('pointerup',event=>{
  if(!homeDrag||event.pointerId!==homeDrag.pointerId)return;
  const {id,object,moved}=homeDrag;object.classList.remove('dragging');homeDrag=null;
  if(!moved)return;
  const point={x:Number.parseFloat(object.style.left),y:Number.parseFloat(object.style.top)};
  setState(d=>{
   d.inventory.homeLayoutVersion=HOME_LAYOUT_VERSION;
   if(id==='tula')d.inventory.tulaHomePosition=point;
   else d.inventory.homePositions={...(d.inventory.homePositions||{}),[id]:point};
   return d;
  });
 });
 document.addEventListener('keydown',event=>{
  const object=event.target.closest('[data-home-object]');
  const moves={ArrowLeft:[-2,0],ArrowRight:[2,0],ArrowUp:[0,-2],ArrowDown:[0,2]};
  if(!object||!moves[event.key])return;
  event.preventDefault();
  const id=object.dataset.homeObject,current=homeViewState(getState());
  const fallback=id==='tula'?current.tulaPosition:homeCatalog.find(item=>item.id===id)?.position;
  const point=safePoint(id==='tula'?current.tulaPosition:current.positions[id],fallback);
  const next={x:point.x+moves[event.key][0],y:point.y+moves[event.key][1]};
  object.style.left=`${next.x}%`;object.style.top=`${next.y}%`;
  setState(d=>{
   d.inventory.homeLayoutVersion=HOME_LAYOUT_VERSION;
   if(id==='tula')d.inventory.tulaHomePosition=next;
   else d.inventory.homePositions={...(d.inventory.homePositions||{}),[id]:next};
   return d;
  });
 });
}
