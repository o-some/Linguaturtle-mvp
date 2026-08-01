const appRoot=document.querySelector('#app');

function translate(de,es){
  try{const state=JSON.parse(localStorage.getItem('linguaturtle-v3-preview')||'{}');return state.lang==='es'?es:de}catch{return de}
}

function cleanLearningWorld(){
  const modePicker=appRoot?.querySelector('.mode-picker');
  if(!modePicker)return;

  // Lernwelt und eigentliche Wortübung bleiben strikt getrennt.
  appRoot.querySelectorAll('.word-showcase').forEach(node=>node.remove());

  const shell=modePicker.closest('.v3-shell');
  if(!shell||shell.querySelector('.world-instruction'))return;

  const guide=document.createElement('section');
  guide.className='world-instruction';
  guide.innerHTML=`
    <span class="world-step">1</span>
    <div>
      <strong>${translate('Wähle jetzt eine Übung','Elige ahora un ejercicio')}</strong>
      <small>${translate('Die Wörter erscheinen erst im gewählten Spielmodus.','Las palabras aparecen solo dentro del modo elegido.')}</small>
    </div>`;
  modePicker.before(guide);
}

function improveIsland(){
  const places=appRoot?.querySelector('.places');
  if(!places)return;
  places.classList.add('island-place-grid');
  places.querySelectorAll('.place').forEach((card,index)=>{
    if(card.querySelector('.place-number'))return;
    const badge=document.createElement('span');
    badge.className='place-number';
    badge.textContent=String(index+1).padStart(2,'0');
    card.appendChild(badge);
  });
}

function markScreen(){
  document.body.classList.toggle('learning-world-open',Boolean(appRoot?.querySelector('.mode-picker')));
  document.body.classList.toggle('exercise-open',Boolean(appRoot?.querySelector('.explore-grid,.quiz-grid,.sentence-zone,.memory-board,.speed-game,.speaking-stage')));
}

let scheduled=false;
function enhance(){
  if(scheduled)return;
  scheduled=true;
  requestAnimationFrame(()=>{
    scheduled=false;
    cleanLearningWorld();
    improveIsland();
    markScreen();
  });
}

if(appRoot){
  new MutationObserver(enhance).observe(appRoot,{childList:true,subtree:true});
  enhance();
}
