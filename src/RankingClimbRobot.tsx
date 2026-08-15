import React, { useEffect, useState, useRef } from 'react';
import './RankingClimbRobot.css';

export default function RankingClimbRobot() {
    const [scrollProgress, setScrollProgress] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleScroll = () => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            
            // We want progress to go from 0 to 1 as the element scrolls through the viewport
            const windowHeight = window.innerHeight;
            
            // Progress starts when the top of the element enters the bottom of the screen
            // Progress ends when the bottom of the element leaves the top of the screen
            const elementTop = rect.top;
            const elementHeight = rect.height;
            
            // Calculate a progress value from 0 to 1
            // Start at 0 when elementTop is at windowHeight * 0.8
            // End at 1 when elementTop is at windowHeight * 0.2
            
            let p = (windowHeight * 0.8 - elementTop) / (windowHeight * 0.6);
            
            p = Math.max(0, Math.min(1, p));
            setScrollProgress(p);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Calculate curved step-like robot position
    const segment = Math.floor(scrollProgress * 8); 
    const localP = (scrollProgress * 8) % 1; 

    let posX = 10;
    let posY = 90;
    const xStep = 20;
    const yStep = 20;

    const fullSegments = Math.min(segment, 7);
    for (let i = 0; i < fullSegments; i++) {
        if (i % 2 === 0) {
            posY -= yStep; // UP
        } else {
            posX += xStep; // RIGHT
        }
    }

    if (fullSegments < 8 && scrollProgress < 1) {
        if (fullSegments % 2 === 0) {
            posY -= yStep * localP;
        } else {
            posX += xStep * localP;
        }
    } else if (scrollProgress >= 1) {
        posX = 90;
        posY = 10;
    }
    
    // Determine the current rank text
    let rankText = "";
    if (scrollProgress < 0.2) rankText = "Rank #5";
    else if (scrollProgress < 0.4) rankText = "Rank #4";
    else if (scrollProgress < 0.6) rankText = "Rank #3";
    else if (scrollProgress < 0.8) rankText = "Rank #2";
    else if (scrollProgress < 1.0) rankText = "Rank #1 !";
    else rankText = "🏆 #1 Domination!";

    return (
        <div ref={containerRef} className="ranking-climb-container">
            <div className="ranking-climb-inner">
                {/* Visual Stairs */}
                <div className="climb-stairs">
                    <div className="climb-step step-5"></div>
                    <div className="climb-step step-4"></div>
                    <div className="climb-step step-3"></div>
                    <div className="climb-step step-2"></div>
                    <div className="climb-step step-1"></div>
                </div>

                {/* Dashed Path Trace with Curved Corners */}
                <svg className="climb-path-trace" width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path 
                        d="M 10 90 L 10 75 Q 10 70 15 70 L 25 70 Q 30 70 30 65 L 30 55 Q 30 50 35 50 L 45 50 Q 50 50 50 45 L 50 35 Q 50 30 55 30 L 65 30 Q 70 30 70 25 L 70 15 Q 70 10 75 10 L 90 10"
                        stroke="rgba(59, 130, 246, 0.4)" 
                        strokeWidth="1" 
                        vectorEffect="non-scaling-stroke"
                        fill="none"
                        strokeLinecap="round"
                        className="climb-path-line"
                    />
                </svg>

                {/* The Climbing Robot */}
                <div 
                    className="climb-robot-wrapper" 
                    style={{
                        left: `${posX}%`,
                        top: `${posY}%`,
                    }}
                >
                    <div className={`climb-speech-bubble ${scrollProgress >= 1 ? 'gold-glow' : ''}`}>
                        {rankText}
                    </div>
                    
                    {/* Simplified Animated Robot */}
                    <div className={`climb-robot-svg ${scrollProgress > 0 && scrollProgress < 1 ? 'walking' : ''}`}>
                        <svg width="60" height="60" viewBox="0 0 64 64" fill="none">
                            <rect x="16" y="8" width="32" height="24" rx="8" fill="url(#botGradDark)" stroke="#4B5563" strokeWidth="1.5" />
                            <circle cx="24" cy="20" r="4" fill="#030712" />
                            <circle cx="40" cy="20" r="4" fill="#030712" />
                            <circle cx="25" cy="19" r="1.8" fill="#60A5FA" />
                            <circle cx="41" cy="19" r="1.8" fill="#60A5FA" />
                            <path d="M 25 26 Q 32 30 39 26" stroke="#4ADE80" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                            <rect x="20" y="34" width="24" height="18" rx="6" fill="url(#botGradDark)" stroke="#4B5563" strokeWidth="1.5" />
                            
                            {/* Arms that swing when walking */}
                            <g className="arm-left">
                                <rect x="10" y="36" width="8" height="4" rx="2" fill="#1F2937" stroke="#4B5563" strokeWidth="1" />
                            </g>
                            <g className="arm-right">
                                <rect x="46" y="36" width="8" height="4" rx="2" fill="#1F2937" stroke="#4B5563" strokeWidth="1" />
                            </g>
                            
                            {/* Feet */}
                            <g className="foot-left">
                                <rect x="22" y="53" width="8" height="5" rx="2.5" fill="#111827" stroke="#4B5563" strokeWidth="1" />
                            </g>
                            <g className="foot-right">
                                <rect x="34" y="53" width="8" height="5" rx="2.5" fill="#111827" stroke="#4B5563" strokeWidth="1" />
                            </g>
                            
                            <defs>
                                <linearGradient id="botGradDark" x1="32" y1="8" x2="32" y2="52" gradientUnits="userSpaceOnUse">
                                    <stop offset="0%" stopColor="#374151" />
                                    <stop offset="100%" stopColor="#111827" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>

                    {scrollProgress >= 1 && (
                        <div className="trophy-reveal">
                            🏆
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
