import { useEffect, useState, useRef } from 'react';
import { supabase } from './lib/supabase';
import Scene3D from './Scene3D';
import ScrollGuide from './ScrollGuide';
import './Home.css';

export default function Home() {
    const [loading, setLoading] = useState(false);
    const [rankStep, setRankStep] = useState(0);
    const [countersVisible, setCountersVisible] = useState(false);
    const [counterValues, setCounterValues] = useState({ businesses: 0, reviews: 0, keywords: 0 });
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
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
        <div className="home-wrapper">
            <Scene3D />
            <div className="home-canvas-overlay"></div>
            <ScrollGuide />
            <div className="home-noise"></div>

            <header className="home-header">
                <nav className="home-glass home-nav">
                    <a className="home-logo" href="#">GBP Auto <span className="home-grad-blue">Master</span></a>
                    <ul className="home-navlinks">
                        <li>Features</li><li>How it Works</li><li>Pricing</li>
                    </ul>
                    <button className="home-login-btn" onClick={handleLogin} disabled={loading}>
                        <svg width="15" height="15" viewBox="0 0 48 48">
                            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.9 6 29.7 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.2-.1-2.4-.4-3.5z"/>
                            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 18.9 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.9 6 29.7 4 24 4 15.9 4 8.9 8.6 6.3 14.7z"/>
                            <path fill="#4CAF50" d="M24 44c5.6 0 10.7-2.1 14.5-5.7l-6.7-5.5C29.6 34.5 26.9 35.5 24 35.5c-5.2 0-9.6-3.3-11.3-7.9l-6.6 5.1C8.9 39.4 15.9 44 24 44z"/>
                            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.7 5.5C41.5 36 44 30.5 44 24c0-1.2-.1-2.4-.4-3.5z"/>
                        </svg>
                        {loading ? 'Connecting...' : 'Login with Google'}
                    </button>
                </nav>
            </header>

            <section className="home-hero home-section">
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

            <section id="what-we-give" className="home-section scroll-reveal">
                <div className="home-wrap">
                    <div className="home-center"><h2 className="home-grad-metal" style={{ fontSize: '32px' }}>What We Give You.</h2></div>
                    <div className="home-grid3">
                        <div className="feature-card home-glass">
                            <svg className="home-icon-box" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '48px', height: '48px', color: 'var(--blue)' }}>
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14">
                                    <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="5s" repeatCount="indefinite" />
                                </polyline>
                            </svg>
                            <h3 className="home-grad-blue" style={{ fontSize: '24px' }}>24/7 Autopilot</h3>
                            <p style={{ marginTop: '10px' }}>We give you your time back. Never worry about replying to another Google review manually. Our engine works around the clock.</p>
                        </div>
                        <div className="feature-card home-glass">
                            <svg className="home-icon-box" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '48px', height: '48px', color: 'var(--orange)' }}>
                                <circle cx="12" cy="12" r="10"></circle>
                                <circle cx="12" cy="12" r="6"></circle>
                                <circle cx="12" cy="12" r="2"></circle>
                                <path d="M12 2v2"/><path d="M12 20v2"/><path d="M2 12h2"/><path d="M20 12h2"/>
                            </svg>
                            <h3 className="home-grad-blue" style={{ fontSize: '24px' }}>Local Dominance</h3>
                            <p style={{ marginTop: '10px' }}>We give you the #1 spot. By automatically injecting the exact keywords your customers search for into your replies.</p>
                        </div>
                        <div className="feature-card home-glass">
                            <svg className="home-icon-box" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '48px', height: '48px', color: 'var(--green)' }}>
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                                <polyline points="9 12 11 14 15 10"></polyline>
                            </svg>
                            <h3 className="home-grad-blue" style={{ fontSize: '24px' }}>Peace of Mind</h3>
                            <p style={{ marginTop: '10px' }}>We give you a bulletproof reputation. Our AI handles negative feedback gracefully and amplifies 5-star praise.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section id="features" className="home-section scroll-reveal">
                <div className="home-glow" style={{ width: '420px', height: '420px', top: '40px', left: '25%', background: 'radial-gradient(circle,rgba(52,168,83,.2) 0%,transparent 70%)' }}></div>
                <div className="home-wrap">
                    <div className="home-center"><h2 className="home-grad-metal" style={{ fontSize: '32px' }}>Everything you need to outrank your competitors.</h2></div>
                    <div className="home-grid3">
                        <div className="feature-card home-glass home-glass-hover">
                            <svg className="home-icon-box" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '48px', height: '48px', color: 'var(--blue)' }}>
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                <animateTransform attributeName="transform" type="translate" values="0,0; 2,-2; 0,0" dur="2s" repeatCount="indefinite" />
                            </svg>
                            <h3>Zero-Effort Local SEO</h3>
                            <p>Our AI injects high-value keywords like "Emergency Plumber" into every review reply automatically.</p>
                            <div className="feature-stat"><span style={{ fontWeight: 800, fontSize: '20px', color: 'var(--blue)' }}>2,400+</span> <span style={{ fontSize: '14px', color: 'rgba(255,255,255,.6)' }}>keywords injected</span></div>
                        </div>
                        <div className="feature-card home-glass home-glass-hover">
                            <svg className="home-icon-box" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '48px', height: '48px', color: 'var(--orange)' }}>
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z">
                                    <animate attributeName="opacity" values="1;0.2;1" dur="2s" repeatCount="indefinite"/>
                                </path>
                            </svg>
                            <h3>Instant Review Replies</h3>
                            <p>Show customers you care. The AI replies to 5-star reviews instantly with empathy.</p>
                            <div className="feature-stat"><span style={{ fontWeight: 800, fontSize: '20px', color: 'var(--orange)' }}>&lt;15ms</span> <span style={{ fontSize: '14px', color: 'rgba(255,255,255,.6)' }}>avg reply time</span></div>
                        </div>
                        <div className="feature-card home-glass home-glass-hover">
                            <svg className="home-icon-box" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '48px', height: '48px', color: 'var(--green)' }}>
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                <polyline points="21 15 16 10 5 21"></polyline>
                            </svg>
                            <h3>Auto-Pilot Photos</h3>
                            <p>Bulk upload your photos once, and we drip-feed them to your Google Gallery all month long.</p>
                            <div className="feature-stat"><span style={{ fontWeight: 800, fontSize: '20px', color: 'var(--green)' }}>1,200+</span> <span style={{ fontSize: '14px', color: 'rgba(255,255,255,.6)' }}>photos scheduled</span></div>
                        </div>
                    </div>
                </div>
            </section>

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
                    <div className="home-price-grid">
                        <div className="price-card home-glass home-glass-hover">
                            <div className="plan-label">Monthly</div>
                            <div className="price-strike">₹360</div>
                            <div className="price-amount"><span className="amt">₹289</span></div>
                            <div className="price-perday">₹9.6 / day</div>
                            <div style={{ fontSize: '11px', color: 'var(--blue-soft)', fontWeight: 'bold', marginTop: '4px', marginBottom: '8px' }}>+ First Time Discount Applied</div>
                            <div className="price-sub">Billed every month. Cancel anytime.</div>
                            <ul className="price-features home-feat-list">
                                <li><span className="home-check blue">✓</span>AI Review Replies</li>
                                <li><span className="home-check blue">✓</span>Keyword Discovery</li>
                                <li><span className="home-check blue">✓</span>Photo Scheduler</li>
                                <li><span className="home-check blue">✓</span>1 GBP Location</li>
                            </ul>
                            <button className="price-btn ghost" onClick={handleLogin}>Start Free Demo</button>
                        </div>
                        <div className="price-card home-glass home-glass-hover" style={{ position: 'relative' }}>
                            <div className="plan-badge popular">MOST POPULAR</div>
                            <div className="plan-label">Half-Yearly</div>
                            <div className="price-strike">₹2,160</div>
                            <div className="price-amount"><span className="amt">₹1,649</span></div>
                            <div className="price-perday">₹9.1 / day</div>
                            <div style={{ fontSize: '11px', color: 'var(--blue-soft)', fontWeight: 'bold', marginTop: '4px', marginBottom: '8px' }}>+ First Time Discount Applied</div>
                            <div className="price-sub">Billed every 6 months.</div>
                            <ul className="price-features home-feat-list">
                                <li><span className="home-check blue">✓</span>AI Review Replies</li>
                                <li><span className="home-check blue">✓</span>Keyword Discovery</li>
                                <li><span className="home-check blue">✓</span>Photo Scheduler</li>
                                <li><span className="home-check blue">✓</span>1 GBP Location</li>
                                <li><span className="home-check blue">✓</span>Priority Support</li>
                            </ul>
                            <button className="price-btn ghost" onClick={handleLogin}>Start Free Demo</button>
                        </div>
                        <div className="price-card best home-glass home-glass-hover winner">
                            <div className="plan-badge best winner">BEST VALUE</div>
                            <div className="plan-label blue">Yearly</div>
                            <div className="price-strike">₹4,380</div>
                            <div className="price-amount"><span className="amt">₹3,149</span></div>
                            <div className="price-perday">₹8.6 / day</div>
                            <div style={{ fontSize: '11px', color: 'var(--green)', fontWeight: 'bold', marginTop: '4px', marginBottom: '8px' }}>+ First Time Discount Applied</div>
                            <div className="price-sub">Billed once a year.</div>
                            <ul className="price-features home-feat-list">
                                <li><span className="home-check green">✓</span>AI Review Replies</li>
                                <li><span className="home-check green">✓</span>Keyword Discovery</li>
                                <li><span className="home-check green">✓</span>Photo Scheduler</li>
                                <li><span className="home-check green">✓</span>1 GBP Location</li>
                                <li><span className="home-check green">✓</span>Priority Support</li>
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

            <section id="contact" className="home-section scroll-reveal">
                <div className="home-wrap">
                    <div className="home-card home-glass" style={{ textAlign: 'center', padding: '60px 20px' }}>
                        <h2 className="home-grad-metal" style={{ fontSize: '32px', marginBottom: '8px' }}>Contact Details</h2>
                        <p style={{ fontSize: '18px', fontWeight: 600, color: 'var(--blue-soft)', margin: '0 0 4px' }}>Ayush Sony</p>
                        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,.7)', marginBottom: '30px' }}>Freelancer and skilled person</p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', flexWrap: 'wrap' }}>
                            <div>
                                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,.5)' }}>Email Us</p>
                                <p style={{ fontSize: '18px', fontWeight: 600, marginTop: '4px' }} className="home-grad-blue">ayushsony126@gmail.com</p>
                            </div>
                            <div>
                                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,.5)' }}>Call Us (India)</p>
                                <p style={{ fontSize: '18px', fontWeight: 600, marginTop: '4px' }}>+91 93720 60163</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <div className="home-divider"></div>
            <div className="home-footer-row">
                <div className="home-logo" style={{ fontSize: '15px' }}>GBP Auto <span className="home-grad-blue">Master</span></div>
                <div className="home-copyright">© 2026 gbpautomaster.in. All rights reserved.</div>
                <div className="home-footer-links" style={{ display: 'flex', gap: '24px' }}>
                    <a href="/privacy">Privacy</a>
                    <a href="/terms">Terms</a>
                    <a href="/refund">Refunds</a>
                    <a href="#contact">Contact</a>
                </div>
            </div>
        </div>
    );
}
