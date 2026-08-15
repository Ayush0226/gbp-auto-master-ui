import React, { useEffect, useRef } from 'react';

interface Particle {
    angle: number;
    speed: number;
    radius: number;
    color: string;
    glow: string;
    ringIndex: number;
}

export const MapCanvasBackground: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let width = (canvas.width = canvas.parentElement?.offsetWidth || window.innerWidth);
        let height = (canvas.height = canvas.parentElement?.offsetHeight || window.innerHeight);

        const handleResize = () => {
            if (!canvas) return;
            width = canvas.width = canvas.parentElement?.offsetWidth || window.innerWidth;
            height = canvas.height = canvas.parentElement?.offsetHeight || window.innerHeight;
        };
        window.addEventListener('resize', handleResize);

        const GLOBE_RADIUS = Math.min(width, height) * 0.35;
        let time = 0;

        // Generate globe dots (lat/lon intersections)
        const globePoints: {x: number, y: number, z: number}[] = [];
        const latLines = 18;
        const lonLines = 36;
        for (let i = 0; i <= latLines; i++) {
            const phi = Math.PI * (i / latLines); // 0 to PI
            for (let j = 0; j < lonLines; j++) {
                const theta = (Math.PI * 2) * (j / lonLines); // 0 to 2PI
                
                const x = GLOBE_RADIUS * Math.sin(phi) * Math.cos(theta);
                const y = GLOBE_RADIUS * Math.cos(phi);
                const z = GLOBE_RADIUS * Math.sin(phi) * Math.sin(theta);
                
                globePoints.push({x, y, z});
            }
        }

        // Define Rings
        const rings = [
            { radius: GLOBE_RADIUS * 1.4, tiltX: 0.4, tiltZ: 0.2, speedMult: 1 },
            { radius: GLOBE_RADIUS * 1.7, tiltX: -0.3, tiltZ: -0.5, speedMult: -0.8 },
            { radius: GLOBE_RADIUS * 2.1, tiltX: 0.6, tiltZ: -0.2, speedMult: 0.6 },
        ];

        // Generate Data Particles on rings
        const particles: Particle[] = [];
        const colors = [
            { main: '#3B82F6', glow: 'rgba(59, 130, 246, 0.8)' },
            { main: '#10B981', glow: 'rgba(16, 185, 129, 0.8)' },
            { main: '#F59E0B', glow: 'rgba(245, 158, 11, 0.8)' },
            { main: '#EF4444', glow: 'rgba(239, 68, 68, 0.8)' },
        ];

        rings.forEach((_, ringIdx) => {
            const numParticles = 12 + Math.random() * 8;
            for (let i = 0; i < numParticles; i++) {
                const col = colors[Math.floor(Math.random() * colors.length)];
                particles.push({
                    angle: Math.random() * Math.PI * 2,
                    speed: (0.002 + Math.random() * 0.003),
                    radius: 2 + Math.random() * 3,
                    color: col.main,
                    glow: col.glow,
                    ringIndex: ringIdx
                });
            }
        });

        // Projection helper to apply tilt and perspective
        const project = (x: number, y: number, z: number, tiltX: number, tiltZ: number) => {
            // Rotate around Z axis (tiltZ)
            let x1 = x * Math.cos(tiltZ) - y * Math.sin(tiltZ);
            let y1 = x * Math.sin(tiltZ) + y * Math.cos(tiltZ);
            let z1 = z;

            // Rotate around X axis (tiltX)
            let x2 = x1;
            let y2 = y1 * Math.cos(tiltX) - z1 * Math.sin(tiltX);
            let z2 = y1 * Math.sin(tiltX) + z1 * Math.cos(tiltX);

            return { x: x2, y: y2, z: z2 };
        };

        const render = () => {
            ctx.fillStyle = '#06080D';
            ctx.fillRect(0, 0, width, height);

            const centerX = width / 2;
            const centerY = height / 2;
            
            // Globe rotation
            time += 0.002;
            const globeTiltX = 0.2; // slight tilt for the globe

            // 1. Draw Back Rings and Back Particles
            rings.forEach((ring, idx) => {
                ctx.beginPath();
                for (let a = 0; a <= Math.PI * 2; a += 0.1) {
                    const px = Math.cos(a) * ring.radius;
                    const pz = Math.sin(a) * ring.radius;
                    const proj = project(px, 0, pz, ring.tiltX, ring.tiltZ);
                    
                    if (proj.z < 0) {
                        ctx.lineTo(centerX + proj.x, centerY + proj.y);
                    } else {
                        ctx.moveTo(centerX + proj.x, centerY + proj.y);
                    }
                }
                ctx.strokeStyle = 'rgba(59, 130, 246, 0.1)';
                ctx.lineWidth = 1;
                ctx.stroke();
            });

            // Draw particles that are behind the globe
            particles.forEach(p => {
                const ring = rings[p.ringIndex];
                p.angle += p.speed * ring.speedMult;
                const px = Math.cos(p.angle) * ring.radius;
                const pz = Math.sin(p.angle) * ring.radius;
                const proj = project(px, 0, pz, ring.tiltX, ring.tiltZ);
                
                if (proj.z < 0) {
                    ctx.beginPath();
                    ctx.arc(centerX + proj.x, centerY + proj.y, p.radius * 0.8, 0, Math.PI * 2);
                    ctx.fillStyle = p.color;
                    ctx.fill();
                }
            });

            // 2. Draw Solid Globe Background (to hide what's behind)
            ctx.beginPath();
            ctx.arc(centerX, centerY, GLOBE_RADIUS, 0, Math.PI * 2);
            
            const globeGrad = ctx.createRadialGradient(
                centerX - GLOBE_RADIUS * 0.3, centerY - GLOBE_RADIUS * 0.3, 0,
                centerX, centerY, GLOBE_RADIUS
            );
            globeGrad.addColorStop(0, '#0f172a');
            globeGrad.addColorStop(1, '#020617');
            
            ctx.fillStyle = globeGrad;
            ctx.fill();

            // 3. Draw Front Globe Dots
            ctx.fillStyle = 'rgba(59, 130, 246, 0.5)';
            globePoints.forEach(pt => {
                // Rotate pt around Y axis for spinning
                const rX = pt.x * Math.cos(time) - pt.z * Math.sin(time);
                const rZ = pt.x * Math.sin(time) + pt.z * Math.cos(time);
                
                // Apply slight fixed X tilt
                const proj = project(rX, pt.y, rZ, globeTiltX, 0);

                if (proj.z > 0) {
                    // Size depends on Z depth
                    const scale = 0.5 + (proj.z / GLOBE_RADIUS) * 1.5;
                    ctx.beginPath();
                    ctx.arc(centerX + proj.x, centerY + proj.y, scale, 0, Math.PI * 2);
                    ctx.fill();
                }
            });
            
            // Draw globe atmosphere glow
            ctx.beginPath();
            ctx.arc(centerX, centerY, GLOBE_RADIUS, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.shadowColor = '#3B82F6';
            ctx.shadowBlur = 30;
            ctx.stroke();
            ctx.shadowBlur = 0;

            // 4. Draw Front Rings and Front Particles
            rings.forEach((ring, idx) => {
                ctx.beginPath();
                for (let a = 0; a <= Math.PI * 2; a += 0.1) {
                    const px = Math.cos(a) * ring.radius;
                    const pz = Math.sin(a) * ring.radius;
                    const proj = project(px, 0, pz, ring.tiltX, ring.tiltZ);
                    
                    if (proj.z >= 0) {
                        ctx.lineTo(centerX + proj.x, centerY + proj.y);
                    } else {
                        ctx.moveTo(centerX + proj.x, centerY + proj.y);
                    }
                }
                ctx.strokeStyle = 'rgba(59, 130, 246, 0.25)';
                ctx.lineWidth = 2;
                ctx.stroke();
            });

            particles.forEach(p => {
                const ring = rings[p.ringIndex];
                const px = Math.cos(p.angle) * ring.radius;
                const pz = Math.sin(p.angle) * ring.radius;
                const proj = project(px, 0, pz, ring.tiltX, ring.tiltZ);
                
                if (proj.z >= 0) {
                    const scale = 1 + (proj.z / (ring.radius)) * 0.5;
                    
                    // Glow
                    ctx.beginPath();
                    ctx.arc(centerX + proj.x, centerY + proj.y, p.radius * scale * 2.5, 0, Math.PI * 2);
                    ctx.fillStyle = p.glow;
                    ctx.fill();

                    // Core
                    ctx.beginPath();
                    ctx.arc(centerX + proj.x, centerY + proj.y, p.radius * scale, 0, Math.PI * 2);
                    ctx.fillStyle = '#fff';
                    ctx.fill();
                }
            });

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 0,
                pointerEvents: 'none',
            }}
        />
    );
};
