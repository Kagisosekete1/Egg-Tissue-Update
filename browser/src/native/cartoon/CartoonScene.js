import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, AppState, View } from 'react-native';
import Svg, { Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { outline } from './palette';
import Egg from './characters/Egg';
import Bottle from './characters/Bottle';
import Landscape from './environments/Landscape';
import Star from './effects/Star';
const clamp=n=>Math.max(0,Math.min(1,n));

/** Independent SVG layers/parts; bounded 30fps clock only while visible and unpaused. */
export default function CartoonScene({danger=0,sprayToken=0,falling=false,fallVariant='wobble',resetToken=0,paused=false,onImpact}){
  const [time,setTime]=useState(0),[reduced,setReduced]=useState(false),[foreground,setForeground]=useState(true);
  const [sprayedAt,setSprayedAt]=useState(-10),[fellAt,setFellAt]=useState(null);
  const clock=useRef(0),impacted=useRef(false),callback=useRef(onImpact),previousSpray=useRef(sprayToken);
  useEffect(()=>{callback.current=onImpact;},[onImpact]);
  useEffect(()=>{let mounted=true;AccessibilityInfo.isReduceMotionEnabled().then(v=>{if(mounted)setReduced(v);}).catch(()=>{});const sub=AccessibilityInfo.addEventListener('reduceMotionChanged',setReduced);const app=AppState.addEventListener('change',s=>setForeground(s==='active'));return()=>{mounted=false;sub.remove();app.remove();};},[]);
  useEffect(()=>{if(paused||!foreground)return;let last=Date.now();const id=setInterval(()=>{const now=Date.now();clock.current+=Math.min((now-last)/1000,.1);last=now;setTime(clock.current);},1000/30);return()=>clearInterval(id);},[paused,foreground]);
  useEffect(()=>{if(previousSpray.current!==sprayToken){previousSpray.current=sprayToken;setSprayedAt(clock.current);}},[sprayToken]);
  useEffect(()=>{setFellAt(falling?clock.current:null);impacted.current=false;},[falling,resetToken]);
  useEffect(()=>{if(fellAt!==null&&time-fellAt>=.9&&!impacted.current){impacted.current=true;callback.current?.();}},[time,fellAt]);
  const ratio=clamp(danger),sag=ratio*100,age=time-sprayedAt,spray=age>=0&&age<.55,fallAge=fellAt===null?0:time-fellAt;
  const drop=falling?clamp((fallAge-.2)/.7):0,landed=drop===1,bob=reduced?0:Math.sin(time*2.6)*5,wobble=reduced?0:Math.sin(time*15)*Math.max(0,ratio-.65)*12;
  const eggY=760+sag*.5+drop*(1080-760-sag*.5),scaleY=landed?1-Math.sin(clamp((fallAge-.9)/.22)*Math.PI)*.2:1;
  return <View style={{flex:1,backgroundColor:'#91e1e7'}} accessible accessibilityLabel={`Cartoon egg ${falling?'has fallen':ratio>.8?'looks frightened':'balances on the tissue'}`}><Svg width="100%" height="100%" viewBox="0 0 1080 1300" preserveAspectRatio="xMidYMid slice">
  <Defs>
  <LinearGradient id="sky" x2="0" y2="1"><Stop stopColor="#4dc9e4"/><Stop offset="1" stopColor="#ecf4ba"/></LinearGradient>
  <LinearGradient id="shell" x2="1" y2="1"><Stop stopColor="#fffdf1"/><Stop offset=".55" stopColor="#ffecc0"/><Stop offset="1" stopColor="#efa665"/></LinearGradient>
  <LinearGradient id="bottle" x2="1" y2="1"><Stop stopColor="#ff98bd"/><Stop offset="1" stopColor="#dc4d94"/></LinearGradient>
  <LinearGradient id="leaf" x2="1" y2="1"><Stop stopColor="#a0dc77"/><Stop offset="1" stopColor="#47a793"/></LinearGradient>
  <LinearGradient id="table" x2="0" y2="1"><Stop stopColor="#ffd39a"/><Stop offset="1" stopColor="#eaa180"/></LinearGradient>
  </Defs>
  <Landscape time={reduced?0:time}/>
  <G {...outline}><Rect x="170" y="748" width="47" height="345" rx="18" fill="#9a7bc7"/><Rect x="863" y="748" width="47" height="345" rx="18" fill="#9a7bc7"/>
  {!falling?<Path d={`M190 750Q540 ${750+sag} 890 750L880 787Q540 ${800+sag} 200 787Z`} fill={ratio>.5?'#a4e5ed':'#f6fcff'}/>:<G><Path d="M190 750L460 905 380 920 190 790Z" fill="#a4e5ed"/><Path d="M890 750L620 910 690 929 890 790Z" fill="#a4e5ed"/></G>}</G>
  {!falling&&<G opacity={ratio*.65}>{[0,1,2,3,4].map(i=><Ellipse key={i} cx={280+i*125} cy={775+Math.sin(i*.8)*sag*.5} rx="30" ry="10" fill="#49bfdd"/>)}</G>}
  <G transform={`translate(${540+wobble} ${eggY+(falling?0:bob)}) rotate(${falling?drop*(fallVariant==='spin'?355:22):0}) scale(1 ${scaleY})`}><Egg mood={falling?3:ratio>.8?2:0} blink={!reduced&&!falling&&time%4>3.8} arm={falling?55:reduced?0:Math.sin(time*3)*9} landed={landed}/></G>
  <Bottle squeeze={spray?Math.sin(age/.55*Math.PI):0}/>
  {spray&&Array.from({length:reduced?5:14},(_,i)=>{const p=clamp(age*2.5-i*.025);return <Ellipse key={i} cx={225+p*380} cy={810-p*110+p*p*(95+sag/2)+(i%3)*12} rx={5+i%4} ry="11" transform={`rotate(35 ${225+p*380} ${810-p*110+p*p*(95+sag/2)+(i%3)*12})`} fill="#6cdef7" stroke="#298bb2" strokeWidth="2" opacity={1-p}/>;})}
  {landed&&fallAge<2.4&&Array.from({length:9},(_,i)=>{const p=clamp((fallAge-.9)/1.5),a=i*2.4;return <Star key={i} x={540+Math.cos(a)*(80+p*220)} y={1050-Math.sin(i)*70-p*130} size={.5+p*.4} rotation={i*30+p*100} color={i%2?'#ffd64f':'#ff94be'}/>;})}
  <G transform={`translate(${reduced?0:Math.sin(time*.7)*5} 0)`}>{[0,1080].map((x,i)=><G key={x} transform={`translate(${x} 1280) scale(${i?-1:1} 1)`}><Path d="M0 0Q140 -200 180 -100Q170 -30 0 0M0 0Q30 -250 80 -240Q140 -140 0 0" fill="url(#leaf)" {...outline}/><Path d="M0 0L138 -104M0 0L75 -205" stroke="#d5ec9c" strokeWidth="7"/></G>)}</G>
  </Svg></View>;
}
