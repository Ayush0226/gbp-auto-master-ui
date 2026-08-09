import { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, Stars, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

function SceneObjects() {
    const groupRef = useRef<THREE.Group>(null);
    const { mouse, viewport } = useThree();

    useFrame((state) => {
        if (groupRef.current) {
            // Subtle parallax based on mouse
            const targetX = (mouse.x * viewport.width) / 30;
            const targetY = (mouse.y * viewport.height) / 30;
            
            groupRef.current.rotation.y += 0.001;
            groupRef.current.rotation.x += 0.0005;

            groupRef.current.position.x += (targetX - groupRef.current.position.x) * 0.05;
            groupRef.current.position.y += (targetY - groupRef.current.position.y) * 0.05;
        }
    });

    return (
        <group ref={groupRef}>
            <Float speed={2} rotationIntensity={1.5} floatIntensity={2} position={[-3.5, 1, -2]}>
                <mesh>
                    <icosahedronGeometry args={[1.2, 0]} />
                    <MeshDistortMaterial color="#3B82F6" emissive="#3B82F6" emissiveIntensity={0.5} roughness={0.1} metalness={0.8} transparent opacity={0.85} distort={0.3} speed={2} />
                </mesh>
            </Float>
            <Float speed={1.5} rotationIntensity={2} floatIntensity={1.5} position={[3.5, -1, -3]}>
                <mesh>
                    <torusKnotGeometry args={[0.8, 0.25, 100, 16]} />
                    <MeshDistortMaterial color="#34A853" emissive="#34A853" emissiveIntensity={0.4} roughness={0.2} metalness={0.9} transparent opacity={0.8} distort={0.2} speed={1.5} />
                </mesh>
            </Float>
            <Float speed={2.5} rotationIntensity={1} floatIntensity={2.5} position={[0.5, -2.5, -1]}>
                <mesh>
                    <octahedronGeometry args={[1, 0]} />
                    <MeshDistortMaterial color="#F97316" emissive="#F97316" emissiveIntensity={0.6} roughness={0.2} metalness={0.5} transparent opacity={0.9} distort={0.4} speed={2} />
                </mesh>
            </Float>
            <Float speed={1.2} rotationIntensity={0.5} floatIntensity={1} position={[-2, -3.5, -5]}>
                <mesh>
                    <sphereGeometry args={[1.5, 32, 32]} />
                    <MeshDistortMaterial color="#1D4ED8" emissive="#1D4ED8" emissiveIntensity={0.3} roughness={0.1} metalness={0.9} transparent opacity={0.5} distort={0.5} speed={1} />
                </mesh>
            </Float>
            <Float speed={1.8} rotationIntensity={1} floatIntensity={1.5} position={[2.5, 2.5, -4]}>
                <mesh>
                    <sphereGeometry args={[0.9, 32, 32]} />
                    <MeshDistortMaterial color="#4ADE80" emissive="#4ADE80" emissiveIntensity={0.4} roughness={0.3} metalness={0.4} transparent opacity={0.7} distort={0.3} speed={1.5} />
                </mesh>
            </Float>
        </group>
    );
}

function Starfield() {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return (
        <Stars radius={50} depth={50} count={isMobile ? 500 : 1500} factor={4} saturation={0} fade speed={1} />
    );
}

export default function Scene3D() {
    return (
        <div className="home-3d-canvas">
            <Canvas camera={{ position: [0, 0, 8], fov: 50 }} gl={{ antialias: true, alpha: true }} dpr={[1, 1.5]}>
                <Suspense fallback={null}>
                    <ambientLight intensity={0.4} />
                    <pointLight position={[10, 10, 10]} intensity={1.5} />
                    <pointLight position={[-10, -10, -10]} intensity={0.5} color="#3B82F6" />
                    <SceneObjects />
                    <Starfield />
                </Suspense>
            </Canvas>
        </div>
    );
}
