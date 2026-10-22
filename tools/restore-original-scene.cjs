const fs = require('fs');
const path = require('path');
const source = fs.readFileSync(process.argv[2] || 'C:/Users/MoFunk/Desktop/Muvit/Egg Game/Egg & Wet Tissue Challenge_ Low-Poly.html', 'utf8');
const between = (a, b) => source.slice(source.indexOf(a), source.indexOf(b, source.indexOf(a)));
const geometry = between('const M=c=>', 'function onResize(){').replace('function spray(){', 'function spray(){hand.updateMatrixWorld(true);');
const confetti = between('const conf=[];', 'function beat(){');
const loop = between('function loop(){', 'function crash(){')
  .replace('function loop(){requestAnimationFrame(loop);const dt=Math.min(.05,clock.getDelta())', 'function animate(delta){const dt=Math.min(.05,delta)')
  .replace('cam.position.x=(Math.random()', 'cam.position.x=cameraX+(Math.random()')
  .replace('R.render(S,cam)', '');
const prelude = `import * as THREE from 'three';
// Generated from the original HTML. Keep the original mesh/particle/animation
// source intact; React Native supplies the clock, input, camera and audio.
export function createOriginalScene(){
const S=new THREE.Group();
S.add(new THREE.HemisphereLight(0xffffff,0x9a8fd0,.85));
const dl=new THREE.DirectionalLight(0xfff1cc,.8*Math.PI);dl.position.set(4,8,5);S.add(dl);
let stateDanger=0,gameOver=false,moodIdx=0,cam,onImpact=()=>{};
const danger=()=>stateDanger;
const cameraX=.7;
`;
const controls = `
function crash(){confetti();timeScale=1;falling=false;eggG.visible=false;splat.visible=true;shake=1;onImpact();
 shards.forEach(s=>{s.m.position.set(0,.3,0);s.v.set((Math.random()-.5)*5,2+Math.random()*3,(Math.random()-.5)*3)})}
function reset(){gameOver=false;falling=false;vy=0;timeScale=1;tear=0;curSag=0;tgtSag=0;kick=0;shake=0;wetAt=t;dripT=1;eggG.visible=true;eggG.rotation.set(0,0,0);eggG.position.set(0,3.6,0);splat.visible=false;shards.forEach(s=>s.m.position.y=-9);parts.forEach(p=>{p.life=0;p.m.visible=false});drips.forEach(p=>p.m.visible=false);conf.forEach(p=>p.m.visible=false)}
function fitCamera(camera,aspect){cam=camera;cam.fov=40;baseZ=Math.max(9.5,10.5/(2*Math.tan(20*Math.PI/180)*aspect));cam.position.set(cameraX,3.4,baseZ);cam.lookAt(cameraX,1.9,0);cam.updateProjectionMatrix()}
function frame(delta,nextDanger,isOver,camera,impact){cam=camera;onImpact=impact;stateDanger=nextDanger;
 if(isOver&&!gameOver){falling=true;vy=0;timeScale=.35}gameOver=isOver;
 tgtSag=gameOver?1.8:Math.min(1.15,danger()*1.15);const w=Math.min(1,danger());tMat.color.setRGB(1-w*.38,1-w*.2,1-w*.04);tMat.opacity=gameOver?.4:1-w*.15;
 moodIdx=gameOver?3:danger()>.85?2:danger()>.55?1:0;mouth.rotation.z=moodIdx===0?Math.PI:0;mouth.scale.set(moodIdx>=2?1.2:1,moodIdx>=2?1.8:1,1);mouth.position.y=moodIdx===0?-.12:-.2;
 animate(delta);tg.computeVertexNormals()}
reset();return {group:S,reset,spray,frame,fitCamera,dispose(){const gs=new Set(),ms=new Set();S.traverse(o=>{if(o.geometry)gs.add(o.geometry);if(o.material)ms.add(o.material)});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose())}};
}
`;
const destination = path.join(__dirname, '../src/game/originalScene.js');
fs.mkdirSync(path.dirname(destination), { recursive: true });
fs.writeFileSync(destination, prelude + geometry + confetti + loop + controls);
console.log('Restored original Three.js scene source:', destination);
