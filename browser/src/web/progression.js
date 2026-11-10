export const LEVELS=[
 {id:1,title:'First splash',world:'Garden Lab',difficulty:'easy',gameMode:'classic',tip:'Learn the rhythm. Roll, then spray.'},
 {id:2,title:'Steady hands',world:'Garden Lab',difficulty:'easy',gameMode:'classic',tip:'Keep calm as the tissue gets wetter.'},
 {id:3,title:'Card party',world:'Garden Lab',difficulty:'easy',gameMode:'chaos',tip:'Watch for shields, double sprays and extra turns.'},
 {id:4,title:'Feeling brave',world:'Garden Lab',difficulty:'normal',gameMode:'classic',tip:'Less tissue strength. More suspense.'},
 {id:5,title:'Already soggy',world:'Garden Lab',difficulty:'easy',gameMode:'sudden',tip:'The tissue starts at 72% damage.'},
 {id:6,title:'Garden champion',world:'Garden Lab',difficulty:'easy',gameMode:'tour',tip:'First to two wins takes the trophy.'},
 {id:7,title:'Cloud control',world:'Cloud Garden',difficulty:'normal',gameMode:'chaos',tip:'Keep an eye on every surprise card.'},
 {id:8,title:'Thin ice',world:'Cloud Garden',difficulty:'normal',gameMode:'sudden',tip:'A wet start makes every spray matter.'},
 {id:9,title:'High pressure',world:'Cloud Garden',difficulty:'hard',gameMode:'classic',tip:'The tissue can take fewer sprays.'},
 {id:10,title:'Wild weather',world:'Cloud Garden',difficulty:'hard',gameMode:'chaos',tip:'Hard difficulty meets unpredictable cards.'},
 {id:11,title:'Last drop',world:'Cloud Garden',difficulty:'hard',gameMode:'sudden',tip:'A fragile start. One big finish.'},
 {id:12,title:'Cloud champion',world:'Cloud Garden',difficulty:'hard',gameMode:'tour',tip:'Win the best-of-three final.'},
];
export const STYLES=[{id:'classic',name:'Classic',icon:'◉',detail:'The original roll-and-spray game.'},{id:'sudden',name:'Sudden Death',icon:'ϟ',detail:'The tissue starts wet and weak.'},{id:'chaos',name:'Chaos Cards',icon:'✦',detail:'Surprise cards can change your sprays.'},{id:'tour',name:'Tournament',icon:'♛',detail:'First to two wins. Best of three rounds.'}];
export const EMPTY_PROGRESS={version:1,xp:0,points:0,wins:0,games:0,safeSprays:0,levels:{},history:[],daily:{},playerName:'Player'};
export function todayKey(date=new Date()){return new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Johannesburg',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);}
export function loadProgress(value){try{const p=JSON.parse(value||'null');if(!p||p.version!==1)return {...EMPTY_PROGRESS};return {...EMPTY_PROGRESS,...p,levels:p.levels||{},history:Array.isArray(p.history)?p.history.slice(0,30):[],daily:p.daily||{}};}catch{return {...EMPTY_PROGRESS};}}
export function roundPoints(game,win){const base=Math.min(60,Math.max(0,game.safeSprays)*2)+Math.min(20,Math.max(0,game.rounds)*2)+20;const score=Math.floor(base*({easy:1,normal:1.5,hard:2}[game.difficulty]||1));return win?score:-score;}
export function unlockedLevel(progress){for(const level of LEVELS){if(!progress.levels[level.id])return level.id;}return LEVELS.length;}
export function isLevelUnlocked(progress,id){return id===1||!!progress.levels[id-1];}
export function recordRound(progress,game,{levelId=null,seriesComplete=true,seriesWon=false,date=new Date()}={}){
 if(game.phase!=='over'||progress.history.some(h=>h.id===game.gameId)||game.mode!=='computer')return progress;
 const win=game.current===2,score=roundPoints(game,win),xp=20+(win?40:0),key=todayKey(date),daily=progress.daily[key]||{games:0,wins:0,sprays:0,claimed:[]};
 const levels={...progress.levels};if(levelId&&isLevelUnlocked(progress,levelId)&&((game.gameMode==='tour'&&seriesComplete&&seriesWon)||(game.gameMode!=='tour'&&win))){levels[levelId]=Math.max(levels[levelId]||0,1+(game.safeSprays>=4?1:0)+(game.safeSprays>=8?1:0));}
 return {...progress,xp:progress.xp+xp,points:Math.max(0,progress.points+score),wins:progress.wins+(win?1:0),games:progress.games+1,safeSprays:progress.safeSprays+game.safeSprays,levels,history:[{id:game.gameId,win,score,mode:game.gameMode,difficulty:game.difficulty,date:date.toISOString(),levelId},...progress.history].slice(0,30),daily:{[key]:{...daily,games:daily.games+1,wins:daily.wins+(win?1:0),sprays:daily.sprays+game.safeSprays}}};
}
export function dailyGoals(progress,date=new Date()){const d=progress.daily[todayKey(date)]||{games:0,wins:0,sprays:0,claimed:[]};return [{id:'games',title:'Back for more',detail:'Finish 3 games vs the computer.',value:d.games,target:3,xp:50},{id:'wins',title:'Egg-cellent victory',detail:'Win 1 round vs the computer.',value:d.wins,target:1,xp:40},{id:'sprays',title:'Gentle touch',detail:'Make 12 safe sprays vs the computer.',value:d.sprays,target:12,xp:60}].map(g=>({...g,claimed:(d.claimed||[]).includes(g.id)}));}
export function claimGoal(progress,id,date=new Date()){const key=todayKey(date),goal=dailyGoals(progress,date).find(g=>g.id===id);if(!goal||goal.claimed||goal.value<goal.target)return progress;const d=progress.daily[key];return {...progress,xp:progress.xp+goal.xp,daily:{...progress.daily,[key]:{...d,claimed:[...(d.claimed||[]),id]}}};}
export const SHIELDS=[{type:'basic',name:'Basic Shield',price:5000,hits:1,detail:'Blocks one fall-causing hit.'},{type:'golden',name:'Golden Shield',price:10000,hits:2,detail:'Blocks two fall-causing hits.'},{type:'super',name:'Super Shield',price:20000,hits:3,detail:'Blocks three fall-causing hits.'}];
