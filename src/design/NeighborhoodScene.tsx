import { Component, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function Building({ x, z, h, w = 0.52, color = '#c6d0ba' }: { x: number; z: number; h: number; w?: number; color?: string }) {
  return <group position={[x, 0, z]}><mesh castShadow receiveShadow position={[0, h / 2, 0]}><boxGeometry args={[w, h, w * 0.8]} /><meshStandardMaterial color={color} roughness={0.85} /></mesh><mesh castShadow position={[0, h + 0.025, 0]}><boxGeometry args={[w + 0.025, 0.05, w * 0.8 + 0.025]} /><meshStandardMaterial color="#e6e8d9" /></mesh>{[0.28, 0.53, 0.78].filter(v => v < h).map(y => <group key={y}>{[-0.13, 0.13].map(tx => <mesh key={tx} position={[tx, y, w * 0.4 + 0.003]}><planeGeometry args={[0.095, 0.11]} /><meshStandardMaterial color="#698c7c" /></mesh>)}</group>)}</group>;
}
function Tree({ x, z, scale = 1 }: { x: number; z: number; scale?: number }) {
  return <group position={[x, 0, z]} scale={scale}><mesh position={[0, 0.17, 0]}><cylinderGeometry args={[0.022, 0.025, 0.34, 6]} /><meshStandardMaterial color="#8c7854" /></mesh><mesh castShadow position={[0, 0.42, 0]}><icosahedronGeometry args={[0.22, 1]} /><meshStandardMaterial color="#6f9165" flatShading /></mesh></group>;
}
function Neighborhood({ paused }: { paused: boolean }) {
  const model = useRef<THREE.Group>(null);
  const marker = useRef<THREE.Group>(null);
  useFrame(({ clock, pointer }) => {
    if (!model.current) return;
    model.current.rotation.y = THREE.MathUtils.lerp(model.current.rotation.y, -0.16 + (paused ? 0 : pointer.x * 0.09), 0.04);
    if (marker.current) marker.current.position.y = 1.65 + (paused ? 0 : Math.sin(clock.elapsedTime * 1.8) * 0.045);
  });
  return <group ref={model} rotation={[0, -0.16, 0]}>
    <mesh receiveShadow position={[0, -0.14, 0]}><boxGeometry args={[5.8, 0.26, 4.7]} /><meshStandardMaterial color="#cbdbc5" /></mesh>
    <mesh position={[0, -0.3, 0]}><boxGeometry args={[5.55, 0.08, 4.48]} /><meshStandardMaterial color="#acbfa4" /></mesh>
    {[-1.15, 1.05].map(z => <group key={z}><mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, z]}><planeGeometry args={[5.8, 0.5]} /><meshStandardMaterial color="#f3f1e6" /></mesh>{[-2.5, -1.8, -1.1, -0.4, 0.3, 1, 1.7, 2.4].map(x => <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.012, z]}><planeGeometry args={[0.27, 0.018]} /><meshBasicMaterial color="#c1c5b6" /></mesh>)}</group>)}
    {[-1.25, 1.35].map(x => <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.008, 0]}><planeGeometry args={[0.46, 4.7]} /><meshStandardMaterial color="#f3f1e6" /></mesh>)}
    <mesh position={[0, 0.025, 0]}><boxGeometry args={[1.72, 0.04, 1.35]} /><meshStandardMaterial color="#bacdb0" /></mesh>
    <group position={[-0.1, 0, -0.05]}><Building x={0} z={0} h={0.64} w={0.92} color="#faf4dd" /><mesh position={[0, 0.33, 0.374]}><boxGeometry args={[0.67, 0.4, 0.018]} /><meshStandardMaterial color="#315d47" /></mesh><mesh castShadow rotation={[0.25, 0, 0]} position={[0, 0.59, 0.48]}><boxGeometry args={[1.04, 0.075, 0.34]} /><meshStandardMaterial color="#216344" /></mesh>{[-0.38, -0.13, 0.13, 0.38].map(x => <mesh key={x} position={[x, 0.62, 0.49]} rotation={[0.25, 0, 0]}><boxGeometry args={[0.1, 0.03, 0.34]} /><meshStandardMaterial color="#dde4c2" /></mesh>)}</group>
    {[[-2.15, -1.8, 0.7], [-0.45, -1.9, 1], [0.48, -1.85, 0.65], [2.2, -1.8, 1.2], [-2.1, 0, 0.87], [2.1, 0.0, 0.7], [-2.15, 1.8, 0.55], [-0.55, 1.8, 0.62], [0.45, 1.8, 0.95], [2.1, 1.8, 0.8]].map(([x,z,h], i) => <Building key={i} x={x} z={z} h={h} color={['#c2c9b5','#e3d6bc','#b8c8b9'][i % 3]} />)}
    {[[-2.65,-0.5],[-2.65,0.45],[-0.77,-0.55],[0.64,-0.6],[0.7,0.45],[-0.75,0.5],[2.68,-0.65],[2.65,0.6],[-1.65,2.1],[1.68,2.05],[1.75,-2.1]].map(([x,z], i) => <Tree key={i} x={x} z={z} scale={0.7 + i % 3 * 0.13} />)}
    <group ref={marker} position={[0, 1.65, 0]} rotation={[0, 0.55, 0]}><mesh castShadow><sphereGeometry args={[0.26, 32, 24]} /><meshStandardMaterial color="#195b40" roughness={0.25} metalness={0.15} /></mesh><mesh position={[0, -0.24, 0]} rotation={[0,0,Math.PI]}><coneGeometry args={[0.18, 0.36, 24]} /><meshStandardMaterial color="#195b40" /></mesh><mesh position={[0, 0.01, 0.237]}><sphereGeometry args={[0.10, 16, 16]} /><meshStandardMaterial color="#edf2db" /></mesh></group>
    {[0.7,1,1.3].map((radius, i) => <mesh key={radius} rotation={[-Math.PI/2,0,0]} position={[0,0.015+i*0.001,0]}><ringGeometry args={[radius, radius+0.014, 80]} /><meshBasicMaterial color="#508b5e" transparent opacity={0.35-i*0.09} /></mesh>)}
  </group>;
}
class SceneBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}
function Fallback() { return <div className="st-map-fallback"><svg viewBox="0 0 600 460" aria-hidden="true"><g transform="translate(300 230) rotate(-25) skewX(20)"><rect x="-210" y="-160" width="420" height="320" rx="20" fill="#cbdbc5" />{[-95,80].map(y=><path key={y} d={`M-210 ${y}H210`} stroke="#f6f3ea" strokeWidth="30"/>)}{[-85,85].map(x=><path key={x} d={`M${x} -160V160`} stroke="#f6f3ea" strokeWidth="25"/>)}{[-150,0,150].flatMap(x=>[-130,0,130].map(y=><rect key={`${x}${y}`} x={x-25} y={y-22} width="50" height="44" fill={x===0&&y===0?'#286c49':'#a9bb9e'} rx="4"/>))}</g><path d="M300 86c-21 0-36 16-36 36 0 27 36 60 36 60s36-33 36-60c0-20-15-36-36-36Z" fill="#185b3d"/><circle cx="300" cy="122" r="11" fill="#f5f3e9"/></svg></div>; }
export default function NeighborhoodScene({ paused }: { paused: boolean }) {
  const [available, setAvailable] = useState(false);
  useEffect(() => { try { const canvas = document.createElement('canvas'); const gl = canvas.getContext('webgl2'); setAvailable(Boolean(gl)); gl?.getExtension('WEBGL_lose_context')?.loseContext(); } catch { setAvailable(false); } }, []);
  if (!available) return <Fallback />;
  return <SceneBoundary fallback={<Fallback />}><Canvas orthographic camera={{ position: [6, 6, 7], zoom: 77, near: 0.1, far: 100 }} dpr={[1, 1.5]} shadows frameloop={paused ? 'demand' : 'always'} gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}><ambientLight intensity={1.8} /><directionalLight castShadow position={[-4,7,4]} intensity={3.5} shadow-mapSize={[1024,1024]} shadow-camera-left={-7} shadow-camera-right={7} shadow-camera-top={7} shadow-camera-bottom={-7} shadow-bias={-0.001} /><Neighborhood paused={paused} /></Canvas></SceneBoundary>;
}
