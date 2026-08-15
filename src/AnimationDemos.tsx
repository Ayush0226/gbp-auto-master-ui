import React, { useState, useEffect, useRef } from 'react';
import './AnimationDemos.css';

// Custom hook for a continuous 0->1 loop
function useLoopingProgress(duration: number) {
    const [progress, setProgress] = useState(0);
    
    useEffect(() => {
        let startTime = performance.now();
        let animationFrameId: number;

        const animate = (time: number) => {
            let elapsed = time - startTime;
            if (elapsed > duration) {
                // Pause for 1 second at the end, then restart
                if (elapsed > duration + 1000) {
                    startTime = time;
                    elapsed = 0;
                } else {
                    elapsed = duration; // hold at 1
                }
            }
            setProgress(elapsed / duration);
            animationFrameId = requestAnimationFrame(animate);
        };
        
        animationFrameId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrameId);
    }, [duration]);

    return progress;
}

// =========================================
// 1. Google Maps Pin Evolution
// =========================================
const Idea1PinEvolution: React.FC = () => {
    const progress = useLoopingProgress(2000); // 2 second animation

    // Pin goes from bottom (100%) to top (30%)
    const pinY = 100 - (progress * 70); 
    const isCrown = progress > 0.8;

    return (
        <div className="demo-cell">
            <div className="demo-anim-container">
                <div className="map-grid-container">
                    <div className="map-plane">
                        <div className="map-trail" style={{ height: `${progress * 70}%` }}></div>
                        <div className="map-pin" style={{ bottom: `${pinY}%` }}>
                            {isCrown ? (
                                <svg viewBox="0 0 24 24" fill="#FCD34D" stroke="#B45309" strokeWidth="1">
                                    <path d="M2 20h20v2H2v-2zm1.5-2l1.5-12 4 4 3-8 3 8 4-4 1.5 12H3.5z" />
                                </svg>
                            ) : (
                                <svg viewBox="0 0 24 24" fill="#EF4444" stroke="#7F1D1D" strokeWidth="1">
                                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                                </svg>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <div className="demo-info">
                <h3>Visibility</h3>
                <p>Evolve from an invisible local business to the #1 Authority on Google Maps.</p>
            </div>
        </div>
    );
};

// =========================================
// 2. Search Results Takeover
// =========================================
const Idea2SerpTakeover: React.FC = () => {
    const progress = useLoopingProgress(2500);

    const heroTop = 200 - (progress * 200);
    const card1Top = progress > 0.2 ? 60 : 0;
    const card2Top = progress > 0.5 ? 120 : 60;
    const card3Top = progress > 0.8 ? 180 : 120;

    const isGold = progress > 0.9;

    return (
        <div className="demo-cell">
            <div className="demo-anim-container">
                <div className="serp-container" style={{ height: '240px', transform: 'scale(0.8)' }}>
                    <div className="serp-card" style={{ top: card1Top }}>
                        <div className="serp-skeleton-img"></div>
                        <div className="serp-skeleton-lines">
                            <div className="serp-skeleton-line"></div>
                            <div className="serp-skeleton-line short"></div>
                        </div>
                    </div>
                    
                    <div className="serp-card" style={{ top: card2Top }}>
                        <div className="serp-skeleton-img"></div>
                        <div className="serp-skeleton-lines">
                            <div className="serp-skeleton-line"></div>
                            <div className="serp-skeleton-line short"></div>
                        </div>
                    </div>
                    
                    <div className="serp-card" style={{ top: card3Top }}>
                        <div className="serp-skeleton-img"></div>
                        <div className="serp-skeleton-lines">
                            <div className="serp-skeleton-line"></div>
                            <div className="serp-skeleton-line short"></div>
                        </div>
                    </div>
                    
                    <div className={`serp-card hero ${isGold ? 'gold' : ''}`} style={{ top: heroTop }}>
                        <div className="serp-skeleton-img" style={{ background: isGold ? '#FCD34D' : '#60A5FA' }}></div>
                        <div className="serp-skeleton-lines">
                            <div className="serp-skeleton-line" style={{ background: isGold ? '#FCD34D' : '#60A5FA' }}></div>
                            <div className="serp-skeleton-line short" style={{ background: isGold ? '#FCD34D' : '#60A5FA' }}></div>
                            {isGold && <div className="serp-skeleton-line gold-text">⭐ Top Rated</div>}
                        </div>
                    </div>
                </div>
            </div>
            <div className="demo-info">
                <h3>Domination</h3>
                <p>Physically outrank and push down your competitors in local search results.</p>
            </div>
        </div>
    );
};

// =========================================
// 3. Local Traffic Magnet
// =========================================
const Idea3TrafficMagnet: React.FC = () => {
    const progress = useLoopingProgress(3000);
    const [particles, setParticles] = useState<{id: number, x: number, y: number}[]>([]);

    const isActive = progress > 0.3;

    useEffect(() => {
        if (isActive) {
            let id = 0;
            const interval = setInterval(() => {
                const startX = Math.random() > 0.5 ? Math.random() * -100 : 400 + Math.random() * 100;
                const startY = Math.random() * 200;
                setParticles(prev => [...prev.slice(-15), { id: id++, x: startX, y: startY }]);
            }, 100);
            return () => clearInterval(interval);
        } else {
            setParticles([]);
        }
    }, [isActive]);

    return (
        <div className="demo-cell">
            <div className="demo-anim-container">
                <div className="magnet-container" style={{ transform: 'scale(0.8)' }}>
                    <div className={`storefront ${isActive ? 'active' : ''}`}>
                        <div className="store-stars">★★★★★</div>
                        <div className="store-door"></div>
                    </div>
                    
                    {particles.map(p => (
                        <div 
                            key={p.id} 
                            className="particle" 
                            style={{
                                left: p.x,
                                top: p.y,
                                opacity: isActive ? 1 : 0,
                                transform: `translate(${300 - p.x}px, ${200 - p.y}px)`
                            }}
                        />
                    ))}
                </div>
            </div>
            <div className="demo-info">
                <h3>Attraction</h3>
                <p>Turn your profile into an automated 5-star magnet for real-world foot traffic.</p>
            </div>
        </div>
    );
};

// =========================================
// 4. Exponential Rocket Graph
// =========================================
const Idea4RocketGraph: React.FC = () => {
    const progress = useLoopingProgress(2000);

    const pathD = "M 0 150 Q 150 150 200 125 T 300 0";
    const pathLength = 400;
    const dashOffset = pathLength - (progress * pathLength);

    const rocketX = progress * 300;
    let rocketY = 150;
    let rotation = 90; 
    
    if (progress < 0.5) {
        rocketY = 150;
        rotation = 90;
    } else if (progress < 0.8) {
        const p2 = (progress - 0.5) / 0.3; 
        rocketY = 150 - (p2 * 50);
        rotation = 90 - (p2 * 45); 
    } else {
        const p3 = (progress - 0.8) / 0.2; 
        rocketY = 100 - (p3 * 100);
        rotation = 0; 
    }

    return (
        <div className="demo-cell">
            <div className="demo-anim-container">
                <div className="graph-container" style={{ width: '300px', height: '150px' }}>
                    <div className="graph-axis-label y-axis">Views</div>
                    <div className="graph-axis-label x-axis">Time</div>
                    <svg className="graph-svg" viewBox="0 0 300 150" preserveAspectRatio="none">
                        <path d="M0 37.5 L300 37.5 M0 75 L300 75 M0 112.5 L300 112.5" stroke="rgba(255,255,255,0.05)" strokeWidth="1" fill="none" />
                        <path 
                            d={pathD} 
                            stroke="#60A5FA" 
                            strokeWidth="3" 
                            fill="none" 
                            strokeLinecap="round"
                            strokeDasharray={pathLength}
                            strokeDashoffset={dashOffset}
                        />
                    </svg>
                    
                    <div 
                        className="graph-rocket" 
                        style={{ 
                            left: `${(rocketX / 300) * 100}%`, 
                            top: `${(rocketY / 150) * 100}%`,
                            transform: `translate(-50%, -50%) rotate(${rotation - 90}deg)`
                        }}
                    >
                        <svg viewBox="0 0 24 24" fill="#FCD34D" stroke="#B45309" strokeWidth="1">
                            <path d="M12 2L8 6h3v8h2V6h3l-4-4zm-6 18c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2H6z"/>
                        </svg>
                    </div>
                </div>
            </div>
            <div className="demo-info">
                <h3>Growth</h3>
                <p>Achieve exponential, compounding growth in monthly profile views.</p>
            </div>
        </div>
    );
};

export default function AnimationDemos() {
    return (
        <div className="demo-showcase">
            <nav className="demo-nav">
                <a href="/" style={{ background: 'rgba(59, 130, 246, 0.2)' }}>← Back to Home</a>
            </nav>
            
            <div className="matrix-grid">
                <Idea1PinEvolution />
                <Idea2SerpTakeover />
                <Idea3TrafficMagnet />
                <Idea4RocketGraph />
            </div>
        </div>
    );
}
