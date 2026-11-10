import React from 'react';
import { Path } from 'react-native-svg';
import { INK } from '../palette';
export default function Star({x,y,size=1,color='#ffe36b',rotation=0}){return <Path transform={`translate(${x} ${y}) rotate(${rotation}) scale(${size})`} d="M0 -22 7 -7 23 -4 11 8 14 25 0 17 -15 25 -11 8 -23 -4 -7 -7Z" fill={color} stroke={INK} strokeWidth="3"/>;}
