import React from 'react';
import { Circle, Ellipse, G, Path } from 'react-native-svg';
import { INK, outline } from '../palette';
export default function Bottle({squeeze}){return <G transform={`translate(90 1000) rotate(${-squeeze*12}) scale(1 ${1-squeeze*.08})`}>
  <Path d="M-18 -120H88L107 -80V72Q45 106 -18 72Z" fill="url(#bottle)" {...outline}/>
  <Path d="M0 -100V45" stroke="#ffc4dd" strokeWidth="14" strokeLinecap="round" opacity={.7}/>
  <Path d="M12 -120V-166H63V-120M-3 -172H103V-207H29Q-3 -207 -3 -172Z" fill="#a78ce8" {...outline}/>
  <Path d="M103 -205H133V-176H103M73 -166Q112 -147 87 -124" fill="#ffe575" {...outline}/>
  <Ellipse cx="35" cy="-31" rx="13" ry="20" fill="white" {...outline}/><Ellipse cx="73" cy="-31" rx="13" ry="20" fill="white" {...outline}/><Circle cx="38" cy="-25" r="6" fill={INK}/><Circle cx="76" cy="-25" r="6" fill={INK}/><Path d="M35 11Q56 36 76 10" fill="none" {...outline}/>
</G>;}

