import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber/native';
import { createOriginalScene } from './src/game/originalScene';

function OriginalWorld({ danger, sprayToken, falling, fallVariant, resetToken, paused, onImpact }) {
  const { camera, size } = useThree();
  const world = useMemo(() => createOriginalScene(), []);
  const previousSpray = useRef(sprayToken), impactCallback = useRef(onImpact);
  useEffect(() => { impactCallback.current = onImpact; }, [onImpact]);
  useEffect(() => { world.reset(); }, [world, resetToken]);
  useEffect(() => { if (previousSpray.current !== sprayToken) { previousSpray.current = sprayToken; world.spray(); } }, [world, sprayToken]);
  useEffect(() => { world.fitCamera(camera, size.width / Math.max(1, size.height)); }, [world, camera, size.width, size.height]);
  useEffect(() => () => world.dispose(), [world]);
  useFrame((_, dt) => { if (!paused) world.frame(dt, danger, falling, camera, () => impactCallback.current?.(), fallVariant); });
  return <primitive object={world.group} />;
}

export default function GameScene(props) {
  return <Canvas flat frameloop={props.paused ? 'demand' : 'always'} camera={{ position: [0, 3.4, 9.5], fov: 40, near: .1, far: 100 }} gl={{ antialias: false, powerPreference: 'high-performance' }} onCreated={({ gl, scene }) => {
    gl.toneMapping = THREE.NoToneMapping;
    scene.background = new THREE.Color(0x9fe6ff);
    scene.fog = new THREE.Fog(0x9fe6ff, 18, 42);
  }}><OriginalWorld {...props} /></Canvas>;
}

