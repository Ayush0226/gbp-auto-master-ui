import React, { useState, useEffect, useRef } from 'react';
import './RocketGrowthGraph.css';

interface StarParticle {
    id: number;
    x: number;
    y: number;
}

const RocketGrowthGraph: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [progress, setProgress] = useState(0);
    const [stars, setStars] = useState<StarParticle[]>([]);
    
    // Total views logic: starts at 1250, scales up to 85000 based on progress
    const baseViews = 1250;
    const peakViews = 85000;
    // We use a curve for the number to match the visual curve
    const currentViews = Math.floor(baseViews + (Math.pow(progress, 3) * (peakViews - baseViews)));

    useEffect(() => {
        const handleScroll = () => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            // Start when top hits 80% of window, end when bottom hits 20%
            const windowHeight = window.innerHeight;
            const startScroll = windowHeight * 0.8;
            // The container is 1200px tall. We want the animation to stretch over the scroll.
            // When rect.top = startScroll, progress = 0.
            // When rect.bottom = windowHeight * 0.2, progress = 1.
            const totalScrollDistance = rect.height; 
            
            let p = (startScroll - rect.top) / totalScrollDistance;
            p = Math.max(0, Math.min(1, p));
            
            setProgress(p);
        };
        
        window.addEventListener('scroll', handleScroll);
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Particle logic - drop stars when in the steep climb phase (progress > 0.6)
    useEffect(() => {
        if (progress > 0.6 && progress < 1) {
            const dropStar = () => {
                setStars(prev => [
                    ...prev.slice(-15), // keep max 15 stars in DOM
                    { id: Date.now() + Math.random(), x: 0, y: 0 }
                ]);
            };
            // The higher the progress, the faster the stars drop
            const rate = 300 - (progress * 250); 
            const interval = setInterval(dropStar, rate);
            return () => clearInterval(interval);
        }
    }, [progress]);

    // Geometry of the SVG line
    const svgWidth = 800;
    const svgHeight = 400;
    
    // A path that goes flat, then curves up exponentially
    const pathD = `M 0 ${svgHeight} Q ${svgWidth * 0.4} ${svgHeight} ${svgWidth * 0.6} ${svgHeight * 0.8} T ${svgWidth} 0`;
    
    // Dash animation
    const pathLength = 1200; // Approx length of the curve
    const dashOffset = pathLength - (progress * pathLength);

    // Rocket position estimation along the curve
    const rocketX = progress * svgWidth;
    let rocketY = svgHeight;
    let rotation = 90; // Default pointing right
    
    if (progress < 0.4) {
        rocketY = svgHeight;
        rotation = 90;
    } else if (progress < 0.7) {
        // curving up
        const p2 = (progress - 0.4) / 0.3; // 0 to 1
        rocketY = svgHeight - (p2 * (svgHeight * 0.3));
        rotation = 90 - (p2 * 45);
    } else {
        // steep spike
        const p3 = (progress - 0.7) / 0.3; // 0 to 1
        rocketY = (svgHeight * 0.7) - (p3 * (svgHeight * 0.7));
        rotation = 45 - (p3 * 45); // points up to 0 degrees
    }

    return (
        <div className="rocket-graph-container" ref={containerRef}>
            <div className="rocket-graph-inner">
                <div className="rocket-graph-wrapper">
                    
                    <div className="graph-axis-label y-axis">Monthly Profile Views</div>
                    <div className="graph-axis-label x-axis">Time</div>
                    
                    <div className="graph-counter-badge">
                        <div className="graph-counter-label">Total Views</div>
                        <div className="graph-counter-val">
                            {currentViews.toLocaleString()}
                        </div>
                    </div>
                    
                    <svg className="graph-svg-layer" viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none">
                        {/* Grid lines */}
                        <path d={`M 0 ${svgHeight * 0.25} L ${svgWidth} ${svgHeight * 0.25}`} stroke="rgba(255,255,255,0.05)" strokeWidth="1" fill="none" />
                        <path d={`M 0 ${svgHeight * 0.5} L ${svgWidth} ${svgHeight * 0.5}`} stroke="rgba(255,255,255,0.05)" strokeWidth="1" fill="none" />
                        <path d={`M 0 ${svgHeight * 0.75} L ${svgWidth} ${svgHeight * 0.75}`} stroke="rgba(255,255,255,0.05)" strokeWidth="1" fill="none" />
                        
                        <path d={`M ${svgWidth * 0.25} 0 L ${svgWidth * 0.25} ${svgHeight}`} stroke="rgba(255,255,255,0.02)" strokeWidth="1" fill="none" />
                        <path d={`M ${svgWidth * 0.5} 0 L ${svgWidth * 0.5} ${svgHeight}`} stroke="rgba(255,255,255,0.02)" strokeWidth="1" fill="none" />
                        <path d={`M ${svgWidth * 0.75} 0 L ${svgWidth * 0.75} ${svgHeight}`} stroke="rgba(255,255,255,0.02)" strokeWidth="1" fill="none" />

                        {/* Animated Line with Neon Glow */}
                        <path 
                            d={pathD} 
                            stroke="#60A5FA" 
                            strokeWidth="4" 
                            fill="none" 
                            strokeLinecap="round"
                            strokeDasharray={pathLength}
                            strokeDashoffset={dashOffset}
                            filter="drop-shadow(0 0 10px rgba(96, 165, 250, 0.8))"
                        />
                    </svg>

                    {/* The Rocket & Star Trails */}
                    <div 
                        className="graph-rocket-sprite" 
                        style={{ 
                            left: `${(rocketX / svgWidth) * 100}%`, 
                            top: `${(rocketY / svgHeight) * 100}%`,
                            transform: `translate(-50%, -50%) rotate(${rotation - 45}deg)` 
                            // SVGs are often pointing top-right. We adjust based on our imported SVG.
                        }}
                    >
                        {stars.map(star => (
                            <div key={star.id} className="graph-star-trail">⭐</div>
                        ))}
                        
                        {/* 3D-ish Rocket SVG */}
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '100%', height: '100%', color: '#FCD34D', fill: 'rgba(252, 211, 77, 0.2)' }}>
                            <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
                            <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
                            <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
                            <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
                        </svg>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default RocketGrowthGraph;
