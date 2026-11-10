import assert from 'node:assert/strict';
import fs from 'node:fs';
import {GameAudio,MUSIC_TRACKS,SOUND_FILES} from '../src/web/audio.js';
import {SPRAYER,sprayerNozzle,sprayDrops,tissueTopAt} from '../src/native/cartoon/layout.js';
class FakeAudio {
 constructor(src){this.src=src;this.paused=true;this.ended=false;this.currentTime=0;this.plays=0;this.handlers={};}
 play(){this.paused=false;this.plays++;return Promise.resolve();}
 pause(){this.paused=true;}
 addEventListener(name,handler){this.handlers[name]=handler;}
}
const made=[],engine=new GameAudio({createAudio:src=>{const a=new FakeAudio(src);made.push(a);return a;},random:()=>.5});
engine.startRound();assert.equal(made.length,0,'audio loaded before user gesture');engine.unlock();assert.equal(made.length,2);const first=engine.music;assert(MUSIC_TRACKS.includes(first.src));assert.equal(MUSIC_TRACKS.length,12);assert.equal(first.loop,false);assert.equal(first.volume,.13);first.currentTime=21;
for(let i=0;i<12;i++)engine.play('spray');assert.equal(engine.effects.get('spray').length,2,'unbounded voices');assert(made.some(a=>a.src==='audio/original-spray.wav'));
engine.setContext({paused:true});assert(first.paused);assert.equal(first.currentTime,21,'pause restarted music');const n=made.length;engine.play('roll');assert.equal(made.length,n);engine.setContext({paused:false});assert(!first.paused);assert.equal(first.currentTime,21);
engine.setEnabled(false);assert(first.paused);assert(engine.effects.get('spray').every(a=>a.paused));engine.setEnabled(true);assert(!first.paused);engine.setMusicEnabled(false);assert(first.paused);engine.play('roll');assert(made.some(a=>a.src==='audio/original-roll.wav'));
engine.setMusicEnabled(true);engine.setContext({visible:false});assert(first.paused);engine.setContext({visible:true});assert(!first.paused);engine.setContext({over:true});assert(first.paused);engine.play('win');assert(made.some(a=>a.src==='audio/original-win.wav'&&!a.paused));
const oldTrack=engine.track;engine.startRound();assert.notEqual(engine.track,oldTrack,'same consecutive song');assert(first.paused);engine.stop();assert(engine.music.paused);assert(made.every(a=>a.paused));
const rejected=new GameAudio({createAudio:src=>({...new FakeAudio(src),play(){return Promise.reject(new Error('Autoplay blocked'));},pause(){}})});rejected.startRound();rejected.unlock();rejected.play('roll');await new Promise(r=>setTimeout(r,0));rejected.stop();
for(const file of new Set([...Object.values(SOUND_FILES),'original-music.wav']))assert(fs.statSync('assets/audio/'+file).size>0,`missing ${file}`);
for(const file of MUSIC_TRACKS)assert(fs.statSync('assets/'+file).size>0);
const nozzle=sprayerNozzle();assert(SPRAYER.x>800&&SPRAYER.y<650);assert(nozzle.x>700&&nozzle.y<600);assert(nozzle.x<SPRAYER.x,'nozzle points away from tissue');
let landed=0;for(let age=0;age<.8;age+=.005){const drops=sprayDrops(age,80);assert(drops.length<=24);for(const d of drops){assert(d.x<=nozzle.x+1);assert(d.y>=nozzle.y-1);if(d.y>tissueTopAt(d.x,80))landed++;}}
assert(landed>0,'no water reaches tissue');assert(sprayDrops(.2,50,true).length<=8);
console.log('PASS: original audio files, gesture unlock, one music player/nonrepeating songs, bounded SFX, pause/mute/background/result/exit, autoplay rejection, upper-right nozzle and water hitting tissue.');

const streamMade=[],stream=new GameAudio({createAudio:src=>{const p=new FakeAudio(src);streamMade.push(p);return p;},random:()=>.5});stream.startRound();stream.unlock();const heard=new Set();for(let i=0;i<12;i++){heard.add(stream.track);const finished=stream.music;finished.paused=true;finished.onended();assert.notEqual(stream.music,finished);assert.equal(stream.music.volume,.13);assert(!stream.music.paused);}assert.equal(heard.size,12,'shuffle repeated before all tracks played');stream.setContext({paused:true});const atPause=stream.music;atPause.onended();assert.equal(stream.music,atPause,'song advanced while paused');stream.setContext({paused:false});assert.notEqual(stream.music,atPause,'ended song did not advance on resume');stream.stop();console.log('PASS: 12-song shuffle bag, preloaded next song, automatic end-to-next playback and pause-safe advancement.');
