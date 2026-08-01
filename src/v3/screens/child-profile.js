import { getState, setState, registerAction } from '../core/index.js';

const stages={
 toddler:{icon:'🧸',age:'2–4',de:'Kleine Entdecker',es:'Pequeños exploradores',answers:2,wordLimit:6,sentenceMax:3,rewardMultiplier:1.35},
 preschool:{icon:'🌱',age:'4–6',de:'Vorschul-Abenteuer',es:'Aventura preescolar',answers:3,wordLimit:10,sentenceMax:5,rewardMultiplier:1.15},
 school:{icon:'🎒',age:'6–9',de:'Schulstarter',es:'Inicio escolar',answers:4,wordLimit:16,sentenceMax:8,rewardMultiplier:1},
 explorer:{icon:'🧭',age:'9+',de:'Sprachentdecker',es:'Exploradores del idioma',answers:4,wordLimit:24,sentenceMax:12,rewardMultiplier:1}
};

const tr=(de,es)=>getState().language==='es'?es:de;
export const profileConfig=()=>({...stages[getState().profile.stage]||stages.preschool,...getState().profile});

export function renderChildProfile({top,nav}){
 const s=getState(),p=s.profile,cfg=profileConfig();
 return `<div class="v3-shell page">${top('profile')}<section class="page-title"><span class="eyebrow">${tr('KINDERPROFIL','PERFIL INFANTIL')}</span><h1>${tr('Lernen passend zum Kind','Aprender según el niño')}</h1></section><section class="profile-form-v3"><label><span>${tr('Name oder Spitzname','Nombre o apodo')}</span><input value="${String(p.name||'').replace(/"/g,'&quot;')}" maxlength="18" data-profile-field="name"></label><h2>${tr('Alters- und Lernstufe','Edad y nivel')}</h2><div class="age-grid">${Object.entries(stages).map(([id,x])=>`<button class="age-card ${p.stage===id?'active':''}" data-action="profile-stage" data-stage="${id}"><span>${x.icon}</span><strong>${x[s.language]}</strong><small>${x.age}</small><em>${x.answers} ${tr('Antworten','respuestas')} · ${x.wordLimit} ${tr('Wörter','palabras')}</em></button>`).join('')}</div><h2>${tr('Lernziel','Objetivo')}</h2><div class="choice-row">${[['speaking','🎙️',tr('Sprechen','Hablar')],['balanced','⚖️',tr('Gemischt','Mixto')],['reading','📖',tr('Lesen','Leer')]].map(([id,i,l])=>`<button class="${p.goal===id?'active':''}" data-action="profile-goal" data-goal="${id}">${i} ${l}</button>`).join('')}</div><h2>${tr('Hilfestufe','Nivel de ayuda')}</h2><div class="choice-row">${[['gentle','🤗',tr('Viel Hilfe','Mucha ayuda')],['normal','✨',tr('Normal','Normal')],['challenge','🚀',tr('Mehr Herausforderung','Más reto')]].map(([id,i,l])=>`<button class="${p.support===id?'active':''}" data-action="profile-support" data-support="${id}">${i} ${l}</button>`).join('')}</div><section class="profile-preview"><span>${cfg.icon}</span><div><strong>${cfg[s.language]}</strong><small>${cfg.answers} ${tr('Antwortmöglichkeiten','opciones')} · ${cfg.sentenceMax} ${tr('Wörter pro Satz','palabras por frase')}</small></div></section><button class="primary" data-action="profile-save">${tr('Profil speichern','Guardar perfil')}</button></section></div>${nav('profile')}`;
}

export function registerChildProfileActions(router){
 registerAction('profile-stage',({data})=>{setState(d=>{d.profile.stage=data.stage;return d});router.renderCurrent()});
 registerAction('profile-goal',({data})=>{setState(d=>{d.profile.goal=data.goal;return d});router.renderCurrent()});
 registerAction('profile-support',({data})=>{setState(d=>{d.profile.support=data.support;return d});router.renderCurrent()});
 registerAction('profile-save',()=>{const input=document.querySelector('[data-profile-field="name"]');setState(d=>{d.profile.name=(input?.value||'Kind').trim()||'Kind';return d});router.navigate('profile')});
}
