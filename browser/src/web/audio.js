export const MUSIC_TRACKS=[1,2,3].map(n=>`audio/game-music/egg-tissue-track-${n}.mp3`);
export const SOUND_FILES={roll:'original-roll.wav',spray:'original-spray.wav',crash:'original-crash.wav',splat:'original-crash.wav',scream:'wilhelm-scream.ogg',fall:'original-fall.wav',win:'original-win.wav',lose:'original-lose.wav',heartbeat:'original-heartbeat.wav',danger:'original-danger.wav',mood0:'original-mood0.wav',mood1:'original-mood1.wav',mood2:'original-mood2.wav'};

/** Original asset playback, with a single music player and bounded SFX pools. */
export class GameAudio {
 constructor({createAudio=src=>new Audio(src),random=Math.random}={}){this.createAudio=createAudio;this.random=random;this.enabled=true;this.musicEnabled=true;this.active=false;this.paused=false;this.over=false;this.visible=true;this.unlocked=false;this.music=null;this.track=-1;this.effects=new Map();}
 allowed(){return this.enabled&&this.active&&!this.paused&&this.visible&&this.unlocked;}
 safePlay(player){try{const attempt=player.play();if(attempt?.catch)attempt.catch(()=>{});}catch{/* Autoplay/device audio errors must not interrupt the game. */}}
 pause(player,reset=false){try{player.pause();if(reset)player.currentTime=0;}catch{/* Optional audio. */}}
 unlock(){this.unlocked=true;this.syncMusic();}
 setEnabled(value){this.enabled=!!value;if(!this.enabled)this.stopEffects();this.syncMusic();}
 setMusicEnabled(value){this.musicEnabled=!!value;this.syncMusic();}
 setContext({paused=this.paused,over=this.over,visible=this.visible}={}){this.paused=paused;this.over=over;this.visible=visible;if(!this.allowed())this.stopEffects();this.syncMusic();}
 startRound(){this.active=true;this.over=false;this.paused=false;if(this.music)this.pause(this.music,true);let next=Math.floor(this.random()*MUSIC_TRACKS.length);if(next===this.track)next=(next+1+Math.floor(this.random()*(MUSIC_TRACKS.length-1)))%MUSIC_TRACKS.length;this.track=next;this.music=null;this.syncMusic();}
 ensureRound(){if(!this.active)this.startRound();}
 syncMusic(){if(!this.allowed()||!this.musicEnabled||this.over){if(this.music)this.pause(this.music);return;}try{if(!this.music){if(this.track<0)this.track=0;this.music=this.createAudio(MUSIC_TRACKS[this.track]);this.music.loop=true;this.music.volume=.13;this.music.preload='none';}if(this.music.paused!==false)this.safePlay(this.music);}catch{/* Music is optional. */}}
 play(name){if(!this.allowed()||!SOUND_FILES[name])return;try{let pool=this.effects.get(name);if(!pool){pool=[];this.effects.set(name,pool);}let player=pool.find(p=>p.paused||p.ended);if(!player&&pool.length<2){player=this.createAudio('audio/'+SOUND_FILES[name]);player.preload='auto';player.volume=name==='heartbeat'?.48:.65;if(name==='scream'){let fallback=false;player.addEventListener?.('error',()=>{if(fallback)return;fallback=true;player.src='audio/original-fall.wav';if(this.allowed())this.safePlay(player);});}pool.push(player);}player??=pool[0];this.pause(player,true);this.safePlay(player);}catch{/* Missing/unsupported media must not block gameplay. */}}
 stopEffects(){for(const pool of this.effects.values())for(const player of pool)this.pause(player,true);}
 stop(){this.active=false;this.stopEffects();if(this.music)this.pause(this.music,true);}
}
export const gameAudio=new GameAudio();
