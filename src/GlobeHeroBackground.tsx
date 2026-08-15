import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, useTexture, OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';

const Earth = () => {
    // A high-res realistic earth texture from a public CDN
    const texture = useTexture('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg');
    const earthRef = useRef<THREE.Mesh>(null);

    useFrame(() => {
        if (earthRef.current) {
            earthRef.current.rotation.y += 0.002;
        }
    });

    return (
        <Sphere ref={earthRef} args={[2.5, 64, 64]} position={[0, -0.5, 0]}>
            <meshStandardMaterial map={texture} roughness={0.6} metalness={0.1} />
        </Sphere>
    );
};

const DataRings = () => {
    const ring1Ref = useRef<THREE.Group>(null);
    const ring2Ref = useRef<THREE.Group>(null);

    useFrame(() => {
        if (ring1Ref.current) ring1Ref.current.rotation.y += 0.005;
        if (ring2Ref.current) ring2Ref.current.rotation.y -= 0.003;
    });

    return (
        <>
            <group ref={ring1Ref} rotation={[0.4, 0, 0.2]}>
                <mesh>
                    <torusGeometry args={[3.2, 0.01, 16, 100]} />
                    <meshBasicMaterial color="#3B82F6" transparent opacity={0.3} />
                </mesh>
                {/* Data particles on ring */}
                {Array.from({ length: 8 }).map((_, i) => (
                    <mesh key={`p1-${i}`} position={[Math.cos(i) * 3.2, Math.sin(i) * 3.2, 0]}>
                        <sphereGeometry args={[0.04, 8, 8]} />
                        <meshBasicMaterial color="#60A5FA" />
                    </mesh>
                ))}
            </group>
            
            <group ref={ring2Ref} rotation={[-0.3, 0, -0.5]}>
                <mesh>
                    <torusGeometry args={[3.8, 0.01, 16, 100]} />
                    <meshBasicMaterial color="#10B981" transparent opacity={0.3} />
                </mesh>
                {Array.from({ length: 12 }).map((_, i) => (
                    <mesh key={`p2-${i}`} position={[Math.cos(i * 0.5) * 3.8, Math.sin(i * 0.5) * 3.8, 0]}>
                        <sphereGeometry args={[0.04, 8, 8]} />
                        <meshBasicMaterial color="#34D399" />
                    </mesh>
                ))}
            </group>
        </>
    );
};

export default function GlobeHeroBackground() {
    return (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none', opacity: 0.6 }}>
            <Canvas camera={{ position: [0, 0, 7], fov: 45 }}>
                <ambientLight intensity={0.2} />
                <directionalLight position={[5, 3, 5]} intensity={1.5} color="#ffffff" />
                <pointLight position={[-5, -3, -5]} intensity={0.5} color="#3B82F6" />
                
                <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />
                <React.Suspense fallback={null}>
                    <Earth />
                </React.Suspense>
                <DataRings />
                <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
            </Canvas>
        </div>
    );
}
