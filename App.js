import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, SafeAreaView, useWindowDimensions } from 'react-native';
import { Canvas, useFrame } from '@react-three/fiber/native';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import * as FileSystem from 'expo-file-system/legacy';

import { StatusBar } from 'expo-status-bar';
import { useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import GameScene from './Scene.native';

function DiceModel({ face, rolling }) {
  const ref = useRef(null);
  const dieGeometry = useMemo(() => new RoundedBoxGeometry(1.12, 1.12, 1.12, 4, .13), []);
  const target = useRef({ x: 0, y: 0 });
  useEffect(() => {
    if (!rolling) {
      const orientations = [
        [0, 0], [0, Math.PI], [-Math.PI / 2, 0], [Math.PI / 2, 0], [0, -Math.PI / 2], [0, Math.PI / 2],
      ];
      target.current = { x: orientations[face - 1]?.[0] ?? 0, y: orientations[face - 1]?.[1] ?? 0 };
    }
  }, [face, rolling]);
  useFrame((_, dt) => {
    if (!ref.current) return;
    if (rolling) {
      ref.current.rotation.x += dt * 5.2;
      ref.current.rotation.y += dt * 6.4;
    } else {
      const smooth = 1 - Math.exp(-dt * 9);
      ref.current.rotation.x += (target.current.x - ref.current.rotation.x) * smooth;
      ref.current.rotation.y += (target.current.y - ref.current.rotation.y) * smooth;
      ref.current.rotation.z *= Math.exp(-dt * 8);
    }
  });
  const pipSets = [
    [[0, 0]],
    [[-.28, .28], [.28, -.28]],
    [[-.28, .28], [0, 0], [.28, -.28]],
    [[-.28, .28], [.28, .28], [-.28, -.28], [.28, -.28]],
    [[-.28, .28], [.28, .28], [0, 0], [-.28, -.28], [.28, -.28]],
    [[-.28, .3], [.28, .3], [-.28, 0], [.28, 0], [-.28, -.3], [.28, -.3]],
  ];
  return <group ref={ref}>
    <mesh castShadow receiveShadow><primitive object={dieGeometry} attach="geometry" /><meshStandardMaterial color="#fffaf0" roughness={0.36} metalness={0.04} /></mesh>
    {pipSets[0].map(([x, y], i) => <mesh key={`f1-${i}`} position={[x, y, .568]}><sphereGeometry args={[.085, 12, 10]} /><meshStandardMaterial color="#241b3b" roughness={0.48} /></mesh>)}
    {pipSets[1].map(([x, y], i) => <mesh key={`f2-${i}`} position={[x, y, -.568]} rotation={[0, Math.PI, 0]}><sphereGeometry args={[.085, 12, 10]} /><meshStandardMaterial color="#241b3b" roughness={0.48} /></mesh>)}
    {pipSets[2].map(([x, y], i) => <mesh key={`f3-${i}`} position={[.568, y, x]} rotation={[0, Math.PI / 2, 0]}><sphereGeometry args={[.085, 12, 10]} /><meshStandardMaterial color="#241b3b" roughness={0.48} /></mesh>)}
    {pipSets[3].map(([x, y], i) => <mesh key={`f4-${i}`} position={[-.568, y, -x]} rotation={[0, -Math.PI / 2, 0]}><sphereGeometry args={[.085, 12, 10]} /><meshStandardMaterial color="#241b3b" roughness={0.48} /></mesh>)}
    {pipSets[4].map(([x, y], i) => <mesh key={`f5-${i}`} position={[x, .568, -y]} rotation={[-Math.PI / 2, 0, 0]}><sphereGeometry args={[.085, 12, 10]} /><meshStandardMaterial color="#241b3b" roughness={0.48} /></mesh>)}
    {pipSets[5].map(([x, y], i) => <mesh key={`f6-${i}`} position={[x, -.568, y]} rotation={[Math.PI / 2, 0, 0]}><sphereGeometry args={[.085, 12, 10]} /><meshStandardMaterial color="#241b3b" roughness={0.48} /></mesh>)}
  </group>;
}
function DicePreview({ face, rolling }) {
  return <Canvas camera={{ position: [2.8, 2.4, 3.4], fov: 35, near: .1, far: 30 }} gl={{ alpha: true, antialias: true }} onCreated={({ gl }) => { gl.setClearColor(0x000000, 0); }} style={{ width: 100, height: 100, backgroundColor: 'transparent' }}>
    <ambientLight intensity={1.4} /><directionalLight position={[3, 4, 5]} intensity={2.1} /><DiceModel face={face} rolling={rolling} />
  </Canvas>;
}

const faces=['⚀','⚁','⚂','⚃','⚄','⚅'];
const winsPath=FileSystem.documentDirectory+'eggWins.json';
const getWins=async()=>{try{return JSON.parse(await FileSystem.readAsStringAsync(winsPath))}catch{return {}}};

function Chip({label,selected,onPress,disabled=false,style}){
  return <Pressable accessibilityRole="button" accessibilityState={{selected,disabled}} onPress={onPress} disabled={disabled} style={({pressed})=>[styles.chip,selected&&styles.chipSelected,disabled&&styles.disabled,pressed&&styles.pressed,style]}><Text style={[styles.chipText,selected&&styles.chipTextSelected]}>{label}</Text></Pressable>;
}
function Stat({children}){return <Text style={styles.stat}>{children}</Text>}

export default function App(){
  const {width}=useWindowDimensions();const wide=width>620;
  const [mode,setMode]=useState('computer'),[p1,setP1]=useState('Player 1'),[p2,setP2]=useState('Computer'),[difficulty,setDifficulty]=useState('normal'),[gameMode,setGameMode]=useState('classic');
  const [current,setCurrent]=useState(1),[roll,setRoll]=useState(0),[sprayed,setSprayed]=useState(0),[total,setTotal]=useState(0),[rounds,setRounds]=useState(0),[damage,setDamage]=useState(0),[breakAt,setBreakAt]=useState(20),[gameOver,setGameOver]=useState(false),[rolling,setRolling]=useState(false),[message,setMessage]=useState('Roll the dice to begin.'),[die,setDie]=useState('⚄'),[diceText,setDiceText]=useState('Ready to roll?'),[rollHint,setRollHint]=useState('1–6 sprays per turn'),[sprayToken,setSprayToken]=useState(0),[resetToken,setResetToken]=useState(0),[wins,setWins]=useState({}),[soundOn,setSoundOn]=useState(true),[mood,setMood]=useState('😎'),[cardNote,setCardNote]=useState('');
  const rollPlayer=useAudioPlayer(require('./assets/roll.wav'));const sprayPlayer=useAudioPlayer(require('./assets/spray.wav'));const crashPlayer=useAudioPlayer(require('./assets/crash.wav'));const winPlayer=useAudioPlayer(require('./assets/win.wav'));
  const timer=useRef([]),rollingRef=useRef(false),gameOverRef=useRef(false),currentRef=useRef(1),rollRef=useRef(0),sprayedRef=useRef(0),damageRef=useRef(0),shieldRef=useRef(false),doubleRef=useRef(false),modeRef=useRef('computer'),breakRef=useRef(20),winsRef=useRef({}),nextTurnRef=useRef(null),rollDiceRef=useRef(null),sprayNowRef=useRef(null);
  const name1=p1.trim()||'Player 1',name2=p2.trim()||(mode==='computer'?'Computer':'Player 2');const danger=Math.min(1.2,damage/Math.max(1,breakAt)),strength=Math.max(0,100-danger*100);
  useEffect(()=>{let alive=true;getWins().then(w=>{if(alive){winsRef.current=w;setWins(w);}});return()=>{alive=false};},[]);
  const play=React.useCallback((player)=>{if(!soundOn)return;try{player.seekTo(0);player.play()}catch{}},[soundOn]);
  const reset=useCallback((nextMode=modeRef.current,nextGameMode=gameMode)=>{
    timer.current.forEach(clearTimeout);timer.current=[];const r={easy:[24,30],normal:[17,23],hard:[12,17]}[difficulty];const threshold=r[0]+Math.random()*(r[1]-r[0]);breakRef.current=threshold;const d=nextGameMode==='sudden'?threshold*.72:0;
    rollRef.current=0;sprayedRef.current=0;damageRef.current=d;shieldRef.current=false;doubleRef.current=false;gameOverRef.current=false;rollingRef.current=false;currentRef.current=1;
    setBreakAt(threshold);setDamage(d);setRoll(0);setSprayed(0);setTotal(0);setRounds(0);setGameOver(false);setRolling(false);setCurrent(1);setDie('⚄');setDiceText('Ready to roll?');setRollHint('1–6 sprays per turn');setCardNote('');setMood('😎');setMessage('Roll the dice to begin.');setResetToken(x=>x+1);
  },[difficulty,gameMode]);
  const finish=useCallback(()=>{
    if(gameOverRef.current)return;gameOverRef.current=true;setGameOver(true);setMood('💥');play(crashPlayer);const loser=currentRef.current===1?name1:name2,winner=currentRef.current===1?name2:name1;setMessage(`💥 Splat! ${loser} made the egg fall. ${winner} wins!`);
    if(modeRef.current==='friend'||currentRef.current===2){const key=modeRef.current==='computer'?'c':'f';const updated={...winsRef.current,[key]:(winsRef.current[key]||0)+1};winsRef.current=updated;setWins(updated);FileSystem.writeAsStringAsync(winsPath,JSON.stringify(updated)).catch(()=>{});play(winPlayer);}
  },[name1,name2,crashPlayer,winPlayer,play]);
  const sprayNow=useCallback((bot=false)=>{
    if(gameOverRef.current||rollRef.current<=0||sprayedRef.current>=rollRef.current)return;
    const n=sprayedRef.current+1;sprayedRef.current=n;setSprayed(n);setTotal(x=>x+1);setSprayToken(x=>x+1);play(sprayPlayer);Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(()=>{});
    let hit=rollRef.current<=2?.7:rollRef.current<=4?1:1.3;if(doubleRef.current){hit*=2;doubleRef.current=false;}if(shieldRef.current){hit=0;shieldRef.current=false;setMessage('🛡️ Egg Shield absorbed that spray!');}
    damageRef.current+=hit;setDamage(damageRef.current);const d=damageRef.current/breakAt;setMood(d>.85?'😱':d>.55?'😰':'😎');
    if(damageRef.current>=breakAt){finish();return;}
    if(n>=rollRef.current){setMessage('Turn complete. The tissue survived… barely.');timer.current.push(setTimeout(()=>nextTurnRef.current?.(),850));}
    else if(!bot)setMessage(`${currentRef.current===1?name1:name2} sprays! (${n} of ${rollRef.current})`);
  },[breakAt,finish,name1,name2,sprayPlayer,play]);
  const nextTurn=useCallback(()=>{
    if(gameOverRef.current)return;const n=currentRef.current===1?2:1;currentRef.current=n;setCurrent(n);if(n===1)setRounds(x=>x+1);rollRef.current=0;sprayedRef.current=0;setRoll(0);setSprayed(0);setDie('⚄');setDiceText('Ready to roll?');setRollHint('1–6 sprays per turn');setMessage(modeRef.current==='computer'&&n===2?`${name2} is thinking…`:'Pass the device, then roll.');if(modeRef.current==='computer'&&n===2)timer.current.push(setTimeout(()=>rollDiceRef.current?.(true),850));
  },[name2]);
  const rollDice=useCallback((bot=false)=>{
    if(gameOverRef.current||rollingRef.current||rollRef.current>0)return;rollingRef.current=true;setRolling(true);Haptics.selectionAsync().catch(()=>{});let k=0;
    const id=setInterval(()=>{setDie(faces[Math.floor(Math.random()*6)]);if(++k>=9){clearInterval(id);const n=1+Math.floor(Math.random()*6);rollRef.current=n;setRoll(n);rollingRef.current=false;setRolling(false);setDie(faces[n-1]);play(rollPlayer);setDiceText(`${n} spray${n===1?'':'s'} · ${n<=2?'Lucky turn 🍀':n<=4?'Normal spraying 💦':'Dangerous turn 🌊'}`);setRollHint(`Spray ${n} time${n===1?'':'s'} to finish your turn`);
      const r=Math.random();shieldRef.current=r<.15;doubleRef.current=r>=.15&&r<.3;const note=shieldRef.current?' 🛡️ Egg Shield: first spray does no damage!':doubleRef.current?' 🔥 Double Trouble: first spray counts twice!':'';setCardNote(note);setMessage(`${bot?name2+' rolled':'You rolled'} ${n}. Now spray ${n} time${n===1?'':'s'}.${note}`);
      if(bot)for(let i=0;i<n;i++)timer.current.push(setTimeout(()=>{if(!gameOverRef.current&&currentRef.current===2)sprayNowRef.current?.(true)},650+i*550));
    }},75);timer.current.push(id);
  },[name2,rollPlayer,play]);
  useEffect(()=>()=>{timer.current.forEach(clearTimeout);},[]);
  nextTurnRef.current=nextTurn;rollDiceRef.current=rollDice;sprayNowRef.current=sprayNow;
  const chooseMode=m=>{setMode(m);modeRef.current=m;setP2(m==='computer'?'Computer':p2==='Computer'?'Player 2':p2);reset(m,gameMode);};
  const chooseGameMode=m=>{setGameMode(m);reset(mode,m);};
  const playerControls=<View style={[styles.settings,wide&&styles.settingsWide]}>
    <View style={styles.field}><Text style={styles.label}>Player 1</Text><TextInput value={p1} onChangeText={setP1} maxLength={14} style={styles.input} placeholder="Player 1" placeholderTextColor="#8981a7" returnKeyType="done" /></View>
    <View style={styles.field}><Text style={styles.label}>Player 2</Text><TextInput value={p2} onChangeText={setP2} maxLength={14} style={styles.input} placeholder="Player 2" placeholderTextColor="#8981a7" returnKeyType="done" /></View>
    <View style={styles.field}><Text style={styles.label}>Difficulty</Text><View style={styles.chipRow}>{['easy','normal','hard'].map(x=><Chip key={x} label={x[0].toUpperCase()+x.slice(1)} selected={difficulty===x} onPress={()=>{setDifficulty(x);}} style={styles.flexChip}/>)}</View></View>
    <View style={styles.field}><Text style={styles.label}>Game mode</Text><View style={styles.chipRow}>{[['classic','Classic'],['sudden','Sudden death']].map(([x,label])=><Chip key={x} label={label} selected={gameMode===x} onPress={()=>chooseGameMode(x)} style={styles.flexChip}/>)}</View></View>
  </View>;
  const controlRow=<View style={[styles.controls,wide&&styles.controlsWide]}>
    <View style={styles.box}><Text style={styles.label}>Dice roll</Text><View style={styles.diceRow}><DicePreview face={Math.max(1, faces.indexOf(die) + 1)} rolling={rolling} /><View style={styles.diceCopy}><Text style={styles.diceText}>{diceText}</Text><Text style={styles.hint}>{rollHint}</Text></View></View></View>
    <View style={styles.box}><Text style={styles.label}>Tissue tension</Text><View style={styles.meter}><View style={[styles.fill,{width:`${100-strength}%`}]}/></View><View style={styles.statRow}><Stat>{strength>70?'Strong':strength>40?'Getting weak':strength>15?'Very fragile':'About to snap!'}</Stat><Stat>{total} spray{total===1?'':'s'}</Stat></View><View style={styles.statRow}><Stat>Rounds: {rounds}</Stat><Stat>Sprays: {total}</Stat></View></View>
  </View>;
  return <SafeAreaView style={styles.safe}><StatusBar style="dark"/><ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled"><View style={[styles.app,wide&&styles.appWide]}>
    <Text style={styles.title}>Egg & Wet Tissue</Text>
    <View style={styles.panel}>
      <View style={styles.modeRow}><Chip label="🤖 Player vs Computer" selected={mode==='computer'} onPress={()=>chooseMode('computer')} style={styles.modeChip}/><Chip label="👥 Pass and play" selected={mode==='friend'} onPress={()=>chooseMode('friend')} style={styles.modeChip}/></View>
      {playerControls}
      <View style={styles.scoreLine}><Text style={styles.turn}>{gameOver?`🏆 ${current===1?name2:name1} wins!`:`${current===1?'🔵':mode==='computer'?'🤖':'🟣'} ${current===1?name1:name2}’s turn`}</Text><Text style={styles.status}>{gameOver?'Game over':strength>65?'Egg is safe… for now':strength>30?'Tissue is weakening!':'Danger zone!'}</Text></View>
      <View style={[styles.sceneWrap,danger>.85&&!gameOver&&styles.warn]}><GameScene danger={danger} sprayToken={sprayToken} falling={gameOver&&danger>=1} resetToken={resetToken}/><Text style={styles.mood}>{mood}</Text></View>
      {controlRow}
      <View style={styles.actionRow}><Chip label={rolling?'🎲 Rolling…':'🎲 Roll the dice'} selected onPress={()=>rollDice(false)} disabled={gameOver||rolling||roll>0||(mode==='computer'&&current===2)} style={styles.primaryButton}/><Chip label="💦 Spray tissue" onPress={()=>sprayNow(false)} disabled={gameOver||roll<=0||sprayed>=roll||(mode==='computer'&&current===2)} style={styles.actionButton}/></View>
      <Text accessibilityLiveRegion="polite" style={styles.message}>{message}</Text>
      <View style={styles.actionRow}><Chip label="🔁 Rematch" onPress={()=>reset()}/><Chip label={soundOn?'🔊 Sound: on':'🔇 Sound: off'} onPress={()=>setSoundOn(x=>!x)}/></View>
      <View style={styles.box}><Text style={styles.label}>🏆 Your wins (saved on this device)</Text><View style={styles.statRow}><Stat>🤖 vs Computer: {wins.c||0}</Stat><Stat>👥 vs Player 2: {wins.f||0}</Stat></View><View style={styles.statRow}><Stat>🌍 vs Online: {wins.o||0}</Stat><Text style={styles.hint}>Online play unavailable</Text></View></View>
      <Text style={styles.rules}><Text style={styles.rulesStrong}>How to play: </Text>roll 1–6, then spray that many times. Every spray weakens the tissue. Whoever’s spray makes the egg fall loses. Rolls of 1–2 are lucky, 5–6 are dangerous. Sudden death starts the tissue nearly broken. It’s a playful simulation, so no real water is needed.</Text>
    </View>
  </View></ScrollView></SafeAreaView>;
}

const styles=StyleSheet.create({
  safe:{flex:1,backgroundColor:'#efeaff'},scroll:{paddingHorizontal:12,paddingTop:8,paddingBottom:28,alignItems:'center'},app:{width:'100%',maxWidth:960},appWide:{width:'100%'},title:{fontSize:30,fontWeight:'900',letterSpacing:-1,marginBottom:12,color:'#2b2146'},pink:{color:'#e8368a'},panel:{backgroundColor:'#fff',borderWidth:1,borderColor:'#2b214624',borderRadius:8,padding:12},modeRow:{flexDirection:'row',gap:8,marginBottom:10},modeChip:{flex:1,minHeight:44},chip:{minHeight:40,paddingHorizontal:10,paddingVertical:8,borderRadius:6,borderWidth:1,borderColor:'#2b214624',backgroundColor:'#f4f0ff',alignItems:'center',justifyContent:'center'},chipSelected:{borderWidth:2,borderColor:'#e8368a'},chipText:{fontSize:13,fontWeight:'800',color:'#2b2146',textAlign:'center'},chipTextSelected:{color:'#2b2146'},pressed:{opacity:.75},disabled:{opacity:.4},settings:{flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:10},settingsWide:{},field:{width:'48%',flexGrow:1,minWidth:145},label:{fontSize:12,fontWeight:'800',color:'#5b5380',marginBottom:5},input:{height:40,borderWidth:1,borderColor:'#2b214624',borderRadius:5,paddingHorizontal:9,color:'#2b2146',backgroundColor:'#f4f0ff',fontWeight:'700'},chipRow:{flexDirection:'row',gap:4},flexChip:{flex:1,paddingHorizontal:4,paddingVertical:6,minHeight:40},scoreLine:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:8,marginVertical:4},turn:{fontWeight:'900',fontSize:14,color:'#2b2146',flexShrink:1},status:{fontSize:12,fontWeight:'800',color:'#0f9d7a',textAlign:'right',flexShrink:1},sceneWrap:{height:320,position:'relative',borderRadius:6,overflow:'hidden',borderWidth:2,borderColor:'#2b214624',backgroundColor:'#9fe6ff'},warn:{borderColor:'#ff3b3b'},mood:{position:'absolute',top:7,left:10,fontSize:32},controls:{flexDirection:'column',gap:10,marginVertical:10},controlsWide:{flexDirection:'row'},box:{flex:1,borderWidth:1,borderColor:'#2b214624',borderRadius:6,padding:10,backgroundColor:'#f4f0ff'},diceRow:{flexDirection:'row',alignItems:'center',gap:10},diceCopy:{flex:1},diceText:{fontWeight:'800',fontSize:14,color:'#2b2146'},hint:{fontSize:12,color:'#5b5380',flexShrink:1},meter:{height:14,backgroundColor:'#2b214624',borderRadius:3,overflow:'hidden'},fill:{height:'100%',backgroundColor:'#e8368a'},statRow:{flexDirection:'row',justifyContent:'space-between',gap:6,marginTop:6,flexWrap:'wrap'},stat:{fontSize:12,fontWeight:'800',color:'#2b2146'},actionRow:{flexDirection:'row',gap:10,marginBottom:10},primaryButton:{flex:1,backgroundColor:'#e8368a',borderColor:'#e8368a',minHeight:48},actionButton:{flex:1,minHeight:48},message:{minHeight:44,padding:10,borderLeftWidth:5,borderLeftColor:'#e8368a',backgroundColor:'#f4f0ff',fontWeight:'800',fontSize:14,color:'#2b2146',marginBottom:10,overflow:'hidden'},rules:{color:'#5b5380',fontSize:13,lineHeight:19,marginTop:10},rulesStrong:{fontWeight:'900'}
});




