import React,{useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import Match from './Match';
import {gameAudio} from './audio';
import Portal from './Portal';
import {read,write} from './play-ui';
import {LEVELS,loadProgress,recordRound,claimGoal,isLevelUnlocked,SHIELDS} from './progression';
import {POWERUP_CATALOG,uuid} from './rules';
import './styles.css';
const KEY='egg-2d-progress-v1';
function getRoute(){const [path,query='']=location.hash.replace(/^#\/?/,'').split('?');return {path:path||'home',params:new URLSearchParams(query)};}
function App(){
 const [route,setRoute]=useState(getRoute),[progress,setProgress]=useState(()=>loadProgress(read(KEY,null))),[audioOn,setAudioOn]=useState(()=>read('egg-2d-sound','1')==='1'),[best,setBest]=useState(()=>Number(read('egg-2d-best',0))||0);
 const progressRef=useRef(progress);
 const [musicOn,setMusicOn]=useState(()=>read('egg-2d-music','1')==='1');
 useEffect(()=>{gameAudio.setEnabled(audioOn);gameAudio.setMusicEnabled(musicOn);},[audioOn,musicOn]);
 useEffect(()=>{const unlock=()=>gameAudio.unlock(),visibility=()=>gameAudio.setContext({visible:!document.hidden});document.addEventListener('pointerdown',unlock);document.addEventListener('keydown',unlock);document.addEventListener('visibilitychange',visibility);visibility();return()=>{document.removeEventListener('pointerdown',unlock);document.removeEventListener('keydown',unlock);document.removeEventListener('visibilitychange',visibility);gameAudio.stop();};},[]);
 const [settings,setSettings]=useState(()=>{try{const p=JSON.parse(read('egg-2d-setup','null'));return {mode:p?.mode==='friend'?'friend':'computer',difficulty:['easy','normal','hard'].includes(p?.difficulty)?p.difficulty:'normal',gameMode:['classic','sudden','chaos','tour'].includes(p?.gameMode)?p.gameMode:'classic'};}catch{return {mode:'computer',difficulty:'normal',gameMode:'classic'};}});
 useEffect(()=>{const changed=()=>setRoute(getRoute());window.addEventListener('hashchange',changed);return()=>window.removeEventListener('hashchange',changed);},[]);
 useEffect(()=>{write('egg-2d-setup',JSON.stringify(settings));},[settings]);
 function updateProgress(next){progressRef.current=next;setProgress(next);write(KEY,JSON.stringify(next));}
 function navigate(path){location.hash=`/${path}`;}
 function launch(level){if(level&&!isLevelUnlocked(progressRef.current,level.id))return;const config=level?{mode:'computer',difficulty:level.difficulty,gameMode:level.gameMode,level:String(level.id)}:settings;gameAudio.startRound();gameAudio.unlock();location.hash='/play?'+new URLSearchParams(config).toString();}
 function onRound(game,context){const next=recordRound(progressRef.current,game,context);updateProgress(next);if(game.mode==='computer'&&game.current===2){const last=next.history[0];if(last&&last.score>best){setBest(last.score);write('egg-2d-best',last.score);}}}
 function buy(type,kind){const p=progressRef.current,item=(kind==='boost'?POWERUP_CATALOG:SHIELDS).find(i=>i.type===type);if(!item||p.points<item.price)return 'Not enough device points.';const next={...p,points:p.points-item.price};if(kind==='boost')next.inventory={...p.inventory,[type]:(p.inventory?.[type]||0)+1};else next.shields=[...(p.shields||[]),{id:uuid(),type,hits:item.hits,equipped:false}];updateProgress(next);return `${item.name} added to your bag.`;}
 function consumeBoost(type){const p=progressRef.current;if(!(p.inventory?.[type]>0))return false;updateProgress({...p,inventory:{...p.inventory,[type]:p.inventory[type]-1}});return true;}
 function consumeShield(){const p=progressRef.current,shield=(p.shields||[]).find(s=>s.equipped&&s.hits>0);if(!shield)return false;updateProgress({...p,shields:p.shields.map(s=>s.id===shield.id?{...s,hits:s.hits-1,equipped:s.hits>1}:s)});return true;}
 function equip(id){const p=progressRef.current;updateProgress({...p,shields:(p.shields||[]).map(s=>({...s,equipped:s.id===id&&s.hits>0}))});}
 const toggleAudio=()=>setAudioOn(v=>{write('egg-2d-sound',v?'0':'1');gameAudio.setEnabled(!v);gameAudio.unlock();return !v;});
 const toggleMusic=()=>setMusicOn(v=>{write('egg-2d-music',v?'0':'1');gameAudio.setMusicEnabled(!v);gameAudio.unlock();return !v;});
 const levelId=Number(route.params.get('level')),level=LEVELS.find(l=>l.id===levelId),validLevel=level&&isLevelUnlocked(progress,level.id)?level:null;
 const matchSettings=validLevel?{mode:'computer',difficulty:validLevel.difficulty,gameMode:validLevel.gameMode}:{mode:route.params.get('mode')==='friend'?'friend':'computer',difficulty:['easy','normal','hard'].includes(route.params.get('difficulty'))?route.params.get('difficulty'):'normal',gameMode:['classic','sudden','chaos','tour'].includes(route.params.get('gameMode'))?route.params.get('gameMode'):'classic'};
 if(route.path==='play'&&(!levelId||validLevel))return <Match key={location.hash} settings={matchSettings} level={validLevel} onExit={()=>navigate(validLevel?'levels':'home')} onRound={onRound} audioOn={audioOn} musicOn={musicOn} onToggleMusic={toggleMusic} onToggleAudio={toggleAudio} best={best} playerName={progress.playerName} inventory={progress.inventory||{}} consumeBoost={consumeBoost} shield={(progress.shields||[]).find(s=>s.equipped&&s.hits>0)} consumeShield={consumeShield}/>;
 const page=['home','setup','levels','challenges','shop','results','settings'].includes(route.path)?route.path:'levels';
 return <Portal key={page} page={page} navigate={navigate} progress={progress} settings={settings} setSettings={setSettings} launch={launch} audioOn={audioOn} musicOn={musicOn} onToggleMusic={toggleMusic} onToggleAudio={toggleAudio} claim={id=>updateProgress(claimGoal(progressRef.current,id))} buy={buy} equip={equip} saveName={name=>updateProgress({...progressRef.current,playerName:name.trim().slice(0,24)||'Player'})} best={best}/>;
}
createRoot(document.getElementById('root')).render(<App/>);
