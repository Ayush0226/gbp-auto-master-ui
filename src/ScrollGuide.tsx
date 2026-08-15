import { useEffect, useState, useRef } from 'react';

// Waypoints for the robot's journey
const WAYPOINTS = [
    { scroll: 0,    x: 85, message: "Hey there! I'm Taay, your GBP Guide 🤖", side: 'right' },
    { scroll: 0.15, x: 15, message: "Watch us rank you #1 on Google Maps! 📈", side: 'left' },
    { scroll: 0.35, x: 85, message: "Swipe through our AI features below! ⚡", side: 'right' },
    { scroll: 0.55, x: 15, message: "Spy on your local competitors live ⚔️", side: 'left' },
    { scroll: 0.75, x: 85, message: "Only ₹9.6/day — grab the discount! 💰", side: 'right' },
    { scroll: 0.92, x: 50, message: "Let me set up your profile now! 🎯", side: 'center' },
];

function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
}

function getWaypointPosition(scrollProgress: number) {
    // Find the two waypoints we're between
    let i = 0;
    for (let j = 0; j < WAYPOINTS.length - 1; j++) {
        if (scrollProgress >= WAYPOINTS[j].scroll && scrollProgress <= WAYPOINTS[j + 1].scroll) {
            i = j;
            break;
        }
        if (j === WAYPOINTS.length - 2) i = j;
    }

    const wp1 = WAYPOINTS[i];
    const wp2 = WAYPOINTS[Math.min(i + 1, WAYPOINTS.length - 1)];
    const range = wp2.scroll - wp1.scroll;
    const localT = range > 0 ? Math.min(1, Math.max(0, (scrollProgress - wp1.scroll) / range)) : 0;
    
    // Ease-in-out for smooth movement
    const eased = localT < 0.5 
        ? 2 * localT * localT 
        : 1 - Math.pow(-2 * localT + 2, 2) / 2;

    return {
        x: lerp(wp1.x, wp2.x, eased),
        message: localT < 0.5 ? wp1.message : wp2.message,
        side: localT < 0.5 ? wp1.side : wp2.side,
        waypointIndex: localT < 0.5 ? i : Math.min(i + 1, WAYPOINTS.length - 1),
    };
}

export default function ScrollGuide() {
    const [scrollProgress, setScrollProgress] = useState(0);
    const [bobOffset, setBobOffset] = useState(0);
    const frameRef = useRef(0);

    useEffect(() => {
        const handleScroll = () => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = docHeight > 0 ? scrollTop / docHeight : 0;
            setScrollProgress(Math.min(1, Math.max(0, progress)));
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Bobbing animation
    useEffect(() => {
        let animId: number;
        const animate = () => {
            frameRef.current += 0.04;
            setBobOffset(Math.sin(frameRef.current) * 6);
            animId = requestAnimationFrame(animate);
        };
        animId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animId);
    }, []);

    const pos = getWaypointPosition(scrollProgress);
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    // The full path (faint background)
    const pathPoints = Array.from({ length: 101 }, (_, i) => {
        const t = i / 100;
        const p = getWaypointPosition(t);
        const y = 5 + (t * 90);
        const x = isMobile ? Math.min(85, Math.max(15, p.x)) : p.x;
        return `${x},${y}`;
    }).join(' ');

    // The active path that perfectly tracks the robot
    const activePointsCount = Math.floor(scrollProgress * 100);
    const activePathPoints = Array.from({ length: activePointsCount + 1 }, (_, i) => {
        const t = i / 100;
        const p = getWaypointPosition(t);
        const y = 5 + (t * 90);
        const x = isMobile ? Math.min(85, Math.max(15, p.x)) : p.x;
        return `${x},${y}`;
    });
    
    // Add the exact fractional point so it seamlessly touches the robot
    if (scrollProgress > 0) {
        const p = getWaypointPosition(scrollProgress);
        const y = 5 + (scrollProgress * 90);
        const x = isMobile ? Math.min(85, Math.max(15, p.x)) : p.x;
        activePathPoints.push(`${x},${y}`);
    }
    const activePathString = activePathPoints.join(' ');

    return (
        <div className="scroll-guide" aria-hidden="true">
            {/* Dotted trail path */}
            <svg className="scroll-guide-trail" viewBox="0 0 100 100" preserveAspectRatio="none">
                {/* Faint upcoming path */}
                <polyline
                    points={pathPoints}
                    fill="none"
                    stroke="rgba(59,130,246,0.15)"
                    strokeWidth="1.2"
                    strokeDasharray="1, 1.5"
                    vectorEffect="non-scaling-stroke"
                />
                {/* Solid drawn path up to the robot */}
                <polyline
                    points={activePathString}
                    fill="none"
                    stroke="rgba(59,130,246,0.6)"
                    strokeWidth="1.5"
                    vectorEffect="non-scaling-stroke"
                />
            </svg>

            {/* The Robot */}
            <div
                className="scroll-guide-robot"
                style={{
                    left: `${isMobile ? Math.min(85, Math.max(15, pos.x)) : pos.x}%`,
                    top: `${5 + (scrollProgress * 90)}%`,
                    transform: `translate(-50%, calc(-50% + ${bobOffset}px)) ${pos.side === 'left' ? 'scaleX(1)' : pos.side === 'right' ? 'scaleX(-1)' : 'scaleX(1)'}`,
                }}
            >
                {/* Robot SVG */}
                <div className="robot-body">
                    <svg width="72" height="72" viewBox="0 0 64 64" fill="none">
                        {/* Antenna */}
                        <line x1="32" y1="8" x2="32" y2="2" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" />
                        <circle cx="32" cy="2" r="2.5" fill="#60A5FA">
                            <animate attributeName="opacity" values="1;0.4;1" dur="1.5s" repeatCount="indefinite" />
                        </circle>
                        
                        {/* Head */}
                        <rect x="16" y="8" width="32" height="24" rx="8" fill="url(#robotGrad)" stroke="#4B5563" strokeWidth="1.5" />
                        
                        {/* Eyes */}
                        <circle cx="24" cy="20" r="4" fill="#030712" />
                        <circle cx="40" cy="20" r="4" fill="#030712" />
                        <circle cx="25" cy="19" r="1.8" fill="#60A5FA">
                            <animate attributeName="cx" values="25;23;25" dur="3s" repeatCount="indefinite" />
                        </circle>
                        <circle cx="41" cy="19" r="1.8" fill="#60A5FA">
                            <animate attributeName="cx" values="41;39;41" dur="3s" repeatCount="indefinite" />
                        </circle>
                        
                        {/* Mouth */}
                        <path d="M 25 26 Q 32 30 39 26" stroke="#4ADE80" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                        
                        {/* Body */}
                        <rect x="20" y="34" width="24" height="18" rx="6" fill="url(#robotGrad)" stroke="#4B5563" strokeWidth="1.5" />
                        
                        {/* Body light */}
                        <circle cx="32" cy="43" r="3" fill="#3B82F6">
                            <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
                        </circle>
                        
                        {/* Arms */}
                        <rect x="10" y="36" width="8" height="4" rx="2" fill="#1F2937" stroke="#4B5563" strokeWidth="1" opacity="0.8">
                            <animateTransform attributeName="transform" type="rotate" values="-5,14,38;5,14,38;-5,14,38" dur="2s" repeatCount="indefinite" />
                        </rect>
                        <rect x="46" y="36" width="8" height="4" rx="2" fill="#1F2937" stroke="#4B5563" strokeWidth="1" opacity="0.8">
                            <animateTransform attributeName="transform" type="rotate" values="5,50,38;-5,50,38;5,50,38" dur="2s" repeatCount="indefinite" />
                        </rect>
                        
                        {/* Feet */}
                        <rect x="22" y="53" width="8" height="5" rx="2.5" fill="#111827" stroke="#4B5563" strokeWidth="1" />
                        <rect x="34" y="53" width="8" height="5" rx="2.5" fill="#111827" stroke="#4B5563" strokeWidth="1" />
                        
                        <defs>
                            <linearGradient id="robotGrad" x1="32" y1="8" x2="32" y2="52" gradientUnits="userSpaceOnUse">
                                <stop offset="0%" stopColor="#374151" />
                                <stop offset="100%" stopColor="#111827" />
                            </linearGradient>
                        </defs>
                    </svg>
                    
                    {/* Glow under robot */}
                    <div className="robot-glow" style={{ width: '54px', height: '14px', bottom: '-12px' }}></div>
                </div>

                {/* Speech Bubble */}
                <div className={`robot-speech ${pos.side === 'right' ? 'speech-left' : 'speech-right'}`} style={{ transform: pos.side === 'right' ? 'scaleX(-1)' : 'scaleX(1)', top: '-16px' }}>
                    <span>{pos.message}</span>
                </div>
            </div>
        </div>
    );
}
