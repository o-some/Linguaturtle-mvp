const PROFILE_KEY='linguaturtle-v3-child-profile';
const app=document.querySelector('#app');

const profiles={
  toddler:{id:'toddler',age:'2–4',icon:'🧸',de:'Kleine Entdecker',es:'Pequeños exploradores',wordLimit:6,answers:2,sentenceMax:3,audioFirst:true,reading:false,rewardMultiplier:1.35},
  preschool:{id:'preschool',age:'4–6',icon:'🌱',de:'Vorschul-Abenteuer',es:'Aventura preescolar',wordLimit:10,answers:3,sentenceMax:5,audioFirst:true,reading:true,rewardMultiplier:1.15},
  school:{id:'school',age:'6–9',icon:'🎒',de:'Schulstarter',es:'Inicio escolar',wordLimit:16,answers:4,sentenceMax:8,audioFirst:false,reading:true,rewardMultiplier:1},
  explorer:{id:'explorer',age:'9+',icon:'🧭',de:'Sprachentdecker',es:'Exploradores del idioma',wordLimit:24,answers:4,sentenceMax:12,audioFirst:false,reading:true,rewardMultiplier:1}
};

let profile=load();
function load(){try{return JSON.parse(localStorage.getItem(PROFILE_KEY)||'null')}catch{return null}}
function save(next){profile={...profile,...next,updatedAt:Date.now()};localStorage.setItem(PROFILE_KEY,JSON.stringify(profile));applyProfile();window.dispatchEvent(new CustomEvent('linguaturtle:profile',{detail:profile}))}
function t(de,es){const base=readBase();return base.lang==='es'?es:de}
function readBase(){try{return JSON.parse(localStorage.getItem('linguaturtle-v3-preview')||'{}')}catch{return {}}}
function config(){const mode=profiles[profile?.stage]||profiles.preschool;return {...mode,name:profile?.name||t('Kind','Niño'),goal:profile?.goal||'balanced',support:profile?.support||'normal'}}
function applyProfile(){const cfg=config();document.documentElement.dataset.childStage=cfg.id;document.documentElement.dataset.childSupport=cfg.support;document.documentElement.style.setProperty('--child-scale',cfg.id==='toddler'?'1.08':cfg.id==='preschool'?'1.03':'1');window.LinguaTurtleProfile={get:()=>profile,getConfig:config,profiles,open:openWizard};}

function card(stage){const p=profiles[stage];return `<button class="age-card ${profile?.stage===stage?'active':''}" data-profile-stage="${stage}"><span>${p.icon}</span><strong>${p.de}</strong><small>${p.age} Jahre</small><em>${p.id==='toddler'?'2 Antworten · viel Audio':p.id==='preschool'?'3 Antworten · kurze Sätze':p.id==='school'?'4 Antworten · Lesen & Hören':'längere Sätze · mehr Tempo'}</em></button>`}
function openWizard(){
  const current=profile||{name:'',stage:'preschool',goal:'balanced',support:'normal'};
  document.querySelector('#childProfileModal')?.remove();
  document.body.insertAdjacentHTML('beforeend',`<div class="profile-modal" id="childProfileModal"><section class="profile-sheet"><button class="profile-close" data-profile-close>×</button><span class="eyebrow">${t('KINDERPROFIL','PERFIL INFANTIL')}</span><h2>${t('Für wen lernt Tula heute?','¿Para quién aprende Tula hoy?')}</h2><label class="profile-label">${t('Name oder Spitzname','Nombre o apodo')}<input id="profileName" maxlength="18" value="${escapeHtml(current.name||'')}" placeholder="${t('z. B. Mia','p. ej. Mia')}"></label><h3>${t('Alters- und Lernstufe','Edad y nivel')}</h3><div class="age-grid">${Object.keys(profiles).map(card).join('')}</div><h3>${t('Lernziel','Objetivo')}</h3><div class="choice-row"><button data-profile-goal="speaking" class="${current.goal==='speaking'?'active':''}">🎙️ ${t('Sprechen','Hablar')}</button><button data-profile-goal="balanced" class="${current.goal==='balanced'?'active':''}">⚖️ ${t('Gemischt','Mixto')}</button><button data-profile-goal="reading" class="${current.goal==='reading'?'active':''}">📖 ${t('Lesen','Leer')}</button></div><h3>${t('Hilfestufe','Nivel de ayuda')}</h3><div class="choice-row"><button data-profile-support="gentle" class="${current.support==='gentle'?'active':''}">🤗 ${t('Viel Hilfe','Mucha ayuda')}</button><button data-profile-support="normal" class="${current.support==='normal'?'active':''}">✨ ${t('Normal','Normal')}</button><button data-profile-support="challenge" class="${current.support==='challenge'?'active':''}">🚀 ${t('Mehr Herausforderung','Más reto')}</button></div><div class="profile-preview" id="profilePreview"></div><button class="primary" data-profile-save>${t('Profil speichern','Guardar perfil')}</button></section></div>`);
  const draft={...current};
  const modal=document.querySelector('#childProfileModal');
  const refresh=()=>{const p=profiles[draft.stage];document.querySelectorAll('[data-profile-stage]').forEach(x=>x.classList.toggle('active',x.dataset.profileStage===draft.stage));document.querySelectorAll('[data-profile-goal]').forEach(x=>x.classList.toggle('active',x.dataset.profileGoal===draft.goal));document.querySelectorAll('[data-profile-support]').forEach(x=>x.classList.toggle('active',x.dataset.profileSupport===draft.support));modal.querySelector('#profilePreview').innerHTML=`<span>${p.icon}</span><div><strong>${p.de}</strong><small>${p.answers} ${t('Antwortmöglichkeiten','opciones')} · ${p.wordLimit} ${t('Wörter pro Lernpool','palabras por grupo')} · ${p.sentenceMax} ${t('Wörter pro Satz','palabras por frase')}</small></div>`};
  modal.addEventListener('click',e=>{const stage=e.target.closest('[data-profile-stage]')?.dataset.profileStage;const goal=e.target.closest('[data-profile-goal]')?.dataset.profileGoal;const support=e.target.closest('[data-profile-support]')?.dataset.profileSupport;if(stage)draft.stage=stage;if(goal)draft.goal=goal;if(support)draft.support=support;if(stage||goal||support)refresh();if(e.target.closest('[data-profile-close]'))modal.remove();if(e.target.closest('[data-profile-save]')){draft.name=modal.querySelector('#profileName').value.trim()||t('Kind','Niño');save(draft);modal.remove();decorate()}});refresh();
}
function escapeHtml(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
function decorate(){
  document.querySelectorAll('.child-profile-chip').forEach(x=>x.remove());
  const top=document.querySelector('.v3-top');
  if(top){const cfg=config();const button=document.createElement('button');button.className='child-profile-chip';button.innerHTML=`<span>${cfg.icon}</span><small>${escapeHtml(cfg.name)}</small>`;button.addEventListener('click',openWizard);top.insertAdjacentElement('afterend',button)}
  const profileHero=document.querySelector('.profile-hero-v3');
  if(profileHero&&!profileHero.querySelector('.profile-settings-link')){const b=document.createElement('button');b.className='profile-settings-link';b.textContent=t('Kinderprofil anpassen','Ajustar perfil infantil');b.addEventListener('click',openWizard);profileHero.appendChild(b)}
}

applyProfile();
const observer=new MutationObserver(()=>decorate());
if(app)observer.observe(app,{childList:true,subtree:true});
decorate();
if(!profile)setTimeout(openWizard,700);
