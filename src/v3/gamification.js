const KEY='linguaturtle-v3-preview';
const SETTINGS_KEY='linguaturtle-v3-settings';
const today=()=>new Date().toISOString().slice(0,10);

function readState(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}}
function writeState(s){localStorage.setItem(KEY,JSON.stringify(s))}
function readSettings(){try{return {sound:true,motion:true,parentPin:'',...JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}')}}catch{return {sound:true,motion:true,parentPin:''}}}
function writeSettings(s){localStorage.setItem(SETTINGS_KEY,JSON.stringify(s));applySettings(s)}
function lang(){return readState().lang==='es'?'es':'de'}
function tr(de,es){return lang()==='de'?de:es}
function learnedTotal(s){return Object.values(s.learned||{}).reduce((a,b)=>a+Number(b||0),0)}

const achievements=[
 {id:'first-lesson',icon:'🌟',de:'Erstes Abenteuer',es:'Primera aventura',test:s=>Number(s.xp||0)>=10},
 {id:'shell-collector',icon:'🐚',de:'Muschelsammler',es:'Coleccionista',test:s=>Number(s.shells||0)>=250},
 {id:'word-friend',icon:'📚',de:'Wörterfreund',es:'Amigo de palabras',test:s=>learnedTotal(s)>=12},
 {id:'level-five',icon:'🏅',de:'Inselrang 5',es:'Rango isleño 5',test:s=>Math.floor(Number(s.xp||0)/100)+1>=5},
 {id:'game-master',icon:'🎮',de:'Spielemeister',es:'Maestro de juegos',test:s=>(s.unlocked||[]).length>=3},
 {id:'daily-hero',icon:'☀️',de:'Tagesheld',es:'Héroe diario',test:s=>Number(s.daily||0)>=5}
];

function missions(s){const learned=learnedTotal(s);return [
 {icon:'🎯',de:'3 Aufgaben lösen',es:'Resolver 3 tareas',value:Math.min(3,Number(s.daily||0)),goal:3,reward:5},
 {icon:'📖',de:'5 Wörter entdecken',es:'Descubrir 5 palabras',value:Math.min(5,learned),goal:5,reward:5},
 {icon:'✨',de:'20 XP verdienen',es:'Ganar 20 XP',value:Math.min(20,Number(s.xp||0)%100),goal:20,reward:5}
]}

function applySettings(settings=readSettings()){
 document.documentElement.classList.toggle('reduced-motion',!settings.motion);
 document.documentElement.dataset.sound=settings.sound?'on':'off';
}

function missionCard(){const s=readState(),list=missions(s);const all=list.every(m=>m.value>=m.goal);const claimed=s.dailyChestDate===today();return `<section class="daily-missions-v3"><header><div><span class="eyebrow">${tr('TAGESMISSIONEN','MISIONES DIARIAS')}</span><h2>${tr('Heute auf Turtle Island','Hoy en Isla Tortuga')}</h2></div><span class="mission-count">${list.filter(m=>m.value>=m.goal).length}/3</span></header><div class="mission-list">${list.map(m=>`<article class="${m.value>=m.goal?'done':''}"><span>${m.icon}</span><div><strong>${tr(m.de,m.es)}</strong><div class="mission-bar"><i style="width:${Math.min(100,m.value/m.goal*100)}%"></i></div><small>${m.value}/${m.goal} · 🐚 ${m.reward}</small></div><b>${m.value>=m.goal?'✓':''}</b></article>`).join('')}</div><button class="daily-chest ${all?'ready':''}" data-v3-chest ${all&&!claimed?'':'disabled'}><span>${claimed?'✅':'🎁'}</span><div><strong>${claimed?tr('Heute abgeholt','Recogido hoy'):tr('Tagestruhe öffnen','Abrir cofre diario')}</strong><small>${all?tr('Belohnung: 25 Muscheln','Recompensa: 25 conchas'):tr('Schließe alle drei Missionen ab','Completa las tres misiones')}</small></div></button></section>`}

function achievementPanel(){const s=readState();return `<section class="achievements-v3"><div class="section-head"><div><span class="eyebrow">${tr('ERFOLGE','LOGROS')}</span><h2>${tr('Deine Abzeichen','Tus insignias')}</h2></div></div><div class="achievement-grid">${achievements.map(a=>{const ok=a.test(s);return `<article class="${ok?'earned':'locked'}"><span>${ok?a.icon:'🔒'}</span><strong>${tr(a.de,a.es)}</strong><small>${ok?tr('Freigeschaltet','Desbloqueado'):tr('Noch verborgen','Aún oculto')}</small></article>`}).join('')}</div></section>`}

function enhance(){
 const shell=document.querySelector('.v3-shell');if(!shell)return;
 const profile=document.querySelector('.profile-hero-v3');
 const hero=document.querySelector('.hero-v3');
 if(hero&&!document.querySelector('.daily-missions-v3')){const progress=document.querySelector('.progress-card');(progress||hero).insertAdjacentHTML('afterend',missionCard())}
 if(profile&&!document.querySelector('.achievements-v3')){const milestone=document.querySelector('.milestone-list');(milestone||profile).insertAdjacentHTML('beforebegin',achievementPanel())}
}

function openSettings(){const s=readState(),settings=readSettings();document.body.insertAdjacentHTML('beforeend',`<div class="parent-modal" id="parentModal"><section class="parent-sheet"><button class="parent-close" data-parent-close>×</button><span class="eyebrow">${tr('ELTERN & EINSTELLUNGEN','PADRES Y AJUSTES')}</span><h2>${tr('Lernumgebung','Entorno de aprendizaje')}</h2><div class="parent-summary"><div><strong>${Math.floor(Number(s.xp||0)/100)+1}</strong><small>${tr('Level','Nivel')}</small></div><div><strong>${s.xp||0}</strong><small>XP</small></div><div><strong>${learnedTotal(s)}</strong><small>${tr('Wörter','Palabras')}</small></div></div><label class="setting-row"><span>🔊 <b>${tr('Audio und Sprache','Audio y voz')}</b></span><input type="checkbox" data-setting="sound" ${settings.sound?'checked':''}></label><label class="setting-row"><span>✨ <b>${tr('Animationen','Animaciones')}</b></span><input type="checkbox" data-setting="motion" ${settings.motion?'checked':''}></label><section class="parent-note"><strong>${tr('Elternhinweis','Nota para padres')}</strong><p>${tr('Der Fortschritt wird nur auf diesem Gerät gespeichert. Es gibt aktuell keine Werbung, kein Tracking und keine echten Käufe.','El progreso solo se guarda en este dispositivo. Actualmente no hay publicidad, seguimiento ni compras reales.')}</p></section><button class="danger-soft" data-reset-progress>${tr('Testfortschritt zurücksetzen','Restablecer progreso de prueba')}</button></section></div>`)}

function claimChest(){const s=readState();if(s.dailyChestDate===today()||!missions(s).every(m=>m.value>=m.goal))return;s.shells=Number(s.shells||0)+25;s.dailyChestDate=today();writeState(s);document.querySelector('.daily-missions-v3')?.remove();enhance();toast(tr('Tagestruhe geöffnet: +25 Muscheln!','Cofre diario abierto: +25 conchas!'))}
function toast(text){document.querySelector('.gamification-toast')?.remove();document.body.insertAdjacentHTML('beforeend',`<div class="gamification-toast">${text}</div>`);setTimeout(()=>document.querySelector('.gamification-toast')?.remove(),1800)}

const observer=new MutationObserver(enhance);observer.observe(document.querySelector('#app'),{childList:true,subtree:true});
document.addEventListener('click',e=>{
 if(e.target.closest('[data-action="menu"]')){e.preventDefault();e.stopImmediatePropagation();openSettings()}
 if(e.target.closest('[data-v3-chest]'))claimChest();
 if(e.target.closest('[data-parent-close]'))document.querySelector('#parentModal')?.remove();
 if(e.target.closest('[data-reset-progress]')){if(confirm(tr('Den gesamten Testfortschritt wirklich löschen?','¿Borrar todo el progreso de prueba?'))){localStorage.removeItem(KEY);location.reload()}}
});
document.addEventListener('change',e=>{const key=e.target.dataset.setting;if(!key)return;const settings=readSettings();settings[key]=e.target.checked;writeSettings(settings)});
applySettings();enhance();