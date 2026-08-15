import React, { useState, useEffect } from 'react';
import './MuscleDemo.css';

const SVGCheck = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
);

export const MuscleDemoHome = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [animateIn, setAnimateIn] = useState(false);

    useEffect(() => {
        // Trigger entrance animations
        setAnimateIn(true);
    }, []);

    const tabs = [
        {
            title: 'AI Auto-Replier',
            header: 'NEVER MISS A REVIEW',
            desc: 'Our proprietary AI instantly replies to all 5-star and 1-star reviews in your brand tone, securing top Google rankings and customer loyalty without you lifting a finger.',
            features: ['Instant AI sync within seconds', 'Custom brand tone configuration', 'Handles negative reviews professionally'],
            img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80'
        },
        {
            title: 'Content Calendar',
            header: 'DOMINATE LOCAL SEARCH',
            desc: 'Automate your entire Google Business posting schedule. We determine the exact time Google is most active in your area and publish high-converting content automatically.',
            features: ['Automated daily photo & video posts', 'Smart scheduling algorithms', 'Boosts local SEO engagement'],
            img: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80'
        },
        {
            title: 'SEO & Keywords',
            header: 'RANK #1 IN YOUR MARKET',
            desc: 'Unlock the exact search terms your competitors are hiding. Our system injects high-performing SEO keywords directly into your GBP to ensure you are always the first choice.',
            features: ['Live search query insights', 'Auto-implemented SEO strategies', 'Detailed competitor leaderboards'],
            img: 'https://images.unsplash.com/photo-1572177812156-58036aae439c?auto=format&fit=crop&q=80'
        }
    ];

    return (
        <div className="muscle-demo">
            {/* Header */}
            <header className={`nav-header ${animateIn ? 'animate-fade-in-up' : ''}`}>
                <div className="container nav-content">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ color: 'var(--accent-gold)', display: 'flex', alignItems: 'center' }}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2v20"></path><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                            </svg>
                        </div>
                        <span style={{ fontWeight: 800, fontSize: '20px', letterSpacing: '-0.5px' }}>GBP EMPIRE®</span>
                    </div>
                    <ul className="nav-links">
                        <li><a href="#features">Features</a></li>
                        <li><a href="#arsenal">The Arsenal</a></li>
                        <li><a href="#pricing">Pricing</a></li>
                        <li><a href="#contact">Contact</a></li>
                    </ul>
                    <button className="btn-primary" style={{ padding: '10px 24px', fontSize: '14px' }}>
                        Join Now
                    </button>
                </div>
            </header>

            {/* Hero */}
            <section className="hero-section">
                <div className="container">
                    <div className={`hero-content ${animateIn ? 'animate-fade-in-up' : ''}`}>
                        <span className="pill-badge">#1 GOOGLE BUSINESS PLATFORM</span>
                        <h1>TRANSFORM YOUR RANKING.<br/>ELEVATE YOUR BUSINESS.</h1>
                        <p className="hero-desc">
                            Ghatkopar's premier local SEO automation facility. 
                            We provide the algorithmic muscle, you provide the dedication. 
                            Build your digital presence, shred the competition, and automate your growth.
                        </p>
                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                            <button className="btn-primary">START FREE TRIAL</button>
                            <button className="btn-outline">EXPLORE FEATURES</button>
                        </div>
                        
                        <div style={{ marginTop: '60px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div className="glass-card" style={{ padding: '16px 24px', display: 'inline-block' }}>
                                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent-gold)' }}>10k+</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Active Businesses</div>
                            </div>
                            <div className="glass-card" style={{ padding: '16px 24px', display: 'inline-block' }}>
                                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent-gold)' }}>4.9/5</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Average Rating</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* The Arsenal (Tabs) */}
            <section id="arsenal" className="tabs-section">
                <div className="container">
                    <span className="pill-badge">WHAT WE OFFER</span>
                    <h2>OUR AUTOMATION ARSENAL</h2>
                    
                    <div className="tab-list">
                        {tabs.map((tab, idx) => (
                            <button 
                                key={idx} 
                                className={`tab-btn ${activeTab === idx ? 'active' : ''}`}
                                onClick={() => setActiveTab(idx)}
                            >
                                {tab.title}
                            </button>
                        ))}
                    </div>

                    <div className="tab-content">
                        <div className="tab-text">
                            <h3 style={{ fontSize: '32px', marginBottom: '16px', color: 'var(--accent-gold)' }}>
                                {tabs[activeTab].header}
                            </h3>
                            <p style={{ fontSize: '18px', color: 'var(--text-muted)', lineHeight: '1.7' }}>
                                {tabs[activeTab].desc}
                            </p>
                            <ul className="checklist">
                                {tabs[activeTab].features.map((feat, i) => (
                                    <li key={i}><SVGCheck /> {feat}</li>
                                ))}
                            </ul>
                            <button className="btn-primary" style={{ marginTop: '40px' }}>
                                TRAIN UNDER THIS STANDARD &rarr;
                            </button>
                        </div>
                        <div className="tab-image" style={{ backgroundImage: `url(${tabs[activeTab].img})` }}></div>
                    </div>
                </div>
            </section>

            {/* The Advantage Grid */}
            <section id="features" className="features-section">
                <div className="container">
                    <span className="pill-badge">WHY TRAIN WITH US</span>
                    <h2>THE EMPIRE ADVANTAGE</h2>
                    
                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                            </div>
                            <h3>24/7 AI MENTOR</h3>
                            <p>An intelligent chatbot acting as your Google Business mentor, optimizing your profile around the clock.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                            </div>
                            <h3>INSTANT SYNC</h3>
                            <p>Real-time review tracking and instant AI replies that make your customers feel heard and valued.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                            </div>
                            <h3>COMPETITOR INTEL</h3>
                            <p>Know exactly what keywords your competitors are ranking for and systematically outrank them.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                            </div>
                            <h3>CONTENT SCHEDULER</h3>
                            <p>Automatically post high-converting photos and offers when Google search volume peaks.</p>
                        </div>
                    </div>
                </div>
            </section>

        </div>
    );
};
