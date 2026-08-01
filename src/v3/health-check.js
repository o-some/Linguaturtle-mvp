const STORAGE_KEY='linguaturtle-v3-preview';

const checks=[];
function add(name,ok,detail=''){checks.push({name,ok:Boolean(ok),detail});}

function safeState(){
  try{
    const raw=localStorage.getItem(STORAGE_KEY);
    if(!raw)return {};
    const parsed=JSON.parse(raw);
    return parsed&&typeof parsed==='object'&&!Array.isArray(parsed)?parsed:{};
  }catch(error){
    add('Lokaler Speicher',false,error.message);
    return {};
  }
}

function run(){
  const state=safeState();
  add('App-Container',Boolean(document.querySelector('#app')),'#app');
  add('Hauptansicht gerendert',Boolean(document.querySelector('#app')?.children.length),'Inhalt im App-Container');
  add('Navigation',Boolean(document.querySelector('.v3-nav')),'untere V3-Navigation');
  add('Sprache',!state.lang||['de','es'].includes(state.lang),state.lang||'Standard: de');
  add('XP',state.xp===undefined||Number.isFinite(Number(state.xp)),String(state.xp??0));
  add('Muscheln',state.shells===undefined||Number.isFinite(Number(state.shells)),String(state.shells??0));
  add('Freischaltungen',state.unlocked===undefined||Array.isArray(state.unlocked),'unlocked[]');
  add('Booster',state.boosters===undefined||(state.boosters&&typeof state.boosters==='object'),'boosters{}');
  add('Tula-Grafik',Boolean(document.querySelector('img[src*="tula"], .v3-brand')),'Maskottchen oder Markenheader');
  add('Web Speech API','speechSynthesis' in window,'optionale Audioausgabe');

  const failed=checks.filter(x=>!x.ok);
  window.LinguaTurtleHealth={status:failed.length?'warning':'ok',checkedAt:new Date().toISOString(),checks};
  document.documentElement.dataset.v3Health=failed.length?'warning':'ok';

  if(failed.length){
    console.warn('[LinguaTurtle V3 Health]',failed);
    const badge=document.createElement('button');
    badge.type='button';
    badge.className='v3-health-badge';
    badge.textContent=`⚠ ${failed.length} Prüfhinweis${failed.length===1?'':'e'}`;
    badge.addEventListener('click',showReport);
    document.body.appendChild(badge);
  }else{
    console.info('[LinguaTurtle V3 Health] Alle Startprüfungen bestanden.');
  }
}

function showReport(){
  document.querySelector('#v3HealthModal')?.remove();
  const rows=checks.map(c=>`<li class="${c.ok?'ok':'fail'}"><b>${c.ok?'✓':'!'}</b><span><strong>${c.name}</strong><small>${c.detail||''}</small></span></li>`).join('');
  document.body.insertAdjacentHTML('beforeend',`<div class="v3-health-modal" id="v3HealthModal"><section><header><div><small>V3 DIAGNOSE</small><h2>Systemprüfung</h2></div><button data-health-close>×</button></header><ul>${rows}</ul><button class="v3-health-repair" data-health-repair>Testdaten normalisieren</button></section></div>`);
  document.querySelector('[data-health-close]')?.addEventListener('click',()=>document.querySelector('#v3HealthModal')?.remove());
  document.querySelector('[data-health-repair]')?.addEventListener('click',repair);
}

function repair(){
  const state=safeState();
  const fixed={
    ...state,
    lang:['de','es'].includes(state.lang)?state.lang:'de',
    xp:Number.isFinite(Number(state.xp))?Number(state.xp):0,
    shells:Number.isFinite(Number(state.shells))?Math.max(0,Number(state.shells)):75,
    streak:Number.isFinite(Number(state.streak))?Math.max(0,Number(state.streak)):1,
    daily:Number.isFinite(Number(state.daily))?Math.max(0,Math.min(5,Number(state.daily))):0,
    learned:state.learned&&typeof state.learned==='object'&&!Array.isArray(state.learned)?state.learned:{},
    unlocked:Array.isArray(state.unlocked)?state.unlocked:[],
    claimed:Array.isArray(state.claimed)?state.claimed:[],
    boosters:state.boosters&&typeof state.boosters==='object'&&!Array.isArray(state.boosters)?state.boosters:{doubleXp:0,hints:0,jumps:0}
  };
  localStorage.setItem(STORAGE_KEY,JSON.stringify(fixed));
  location.reload();
}

const style=document.createElement('style');
style.textContent=`.v3-health-badge{position:fixed;right:12px;top:max(12px,env(safe-area-inset-top));z-index:1000;border:1px solid #e2c66d;border-radius:999px;background:#fff6d9;color:#6b4d00;padding:9px 12px;font:800 12px system-ui;box-shadow:0 8px 24px rgba(7,63,103,.16)}.v3-health-modal{position:fixed;inset:0;z-index:1100;background:rgba(3,34,56,.58);display:grid;place-items:end center}.v3-health-modal>section{width:min(100%,560px);max-height:85vh;overflow:auto;background:#fff;border-radius:28px 28px 0 0;padding:22px 18px calc(24px + env(safe-area-inset-bottom));font-family:system-ui;color:#17354a}.v3-health-modal header{display:flex;justify-content:space-between;align-items:center}.v3-health-modal header small{font-weight:900;letter-spacing:.15em;color:#d3ad51}.v3-health-modal h2{margin:4px 0;color:#073f67}.v3-health-modal header button{border:0;background:#eaf5fa;width:42px;height:42px;border-radius:50%;font-size:24px;color:#073f67}.v3-health-modal ul{list-style:none;padding:0;display:grid;gap:9px}.v3-health-modal li{display:flex;align-items:center;gap:12px;border:1px solid #cfe1ea;border-radius:16px;padding:12px}.v3-health-modal li>b{display:grid;place-items:center;width:30px;height:30px;border-radius:50%;background:#e8f7ef;color:#167348}.v3-health-modal li.fail>b{background:#fff1e8;color:#a94b13}.v3-health-modal li span{display:grid}.v3-health-modal li small{color:#6b8292}.v3-health-repair{width:100%;border:0;border-radius:17px;background:#073f67;color:#fff;padding:14px;font-weight:900}`;
document.head.appendChild(style);

setTimeout(run,900);
