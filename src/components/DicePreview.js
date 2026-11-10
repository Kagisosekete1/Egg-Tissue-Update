import React, { useEffect, useState } from 'react';
import { Animated, Easing } from 'react-native';
import Svg, { Circle, Rect } from 'react-native-svg';
const PIPS=[[[50,50]],[[27,27],[73,73]],[[27,27],[50,50],[73,73]],[[27,27],[73,27],[27,73],[73,73]],[[27,27],[73,27],[50,50],[27,73],[73,73]],[[27,24],[73,24],[27,50],[73,50],[27,76],[73,76]]];
export default function DicePreview({face=1,rolling=false}){
  const [spin]=useState(()=>new Animated.Value(0));
  useEffect(()=>{if(!rolling){spin.setValue(0);return;}const animation=Animated.loop(Animated.timing(spin,{toValue:1,duration:420,easing:Easing.linear,useNativeDriver:true}));animation.start();return()=>animation.stop();},[rolling,spin]);
  return <Animated.View accessible accessibilityLabel={rolling?'Die rolling':`Die shows ${face}`} style={{width:78,height:78,transform:[{rotate:spin.interpolate({inputRange:[0,1],outputRange:['0deg','360deg']})}]}}><Svg width="78" height="78" viewBox="0 0 100 108"><Rect x="5" y="12" width="90" height="90" rx="23" fill="#c6a4df" stroke="#39254f" strokeWidth="5"/><Rect x="5" y="4" width="90" height="90" rx="23" fill="#fff3ce" stroke="#39254f" strokeWidth="5"/>{(PIPS[Math.max(0,Math.min(5,face-1))]||PIPS[0]).map(([x,y],i)=><Circle key={i} cx={x} cy={y} r="8" fill="#39254f"/>)}</Svg></Animated.View>;
}
