import { collections } from '../content-multilingual.js';
import {
  getState, setState, registerAction, grantReward,
  sourceLanguage, targetLanguage, languageValue, uiText, takePracticeWordIds
} from '../core/index.js?build=cinematic-worlds-1';
import { assets } from '../../config/assets.js?build=cinematic-worlds-1';

const tr=(de,es,el=de)=>uiText(de,es,el);
const shuffle=a=>[...a].sort(()=>Math.random()-.5);
const allWords=()=>collections.flatMap(c=>c.words);
let memory={cards:[],open:[],matched:[]};
let speed={items:[],step:0,score:0,combo:0,time:45,current:null,options:[]};
let speedTimer=null;

function startMemory(){
  const target=targetLanguage();
  const pool=allWords(),worldId=getState().session.collectionId;
  const ids=new Set(takePracticeWordIds(worldId,'memory',pool.map(word=>word.id),6));
  const words=pool.filter(word=>ids.has(word.id));
  memory={open:[],matched:[],cards:shuffle(words.flatMap(w=>[
    {id:`${w.id}-i`,pair:w.id,label:w.emoji},
    {id:`${w.id}-w`,pair:w.id,label:languageValue(w,target)}
  ]))};
  setState(d=>{d.session.activeGame='memory';return d});
}
function startSpeed(){clearInterval(speedTimer);const pool=allWords(),worldId=getState().session.collectionId;const ids=new Set(takePracticeWordIds(worldId,'speed',pool.map(word=>word.id),15));const words=pool.filter(word=>ids.has(word.id));const items=shuffle([...words,...words]).slice(0,30);speed={items,step:0,score:0,combo:0,time:45,current:items[0],options:[]};prepareSpeedQuestion();setState(d=>{d.session.activeGame='speed';return d})}
function prepareSpeedQuestion(){const cur=speed.items[speed.step];speed.current=cur;speed.options=shuffle([cur,...shuffle(allWords().filter(w=>w.id!==cur.id)).slice(0,3)])}

export function registerAdvancedRoutes(router,{top,nav,renderComplete}){
  router.register('memory',()=>{
    if(!memory.cards.length)startMemory();
    if(memory.matched.length===memory.cards.length){const worldId=getState().session.collectionId;const reward=grantReward({xp:50,shells:18,practiceResult:{worldId,exerciseId:'memory'}});memory={cards:[],open:[],matched:[]};setState(d=>{d.session.activeGame=null;return d});return renderComplete(tr('Palast-Memory geschafft!','¡Memoria del palacio completada!','Η μνήμη του παλατιού ολοκληρώθηκε!'),reward,'world','start-memory')}
    return `<div class="v3-shell page">${top('world')}<section class="page-title"><span class="eyebrow">${tr('PALAST-MEMORY','MEMORIA DEL PALACIO','ΜΝΗΜΗ ΤΟΥ ΠΑΛΑΤΙΟΥ')}</span><h1>${tr('Finde die Paare','Encuentra las parejas','Βρες τα ζευγάρια')}</h1><p>${tr('Verbinde Bild und passendes Wort.','Une la imagen con la palabra correcta.','Ταίριαξε την εικόνα με τη σωστή λέξη.')}</p></section><section class="advanced-memory-grid">${memory.cards.map(c=>{const open=memory.open.includes(c.id)||memory.matched.includes(c.id);return `<button class="${open?'open':''}" data-action="memory-card" data-card="${c.id}">${open?`<span>${c.label}</span>`:`<img class="memory-card-back" src="${assets.cards.neutralBack}" alt="">`}</button>`}).join('')}</section></div>${nav('island')}`;
  });

  router.register('speed',()=>{
    if(!speed.items.length)startSpeed();
    const source=sourceLanguage(),target=targetLanguage();
    return `<div class="v3-shell page speed-bg">${top('world')}<section class="page-title speed-title speed-title-with-tula"><div><span class="eyebrow">${tr('ZEIT-ABENTEUER','AVENTURA CONTRARRELOJ','ΠΕΡΙΠΕΤΕΙΑ ΧΡΟΝΟΥ')}</span><h1>${tr('Goldene Minute','Minuto dorado','Χρυσό λεπτό')}</h1><p>${tr('Übersetze so viele Wörter wie möglich.','Traduce tantas palabras como puedas.','Μετάφρασε όσες περισσότερες λέξεις μπορείς.')}</p></div><img class="speed-tula" src="${assets.characters.tula.poses.surprised}" alt="Tula"></section><section class="speed-status"><div><small>${tr('ZEIT','TIEMPO','ΧΡΟΝΟΣ')}</small><strong id="speedTime">${speed.time}</strong></div><div><small>COMBO</small><strong>${speed.combo}×</strong></div><div><small>${tr('PUNKTE','PUNTOS','ΠΟΝΤΟΙ')}</small><strong>${speed.score}</strong></div></section><section class="speed-question"><span>${speed.current.emoji}</span><small>${tr('ÜBERSETZE','TRADUCE','ΜΕΤΑΦΡΑΣΕ')}</small><h2>${languageValue(speed.current,source)}</h2></section><section class="speed-options">${speed.options.map(w=>`<button data-action="speed-answer" data-answer="${w.id}">${languageValue(w,target)}</button>`).join('')}</section></div>`;
  });
}

export function registerAdvancedActions(router,{renderComplete}){
  registerAction('start-memory',()=>{startMemory();router.navigate('memory')});
  registerAction('start-speed',()=>{startSpeed();router.navigate('speed');speedTimer=setInterval(()=>{speed.time--;const node=document.querySelector('#speedTime');if(node)node.textContent=String(speed.time);if(speed.time<=0){clearInterval(speedTimer);speedTimer=null;const worldId=getState().session.collectionId;const reward=grantReward({xp:speed.score*5,shells:Math.max(6,Math.floor(speed.score/2)),practiceResult:{worldId,exerciseId:'speed'}});setState(d=>{d.session.activeGame=null;return d});document.querySelector('#app').innerHTML=renderComplete(tr('Goldene Minute beendet!','¡Minuto dorado terminado!','Το χρυσό λεπτό τελείωσε!'),reward,'world','start-speed')}},1000)});
  registerAction('memory-card',({data})=>{const id=data.card;if(memory.open.includes(id)||memory.matched.includes(id)||memory.open.length>=2)return;memory.open.push(id);router.renderCurrent();if(memory.open.length===2){const [a,b]=memory.open.map(x=>memory.cards.find(c=>c.id===x));setTimeout(()=>{if(a.pair===b.pair)memory.matched.push(...memory.open);memory.open=[];router.renderCurrent()},600)}});
  registerAction('speed-answer',({data})=>{if(data.answer===speed.current.id){speed.score++;speed.combo++}else speed.combo=0;speed.step++;if(speed.step>=speed.items.length){speed.time=0;return}prepareSpeedQuestion();router.renderCurrent()});
}
