const KEY='linguaturtle-v3-preview';
const HOME_KEY='linguaturtle-v3-home';

const catalog=[
 {id:'bed',type:'furniture',icon:'🛏️',cost:60,de:'Wolkenbett',es:'Cama nube'},
 {id:'lamp',type:'furniture',icon:'🪔',cost:35,de:'Goldene Lampe',es:'Lámpara dorada'},
 {id:'plant',type:'furniture',icon:'🪴',cost:25,de:'Olivenbaum',es:'Olivo'},
 {id:'rug',type:'furniture',icon:'🟦',cost:45,de:'Meeres-Teppich',es:'Alfombra marina'},
 {id:'books',type:'furniture',icon:'📚',cost:40,de:'Bücherregal',es:'Estantería'},
 {id:'aquarium',type:'furniture',icon:'🐠',cost:90,de:'Kleines Aquarium',es:'Acuario pequeño'},
 {id:'sailor',type:'outfit',icon:'⚓',cost:75,de:'Matrosen-Outfit',es:'Traje marinero'},
 {id:'crown',type:'outfit',icon:'👑',cost:110,de:'Goldene Krone',es:'Corona dorada'},
 {id:'explorer',type:'outfit',icon:'🎒',cost:95,de:'Insel-Entdecker',es:'Explorador de isla'},
 {id:'stars',type:'effect',icon:'✨',cost:55,de:'Sternenfunkeln',es:'Brillo de estrellas'}
];

function appState(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}}
function setAppState(s){localStorage.setItem(KEY,JSON.stringify(s))}
function homeState(){try{return {owned:['plant'],equippedFurniture:['plant'],outfit:null,effect:null,...JSON.parse(localStorage.getItem(HOME_KEY)||'{}')}}catch{return {owned:['plant'],equippedFurniture:['plant'],outfit:null,effect:null}}}
function setHomeState(s){localStorage.setItem(HOME_KEY,JSON.stringify(s))}
function lang(){return appState().lang||'de'}
function t(de,es){return lang()==='de'?de:es}
function itemName(i){return i[lang()]}

function decorateIsland(){
 const places=document.querySelector('.places');
 if(places&&!places.querySelector('[data-tula-home]')){
  const b=document.createElement('button');b.className='place tula-home-entry';b.dataset.tulaHome='1';b.innerHTML=`<span>🏡</span><strong>${t('Tulas Zuhause','Casa de Tula')}</strong><small>${t('Einrichten & verkleiden','Decorar y vestir')}</small>`;places.prepend(b);
 }
 const quick=document.querySelector('.journey-grid');
 if(quick&&!quick.querySelector('[data-tula-home]')){
  const b=document.createElement('button');b.dataset.tulaHome='1';b.innerHTML=`<span>🏡</span><div><strong>${t('Tulas Zuhause','Casa de Tula')}</strong><small>${t('Dein persönlicher Inselraum','Tu espacio personal')}</small></div><b>→</b>`;quick.appendChild(b);
 }
}

function roomMarkup(){
 const hs=homeState();
 const furniture=catalog.filter(i=>i.type==='furniture'&&hs.equippedFurniture.includes(i.id));
 const outfit=catalog.find(i=>i.id===hs.outfit);
 const effect=hs.effect==='stars'?'<i class="home-stars">✦ ✧ ✦</i>':'';
 return `<section class="tula-room">${effect}<div class="room-window"><span>☀️</span><i></i></div><div class="room-items">${furniture.map(i=>`<span class="room-${i.id}" title="${itemName(i)}">${i.icon}</span>`).join('')}</div><div class="room-tula"><img src="assets/illustrations/tula-welcome.svg" alt="Tula">${outfit?`<span class="tula-outfit outfit-${outfit.id}">${outfit.icon}</span>`:''}</div></section>`
}
function renderHomeRoom(){
 const state=appState(),hs=homeState();
 document.querySelector('#tulaHomeModal')?.remove();
 document.body.insertAdjacentHTML('beforeend',`<div class="tula-home-modal" id="tulaHomeModal"><div class="tula-home-sheet"><header><button data-home-action="close">←</button><div><span>${t('TULAS ZUHAUSE','CASA DE TULA')}</span><h1>${t('Mach es dir gemütlich','Ponte cómodo')}</h1></div><strong>🐚 ${Number(state.shells||0)}</strong></header>${roomMarkup()}<nav class="home-tabs"><button class="active" data-home-tab="furniture">🪑 ${t('Möbel','Muebles')}</button><button data-home-tab="outfit">👒 ${t('Outfits','Trajes')}</button><button data-home-tab="effect">✨ ${t('Effekte','Efectos')}</button></nav><section class="home-catalog" id="homeCatalog"></section></div></div>`);
 renderCatalog('furniture');
}
function renderCatalog(type){
 const hs=homeState(),state=appState();
 document.querySelectorAll('[data-home-tab]').forEach(b=>b.classList.toggle('active',b.dataset.homeTab===type));
 const box=document.querySelector('#homeCatalog');if(!box)return;
 box.innerHTML=catalog.filter(i=>i.type===type).map(i=>{
  const owned=hs.owned.includes(i.id);
  const active=i.type==='furniture'?hs.equippedFurniture.includes(i.id):hs[i.type]===i.id;
  return `<article class="home-item ${active?'active':''}"><span>${i.icon}</span><div><strong>${itemName(i)}</strong><small>${owned?(active?t('Aktiv','Activo'):t('Gekauft','Comprado')):`🐚 ${i.cost}`}</small></div><button data-home-item="${i.id}" ${!owned&&Number(state.shells||0)<i.cost?'disabled':''}>${owned?(active?'✓':t('Auswählen','Elegir')):t('Kaufen','Comprar')}</button></article>`
 }).join('');
}
function selectItem(id){
 const item=catalog.find(i=>i.id===id);if(!item)return;
 const state=appState(),hs=homeState();
 if(!hs.owned.includes(id)){
  if(Number(state.shells||0)<item.cost)return;
  state.shells=Number(state.shells||0)-item.cost;hs.owned.push(id);
 }
 if(item.type==='furniture'){
  hs.equippedFurniture=hs.equippedFurniture.includes(id)?hs.equippedFurniture.filter(x=>x!==id):[...hs.equippedFurniture,id].slice(-6);
 }else hs[item.type]=hs[item.type]===id?null:id;
 setAppState(state);setHomeState(hs);renderHomeRoom();
}

document.addEventListener('click',e=>{
 const open=e.target.closest('[data-tula-home]');if(open)renderHomeRoom();
 const action=e.target.closest('[data-home-action]')?.dataset.homeAction;if(action==='close')document.querySelector('#tulaHomeModal')?.remove();
 const tab=e.target.closest('[data-home-tab]')?.dataset.homeTab;if(tab)renderCatalog(tab);
 const item=e.target.closest('[data-home-item]')?.dataset.homeItem;if(item)selectItem(item);
});
new MutationObserver(decorateIsland).observe(document.querySelector('#app'),{childList:true,subtree:true});
decorateIsland();