import React from 'react';
import { Circle, Ellipse, G, Path } from 'react-native-svg';
import { INK, outline } from '../palette';
export default function Egg({mood=0,blink,arm,landed}){const scared=mood>=3,worried=mood===2,alert=mood===1;return <G id={`egg-reaction-${mood}`}>
 <Ellipse cy="13" rx="119" ry="20" fill={INK} opacity={.13}/>
 <G transform={`rotate(${-arm} -105 -80)`}><Path d="M-100 -90Q-170 -130 -180 -70" fill="none" {...outline}/><Path d="M-190 -65Q-213 -90 -197 -96L-181 -82Q-170 -111 -160 -100L-163 -74Q-154 -56 -177 -50Z" fill="#ffcd78" {...outline}/></G>
 <G transform={`rotate(${arm} 105 -80)`}><Path d="M100 -90Q170 -130 180 -70" fill="none" {...outline}/><Path d="M190 -65Q213 -90 197 -96L181 -82Q170 -111 160 -100L163 -74Q154 -56 177 -50Z" fill="#ffcd78" {...outline}/></G>
 <Path d="M-42 -12L-48 10M42 -12L48 10" {...outline}/><Ellipse cx="-57" cy="10" rx="29" ry="15" fill="#a875d4" {...outline}/><Ellipse cx="57" cy="10" rx="29" ry="15" fill="#a875d4" {...outline}/>
 <Path d="M0 -300C65 -300 133 -155 128 -95C121 35 -121 35 -128 -95C-133 -155 -65 -300 0 -300Z" fill="url(#shell)" {...outline}/>
 <Path d="M-74 -172Q-55 -247 -23 -260" fill="none" stroke="#fff" strokeWidth="19" strokeLinecap="round" opacity={.85}/>
 <Ellipse cx="-72" cy="-79" rx="25" ry="13" fill="#ffa2a0" opacity={scared?.3:.7}/><Ellipse cx="72" cy="-79" rx="25" ry="13" fill="#ffa2a0" opacity={scared?.3:.7}/>
 <G transform={`translate(0 -129) scale(1 ${blink?.12:1})`}>
 {[-43,43].map(x=><G key={x}><Ellipse cx={x} rx="34" ry={mood>=4?52:scared?48:alert?44:42} fill="white" stroke={INK} strokeWidth="6"/>{landed?<Path d={`M${x-15} -13L${x+15} 13M${x+15} -13L${x-15} 13`} {...outline}/>:<G><Ellipse cx={x+(alert?11:worried?-2:6)} cy={alert?12:8} rx={scared?9:worried?12:15} ry="22" fill={INK}/><Circle cx={x+(alert?15:worried?2:10)} cy={alert?4:-1} r="6" fill="white"/></G>}</G>)}
 </G>
 <Path d={scared?'M-72 -203L-20 -180M20 -180L72 -203':worried?'M-72 -183L-25 -199M25 -199L72 -183':alert?'M-75 -197Q-46 -212 -22 -196M24 -181Q48 -197 74 -181':'M-73 -184Q-47 -205 -24 -188M24 -188Q47 -205 73 -184'} fill="none" {...outline}/>
 {scared?<Ellipse cy="-55" rx={mood>=4?25:17} ry={mood>=4?32:23} fill={INK}/>:worried?<Path d="M-29 -44Q-10 -68 8 -53Q20 -43 31 -55" fill="none" {...outline}/>:alert?<Path d="M-25 -49Q0 -39 25 -53" fill="none" {...outline}/>:<G><Path d="M-38 -69Q0 -17 38 -69Z" fill={INK}/><Path d="M-15 -49Q0 -58 16 -49Q0 -33 -15 -49" fill="#ff829a"/></G>}
 {mood>=3&&!landed&&<G><Path d="M110 -191Q137 -165 127 -149Q112 -136 102 -151Q95 -163 110 -191Z" fill="#78e1f7" stroke="#3787b2" strokeWidth="4"/><Path d="M111 -170L115 -158" stroke="#eaffff" strokeWidth="4" strokeLinecap="round"/></G>}
 {landed&&<Path d="M-8 -293L8 -251 -14 -230 10 -210" fill="none" {...outline}/>}
</G>;}
