import { useEffect, useState, useRef } from 'react';
import { supabase } from './lib/supabase';
import { MapCanvasBackground } from './MapCanvasBackground';
import RocketGrowthGraph from './RocketGrowthGraph';
import ScrollGuide from './ScrollGuide';
import { DetailedAnalysisBg, CompetitorBg, ContentCalendarBg } from './CarouselBackgrounds';
import './Home.css';

const FeatureCarousel = () => {
    const [activeIndex, setActiveIndex] = useState(0);
    const features = [
        { 
            icon: '🤖', 
            title: '24/7 AI Mentor', 
            slogan: 'Everything you need to Top', 
            desc: 'A dedicated AI consultant right in your dashboard analyzing your local search data 24/7, pinpointing missing profile attributes, and generating step-by-step strategy recommendations to outrank local competitors.',
            color: 'blue', 
            hex: '#3b82f6',
            highlights: ['Real-time profile diagnostic score', 'Personalized daily optimization tips', 'Instant Maps growth roadmap'],
            stat: '+340% Maps Views'
        },
        { 
            icon: '💬', 
            title: 'AI Review Replier', 
            slogan: 'Turn every review into customer trust', 
            desc: 'Stop stressing over bad reviews. Our AI instantly replies to every customer with empathy, gracefully de-escalating 1-star reviews and celebrating 5-star praise within 15 milliseconds. Seamlessly weaves in target SEO keywords.',
            color: 'orange', 
            hex: '#f97316',
            highlights: ['15ms response speed', 'Custom brand tone persona', 'Automatic 1-star review alert'],
            stat: '100% Response Rate'
        },
        { 
            icon: '📅', 
            title: 'Content Calendar', 
            slogan: 'Photos, posts & videos uploaded automatically', 
            desc: 'Upload your photos, videos, and posts once. Our engine automatically schedules and drips them onto your profile every day during Google\'s most active search hours to keep your listing fresh and active.',
            color: 'green', 
            hex: '#22c55e',
            highlights: ['Peak search hour auto-posting', 'Bulk photo & video scheduler', 'Automated offer & event updates'],
            stat: 'Daily Auto Posts'
        },
        { 
            icon: '🎯', 
            title: 'SEO Keywords Auto Implement', 
            slogan: 'Direct keyword insertion for top Maps ranking', 
            desc: 'Injecting local search terms directly into your Google profile is the #1 way to rank higher. Simply list your target keywords, and our AI seamlessly weaves them into every automated reply to boost your Maps ranking.',
            color: 'blue', 
            hex: '#3b82f6',
            highlights: ['Auto keyword injection in replies', 'Search intent matching algorithm', 'Rank tracking by target terms'],
            stat: '#1 Local Map Pack'
        },
        { 
            icon: '⚔️', 
            title: 'Know your Competitor', 
            slogan: 'Uncover competitor tactics & beat them', 
            desc: 'Never guess who\'s beating you in local search. Enter any keyword and instantly view the local competitor leaderboard to track market share, inspect their review strategy, and systematically outmaneuver them.',
            color: 'orange', 
            hex: '#f97316',
            highlights: ['Live local leaderboard search', 'Competitor review velocity tracking', 'Keyword gap detection'],
            stat: 'Full Market Intel'
        },
        { 
            icon: '📊', 
            title: 'Detailed Analysis', 
            slogan: 'Track your growth with real-time charts', 
            desc: 'Beautiful, real-time analytics showing search impressions, phone call clicks, website visits, and direction requests so you can track your business growth and measure exact ROI from automation.',
            color: 'green', 
            hex: '#22c55e',
            highlights: ['Calls, directions & click charts', 'Weekly growth comparison', 'Exportable client reports'],
            stat: 'Real-Time ROI Charts'
        }
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % features.length);
        }, 7000);
        return () => clearInterval(interval);
    }, [features.length]);

    const getCardClass = (index: number) => {
        if (index === activeIndex) return 'active';
        if (index === (activeIndex - 1 + features.length) % features.length) return 'prev';
        if (index === (activeIndex + 1) % features.length) return 'next';
        
        const diff = index - activeIndex;
        if (diff > 1 || (diff < 0 && Math.abs(diff) < features.length - 1)) {
            return 'hidden-right';
        }
        return 'hidden-left';
    };

    const activeFeature = features[activeIndex];

    return (
        <div style={{ position: 'relative' }}>
            <div className="home-carousel-ring"></div>
            
            <div className="features-split-grid">
                
                {/* Mobile Tabs (Hidden on Desktop) */}
                <div className="mobile-feature-tabs">
                    {features.map((feature, index) => (
                        <div 
                            key={`mob-${index}`}
                            className={`mobile-tab ${index === activeIndex ? 'active' : ''}`}
                            onClick={() => setActiveIndex(index)}
                            style={{ 
                                borderColor: index === activeIndex ? feature.hex : 'transparent',
                                color: index === activeIndex ? feature.hex : 'rgba(255,255,255,0.5)',
                                background: index === activeIndex ? `${feature.hex}15` : 'rgba(255,255,255,0.05)'
                            }}
                        >
                            <span className="mobile-tab-icon">{feature.icon}</span>
                            <span className="mobile-tab-title">{feature.title}</span>
                        </div>
                    ))}
                </div>

                {/* Left Side: 3D Rotating Carousel (Hidden on Mobile) */}
                <div className="desktop-feature-visual" style={{ position: 'relative' }}>
                    <div className="home-carousel-container" style={{ height: '420px' }}>
                        {features.map((feature, index) => (
                            <div 
                                key={index}
                                className={`home-carousel-card ${getCardClass(index)}`}
                                onClick={() => setActiveIndex(index)}
                                style={{ '--theme-color': feature.hex } as React.CSSProperties}
                            >
                                {/* Replace the standard watermark with SVG for specific slides */}
                                {feature.title === 'Detailed Analysis' ? <DetailedAnalysisBg /> :
                                 feature.title === 'Know your Competitor' ? <CompetitorBg /> :
                                 feature.title === 'Content Calendar' ? <ContentCalendarBg /> :
                                 <div className="card-watermark">{feature.icon}</div>}
                                
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                    <div style={{ fontSize: '24px', textAlign: 'left', filter: index === activeIndex ? `drop-shadow(0 0 12px ${feature.hex})` : 'none', transition: 'all 0.5s ease', opacity: index === activeIndex ? 1 : 0.6 }}>
                                        {feature.icon}
                                    </div>
                                    <span style={{ fontSize: '11px', fontWeight: 800, color: index === activeIndex ? feature.hex : 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '4px' }}>
                                        0{index + 1} / 0{features.length}
                                    </span>
                                </div>
                                
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    <h3 style={{ fontSize: '32px', color: index === activeIndex ? feature.hex : '#fff', fontWeight: 900, lineHeight: 1.1, textAlign: 'left', margin: 0, transition: 'color 0.5s ease', letterSpacing: '-0.5px' }}>
                                        {feature.title.split(' ').map((word, i) => (
                                            <span key={i} style={{ display: 'block' }}>{word}</span>
                                        ))}
                                    </h3>
                                </div>

                                {/* Active 7-Second Progress Bar */}
                                {index === activeIndex && (
                                    <div style={{ width: '100%', height: '3px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden', marginTop: 'auto' }}>
                                        <div 
                                            key={activeIndex}
                                            style={{ 
                                                height: '100%', 
                                                background: feature.hex, 
                                                width: '100%', 
                                                animation: 'carouselProgress 7s linear forwards' 
                                            }} 
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="carousel-dots" style={{ marginTop: '12px' }}>
                        {features.map((_, idx) => (
                            <div 
                                key={idx} 
                                className={`carousel-dot ${idx === activeIndex ? 'active' : ''}`}
                                onClick={() => setActiveIndex(idx)}
                            />
                        ))}
                    </div>
                </div>

                {/* Right Side: Detailed Feature Info Panel */}
                <div className="home-glass feature-detail-panel" style={{ padding: '40px', borderRadius: '24px', position: 'relative', overflow: 'hidden', border: `1px solid ${activeFeature.hex}44`, background: 'rgba(15, 15, 22, 0.85)', backdropFilter: 'blur(20px)', transition: 'all 0.5s ease' }}>
                    <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '200px', height: '200px', background: activeFeature.hex, filter: 'blur(90px)', opacity: 0.25, pointerEvents: 'none' }}></div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
                        <span style={{ fontSize: '36px' }}>{activeFeature.icon}</span>
                        <span style={{ background: `${activeFeature.hex}22`, color: activeFeature.hex, border: `1px solid ${activeFeature.hex}66`, padding: '6px 14px', borderRadius: '99px', fontSize: '13px', fontWeight: 700, letterSpacing: '0.5px' }}>
                            {activeFeature.slogan}
                        </span>
                    </div>

                    <h3 style={{ fontSize: '34px', color: '#FFFFFF', fontWeight: 800, marginBottom: '16px', lineHeight: 1.1 }}>
                        {activeFeature.title}
                    </h3>

                    <p style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '16px', lineHeight: 1.7, marginBottom: '28px' }}>
                        {activeFeature.desc}
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                        {activeFeature.highlights.map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#F1F5F9', fontWeight: 600, fontSize: '14px' }}>
                                <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: activeFeature.hex, color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800 }}>✓</span>
                                {item}
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                        <div>
                            <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>Proven Outcome</div>
                            <div style={{ fontSize: '20px', fontWeight: 800, color: activeFeature.hex, marginTop: '2px' }}>{activeFeature.stat}</div>
                        </div>
                        <a className="home-btn-primary" href="#pricing" style={{ padding: '12px 24px', fontSize: '14px' }}>
                            Get Started Now &rarr;
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function Home() {
    const [loading, setLoading] = useState(false);
    const [rankStep, setRankStep] = useState(0);
    const [countersVisible, setCountersVisible] = useState(false);
    const [counterValues, setCounterValues] = useState({ businesses: 0, reviews: 0, keywords: 0 });
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [theme, setTheme] = useState<'light'|'dark'>('dark');
    const counterRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Automatically check if user is already logged in
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                window.location.href = '/dashboard';
            }
        });
    }, []);

    // IntersectionObserver for scroll-reveal sections
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('revealed');
                    }
                });
            },
            { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
        );

        const sections = document.querySelectorAll('.scroll-reveal');
        sections.forEach((el) => observer.observe(el));

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setRankStep(prev => prev >= 6 ? 0 : prev + 1);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !countersVisible) {
                setCountersVisible(true);
                const targets = { businesses: 500, reviews: 50000, keywords: 24000 };
                const duration = 2000;
                const startTime = Date.now();
                const tick = () => {
                    const elapsed = Date.now() - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    const eased = 1 - Math.pow(1 - progress, 3);
                    setCounterValues({
                        businesses: Math.floor(eased * targets.businesses),
                        reviews: Math.floor(eased * targets.reviews),
                        keywords: Math.floor(eased * targets.keywords),
                    });
                    if (progress < 1) requestAnimationFrame(tick);
                };
                requestAnimationFrame(tick);
            }
        }, { threshold: 0.3 });
        if (counterRef.current) observer.observe(counterRef.current);
        return () => observer.disconnect();
    }, [countersVisible]);

    const handleRankMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        setMousePos({ x: x * 10, y: -y * 10 });
    };
    const handleRankMouseLeave = () => setMousePos({ x: 0, y: 0 });

    const handleLogin = async (e: React.MouseEvent) => {
        e.preventDefault();
        setLoading(true);
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                scopes: 'https://www.googleapis.com/auth/business.manage',
                queryParams: { access_type: 'offline', prompt: 'consent' },
                redirectTo: `${window.location.origin}/dashboard`
            }
        });
    };

    const businesses = [
        { name: 'Rohini AC & Plumbing Services', rating: '4.9', reviews: 214, isYou: true },
        { name: 'Sharma Plumbing Co.', rating: '4.3', reviews: 82, isYou: false },
        { name: 'Delhi Quick Fix', rating: '4.1', reviews: 64, isYou: false },
        { name: 'City Pipe Experts', rating: '4.0', reviews: 51, isYou: false },
    ];
    const getRankedBusinesses = () => {
        const competitors = businesses.filter(b => !b.isYou);
        const you = businesses.find(b => b.isYou)!;
        let yourPosition: number;
        if (rankStep <= 0) yourPosition = 3;
        else if (rankStep === 1) yourPosition = 2;
        else if (rankStep === 2) yourPosition = 1;
        else yourPosition = 0;
        const result = [...competitors];
        result.splice(yourPosition, 0, you);
        return result;
    };

    return (
        <div className={`home-wrapper ${theme === 'light' ? 'light-theme' : ''}`}>
            <ScrollGuide />
            <div className="home-noise"></div>

            <header className="home-header">
                <nav className="home-glass home-nav">
                    <a className="home-logo" href="#">GBP Auto <span className="home-grad-blue">Master</span></a>
                    <ul className="home-navlinks">
                        <li><a href="#services">Features</a></li>
                        <li><a href="#how">How it Works</a></li>
                        <li><a href="#pricing">Pricing</a></li>
                    </ul>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <button className="home-login-btn" onClick={handleLogin} disabled={loading}>
                            <svg width="15" height="15" viewBox="0 0 48 48">
                                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.9 6 29.7 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.2-.1-2.4-.4-3.5z"/>
                                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 18.9 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.9 6 29.7 4 24 4 15.9 4 8.9 8.6 6.3 14.7z"/>
                                <path fill="#4CAF50" d="M24 44c5.6 0 10.7-2.1 14.5-5.7l-6.7-5.5C29.6 34.5 26.9 35.5 24 35.5c-5.2 0-9.6-3.3-11.3-7.9l-6.6 5.1C8.9 39.4 15.9 44 24 44z"/>
                                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.7 5.5C41.5 36 44 30.5 44 24c0-1.2-.1-2.4-.4-3.5z"/>
                            </svg>
                            {loading ? 'Connecting...' : 'Login with Google'}
                        </button>
                    </div>
                </nav>
            </header>

            {/* Continuous Feature Ticker Marquee */}
            <div className="home-ticker-wrap">
                <div className="home-ticker-inner">
                    {/* First set */}
                    <div className="home-ticker-item"><span>🚀</span> Auto-Reply to Reviews in 15ms</div>
                    <div className="home-ticker-item"><span>📈</span> Rank #1 on Google Maps</div>
                    <div className="home-ticker-item"><span>🎯</span> Smart SEO Keyword Injection</div>
                    <div className="home-ticker-item"><span>📸</span> Automated Photo Scheduler</div>
                    <div className="home-ticker-item"><span>⚔️</span> Live Competitor Tracking</div>
                    <div className="home-ticker-item"><span>🤖</span> 24/7 AI Local SEO Mentor</div>
                    {/* Duplicate set for seamless looping */}
                    <div className="home-ticker-item"><span>🚀</span> Auto-Reply to Reviews in 15ms</div>
                    <div className="home-ticker-item"><span>📈</span> Rank #1 on Google Maps</div>
                    <div className="home-ticker-item"><span>🎯</span> Smart SEO Keyword Injection</div>
                    <div className="home-ticker-item"><span>📸</span> Automated Photo Scheduler</div>
                    <div className="home-ticker-item"><span>⚔️</span> Live Competitor Tracking</div>
                    <div className="home-ticker-item"><span>🤖</span> 24/7 AI Local SEO Mentor</div>
                </div>
            </div>

            <section className="home-hero home-section" style={{ paddingTop: '80px', position: 'relative', overflow: 'hidden' }}>
                <MapCanvasBackground />
                <div className="home-glow" style={{ width: '640px', height: '640px', top: '-160px', left: '50%', transform: 'translateX(-50%)', background: 'radial-gradient(circle,rgba(59,130,246,.32) 0%,transparent 70%)' }}></div>
                <div className="home-glow" style={{ width: '380px', height: '380px', top: '160px', left: '-120px', background: 'radial-gradient(circle,rgba(52,168,83,.2) 0%,transparent 70%)' }}></div>
                <div className="home-glow" style={{ width: '340px', height: '340px', top: '260px', right: '-100px', background: 'radial-gradient(circle,rgba(249,115,22,.16) 0%,transparent 70%)' }}></div>

                <div className="home-wrap">
                    <span className="home-badge">✨ The #1 Local SEO Automation Engine in India</span>
                    <h1 className="home-grad-metal">Dominate Google Maps.<br/>On Absolute <span className="home-grad-blue">Autopilot.</span></h1>
                    <p style={{ marginTop: '14px', fontSize: '28px', fontWeight: 800, color: 'var(--blue-soft)' }}>Automate in less than 12/-</p>
                    <p>Connect your Google Business Profile in 1-click. Our AI instantly replies to your reviews, injects local SEO keywords, and pushes you to the #1 spot on Google Maps.</p>
                    <div className="home-cta-group">
                        <button className="home-btn-primary" onClick={handleLogin}>Start Your Free Demo →</button>
                        <a className="home-btn-secondary home-glass home-glass-hover" href="#how"><span className="home-play-circle">▶</span> See How It Works</a>
                    </div>

                    <div className="rank-card" onMouseMove={handleRankMouseMove} onMouseLeave={handleRankMouseLeave}>
                        <div className="rank-card-inner home-glass" style={{ transform: `perspective(1000px) rotateY(${mousePos.x}deg) rotateX(${mousePos.y}deg)` }}>
                            <div className="rank-searchbar">📍 plumber near me — Rohini, Delhi</div>
                            {getRankedBusinesses().map((biz, i) => (
                                <div key={biz.name} className={`rank-item ${biz.isYou ? 'active' : 'other'}`} style={{ order: i }}>
                                    <div className={`rank-num ${i === 0 ? 'top' : 'dim'}`}>{i + 1}</div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div className={biz.isYou ? 'rank-name' : 'rank-name-dim'}>{biz.name}</div>
                                        <div className="rank-meta">★ {biz.rating} · {biz.isYou && rankStep >= 3 ? biz.reviews + 3 : biz.reviews} reviews</div>
                                    </div>
                                    {biz.isYou && i === 0 && <div className="rank-badge">▲ +3</div>}
                                </div>
                            ))}
                        </div>
                        <div className="rank-glow"></div>
                        {rankStep >= 3 && <div className="rank-float-label home-glass">Rank #4 → <span className="home-grad-blue" style={{ fontWeight: 700 }}>#1</span></div>}
                    </div>
                </div>
            </section>

            <section className="social-proof-bar scroll-reveal" ref={counterRef}>
                <div className="home-wrap">
                    <div className="proof-stats">
                        <div className="proof-stat"><span className="proof-num">{counterValues.businesses.toLocaleString()}+</span><span className="proof-label">Businesses Automated</span></div>
                        <div className="proof-divider"></div>
                        <div className="proof-stat"><span className="proof-num">{counterValues.reviews.toLocaleString()}+</span><span className="proof-label">Reviews Replied</span></div>
                        <div className="proof-divider"></div>
                        <div className="proof-stat"><span className="proof-num">{counterValues.keywords.toLocaleString()}+</span><span className="proof-label">SEO Keywords Injected</span></div>
                    </div>
                </div>
            </section>

            <section className="home-promo-section scroll-reveal" style={{ padding: '0 20px 16px' }}>
                <div className="home-wrap" style={{ maxWidth: '900px' }}>
                    <div className="home-promo-strip home-glass home-glass-hover">
                        <div className="home-promo-left">
                            <div className="home-promo-icon">✨</div>
                            <div>
                                <div className="home-promo-title" style={{ fontSize: '36px', fontWeight: 900 }}>Automate in <span className="home-grad-blue">less than 12/-</span></div>
                                <div className="home-promo-sub" style={{ fontSize: '16px' }}>Use the promo code below to claim your discount.</div>
                            </div>
                        </div>
                        <a className="home-btn-primary home-promo-cta" href="#pricing">Claim the Offer →</a>
                    </div>
                </div>
            </section>

            <section id="services" className="home-section scroll-reveal" style={{ position: 'relative', overflow: 'hidden' }}>
                <div className="home-wrap">
                    <div className="home-center" style={{ marginBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '12px' }}>
                            <div style={{ height: '2px', width: '40px', background: '#E8A820' }}></div>
                            <span style={{ color: '#E8A820', fontWeight: 700, letterSpacing: '2px', fontSize: '13px', textTransform: 'uppercase' }}>What We Offer</span>
                            <div style={{ height: '2px', width: '40px', background: '#E8A820' }}></div>
                        </div>
                        <h2 style={{ fontSize: '48px', color: '#fff', fontWeight: 800 }}>Arsenal of <span style={{ color: '#E8A820' }}>automation</span></h2>
                    </div>
                    <FeatureCarousel />
                </div>
            </section>
            
            <RocketGrowthGraph />

            <section id="how" className="home-section scroll-reveal">
                <div className="home-wrap">
                    <div className="home-center"><h2 className="home-grad-metal" style={{ fontSize: '32px' }}>Three steps. Zero effort.</h2></div>
                    <div className="home-grid3">
                        <div className="home-card home-glass home-glass-hover">
                            <div className="home-step-num">01</div>
                            <div className="home-icon-box home-icon-blue" style={{ marginTop: '14px' }}>🔗</div>
                            <h3>Connect your GBP</h3>
                            <p>Sign in with Google and link your Business Profile in under 60 seconds. No code, no hassle.</p>
                        </div>
                        <div className="home-card home-glass home-glass-hover">
                            <div className="home-step-num">02</div>
                            <div className="home-icon-box home-icon-blue" style={{ marginTop: '14px' }}>🤖</div>
                            <h3>AI takes over</h3>
                            <p>Our engine starts replying to reviews, weaving in local keywords, and queuing your photo drops.</p>
                        </div>
                        <div className="home-card home-glass home-glass-hover">
                            <div className="home-step-num">03</div>
                            <div className="home-icon-box home-icon-blue" style={{ marginTop: '14px' }}>🚀</div>
                            <h3>Watch your rank climb</h3>
                            <p>Track your Maps position rise in your dashboard, week over week, without lifting a finger.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section id="pricing" className="home-section scroll-reveal">
                <div className="home-glow" style={{ width: '560px', height: '560px', top: '0', left: '50%', transform: 'translateX(-50%)', background: 'radial-gradient(circle,rgba(59,130,246,.32) 0%,transparent 70%)' }}></div>
                <div className="home-wrap">
                    <div className="home-center"><h2 className="home-grad-metal" style={{ fontSize: '32px' }}>Cheaper than a newspaper ad.<br/>Better than an SEO agency.</h2></div>
                    
                    <div className="pricing-rocket-container">
                        <svg width="60" height="60" viewBox="0 0 64 64" fill="none">
                            {/* Rocket Body */}
                            <path d="M 32 8 C 40 20 42 34 42 44 L 22 44 C 22 34 24 20 32 8 Z" fill="#1F2937" stroke="#4B5563" strokeWidth="2" strokeLinejoin="round" />
                            {/* Rocket Window */}
                            <circle cx="32" cy="28" r="5" fill="#111827" stroke="#60A5FA" strokeWidth="2" />
                            {/* Rocket Fins */}
                            <path d="M 22 38 L 14 48 L 22 44 Z" fill="#374151" stroke="#4B5563" strokeWidth="1" strokeLinejoin="round" />
                            <path d="M 42 38 L 50 48 L 42 44 Z" fill="#374151" stroke="#4B5563" strokeWidth="1" strokeLinejoin="round" />
                            {/* Rocket Engine */}
                            <path d="M 28 44 L 36 44 L 34 48 L 30 48 Z" fill="#4B5563" />
                            {/* Fire */}
                            <path d="M 28 48 Q 32 60 36 48 Q 32 54 28 48 Z" fill="#EF4444">
                                <animate attributeName="fill" values="#EF4444;#F59E0B;#EF4444" dur="0.2s" repeatCount="indefinite" />
                            </path>
                        </svg>
                    </div>

                    <div className="home-price-grid">
                        <div className="price-card home-glass home-glass-hover" style={{ position: 'relative' }}>
                            <div className="plan-badge popular">MOST POPULAR</div>
                            <div className="plan-label">Half-Yearly</div>
                            <div className="price-strike">₹3,000</div>
                            <div className="price-amount"><span className="amt">₹2,099</span></div>
                            <div className="price-perday">₹9.4 / day</div>
                            <div style={{ fontSize: '11px', color: 'var(--blue-soft)', fontWeight: 'bold', marginTop: '4px', marginBottom: '8px' }}>+ First Time Discount Applied</div>
                            <div className="price-sub">Billed every 6 months.</div>
                            <ul className="price-features home-feat-list">
                                <li><span className="home-check blue">✓</span>24/7 AI Local SEO Mentor</li>
                                <li><span className="home-check blue">✓</span>Auto AI Review Replies</li>
                                <li><span className="home-check blue">✓</span>Target Keyword Discovery</li>
                                <li><span className="home-check blue">✓</span>Automated Content Calendar</li>
                                <li><span className="home-check blue">✓</span>Detailed Growth Analytics</li>
                                <li><span className="home-check blue">✓</span>1 GBP Location</li>
                                <li><span className="home-check blue">✓</span>Priority Support</li>
                            </ul>
                            <button className="price-btn ghost" onClick={handleLogin}>Start Free Demo</button>
                        </div>
                        <div className="price-card best home-glass home-glass-hover winner">
                            <div className="plan-badge best winner">BEST VALUE</div>
                            <div className="plan-label blue">Yearly</div>
                            <div className="price-strike">₹4,380</div>
                            <div className="price-amount"><span className="amt">₹3,999</span></div>
                            <div className="price-perday">₹10.9 / day</div>
                            <div style={{ fontSize: '11px', color: 'var(--green)', fontWeight: 'bold', marginTop: '4px', marginBottom: '8px' }}>+ First Time Discount Applied</div>
                            <div className="price-sub">Billed once a year.</div>
                            <ul className="price-features home-feat-list">
                                <li><span className="home-check green">✓</span>24/7 AI Local SEO Mentor</li>
                                <li><span className="home-check green">✓</span>Auto AI Review Replies</li>
                                <li><span className="home-check green">✓</span>Target Keyword Discovery</li>
                                <li><span className="home-check green">✓</span>Automated Content Calendar</li>
                                <li><span className="home-check green">✓</span>Detailed Growth Analytics</li>
                                <li><span className="home-check green">✓</span>1 GBP Location</li>
                                <li><span className="home-check green">✓</span>Priority Support</li>
                                <li style={{ fontWeight: 'bold', color: '#fff', background: 'rgba(52,168,83,0.1)', padding: '6px 12px', borderRadius: '8px', marginLeft: '-12px' }}><span className="home-check green">⭐</span>Live Competitor Leaderboard</li>
                            </ul>
                            <button className="price-btn solid" onClick={handleLogin}>Start Free Demo</button>
                        </div>
                    </div>

                    <div className="home-promo-banner home-glass">
                        <div style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>Automate in <span className="home-grad-blue">less than 12/-</span></div>
                        <button className="home-promo-code-btn" onClick={(e) => {
                            navigator.clipboard.writeText('FIRSTUNDER10');
                            const target = e.currentTarget;
                            const original = target.innerHTML;
                            target.innerHTML = 'Copied! ✓';
                            setTimeout(() => { target.innerHTML = original; }, 1800);
                        }}>Use code <code>FIRSTUNDER10</code> 📋</button>
                    </div>
                </div>
            </section>


            <div className="home-divider"></div>
            <div className="home-footer-row">
                <div className="home-logo" style={{ fontSize: '15px' }}>GBP Auto <span className="home-grad-blue">Master</span></div>
                <div className="home-copyright">© 2026 gbpautomaster.in. All rights reserved.</div>
                <div className="home-footer-links" style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <a href="/privacy" onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', '/privacy'); window.dispatchEvent(new Event('popstate')); }}>Privacy Policy</a>
                    <a href="/terms" onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', '/terms'); window.dispatchEvent(new Event('popstate')); }}>Terms of Service</a>
                    <a href="/refund" onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', '/refund'); window.dispatchEvent(new Event('popstate')); }}>Cancellation & Refund Policy</a>
                </div>
            </div>
        </div>
    );
}
