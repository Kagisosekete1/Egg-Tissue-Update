import React from 'react';
import { Circle, Ellipse, G, Path } from 'react-native-svg';
import { INK, outline } from '../palette';
export default function Egg({mood,blink,arm,landed}){const scared=mood>1;return <G>
  <Ellipse cy="13" rx="119" ry="20" fill={INK} opacity={.13}/>
  <G transform={`rotate(${-arm} -105 -80)`}><Path d="M-100 -90Q-170 -130 -180 -70" fill="none" {...outline}/><Path d="M-190 -65Q-213 -90 -197 -96L-181 -82Q-170 -111 -160 -100L-163 -74Q-154 -56 -177 -50Z" fill="#ffcd78" {...outline}/></G>
  <G transform={`rotate(${arm} 105 -80)`}><Path d="M100 -90Q170 -130 180 -70" fill="none" {...outline}/><Path d="M190 -65Q213 -90 197 -96L181 -82Q170 -111 160 -100L163 -74Q154 -56 177 -50Z" fill="#ffcd78" {...outline}/></G>
  <Path d="M-42 -12L-48 10M42 -12L48 10" {...outline}/><Ellipse cx="-57" cy="10" rx="29" ry="15" fill="#a875d4" {...outline}/><Ellipse cx="57" cy="10" rx="29" ry="15" fill="#a875d4" {...outline}/>
  <Path d="M0 -300C65 -300 133 -155 128 -95C121 35 -121 35 -128 -95C-133 -155 -65 -300 0 -300Z" fill="url(#shell)" {...outline}/>
  <Path d="M-74 -172Q-55 -247 -23 -260" fill="none" stroke="#fff" strokeWidth="19" strokeLinecap="round" opacity={.85}/>
  <Ellipse cx="-72" cy="-79" rx="25" ry="13" fill="#ffa2a0" opacity={.7}/><Ellipse cx="72" cy="-79" rx="25" ry="13" fill="#ffa2a0" opacity={.7}/>
  <G transform={`translate(0 -129) scale(1 ${blink?.12:1})`}>
  {[-43,43].map(x=><G key={x}><Ellipse cx={x} rx="34" ry={scared?49:42} fill="white" stroke={INK} strokeWidth="6"/>{landed?<Path d={`M${x-15} -13L${x+15} 13M${x+15} -13L${x-15} 13`} {...outline}/>:<G><Ellipse cx={x+6} cy="8" rx={scared?10:15} ry="22" fill={INK}/><Circle cx={x+10} cy="-1" r="6" fill="white"/></G>}</G>)}
  </G>
  <Path d={scared?'M-72 -195L-20 -181M20 -181L72 -195':'M-73 -184Q-47 -205 -24 -188M24 -188Q47 -205 73 -184'} fill="none" {...outline}/>
  {scared?<Ellipse cy="-55" rx="22" ry="29" fill={INK}/>:<G><Path d="M-38 -69Q0 -17 38 -69Z" fill={INK}/><Path d="M-15 -49Q0 -58 16 -49Q0 -33 -15 -49" fill="#ff829a"/></G>}
  {landed&&<Path d="M-8 -293L8 -251 -14 -230 10 -210" fill="none" {...outline}/>}
</G>;}
