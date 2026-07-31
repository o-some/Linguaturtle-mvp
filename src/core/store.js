const KEY='linguaturtle-v2';
const LEGACY=['linguaturtle-premium-v4','linguaturtle-v3','linguaturtle-v2'];

function legacy(){for(const key of LEGACY){try{const data=JSON.parse(localStorage.getItem(key)||'null');if(data)return data}catch{}}return {}}
const old=legacy();
const today=new Date().toISOString().slice(0,10);
const initial={
lang:old.lang||old.source||'de',xp:Number(old.xp||0),shells:Number(old.shells??75),streak:Number(old.streak||1),
unlocked:old.unlocked||[],learned:old.learned||{},category:'animals',dailyDate:today,dailyCount:0,
boosters:{doubleXpUntil:0,jumps:0,hints:0},claimed:[],screen:'home',sound:old.muted?false:true,reducedMotion:false
};
let state={...initial,...load()};
if(state.dailyDate!==today){state.dailyDate=today;state.dailyCount=0}

function load(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}}
function save(){localStorage.setItem(KEY,JSON.stringify(state))}
export function getState(){return state}
export function patch(next){state={...state,...next};save();return state}
export function update(fn){state=fn({...state})||state;save();return state}
export function level(){return Math.floor(state.xp/100)+1}
export function levelXp(){return state.xp%100}
export function xpToNext(){return 100-levelXp()}
export function addReward({xp=0,shells=0,daily=0}){
const multiplier=Date.now()<Number(state.boosters.doubleXpUntil||0)?2:1;
state.xp+=xp*multiplier;state.shells+=shells;state.dailyCount=Math.min(5,state.dailyCount+daily);save();
return {xp:xp*multiplier,shells};
}
export function buy(cost){if(state.shells<cost)return false;state.shells-=cost;save();return true}
export function markLearned(ids){const learned={...state.learned};ids.forEach(id=>learned[id]=(learned[id]||0)+1);state.learned=learned;save()}
export function resetAll(){state={...initial};save()}
