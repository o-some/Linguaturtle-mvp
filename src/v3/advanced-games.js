const KEY='linguaturtle-v3-preview';
const app=document.querySelector('#app');
let timer=null;
let memory={cards:[],open:[],matched:[],score:0};
let speed={items:[],step:0,score:0,combo:0,time:45,current:null};

const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}};
const write=state=>localStorage.setItem(KEY,JSON.stringify(state));
const lang=()=>read().lang||'de';
const t=(de,es)=>lang()==='de'?de:es;
const target=()=>lang()==='de'?'es':'de';
const shuffle=a=>[...a].sort(()=>Math.random()-.5);
const words=()=>[
  ['🐶','Hund','perro'],['🐱','Katze','gato'],['🐦','Vogel','pájaro'],['🐟','Fisch','pez'],
  ['🍎','Apfel','manzana'],['🍓','Erdbeere','fresa'],['🥕','Karotte','zanahoria'],['🌻','Sonnenblume','girasol'],
  ['📚','Buch','libro'],['✏️','Stift','lápiz'],['🌊','Meer','mar'],['☀️','Sonne','sol']
].map((w,i)=>({id:`advanced-${i}`,emoji:w[0],de:w[1],es:w[2]}));

function top(title){const s=read();return `<header class="advanced-top"><button data-advanced-home>←</button><div><small>LINGUATURTLE 3.0</small><strong>${title}</strong></div><span>🐚 ${Number(s.shells||0)}</span></header>`}
function reward(xp,shells){const s=read();const doubled=Number(s.boosters?.doubleXp||0)>0;const earnedXp=doubled?xp*2:xp;if(doubled)s.boosters.doubleXp--;s.xp=Number(s.xp||0)+earnedXp;s.shells=Number(s.shells||0)+shells;s.daily=Math.min(5,Number(s.daily||0)+1);write(s);return{xp:earnedXp,shells}}
function finish(title,xp,shells){clearInterval(timer);timer=null;app.innerHTML=`<main class="advanced-shell"><section class="advanced-finish"><img src="assets/illustrations/tula-welcome.svg" alt="Tula"><small>${t('ABENTEUER GESCHAFFT','AVENTURA COMPLETADA')}</small><h1>${title}</h1><p>${t('Tula ist richtig stolz auf dich!','¡Tula está muy orgullosa de ti!')}</p><div class="advanced-rewards"><div>✨<strong>+${xp}</strong><span>XP</span></div><div>🐚<strong>+${shells}</strong><span>${t('Muscheln','Conchas')}</span></div></div><button class="advanced-primary" data-advanced-home>⌂ ${t('Zur Startseite','Ir al inicio')}</button><button class="advanced-secondary" data-advanced-replay>${t('Noch einmal spielen','Jugar otra vez')}</button></section></main>`}

function startMemory(){const selected=shuffle(words()).slice(0,6);memory={open:[],matched:[],score:0,cards:shuffle(selected.flatMap(w=>[
{id:`${w.id}-image`,pair:w.id,label:w.emoji,type:'image'},
{id:`${w.id}-word`,pair:w.id,label:w[target()],type:'word'}
]))};renderMemory()}
function renderMemory(){if(memory.matched.length===memory.cards.length){const r=reward(50,18);return finish(t('Palast-Memory geschafft!','¡Memoria del palacio completada!'),r.xp,r.shells)}app.innerHTML=`<main class="advanced-shell">${top(t('Palast-Memory','Memoria del palacio'))}<section class="advanced-progress"><div><i style="width:${memory.matched.length/memory.cards.length*100}%"></i></div><span>${memory.matched.length/2}/6</span></section><section class="memory-intro"><span>🏛️</span><div><h1>${t('Finde die Paare','Encuentra las parejas')}</h1><p>${t('Verbinde jedes Bild mit dem passenden Wort.','Une cada imagen con la palabra correcta.')}</p></div></section><section class="advanced-memory-grid">${memory.cards.map(c=>{const visible=memory.open.includes(c.id)||memory.matched.includes(c.id);return `<button class="${visible?'open':''} ${memory.matched.includes(c.id)?'matched':''}" data-advanced-card="${c.id}"><span>${visible?c.label:'⚓'}</span></button>`}).join('')}</section><footer class="advanced-note">🐚 ${t('Belohnung: 18 Muscheln','Recompensa: 18 conchas')}</footer></main>`}
function memoryClick(id){if(memory.open.includes(id)||memory.matched.includes(id)||memory.open.length>=2)return;memory.open.push(id);renderMemory();if(memory.open.length===2){const [a,b]=memory.open.map(x=>memory.cards.find(c=>c.id===x));setTimeout(()=>{if(a.pair===b.pair){memory.matched.push(...memory.open);memory.score++;}memory.open=[];renderMemory()},650)}}

function startSpeed(){clearInterval(timer);speed={items:shuffle([...words(),...words(),...words()]),step:0,score:0,combo:0,time:45,current:null};timer=setInterval(()=>{speed.time--;if(speed.time<=0)return finishSpeed();renderSpeed()},1000);renderSpeed()}
function renderSpeed(){if(speed.step>=speed.items.length||speed.time<=0)return finishSpeed();const current=speed.items[speed.step];speed.current=current;const options=shuffle([current,...shuffle(words().filter(w=>w.id!==current.id)).slice(0,3)]);app.innerHTML=`<main class="advanced-shell speed-bg">${top(t('Goldene Minute','Minuto dorado'))}<section class="speed-status"><div><small>${t('ZEIT','TIEMPO')}</small><strong>${speed.time}</strong></div><div><small>COMBO</small><strong>${speed.combo}×</strong></div><div><small>${t('PUNKTE','PUNTOS')}</small><strong>${speed.score}</strong></div></section><section class="speed-question"><span>${current.emoji}</span><small>${t('ÜBERSETZE','TRADUCE')}</small><h1>${current[lang()]}</h1></section><section class="speed-options">${options.map(w=>`<button data-advanced-answer="${w.id}">${w[target()]}</button>`).join('')}</section><footer class="advanced-note">🔥 ${t('Jede 5er-Combo gibt Bonus-Muscheln','Cada combo de 5 da conchas extra')}</footer></main>`}
function speedAnswer(id){if(id===speed.current.id){speed.score++;speed.combo++;if(speed.combo%5===0){const s=read();s.shells=Number(s.shells||0)+3;write(s)}}else speed.combo=0;speed.step++;renderSpeed()}
function finishSpeed(){const shells=Math.max(6,Math.floor(speed.score/2));const r=reward(speed.score*5,shells);finish(t('Goldene Minute beendet!','¡Minuto dorado terminado!'),r.xp,r.shells)}

function injectModes(){const picker=document.querySelector('.mode-picker');if(!picker||picker.querySelector('[data-mode="memory"]'))return;const s=read();[['memory','🏛️',t('Palast-Memory','Memoria del palacio'),t('Belohnung: 🐚 18','Recompensa: 🐚 18')],['speed','⏱️',t('Goldene Minute','Minuto dorado'),t('45 Sekunden · Combo-Bonus','45 segundos · bonus combo')]].forEach(([id,icon,title,desc])=>{const open=(s.unlocked||[]).includes(id);const button=document.createElement('button');button.dataset.mode=id;button.className=open?'':'locked';button.innerHTML=`<span>${icon}</span><div><strong>${title}</strong><small>${open?desc:t('In der Boutique freischalten','Desbloquear en boutique')}</small></div><b>${open?'→':'🔒'}</b>`;picker.appendChild(button)})}

const observer=new MutationObserver(injectModes);observer.observe(app,{childList:true,subtree:true});injectModes();

document.addEventListener('click',e=>{
 const mode=e.target.closest('[data-mode]')?.dataset.mode;
 if(mode==='memory'){e.stopImmediatePropagation();const s=read();if(!(s.unlocked||[]).includes('memory'))return;startMemory()}
 if(mode==='speed'){e.stopImmediatePropagation();const s=read();if(!(s.unlocked||[]).includes('speed'))return;startSpeed()}
 const card=e.target.closest('[data-advanced-card]')?.dataset.advancedCard;if(card)memoryClick(card);
 const answer=e.target.closest('[data-advanced-answer]')?.dataset.advancedAnswer;if(answer)speedAnswer(answer);
 if(e.target.closest('[data-advanced-home]')){clearInterval(timer);location.reload()}
 if(e.target.closest('[data-advanced-replay]')){document.querySelector('.speed-bg')?startSpeed():startMemory()}
},true);
