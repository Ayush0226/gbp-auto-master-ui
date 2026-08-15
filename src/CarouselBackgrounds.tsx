import React from 'react';

export const DetailedAnalysisBg = () => (
    <div className="card-custom-bg" style={{ position: 'absolute', right: '-20%', top: '-10%', width: '120%', height: '120%', opacity: 0.15, pointerEvents: 'none' }}>
        <svg viewBox="0 0 100 100" width="100%" height="100%">
            <g className="bar-graph">
                <rect x="20" y="60" width="12" height="30" fill="rgba(34, 197, 94, 0.4)" rx="2">
                    <animate attributeName="height" values="10;30;10" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="y" values="80;60;80" dur="2s" repeatCount="indefinite" />
                </rect>
                <rect x="40" y="40" width="12" height="50" fill="rgba(34, 197, 94, 0.6)" rx="2">
                    <animate attributeName="height" values="20;50;20" dur="2.5s" repeatCount="indefinite" />
                    <animate attributeName="y" values="70;40;70" dur="2.5s" repeatCount="indefinite" />
                </rect>
                <rect x="60" y="20" width="12" height="70" fill="rgba(34, 197, 94, 0.8)" rx="2">
                    <animate attributeName="height" values="30;70;30" dur="3s" repeatCount="indefinite" />
                    <animate attributeName="y" values="60;20;60" dur="3s" repeatCount="indefinite" />
                </rect>
            </g>
            <g className="pie-chart" transform="translate(65, 35)">
                <circle cx="0" cy="0" r="15" fill="rgba(34, 197, 94, 0.2)" />
                <path d="M 0 0 L 0 -15 A 15 15 0 0 1 15 0 Z" fill="rgba(34, 197, 94, 0.8)">
                    <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="10s" repeatCount="indefinite" />
                </path>
            </g>
        </svg>
    </div>
);

export const CompetitorBg = () => (
    <div className="card-custom-bg" style={{ position: 'absolute', right: '-20%', top: '-10%', width: '120%', height: '120%', opacity: 0.15, pointerEvents: 'none' }}>
        <svg viewBox="0 0 100 100" width="100%" height="100%">
            <g className="podium">
                <rect x="40" y="50" width="20" height="40" fill="rgba(249, 115, 22, 0.8)" rx="2" />
                <text x="50" y="70" fill="rgba(255,255,255,0.8)" fontSize="14" textAnchor="middle" fontWeight="bold">1</text>
                
                <rect x="20" y="65" width="20" height="25" fill="rgba(249, 115, 22, 0.5)" rx="2" />
                <text x="30" y="80" fill="rgba(255,255,255,0.6)" fontSize="12" textAnchor="middle" fontWeight="bold">2</text>
                
                <rect x="60" y="75" width="20" height="15" fill="rgba(249, 115, 22, 0.3)" rx="2" />
                <text x="70" y="86" fill="rgba(255,255,255,0.4)" fontSize="10" textAnchor="middle" fontWeight="bold">3</text>
            </g>
            <g className="crown">
                <path d="M 42 45 L 45 35 L 50 42 L 55 35 L 58 45 Z" fill="rgba(252, 211, 77, 1)">
                    <animateTransform attributeName="transform" type="translate" values="0,0; 0,-5; 0,0" dur="2s" repeatCount="indefinite" />
                </path>
            </g>
        </svg>
    </div>
);

export const ContentCalendarBg = () => (
    <div className="card-custom-bg" style={{ position: 'absolute', right: '-20%', top: '-10%', width: '120%', height: '120%', opacity: 0.15, pointerEvents: 'none' }}>
        <svg viewBox="0 0 100 100" width="100%" height="100%">
            <rect x="25" y="30" width="50" height="50" fill="rgba(34, 197, 94, 0.2)" stroke="rgba(34, 197, 94, 0.6)" strokeWidth="4" rx="4" />
            <rect x="25" y="30" width="50" height="15" fill="rgba(34, 197, 94, 0.6)" />
            <rect x="35" y="25" width="4" height="10" fill="rgba(255,255,255,0.8)" rx="2" />
            <rect x="61" y="25" width="4" height="10" fill="rgba(255,255,255,0.8)" rx="2" />
            
            <path d="M 35 55 L 40 60 L 50 48" stroke="rgba(34, 197, 94, 1)" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="30" strokeDashoffset="30">
                <animate attributeName="stroke-dashoffset" values="30;0;0;30" dur="4s" repeatCount="indefinite" />
            </path>
            <path d="M 55 70 L 60 75 L 70 63" stroke="rgba(34, 197, 94, 0.8)" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="30" strokeDashoffset="30">
                <animate attributeName="stroke-dashoffset" values="30;30;0;0" dur="4s" repeatCount="indefinite" />
            </path>
        </svg>
    </div>
);
