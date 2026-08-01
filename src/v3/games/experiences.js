import { collections } from '../content-multilingual.js';
import {
  getState,setState,registerAction,speak,grantReward,spendShells,levelFromXp,
  sourceLanguage,targetLanguage,languageMeta,languageValue,uiText
} from '../core/index.js';
import { profileConfig } from '../screens/child-profile.js';

const tr=(de,es,el=de)=>uiText(de,es,el);
const shuffle=a=>[...a].sort(()=>Math.random()-.5);
const allWords=()=>collections.flatMap(c=>c.words.map(w=>({...w,collection:c.id})));
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
 {id:'plant',icon:'🪴',cost:25,de:'Olivenbaum',es:'Olivo',el:'Ελιά'},
 {id:'bed',icon:'🛏️',cost:60,de:'Wolkenbett',es:'Cama nube',el:'Κρεβάτι σύννεφο'},
 {id:'lamp',icon:'🪔',cost:35,de:'Goldene Lampe',es:'Lámpara dorada',el:'Χρυσή λάμπα'},
 {id:'books',icon:'📚',cost:40,de:'Bücherregal',es:'Estantería',el:'Βιβλιοθήκη'},
 {id:'aquarium',icon:'🐠',cost:90,de:'Aquarium',es:'Acuario',el:'Ενυδρείο'},
 {id:'crown',icon:'👑',cost:110,de:'Goldene Krone',es:'Corona dorada',el:'Χρυσό στέμμα'}
];

function adaptivePool(){const s=getState(),mastery=s.progress.mastery||{};return shuffle(allWords()).sort((a,b)=>(mastery[a.id]?.right||0)-(mastery[b.id]?.right||0)).slice(0,10)}
function adaptiveRoute({top,nav}){
 if(!adaptive.items.length){adaptive.items=adaptivePool();adaptive.step=0;adaptive.score=0}
 if(adaptive.step>=adaptive.items.length){const r=grantReward({xp:25+adaptive.score*4,shells:8+adaptive.score,countDaily:true});adaptive={items:[],step:0,score:0,current:null};return `<div class="v3-shell page">${top()}<section class="celebration"><div style="font-size:72px">🧠🐢</div><h1>${tr('Wiederholung geschafft!','¡Repaso completado!','Η επανάληψη ολοκληρώθηκε!')}</h1><div class="reward-row"><div>✨<strong>+${r.xp}</strong><small>XP</small></div><div>🐚<strong>+${r.shells}</strong><small>${tr('Muscheln','Conchas','Κοχύλια')}</small></div></div><button class="primary" data-action="navigate" data-route="home">${tr('Zur Startseite','Ir al inicio','Στην αρχική')}</button></section></div>`}
 const w=adaptive.items[adaptive.step];adaptive.current=w;const cfg=profileConfig(),source=sourceLanguage(),target=targetLanguage();const opts=shuffle([w,...shuffle(allWords().filter(x=>x.id!==w.id)).slice(0,cfg.answers-1)]);return `<div class="v3-shell page">${top('home')}<section class="quiz-head"><div class="bar"><i style="width:${adaptive.step/adaptive.items.length*100}%"></i></div><span>${adaptive.step+1}/${adaptive.items.length}</span></section><section class="listen-card"><span>${w.emoji}</span><h2>${languageValue(w,source)}</h2><button data-action="adaptive-speak">🔊</button></section><div class="quiz-grid">${opts.map(x=>`<button data-action="adaptive-answer" data-id="${x.id}"><span>${x.emoji}</span><strong>${languageValue(x,target)}</strong></button>`).join('')}</div></div>${nav('home')}`}
function speakingRoute({top,nav}){const cfg=profileConfig(),items=allWords().slice(0,cfg.wordLimit),target=targetLanguage();return `<div class="v3-shell page">${top('home')}<section class="page-title"><span class="eyebrow">${tr('SPRECHTRAINER','ENTRENADOR DE VOZ','ΕΞΑΣΚΗΣΗ ΟΜΙΛΙΑΣ')}</span><h1>${tr('Sprich mit Tula','Habla con Tula','Μίλα με την Τούλα')}</h1><p>${tr('Höre ein Wort und sprich es laut nach.','Escucha una palabra y repítela en voz alta.','Άκου μια λέξη και πες την δυνατά.')}</p></section><div class="explore-grid">${items.map(w=>`<button data-action="speaking-word" data-id="${w.id}"><span>${w.emoji}</span><strong>${languageValue(w,target)}</strong><small>${tr('Anhören & nachsprechen','Escuchar y repetir','Άκου και επανάλαβε')}</small></button>`).join('')}</div></div>${nav('home')}`}
function storiesRoute({top,nav}){const source=sourceLanguage();return `<div class="v3-shell page">${top('home')}<section class="page-title"><span class="eyebrow">${tr('MINI-GESCHICHTEN','MINI HISTORIAS','ΜΙΚΡΕΣ ΙΣΤΟΡΙΕΣ')}</span><h1>${tr('Tulas Geschichten','Historias de Tula','Οι ιστορίες της Τούλα')}</h1></section><section class="journey-grid">${stories.map((s,i)=>`<button data-action="open-story" data-index="${i}"><span>${s.icon}</span><div><strong>${languageValue(s,source)}</strong><small>3 ${tr('Kapitel','capítulos','κεφάλαια')}</small></div><b>→</b></button>`).join('')}</section></div>${nav('home')}`}
function storyRoute({top,nav}){const s=stories[story.index],p=s.pages[story.step],source=sourceLanguage(),target=targetLanguage();if(!p){const r=grantReward({xp:30,shells:10,countDaily:true});story={index:0,step:0,score:0};return `<div class="v3-shell page">${top()}<section class="celebration"><div style="font-size:72px">📖✨</div><h1>${tr('Geschichte geschafft!','¡Historia completada!','Η ιστορία ολοκληρώθηκε!')}</h1><div class="reward-row"><div>✨<strong>+${r.xp}</strong></div><div>🐚<strong>+${r.shells}</strong></div></div><button class="primary" data-action="navigate" data-route="stories">${tr('Weitere Geschichte','Otra historia','Άλλη ιστορία')}</button></section></div>`}return `<div class="v3-shell page">${top('stories')}<section class="story-card"><span>${s.icon}</span><small>${story.step+1}/3</small><h1>${languageValue(s,source)}</h1><p>${languageValue(p,target)}</p><small>${languageValue(p,source)}</small><button data-action="story-speak">🔊 ${tr('Vorlesen','Leer en voz alta','Ανάγνωση')}</button><button class="primary" data-action="story-next">${tr('Weiter','Continuar','Συνέχεια')} →</button></section></div>${nav('home')}`}
function travelRoute({top,nav}){if(travel.step>=travel.items.length){const mode=travel.mode,base=mode==='castle'?{xp:60,shells:25}:{xp:40,shells:14};const r=grantReward({...base,countDaily:true});travel={mode:'harbor',items:[],step:0,score:0,current:null};return `<div class="v3-shell page">${top()}<section class="celebration"><div style="font-size:72px">${mode==='castle'?'🏰':'⚓'}✨</div><h1>${tr('Abenteuer geschafft!','¡Aventura completada!','Η περιπέτεια ολοκληρώθηκε!')}</h1><div class="reward-row"><div>✨<strong>+${r.xp}</strong></div><div>🐚<strong>+${r.shells}</strong></div></div><button class="primary" data-action="navigate" data-route="island">${tr('Zur Insel','Volver a la isla','Πίσω στο νησί')}</button></section></div>`}
 const x=travel.items[travel.step];travel.current=x;const source=sourceLanguage(),target=targetLanguage();const opts=shuffle([x,...shuffle(phrases.filter(p=>p!==x)).slice(0,travel.mode==='castle'?3:2)]);return `<div class="v3-shell page expansion-page">${top('island')}<section class="${travel.mode==='castle'?'castle-hero':'harbor-hero'}"><span>${travel.mode==='castle'?'🏰':'⚓'}</span><div><small>${travel.mode==='castle'?tr('BOSS-LEVEL','NIVEL JEFE','ΤΕΛΙΚΟ ΕΠΙΠΕΔΟ'):tr('REISE & DIALOGE','VIAJES Y DIÁLOGOS','ΤΑΞΙΔΙΑ ΚΑΙ ΔΙΑΛΟΓΟΙ')}</small><h1>${languageValue(x,source)}</h1></div></section><div class="dialog-options">${opts.map(o=>`<button data-action="travel-answer" data-value="${languageValue(o,target)}">${languageValue(o,target)}</button>`).join('')}</div></div>${nav('island')}`}
function homeRoute({top,nav}){const s=getState(),owned=s.inventory.homeOwned||['plant'],equipped=s.inventory.homeEquipped||['plant'],source=sourceLanguage();return `<div class="v3-shell page">${top('island')}<section class="page-title"><span class="eyebrow">${tr('TULAS ZUHAUSE','CASA DE TULA','ΤΟ ΣΠΙΤΙ ΤΗΣ ΤΟΥΛΑ')}</span><h1>${tr('Mach es dir gemütlich','Ponte cómodo','Νιώσε σαν στο σπίτι σου')}</h1></section><section class="tula-room"><div class="room-items">${homeCatalog.filter(i=>equipped.includes(i.id)).map(i=>`<span>${i.icon}</span>`).join('')}</div><div class="room-tula"><img src="assets/illustrations/tula-welcome.svg" alt="Tula"></div></section><section class="shop-section">${homeCatalog.map(i=>`<article class="shop-card-v3"><span>${i.icon}</span><div><strong>${languageValue(i,source)}</strong><small>${owned.includes(i.id)?tr('Gekauft','Comprado','Αγορασμένο'):`🐚 ${i.cost}`}</small></div><button data-action="home-item" data-id="${i.id}">${equipped.includes(i.id)?'✓':owned.includes(i.id)?tr('Aufstellen','Colocar','Τοποθέτηση'):tr('Kaufen','Comprar','Αγορά')}</button></article>`).join('')}</section></div>${nav('island')}`}

export function registerExperienceRoutes(router,ui){router.register('adaptive',()=>adaptiveRoute(ui));router.register('speaking',()=>speakingRoute(ui));router.register('stories',()=>storiesRoute(ui));router.register('story',()=>storyRoute(ui));router.register('harbor',()=>travelRoute(ui));router.register('castle',()=>travelRoute(ui));router.register('tula-home',()=>homeRoute(ui))}
export function registerExperienceActions(router){
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
 registerAction('home-item',({data})=>{const item=homeCatalog.find(i=>i.id===data.id);if(!item)return;const s=getState(),owned=s.inventory.homeOwned||['plant'];if(!owned.includes(item.id)&&!spendShells(item.cost))return alert(tr('Nicht genug Muscheln.','No hay suficientes conchas.','Δεν έχεις αρκετά κοχύλια.'));setState(d=>{d.inventory.homeOwned=[...new Set([...(d.inventory.homeOwned||['plant']),item.id])];const current=d.inventory.homeEquipped||['plant'];d.inventory.homeEquipped=current.includes(item.id)?current.filter(x=>x!==item.id):[...current,item.id].slice(-6);return d});router.renderCurrent()});
}
