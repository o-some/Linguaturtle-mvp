import {allWords,collections} from './content.js';

const KEY='linguaturtle-v3-preview';
const MASTERY_KEY='linguaturtle-v3-mastery';
const mastery=loadMastery();
let round={items:[],step:0,score:0,current:null};

function loadState(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}}
function saveState(state){localStorage.setItem(KEY,JSON.stringify(state))}
function loadMastery(){try{return JSON.parse(localStorage.getItem(MASTERY_KEY)||'{}')}catch{return {}}}
function saveMastery(){localStorage.setItem(MASTERY_KEY,JSON.stringify(mastery))}
function lang(){return loadState().lang||'de'}
function target(){return lang()==='de'?'es':'de'}
function t(de,es){return lang()==='de'?de:es}
function shuffle(items){return [...items].sort(()=>Math.random()-.5)}
function scoreFor(word){const m=mastery[word.id]||{right:0,wrong:0,last:0};return (m.wrong*4)-(m.right*1.25)+(Date.now()-Number(m.last||0))/86400000*.08+Math.random()*2}
function dueWords(){return [...allWords].sort((a,b)=>scoreFor(b)-scoreFor(a)).slice(0,10)}
function updateMastery(id,correct){const prev=mastery[id]||{right:0,wrong:0,last:0};mastery[id]={right:prev.right+(correct?1:0),wrong:prev.wrong+(correct?0:1),last:Date.now()};saveMastery()}
function speak(text,language=target()){if(!('speechSynthesis'in window))return;const u=new SpeechSynthesisUtterance(text);u.lang=language==='de'?'de-DE':'es-ES';u.rate=.82;speechSynthesis.cancel();speechSynthesis.speak(u)}
function app(){return document.querySelector('#app')}
function stat(){const values=Object.values(mastery);return{practiced:values.length,strong:values.filter(x=>x.right>=3&&x.wrong===0).length,review:values.filter(x=>x.wrong>x.right).length}}

function injectEntry(){const home=document.querySelector('.journey-grid');if(!home||document.querySelector('[data-adaptive-start]'))return;const s=stat();home.insertAdjacentHTML('afterend',`<button class="adaptive-entry" data-adaptive-start><span>🧠</span><div><small>${t('PERSÖNLICHE RUNDE','RONDA PERSONAL')}</small><strong>${t('Schlaue Wiederholung','Repaso inteligente')}</strong><em>${s.review?`${s.review} ${t('Wörter warten','palabras pendientes')}`:t('Dein individueller Wortmix','Tu mezcla personal')}</em></div><b>→</b></button>`)}

function start(){round={items:dueWords(),step:0,score:0,current:null};renderQuestion()}
function renderQuestion(){const root=app();if(!root)return;if(round.step>=round.items.length)return finish();const current=round.items[round.step];round.current=current;const options=shuffle([current,...shuffle(allWords.filter(w=>w.id!==current.id)).slice(0,3)]);root.innerHTML=`<div class="v3-shell adaptive-page"><header class="adaptive-top"><button data-adaptive-home>←</button><div><small>${t('SCHLAUE WIEDERHOLUNG','REPASO INTELIGENTE')}</small><strong>${round.step+1}/${round.items.length}</strong></div></header><div class="adaptive-progress"><i style="width:${round.step/round.items.length*100}%"></i></div><section class="adaptive-card"><span>${current.emoji}</span><small>${collections.find(c=>c.id===current.collection)?.[lang()]||''}</small><h1>${current[lang()]}</h1><button data-adaptive-speak>🔊 ${t('Anhören','Escuchar')}</button></section><div class="adaptive-options">${options.map(w=>`<button data-adaptive-answer="${w.id}">${w[target()]}</button>`).join('')}</div></div>`;speak(current[target()])}
function answer(id){const correct=id===round.current.id;updateMastery(round.current.id,correct);if(correct){round.score++;reward(8,1);toast(t('Richtig!','¡Correcto!'));setTimeout(()=>{round.step++;renderQuestion()},450)}else{toast(t('Dieses Wort kommt bald noch einmal.','Esta palabra volverá pronto.'));const missed=round.current;round.items.splice(Math.min(round.items.length,round.step+3),0,missed)}}
function reward(xp,shells){const state=loadState();state.xp=Number(state.xp||0)+xp;state.shells=Number(state.shells||0)+shells;saveState(state)}
function finish(){const bonus=Math.max(5,round.score);reward(15,bonus);const s=stat();app().innerHTML=`<div class="v3-shell adaptive-page"><section class="adaptive-finish"><div>🐢</div><small>${t('PERSÖNLICHE RUNDE GESCHAFFT','RONDA PERSONAL COMPLETADA')}</small><h1>${t('Dein Wortschatz wächst!','¡Tu vocabulario crece!')}</h1><p>${round.score}/${round.items.length} ${t('richtig beantwortet','respuestas correctas')}</p><section><article><b>+15</b><span>XP</span></article><article><b>+${bonus}</b><span>🐚</span></article><article><b>${s.strong}</b><span>${t('sicher','dominadas')}</span></article></section><button data-adaptive-start>${t('Noch eine Runde','Otra ronda')}</button><button data-adaptive-home>${t('Zur Startseite','Ir al inicio')}</button></section></div>`}
function toast(text){document.querySelector('.adaptive-toast')?.remove();document.body.insertAdjacentHTML('beforeend',`<div class="adaptive-toast">${text}</div>`);setTimeout(()=>document.querySelector('.adaptive-toast')?.remove(),1500)}

document.addEventListener('click',event=>{if(event.target.closest('[data-adaptive-start]'))start();if(event.target.closest('[data-adaptive-home]'))location.reload();if(event.target.closest('[data-adaptive-speak]'))speak(round.current[target()]);const id=event.target.closest('[data-adaptive-answer]')?.dataset.adaptiveAnswer;if(id)answer(id)});
new MutationObserver(injectEntry).observe(document.querySelector('#app'),{childList:true,subtree:true});
injectEntry();
window.LinguaTurtleAdaptive={getMastery:()=>({...mastery}),dueWords,stats:stat};
