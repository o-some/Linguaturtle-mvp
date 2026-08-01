import { collections } from './content.js';

const KEY='linguaturtle-v3-preview';
const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}};
const write=s=>localStorage.setItem(KEY,JSON.stringify(s));
const lang=()=>read().lang==='es'?'es':'de';
const target=()=>lang()==='de'?'es':'de';
const tr=(de,es)=>lang()==='de'?de:es;
const allWords=()=>collections.flatMap(c=>c.words);
const clean=s=>(s||'').toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zñüäöß\s]/gi,'').trim();
const similarity=(a,b)=>{a=clean(a);b=clean(b);if(!a||!b)return 0;if(a===b)return 100;const A=new Set(a.split('')),B=new Set(b.split(''));const common=[...A].filter(x=>B.has(x)).length;const wordBonus=a.split(/\s+/).filter(x=>b.includes(x)).length/Math.max(1,a.split(/\s+/).length);return Math.min(99,Math.round((common/Math.max(A.size,B.size)*.55+wordBonus*.45)*100))};
const speak=(text,code=target())=>{if(!('speechSynthesis'in window))return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang=code==='de'?'de-DE':'es-ES';u.rate=.76;u.pitch=1.02;speechSynthesis.speak(u)};
const reward=(xp,shells)=>{const s=read();s.xp=Number(s.xp||0)+xp;s.shells=Number(s.shells||0)+shells;s.daily=Math.min(5,Number(s.daily||0)+1);s.speakingCount=Number(s.speakingCount||0)+1;write(s)};
const toast=text=>{document.querySelector('.speak-toast')?.remove();document.body.insertAdjacentHTML('beforeend',`<div class="speak-toast">${text}</div>`);setTimeout(()=>document.querySelector('.speak-toast')?.remove(),1600)};

const phrases=[
{de:'Guten Morgen, Tula!',es:'¡Buenos días, Tula!',icon:'☀️'},
{de:'Ich heiße Tula.',es:'Me llamo Tula.',icon:'🐢'},
{de:'Wo ist der Hafen?',es:'¿Dónde está el puerto?',icon:'⚓'},
{de:'Ich möchte einen Apfel.',es:'Quiero una manzana.',icon:'🍎'},
{de:'Der Hund rennt schnell.',es:'El perro corre rápido.',icon:'🐶'},
{de:'Das Meer ist blau.',es:'El mar es azul.',icon:'🌊'},
{de:'Danke und auf Wiedersehen.',es:'Gracias y hasta luego.',icon:'👋'},
{de:'Ich lerne jeden Tag.',es:'Aprendo cada día.',icon:'📚'}
];

const stories=[
{id:'apple',icon:'🍎',de:'Tula sucht einen Apfel',es:'Tula busca una manzana',pages:[
{de:'Tula geht in den Garten.',es:'Tula va al jardín.',qDe:'Wohin geht Tula?',qEs:'¿Adónde va Tula?',answers:[['In den Garten','Al jardín'],['Zum Hafen','Al puerto'],['In die Schule','A la escuela']],correct:0},
{de:'Unter dem Baum liegt ein roter Apfel.',es:'Debajo del árbol hay una manzana roja.',qDe:'Welche Farbe hat der Apfel?',qEs:'¿De qué color es la manzana?',answers:[['Blau','Azul'],['Rot','Roja'],['Gelb','Amarilla']],correct:1},
{de:'Tula nimmt den Apfel und sagt Danke.',es:'Tula toma la manzana y dice gracias.',qDe:'Was sagt Tula?',qEs:'¿Qué dice Tula?',answers:[['Bitte','Por favor'],['Hallo','Hola'],['Danke','Gracias']],correct:2}]},
{id:'harbor',icon:'⛵',de:'Ein Tag am Hafen',es:'Un día en el puerto',pages:[
{de:'Tula sieht ein weißes Schiff.',es:'Tula ve un barco blanco.',qDe:'Was sieht Tula?',qEs:'¿Qué ve Tula?',answers:[['Ein Schiff','Un barco'],['Einen Zug','Un tren'],['Ein Auto','Un coche']],correct:0},
{de:'Das Schiff fährt über das blaue Meer.',es:'El barco navega por el mar azul.',qDe:'Wo fährt das Schiff?',qEs:'¿Por dónde navega el barco?',answers:[['Über das Meer','Por el mar'],['Durch den Wald','Por el bosque'],['In der Schule','En la escuela']],correct:0},
{de:'Am Abend winkt Tula dem Kapitän.',es:'Por la tarde Tula saluda al capitán.',qDe:'Wem winkt Tula?',qEs:'¿A quién saluda Tula?',answers:[['Dem Lehrer','Al profesor'],['Dem Kapitän','Al capitán'],['Dem Hund','Al perro']],correct:1}]},
{id:'home',icon:'🏡',de:'Ein gemütlicher Abend',es:'Una tarde acogedora',pages:[
{de:'Tula sitzt auf dem blauen Teppich.',es:'Tula se sienta en la alfombra azul.',qDe:'Wo sitzt Tula?',qEs:'¿Dónde se sienta Tula?',answers:[['Auf dem Teppich','En la alfombra'],['Auf dem Baum','En el árbol'],['Im Schiff','En el barco']],correct:0},
{de:'Sie liest ein Buch über Tiere.',es:'Lee un libro sobre animales.',qDe:'Was liest Tula?',qEs:'¿Qué lee Tula?',answers:[['Einen Brief','Una carta'],['Ein Buch','Un libro'],['Eine Karte','Un mapa']],correct:1},
{de:'Dann schläft Tula in ihrem Bett.',es:'Después Tula duerme en su cama.',qDe:'Was macht Tula am Ende?',qEs:'¿Qué hace Tula al final?',answers:[['Sie tanzt','Baila'],['Sie schwimmt','Nada'],['Sie schläft','Duerme']],correct:2}]}];

let mode='word',items=[],step=0,score=0,current=null,story=null,page=0;
const recognitionCtor=window.SpeechRecognition||window.webkitSpeechRecognition;

function injectCards(){
 const add=()=>{
  document.querySelectorAll('.mode-picker').forEach(box=>{
   if(!box.querySelector('[data-speaking-open]'))box.insertAdjacentHTML('beforeend',`<button data-speaking-open><span>🎙️</span><div><strong>${tr('Sprechtrainer','Entrenador de pronunciación')}</strong><small>${tr('Wörter und Sätze laut nachsprechen · 🐚 bis 20','Repite palabras y frases · hasta 🐚 20')}</small></div><b>→</b></button>`);
  });
  const journey=document.querySelector('.journey-grid');
  if(journey&&!journey.querySelector('[data-stories-open]'))journey.insertAdjacentHTML('beforeend',`<button data-stories-open><span>📖</span><div><strong>${tr('Tulas Geschichten','Historias de Tula')}</strong><small>${tr('Lesen, hören und entscheiden','Leer, escuchar y decidir')}</small></div><b>→</b></button>`);
 };
 new MutationObserver(add).observe(document.querySelector('#app'),{childList:true,subtree:true});add();
}

function shell(content){document.querySelector('#app').innerHTML=`<div class="v3-shell page"><header class="v3-top"><button class="icon" data-speaking-back>←</button><div class="v3-brand"><i>🐢</i><strong>LinguaTurtle</strong></div><span class="wallet-mini">🐚 ${Number(read().shells||0)}</span></header>${content}</div>`}
function startSpeaking(kind='word'){
 mode=kind;step=0;score=0;
 if(kind==='word')items=[...allWords()].sort(()=>Math.random()-.5).slice(0,8).map(w=>({icon:w.emoji,de:w.de,es:w.es}));else items=[...phrases].sort(()=>Math.random()-.5).slice(0,6);
 renderSpeaking();
}
function renderSpeaking(){
 if(step>=items.length)return finishSpeaking();current=items[step];const phrase=current[target()];
 shell(`<section class="speaking-head"><div class="bar"><i style="width:${step/items.length*100}%"></i></div><span>${step+1}/${items.length}</span></section><section class="speech-card"><span class="speech-icon">${current.icon}</span><span class="eyebrow">${mode==='word'?tr('WORT NACHSPRECHEN','REPITE LA PALABRA'):tr('SATZ NACHSPRECHEN','REPITE LA FRASE')}</span><h1>${phrase}</h1><p>${current[lang()]}</p><button data-speech-listen>🔊 ${tr('Langsam anhören','Escuchar despacio')}</button></section><section class="mic-panel"><button class="mic-button" data-speech-record>🎙️</button><strong>${recognitionCtor?tr('Tippe und sprich deutlich','Toca y habla claramente'):tr('Sprich laut nach und bestätige','Repite en voz alta y confirma')}</strong><small>${recognitionCtor?tr('Die Bewertung erfolgt nur auf deinem Gerät.','La evaluación se realiza en tu dispositivo.'):tr('Dein Browser unterstützt keine automatische Erkennung.','Tu navegador no admite reconocimiento automático.')}</small><div id="speechResult"></div></section>${!recognitionCtor?`<button class="primary" data-speech-confirm>${tr('Ich habe es gesprochen','Lo he dicho')} ✓</button>`:''}`);
 setTimeout(()=>speak(phrase),250);
}
function record(){
 if(!recognitionCtor)return;
 const r=new recognitionCtor();r.lang=target()==='de'?'de-DE':'es-ES';r.interimResults=false;r.maxAlternatives=1;
 const btn=document.querySelector('[data-speech-record]');btn?.classList.add('listening');
 r.onresult=e=>{const heard=e.results[0][0].transcript;const percent=similarity(heard,current[target()]);document.querySelector('#speechResult').innerHTML=`<div class="speech-score ${percent>=65?'good':'try'}"><strong>${percent}%</strong><span>${tr('Erkannt:','Erkannt:')} ${heard}</span></div>`;if(percent>=65){score++;reward(10,2);toast(tr('Sehr schön gesprochen! +2 Muscheln','¡Muy bien pronunciado! +2 conchas'));setTimeout(()=>{step++;renderSpeaking()},1000)}else toast(tr('Noch einmal langsam versuchen.','Inténtalo otra vez más despacio.'))};
 r.onerror=()=>toast(tr('Ich konnte dich nicht verstehen. Versuch es erneut.','No pude entenderte. Inténtalo de nuevo.'));
 r.onend=()=>btn?.classList.remove('listening');r.start();
}
function manualConfirm(){score++;reward(6,1);step++;renderSpeaking()}
function finishSpeaking(){shell(`<section class="celebration speaking-finish"><div class="finish-orb">🎙️</div><span class="eyebrow">${tr('SPRECHRUNDE GESCHAFFT','RONDA COMPLETADA')}</span><h1>${tr('Tula hat dir gut zugehört!','¡Tula te ha escuchado!')}</h1><p>${tr(`${score} von ${items.length} Aufgaben geschafft.`,`${score} de ${items.length} tareas completadas.`)}</p><div class="reward-row"><div><span>✨</span><strong>+${score*10}</strong><small>XP</small></div><div><span>🐚</span><strong>+${recognitionCtor?score*2:score}</strong><small>${tr('Muscheln','Conchas')}</small></div></div><button class="primary" data-speaking-replay>${tr('Noch einmal sprechen','Hablar otra vez')}</button><button class="secondary" data-speaking-home>⌂ ${tr('Zur Startseite','Ir al inicio')}</button></section>`)}

function storyShelf(){shell(`<section class="page-title"><span class="eyebrow">${tr('TULAS GESCHICHTEN','HISTORIAS DE TULA')}</span><h1>${tr('Kleine Abenteuer','Pequeñas aventuras')}</h1><p>${tr('Höre die Geschichte und hilf Tula bei den Entscheidungen.','Escucha la historia y ayuda a Tula a decidir.')}</p></section><section class="story-shelf">${stories.map(s=>`<button data-story-id="${s.id}"><span>${s.icon}</span><div><strong>${s[lang()]}</strong><small>3 ${tr('Kapitel','capítulos')} · 🐚 12</small></div><b>→</b></button>`).join('')}</section>`)}
function startStory(id){story=stories.find(s=>s.id===id);page=0;score=0;renderStory()}
function renderStory(){if(page>=story.pages.length)return finishStory();const p=story.pages[page];shell(`<section class="story-progress"><div class="bar"><i style="width:${page/story.pages.length*100}%"></i></div><span>${page+1}/${story.pages.length}</span></section><section class="story-scene"><div class="story-art">${story.icon}</div><span class="eyebrow">${story[lang()]}</span><h1>${p[target()]}</h1><p>${p[lang()]}</p><button data-story-listen>🔊 ${tr('Geschichte anhören','Escuchar la historia')}</button></section><section class="story-question"><h2>${p[lang()==='de'?'qDe':'qEs']}</h2><div>${p.answers.map((a,i)=>`<button data-story-answer="${i}">${a[lang()==='de'?0:1]}</button>`).join('')}</div></section>`);setTimeout(()=>speak(p[target()]),250)}
function answerStory(i){const p=story.pages[page];if(Number(i)!==p.correct){toast(tr('Fast! Schau noch einmal in die Geschichte.','¡Casi! Mira otra vez la historia.'));return}score++;reward(8,2);toast(tr('Richtig! +2 Muscheln','¡Correcto! +2 conchas'));setTimeout(()=>{page++;renderStory()},550)}
function finishStory(){reward(15,6);shell(`<section class="celebration story-finish"><div class="finish-orb">📖</div><span class="eyebrow">${tr('GESCHICHTE BEENDET','HISTORIA TERMINADA')}</span><h1>${tr('Was für ein Abenteuer!','¡Qué aventura!')}</h1><p>${tr('Du hast Tula durch die ganze Geschichte begleitet.','Has acompañado a Tula durante toda la historia.')}</p><div class="reward-row"><div><span>✨</span><strong>+${score*8+15}</strong><small>XP</small></div><div><span>🐚</span><strong>+${score*2+6}</strong><small>${tr('Muscheln','Conchas')}</small></div></div><button class="primary" data-stories-open>${tr('Weitere Geschichte','Otra historia')}</button><button class="secondary" data-speaking-home>⌂ ${tr('Zur Startseite','Ir al inicio')}</button></section>`)}

function goHome(){location.reload()}
document.addEventListener('click',e=>{
 if(e.target.closest('[data-speaking-open]'))startSpeaking('word');
 if(e.target.closest('[data-speaking-sentences]'))startSpeaking('sentence');
 if(e.target.closest('[data-speech-listen]'))speak(current[target()]);
 if(e.target.closest('[data-speech-record]'))record();
 if(e.target.closest('[data-speech-confirm]'))manualConfirm();
 if(e.target.closest('[data-speaking-replay]'))startSpeaking(mode);
 if(e.target.closest('[data-stories-open]'))storyShelf();
 const storyId=e.target.closest('[data-story-id]')?.dataset.storyId;if(storyId)startStory(storyId);
 if(e.target.closest('[data-story-listen]'))speak(story.pages[page][target()]);
 const ans=e.target.closest('[data-story-answer]')?.dataset.storyAnswer;if(ans!==undefined)answerStory(ans);
 if(e.target.closest('[data-speaking-home]')||e.target.closest('[data-speaking-back]'))goHome();
});

injectCards();
window.LinguaTurtleSpeaking={startWords:()=>startSpeaking('word'),startSentences:()=>startSpeaking('sentence'),openStories:storyShelf};
