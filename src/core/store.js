const KEY='linguaturtle-v2';
const LEGACY=['linguaturtle-premium-v4','linguaturtle-v3','linguaturtle-v2'];

function readJson(key){
  try{
    const value=JSON.parse(localStorage.getItem(key)||'null');
    return value&&typeof value==='object'?value:null;
  }catch{return null}
}
function legacy(){for(const key of LEGACY){const data=readJson(key);if(data)return data}return {}}
function load(){return readJson(KEY)||{}}

const old=legacy();
const today=new Date().toISOString().slice(0,10);
const initial={
  lang:old.lang||old.source||'de',
  xp:Number(old.xp||0),
  shells:Number(old.shells??75),
  streak:Number(old.streak||1),
  unlocked:Array.isArray(old.unlocked)?old.unlocked:[],
  learned:old.learned&&typeof old.learned==='object'&&!Array.isArray(old.learned)?old.learned:{},
  category:'animals',
  dailyDate:today,
  dailyCount:0,
  boosters:{doubleXpUntil:0,jumps:0,hints:0},
  claimed:[],
  screen:'home',
  sound:old.muted?false:true,
  reducedMotion:false
};

const loaded=load();
let state={
  ...initial,
  ...loaded,
  unlocked:Array.isArray(loaded.unlocked)?loaded.unlocked:initial.unlocked,
  learned:loaded.learned&&typeof loaded.learned==='object'&&!Array.isArray(loaded.learned)?loaded.learned:initial.learned,
  boosters:{...initial.boosters,...(loaded.boosters&&typeof loaded.boosters==='object'?loaded.boosters:{})},
  claimed:Array.isArray(loaded.claimed)?loaded.claimed:[],
  lang:['de','es'].includes(loaded.lang)?loaded.lang:initial.lang,
  screen:typeof loaded.screen==='string'?loaded.screen:'home'
};
if(state.dailyDate!==today){state.dailyDate=today;state.dailyCount=0}

function save(){localStorage.setItem(KEY,JSON.stringify(state))}
export function getState(){return state}
export function patch(next){state={...state,...next};save();return state}
export function update(fn){state=fn({...state})||state;save();return state}
export function level(){return Math.floor(Number(state.xp||0)/100)+1}
export function levelXp(){return Number(state.xp||0)%100}
export function xpToNext(){return 100-levelXp()}
export function addReward({xp=0,shells=0,daily=0}){
  const multiplier=Date.now()<Number(state.boosters.doubleXpUntil||0)?2:1;
  state.xp=Number(state.xp||0)+xp*multiplier;
  state.shells=Number(state.shells||0)+shells;
  state.dailyCount=Math.min(5,Number(state.dailyCount||0)+daily);
  save();
  return {xp:xp*multiplier,shells};
}
export function buy(cost){if(Number(state.shells||0)<cost)return false;state.shells-=cost;save();return true}
export function markLearned(ids){const learned={...(state.learned||{})};ids.forEach(id=>learned[id]=(learned[id]||0)+1);state.learned=learned;save()}
export function resetAll(){state={...initial,boosters:{...initial.boosters},unlocked:[],learned:{},claimed:[]};save()}
