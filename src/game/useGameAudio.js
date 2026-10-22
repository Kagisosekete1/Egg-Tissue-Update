import { useCallback, useEffect, useMemo, useRef } from 'react';
import * as Speech from 'expo-speech';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';

export function useGameAudio(enabled, active, gameOver) {
  const roll=useAudioPlayer(require('../../assets/original-roll.wav')),spray=useAudioPlayer(require('../../assets/original-spray.wav')),crash=useAudioPlayer(require('../../assets/original-crash.wav')),scream=useAudioPlayer(require('../../assets/wilhelm-scream.ogg')),win=useAudioPlayer(require('../../assets/original-win.wav')),lose=useAudioPlayer(require('../../assets/original-lose.wav')),heartbeat=useAudioPlayer(require('../../assets/original-heartbeat.wav')),danger=useAudioPlayer(require('../../assets/original-danger.wav')),mood0=useAudioPlayer(require('../../assets/original-mood0.wav')),mood1=useAudioPlayer(require('../../assets/original-mood1.wav')),mood2=useAudioPlayer(require('../../assets/original-mood2.wav'));
  const music1=useAudioPlayer(require('../../assets/game-music/egg-tissue-track-1.mp3'));
  const music2=useAudioPlayer(require('../../assets/game-music/egg-tissue-track-2.mp3'));
  const music3=useAudioPlayer(require('../../assets/game-music/egg-tissue-track-3.mp3'));
  const players=useMemo(()=>({roll,spray,crash,scream,win,lose,heartbeat,danger,mood0,mood1,mood2}),[roll,spray,crash,scream,win,lose,heartbeat,danger,mood0,mood1,mood2]);
  const musicPlayers=useMemo(()=>[music1,music2,music3],[music1,music2,music3]);
  const started=useRef(false),selectedTrack=useRef(-1);
  const audioState=useRef({enabled,active,gameOver});
  useEffect(()=>{audioState.current={enabled,active,gameOver};},[enabled,active,gameOver]);

  useEffect(()=>{
    setAudioModeAsync({playsInSilentMode:true,shouldPlayInBackground:false}).catch(()=>{});
    musicPlayers.forEach(player=>{player.loop=true;player.volume=.13;});
  },[musicPlayers]);

  const startMusic=useCallback(()=>{
    const state=audioState.current;
    if(!state.enabled||!state.active||state.gameOver)return;
    let index=Math.floor(Math.random()*musicPlayers.length);
    if(index===selectedTrack.current)index=(index+1+Math.floor(Math.random()*(musicPlayers.length-1)))%musicPlayers.length;
    selectedTrack.current=index;
    musicPlayers.forEach((player,i)=>{
      player.pause();
      if(i===index){const seeking=player.seekTo(0);player.play();seeking.catch(()=>{});}
    });
  },[musicPlayers]);

  useEffect(()=>{
    if(gameOver){
      musicPlayers.forEach(player=>player.pause());
      started.current=false;
      Speech.stop().catch(()=>{});
      return;
    }
    if(!enabled||!active){
      musicPlayers.forEach(player=>player.pause());
      Object.values(players).forEach(player=>player.pause());
      Speech.stop().catch(()=>{});
      return;
    }
    if(started.current&&selectedTrack.current>=0)musicPlayers[selectedTrack.current].play();
  },[enabled,active,gameOver,musicPlayers,players]);

  const startGame=useCallback(()=>{
    if(!enabled||!active||gameOver||started.current)return;
    started.current=true;
    // Start the instrumental immediately when Play opens.
    startMusic();
  },[enabled,active,gameOver,startMusic]);

  const play=useCallback((name)=>{
    if(!enabled||!active)return;
    const player=players[name];
    if(player)player.seekTo(0).then(()=>player.play()).catch(()=>{});
  },[enabled,active,players]);

  return useMemo(()=>({play,startGame}),[play,startGame]);
}
