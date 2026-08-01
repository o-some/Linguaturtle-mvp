const KEY='linguaturtle-v3-preview';
const app=document.querySelector('#app');
const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}};
const write=s=>localStorage.setItem(KEY,JSON.stringify(s));
const lang=()=>read().lang||'de';
const tr=(de,es)=>lang()==='de'?de:es;
const level=()=>Math.floor(Number(read().xp||0)/100)+1;
const shuffled=a=>[...a].sort(()=>Math.random()-.5);

const travel=[
 {de:'Guten Morgen',es:'Buenos días',emoji:'☀️'},
 {de:'Wo ist der Hafen?',es:'¿Dónde está el puerto?',emoji:'⚓'},
 {de:'Ich möchte eine Fahrkarte',es:'Quiero un billete',emoji:'🎫'},
 {de:'Wann fährt das Schiff?',es:'¿Cuándo sale el barco?',emoji:'⛴️'},
 {de:'Danke',es:'Gracias',emoji:'🙏'},
 {de:'Auf Wiedersehen',es:'Adiós',emoji:'👋'}
];

let mode=null,step=0,score=0,current=null,boss=[];
function speak(text,l=lang()==='de'?'de-DE':'es-ES'){if(!('speechSynthesis'in window))return;const u=new SpeechSynthesisUtterance(text);u.lang=l;u.rate=.82;speechSynthesis.cancel();speechSynthesis.speak(u)}
function shell(){return Number(read().shells||0)}
function reward(xp,shells){const s=read();s.xp=Number(s.xp||0)+xp;s.shells=Number(s.shells||0)+shells;s.daily=Math.min(5,Number(s.daily||0)+1);write(s)}
function top(title){return `<div class="exp-top"><button data-exp-home>←</button><strong>${title}</strong><span>🐚 ${shell()}</span></div>`}
function openHarbor(){if(level()<7)return locked(7);mode='harbor';step=0;score=0;renderHarbor()}
function renderHarbor(){if(step>=travel.length)return finish(tr('Hafen-Abenteuer geschafft!','¡Aventura del puerto completada!'),score*12+20,score*3+8);current=travel[step];const target=lang()==='de'?'es':'de';const options=shuffled([current,...shuffled(travel.filter(x=>x!==current)).slice(0,2)]);app.innerHTML=`<div class="v3-shell page expansion-page">${top(tr('Hafen','Puerto'))}<section class="harbor-hero"><span>⚓</span><div><small>${tr('REISE & DIALOGE','VIAJES Y DIÁLOGOS')}</small><h1>${tr('Hilf Tula am Hafen','Ayuda a Tula en el puerto')}</h1><p>${tr('Wähle die passende Übersetzung.','Elige la traducción correcta.')}</p></div></section><div class="exp-progress"><i style="width:${step/travel.length*100}%"></i></div><section class="dialog-card"><span>${current.emoji}</span><h2>${current[lang()]}</h2><button data-exp-speak>🔊</button></section><div class="dialog-options">${options.map(o=>`<button data-exp-answer="${o[target]}">${o[target]}</button>`).join('')}</div></div>`}
function openCastle(){if(level()<10)return locked(10);mode='castle';step=0;score=0;boss=shuffled(travel).slice(0,5);renderCastle()}
function renderCastle(){if(step>=boss.length)return finish(tr('Boss-Level gewonnen!','¡Nivel jefe superado!'),score*20+40,score*5+25);current=boss[step];const target=lang()==='de'?'es':'de';const options=shuffled([current,...shuffled(travel.filter(x=>x!==current)).slice(0,3)]);app.innerHTML=`<div class="v3-shell page expansion-page castle-bg">${top(tr('Schloss','Castillo'))}<section class="castle-hero"><span>🏰</span><div><small>${tr('BOSS-LEVEL','NIVEL JEFE')}</small><h1>${tr('Die goldene Sprachprüfung','La prueba dorada')}</h1><p>${tr('Fünf Aufgaben. Jede richtige Antwort füllt die Krone.','Cinco retos. Cada acierto llena la corona.')}</p></div></section><div class="crown-meter">${[0,1,2,3,4].map(i=>`<i class="${i<score?'on':''}">♛</i>`).join('')}</div><section class="boss-card"><span>${current.emoji}</span><h2>${current[lang()]}</h2><button data-exp-speak>🔊</button></section><div class="boss-options">${options.map(o=>`<button data-exp-answer="${o[target]}">${o[target]}</button>`).join('')}</div></div>`}
function answer(value){const target=lang()==='de'?'es':'de';if(value===current[target]){score++;reward(mode==='castle'?20:12,mode==='castle'?5:3);step++;toast(tr('Richtig!','¡Correcto!'));setTimeout(()=>mode==='castle'?renderCastle():renderHarbor(),450)}else toast(tr('Fast – versuch es noch einmal.','Casi, inténtalo otra vez.'))}
function finish(title,xp,shells){reward(xp,shells);app.innerHTML=`<div class="v3-shell page expansion-page">${top(title)}<section class="exp-finish"><div>🐢✨</div><small>${tr('ABENTEUER GESCHAFFT','AVENTURA COMPLETADA')}</small><h1>${title}</h1><p>${tr(`Du hast ${score} Aufgaben richtig gelöst.`,`Has resuelto ${score} retos.`)}</p><section><article><span>✨</span><strong>+${xp}</strong><small>XP</small></article><article><span>🐚</span><strong>+${shells}</strong><small>${tr('Muscheln','Conchas')}</small></article></section><button data-exp-home>${tr('Zur Insel','Volver a la isla')}</button></section></div>`}
function locked(n){toast(tr(`Dieser Ort öffnet sich ab Level ${n}.`,`Este lugar se abre en el nivel ${n}.`))}
function toast(text){document.querySelector('.v3-toast')?.remove();document.body.insertAdjacentHTML('beforeend',`<div class="v3-toast">${text}</div>`);setTimeout(()=>document.querySelector('.v3-toast')?.remove(),1600)}

document.addEventListener('click',e=>{
 const btn=e.target.closest('button'); if(!btn)return;
 const text=(btn.textContent||'').trim();
 if(btn.matches('[data-exp-home]')){location.reload();return}
 if(btn.matches('[data-exp-speak]')){const target=lang()==='de'?'es':'de';speak(current[target],target==='de'?'de-DE':'es-ES');return}
 if(btn.dataset.expAnswer){answer(btn.dataset.expAnswer);return}
 if(text.includes('Hafen')||text.includes('Puerto')){e.preventDefault();e.stopImmediatePropagation();openHarbor()}
 if(text.includes('Schloss')||text.includes('Castillo')){e.preventDefault();e.stopImmediatePropagation();openCastle()}
},true);
