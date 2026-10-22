import React, {useEffect,useMemo,useRef} from 'react';
import {Canvas,useFrame} from '@react-three/fiber/native';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
function DiceModel({ face, rolling }) {
  const ref = useRef(null);
  const dieGeometry = useMemo(() => new RoundedBoxGeometry(1.12, 1.12, 1.12, 4, .13), []);
  const target = useRef({ x: 0, y: 0 });
  useEffect(() => {
    if (!rolling && ref.current) {
      // The camera looks squarely at the +Z face. Keep the rolled value on that face.
      const orientations = [
        [0, 0], [0, Math.PI], [0, -Math.PI / 2], [0, Math.PI / 2], [Math.PI / 2, 0], [-Math.PI / 2, 0],
      ];
      target.current = { x: orientations[face - 1]?.[0] ?? 0, y: orientations[face - 1]?.[1] ?? 0 };
      ref.current.rotation.set(target.current.x, target.current.y, 0);
    }
  }, [face, rolling]);
  useFrame((_, dt) => {
    if (!ref.current) return;
    if (rolling) {
      ref.current.rotation.x += dt * 5.2;
      ref.current.rotation.y += dt * 6.4;
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
export default function DicePreview({ face, rolling }) {
  return <Canvas frameloop={rolling ? 'always' : 'demand'} camera={{ position: [0, 0, 4.8], fov: 35, near: .1, far: 30 }} gl={{ alpha: true, antialias: false, powerPreference: 'high-performance' }} onCreated={({ gl }) => { gl.setClearColor(0x000000, 0); }} style={{ width: 78, height: 78, backgroundColor: 'transparent' }}>
    <ambientLight intensity={1.4} /><directionalLight position={[3, 4, 5]} intensity={2.1} /><DiceModel face={face} rolling={rolling} />
  </Canvas>;
}


