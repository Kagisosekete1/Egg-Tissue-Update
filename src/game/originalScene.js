import * as THREE from 'three';
// Generated from the original HTML. Keep the original mesh/particle/animation
// source intact; React Native supplies the clock, input, camera and audio.
export function createOriginalScene(){
const S=new THREE.Group();
S.add(new THREE.HemisphereLight(0xffffff,0x9a8fd0,.85));
const dl=new THREE.DirectionalLight(0xfff1cc,.8*Math.PI);dl.position.set(4,8,5);S.add(dl);
let stateDanger=0,gameOver=false,moodIdx=0,cam,onImpact=()=>{};
const danger=()=>stateDanger;
const cameraX=.7;
const M=c=>new THREE.MeshStandardMaterial({color:c,flatShading:true,roughness:.95,metalness:0});
const mk=(g,c,x,y,z,p)=>{const m=new THREE.Mesh(g,M(c));m.position.set(x,y,z);(p||S).add(m);return m};

mk(new THREE.BoxGeometry(15,.6,5.5),0xc9854c,0,-.3,0);
mk(new THREE.BoxGeometry(15.2,.14,5.7),0xf0c78d,0,.02,0);
mk(new THREE.PlaneGeometry(80,40),0x8f86d8,0,-.62,-4).rotation.x=-Math.PI/2;
[[-9,2.6,0x7a6fd0,-9],[-3,3.4,0x5fc4b0,-11],[5,3,0xb48ae6,-10],[11,2.4,0x6bb8e8,-9]].forEach(h=>mk(new THREE.ConeGeometry(h[1]*1.5,h[1]*2,5),h[2],h[0],h[1]-.6,h[3]));
const sun=mk(new THREE.IcosahedronGeometry(1,0),0xffe58c,6,7,-12);sun.material=new THREE.MeshBasicMaterial({color:0xffe58c});
const clouds=[[-6,7,-8],[3,8.2,-10],[9,6.2,-9]].map(p=>{const g=new THREE.Group();g.position.set(...p);S.add(g);
 [[0,0,.9],[.9,.15,.7],[-.9,-.05,.65]].forEach(c=>{const m=mk(new THREE.IcosahedronGeometry(c[2],0),0xffffff,c[0],c[1],0,g);m.material.emissive=new THREE.Color(0x667788)});return g});
[-2.7,2.7].forEach(x=>{mk(new THREE.CylinderGeometry(.55,.7,2.95,6),0xdfe9f5,x,1.475,0);mk(new THREE.CylinderGeometry(.62,.55,.12,6),0xb5c4d6,x,2.94,0)});

const tg=new THREE.PlaneGeometry(5.4,1.8,10,2);tg.rotateX(-Math.PI/2);
const tp=tg.attributes.position,base=Array.from(tp.array);
const tMat=new THREE.MeshStandardMaterial({color:0xffffff,flatShading:true,roughness:1,side:THREE.DoubleSide,transparent:true});
const tissue=new THREE.Mesh(tg,tMat);tissue.position.y=3;S.add(tissue);
function shape(s){for(let i=0;i<tp.count;i++){const x=base[i*3];tp.setY(i,-s*(1-(x/2.7)**2)+(i%3===1?.02*Math.sin(i):0)-tear*2.6*Math.max(0,1-Math.abs(x)/.9))}tp.needsUpdate=true}

const eggG=new THREE.Group();S.add(eggG);
const eggM=mk(new THREE.SphereGeometry(.45,8,6),0xfff0c8,0,0,0,eggG);eggM.scale.set(1,1.3,1);
const eyes=[-.16,.16].map(x=>mk(new THREE.IcosahedronGeometry(.07,0),0x4a3a58,x,.05,.42,eggG));const mouth=mk(new THREE.TorusGeometry(.1,.03,4,8,Math.PI),0x4a3a58,0,-.12,.44,eggG);mouth.rotation.z=Math.PI;
mk(new THREE.IcosahedronGeometry(.09,0),0xffffff,-.2,.3,.3,eggG);

const hand=new THREE.Group();hand.position.set(4.7,3.9,.7);hand.rotation.y=-.25;S.add(hand);
mk(new THREE.BoxGeometry(1.8,.4,.45),0xffc9a0,1.1,-.1,0,hand);
mk(new THREE.BoxGeometry(.6,.6,.6),0xffb88a,.1,-.05,0,hand);
mk(new THREE.BoxGeometry(.5,.9,.45),0x2fc6c0,-.2,.3,0,hand);
const head=mk(new THREE.BoxGeometry(.55,.22,.3),0xff5ca8,-.2,.84,0,hand);
mk(new THREE.ConeGeometry(.1,.4,5),0xff5ca8,-.55,.84,0,hand).rotation.z=Math.PI/2;

const pG=new THREE.TetrahedronGeometry(.12),pMat=new THREE.MeshBasicMaterial({color:0x39bfff});
const parts=[];for(let i=0;i<40;i++){const m=new THREE.Mesh(pG,pMat);m.visible=false;S.add(m);parts.push({m,v:new THREE.Vector3(),life:0})}
function spray(){hand.updateMatrixWorld(true);const o=new THREE.Vector3(-.75,.84,0);hand.localToWorld(o);const tgt=new THREE.Vector3(0,3.1,0);
 parts.slice(0,24).forEach(p=>{p.m.position.copy(o);p.v.copy(tgt).sub(o).normalize().multiplyScalar(5+Math.random()*2).add(new THREE.Vector3((Math.random()-.5)*.8,(Math.random()-.3)*1.2,(Math.random()-.5)*1.4));p.life=.65;p.m.visible=true});parts.push(parts.shift());kick=1;wetAt=t+.9}

const splat=new THREE.Group();splat.visible=false;S.add(splat);
const white=mk(new THREE.IcosahedronGeometry(1,0),0xfdf6e3,0,.1,0,splat);white.scale.set(1.2,.08,1);
const yolk=mk(new THREE.IcosahedronGeometry(.5,0),0xffc933,0,.14,0,splat);yolk.scale.set(1,.3,1);
const shards=[];for(let i=0;i<9;i++){const m=mk(new THREE.TetrahedronGeometry(.16),0xfff0c8,0,-9,0);shards.push({m,v:new THREE.Vector3()})}

const dG=new THREE.IcosahedronGeometry(.08,0),dMat=new THREE.MeshBasicMaterial({color:0x39bfff});
const drips=[];for(let i=0;i<10;i++){const m=new THREE.Mesh(dG,dMat);m.scale.y=1.6;m.visible=false;S.add(m);drips.push({m,v:0})}
let wetAt=0,dripT=1,tear=0,baseZ=9.5;
let timeScale=1,tgtSag=0,curSag=0,kick=0,falling=false,vy=0,shake=0,t=0,fallStyle='wobble',fallElapsed=0;
const fallStars=[];for(let i=0;i<4;i++){const star=mk(new THREE.IcosahedronGeometry(.12,0),0xffd84a,0,0,0);star.visible=false;fallStars.push(star)}
const conf=[];for(let i=0;i<30;i++){const m=new THREE.Mesh(new THREE.TetrahedronGeometry(.1),new THREE.MeshBasicMaterial({color:[0xff5ca8,0xffd65a,0x6ce7c4,0x6bb8e8,0xb48ae6][i%5]}));m.visible=false;S.add(m);conf.push({m,v:new THREE.Vector3()})}
function confetti(){conf.forEach(c=>{c.m.position.set(0,1.2,.3);c.v.set((Math.random()-.5)*7,4+Math.random()*5,(Math.random()-.5)*4);c.m.visible=true})}
function animate(delta){const dt=Math.min(.05,delta)*timeScale;t+=dt;
 curSag+=(tgtSag-curSag)*Math.min(1,dt*5);shape(curSag);
 sun.rotation.y=t*.3;clouds.forEach(c=>{c.position.x+=dt*.25;if(c.position.x>13)c.position.x=-13});
 if(!falling){const amp=danger()>.3?(.02+.1*danger()**2):0;eggG.position.set(0,3-curSag+.6+(danger()<.4?Math.abs(Math.sin(t*3))*.04:0),0);
  eggG.rotation.set(0,0,0);eggG.position.x=Math.sin(t*28)*amp*.4}
 else{
  fallElapsed+=dt;vy-=16*dt;eggG.position.y+=vy*dt;
  if(fallStyle==='spin'){eggG.rotation.x+=dt*4;eggG.rotation.z+=dt*9}
  else if(fallStyle==='bounce'){eggG.rotation.z=Math.sin(fallElapsed*11)*.16;}
  else if(fallStyle==='confetti'){eggG.rotation.y+=dt*2.5;eggG.rotation.z+=dt*3.5;}
  else if(fallStyle==='dizzy'){
   eggG.rotation.x=Math.sin(fallElapsed*13)*.45;eggG.rotation.y+=dt*7;eggG.rotation.z+=dt*6;
   fallStars.forEach((star,i)=>{const a=fallElapsed*9+i*Math.PI/2;star.visible=true;star.position.set(eggG.position.x+Math.cos(a)*.8,eggG.position.y+.5+Math.sin(a)*.65,eggG.position.z+.45);star.rotation.z+=dt*5});
  }else eggG.rotation.z=Math.sin(fallElapsed*18)*.24+fallElapsed*2.5;
  if(eggG.position.y<.6)crash()
 }
 kick=Math.max(0,kick-dt*3);{const bl=(t%3.2)<.12?.1:1;eyes.forEach(e=>e.scale.y=bl*(moodIdx>=2?1.7:1))}hand.position.x=4.7-kick*.5;hand.position.y=3.9+Math.sin(t*2)*.05;head.position.y=.84-kick*.1;
 if(gameOver)tear=Math.min(1,tear+dt*2.5);
 if(!gameOver&&danger()>.2&&t>wetAt){dripT-=dt;if(dripT<=0){dripT=2.4-danger()*1.5+Math.random()*.8;const d=drips.find(d=>!d.m.visible);if(d){const x=(Math.random()-.5)*3.4;d.m.position.set(x,3-curSag*(1-(x/2.7)**2)-.05,(Math.random()-.5)*1.2);d.m.visible=true;d.v=0}}}
 conf.forEach(c=>{if(c.m.visible){c.v.y-=7*dt;c.m.position.addScaledVector(c.v,dt);c.m.rotation.x+=dt*6;c.m.rotation.y+=dt*5;if(c.m.position.y<.1)c.m.visible=false}});
 drips.forEach(d=>{if(d.m.visible){d.v-=9*dt;d.m.position.y+=d.v*dt;if(d.m.position.y<.1)d.m.visible=false}});
 parts.forEach(p=>{if(p.life>0){p.life-=dt;p.v.y-=4*dt;p.m.position.addScaledVector(p.v,dt);if(p.life<=0)p.m.visible=false}});
 shards.forEach(s=>{if(s.m.position.y>.1){s.v.y-=16*dt;s.m.position.addScaledVector(s.v,dt);s.m.rotation.x+=dt*8;if(s.m.position.y<=.1)s.m.position.y=.1}});
 shake=Math.max(danger()>.85&&!gameOver?.25:0,shake-dt*2);cam.position.x=cameraX+(Math.random()-.5)*shake*.35+Math.sin(t*.5)*.25;cam.position.z=baseZ-Math.min(1,danger())*.8;
 }

function crash(){confetti();timeScale=1;falling=false;eggG.visible=false;fallStars.forEach(star=>star.visible=false);splat.visible=true;shake=1;onImpact();
 shards.forEach(s=>{s.m.position.set(0,.3,0);s.v.set((Math.random()-.5)*5,2+Math.random()*3,(Math.random()-.5)*3)})}
function reset(){gameOver=false;falling=false;vy=0;timeScale=1;tear=0;curSag=0;tgtSag=0;kick=0;shake=0;fallElapsed=0;fallStyle='wobble';wetAt=t;dripT=1;eggG.visible=true;eggG.rotation.set(0,0,0);eggG.position.set(0,3.6,0);splat.visible=false;fallStars.forEach(star=>star.visible=false);shards.forEach(s=>s.m.position.y=-9);parts.forEach(p=>{p.life=0;p.m.visible=false});drips.forEach(p=>p.m.visible=false);conf.forEach(p=>p.m.visible=false)}
function fitCamera(camera,aspect){cam=camera;cam.fov=40;baseZ=Math.max(9.5,10.5/(2*Math.tan(20*Math.PI/180)*aspect));cam.position.set(cameraX,3.4,baseZ);cam.lookAt(cameraX,1.9,0);cam.updateProjectionMatrix()}
function frame(delta,nextDanger,isOver,camera,impact,nextFallStyle){cam=camera;onImpact=impact;stateDanger=nextDanger;
 if(isOver&&!gameOver){falling=true;vy=nextFallStyle==='bounce'?4:0;fallElapsed=0;fallStyle=nextFallStyle||'wobble';timeScale=.35}gameOver=isOver;
 tgtSag=gameOver?1.8:Math.min(1.15,danger()*1.15);const w=Math.min(1,danger());tMat.color.setRGB(1-w*.38,1-w*.2,1-w*.04);tMat.opacity=gameOver?.4:1-w*.15;
 moodIdx=gameOver?3:danger()>.85?2:danger()>.55?1:0;mouth.rotation.z=moodIdx===0?Math.PI:0;mouth.scale.set(moodIdx>=2?1.2:1,moodIdx>=2?1.8:1,1);mouth.position.y=moodIdx===0?-.12:-.2;
 animate(delta);tg.computeVertexNormals()}
reset();return {group:S,reset,spray,frame,fitCamera,dispose(){const gs=new Set(),ms=new Set();S.traverse(o=>{if(o.geometry)gs.add(o.geometry);if(o.material)ms.add(o.material)});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose())}};
}
