import { useEffect, useState, useRef } from 'react';
import { supabase } from './lib/supabase';
import Scene3D from './Scene3D';
import ScrollGuide from './ScrollGuide';
import './Home.css';

export default function Home() {
    const [loading, setLoading] = useState(false);

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

                    <div className="home-mockup-wrap">
                        <div className="home-glass" style={{ borderRadius: '24px', padding: '20px' }}>
                            <div className="home-searchbar">📍 plumber near me — Rohini, Delhi</div>
                            <div className="home-rank-item top">
                                <div className="home-rank-num">1</div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div className="home-rank-name">Rohini AC &amp; Plumbing Services</div>
                                    <div className="home-rank-meta">★ 4.9 · 214 reviews</div>
                                </div>
                                <div className="home-rank-badge">▲ +3</div>
                            </div>
                            <div className="home-rank-item other">
                                <div className="home-rank-num">2</div>
                                <div><div className="home-rank-name" style={{ fontWeight: 400, fontSize: '13px' }}>Sharma Plumbing Co.</div><div className="home-rank-meta">★ 4.3 · 82 reviews</div></div>
                            </div>
                            <div className="home-rank-item other">
                                <div className="home-rank-num">3</div>
                                <div><div className="home-rank-name" style={{ fontWeight: 400, fontSize: '13px' }}>Delhi Quick Fix</div><div className="home-rank-meta">★ 4.1 · 64 reviews</div></div>
                            </div>
                            <div className="home-rank-item other">
                                <div className="home-rank-num">4</div>
                                <div><div className="home-rank-name" style={{ fontWeight: 400, fontSize: '13px' }}>City Pipe Experts</div><div className="home-rank-meta">★ 4.0 · 51 reviews</div></div>
                            </div>
                        </div>
                        <div className="home-float-badge home-glass">Rank #4 → <span className="home-grad-blue" style={{ fontWeight: 700 }}>#1</span></div>
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
                        <div className="home-card home-glass">
                            <h3 className="home-grad-blue" style={{ fontSize: '24px' }}>24/7 Autopilot</h3>
                            <p style={{ marginTop: '10px' }}>We give you your time back. Never worry about replying to another Google review manually. Our engine works around the clock.</p>
                        </div>
                        <div className="home-card home-glass">
                            <h3 className="home-grad-blue" style={{ fontSize: '24px' }}>Local Dominance</h3>
                            <p style={{ marginTop: '10px' }}>We give you the #1 spot. By automatically injecting the exact keywords your customers search for into your replies.</p>
                        </div>
                        <div className="home-card home-glass">
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
                        <div className="home-card home-glass home-glass-hover">
                            <div className="home-icon-box home-icon-blue">🧠</div>
                            <h3>Zero-Effort Local SEO.</h3>
                            <p>Our AI injects high-value keywords like "Emergency Plumber" into every review reply automatically.</p>
                        </div>
                        <div className="home-card home-glass home-glass-hover">
                            <div className="home-icon-box home-icon-orange">⚡</div>
                            <h3>Instant Review Replies.</h3>
                            <p>Show customers you care. The AI replies to 5-star reviews instantly with empathy.</p>
                        </div>
                        <div className="home-card home-glass home-glass-hover">
                            <div className="home-icon-box home-icon-green">📅</div>
                            <h3>Auto-Pilot Photos.</h3>
                            <p>Bulk upload your photos once, and we drip-feed them to your Google Gallery all month long.</p>
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
                        <div className="home-price-card home-glass home-glass-hover">
                            <div className="home-plan-label">Monthly</div>
                            <div className="home-price-strike">₹360</div>
                            <div className="home-price-num"><span className="amt">₹289</span></div>
                            <div className="home-price-perday">₹9.6 / day</div>
                            <div style={{ fontSize: '11px', color: 'var(--blue-soft)', fontWeight: 'bold', marginTop: '4px', marginBottom: '8px' }}>+ First Time Discount Applied</div>
                            <div className="home-price-sub">Billed every month. Cancel anytime.</div>
                            <ul className="home-feat-list">
                                <li><span className="home-check blue">✓</span>AI Review Replies</li>
                                <li><span className="home-check blue">✓</span>Keyword Discovery</li>
                                <li><span className="home-check blue">✓</span>Photo Scheduler</li>
                                <li><span className="home-check blue">✓</span>1 GBP Location</li>
                            </ul>
                            <button className="home-price-btn ghost" onClick={handleLogin}>Start Free Demo</button>
                        </div>
                        <div className="home-price-card home-glass home-glass-hover" style={{ position: 'relative' }}>
                            <div className="home-plan-badge">MOST POPULAR</div>
                            <div className="home-plan-label">Half-Yearly</div>
                            <div className="home-price-strike">₹2,160</div>
                            <div className="home-price-num"><span className="amt">₹1,649</span></div>
                            <div className="home-price-perday">₹9.1 / day</div>
                            <div style={{ fontSize: '11px', color: 'var(--blue-soft)', fontWeight: 'bold', marginTop: '4px', marginBottom: '8px' }}>+ First Time Discount Applied</div>
                            <div className="home-price-sub">Billed every 6 months.</div>
                            <ul className="home-feat-list">
                                <li><span className="home-check blue">✓</span>AI Review Replies</li>
                                <li><span className="home-check blue">✓</span>Keyword Discovery</li>
                                <li><span className="home-check blue">✓</span>Photo Scheduler</li>
                                <li><span className="home-check blue">✓</span>1 GBP Location</li>
                                <li><span className="home-check blue">✓</span>Priority Support</li>
                            </ul>
                            <button className="home-price-btn ghost" onClick={handleLogin}>Start Free Demo</button>
                        </div>
                        <div className="home-price-card home-glass home-glass-hover winner">
                            <div className="home-plan-badge winner">BEST VALUE</div>
                            <div className="home-plan-label blue">Yearly</div>
                            <div className="home-price-strike">₹4,380</div>
                            <div className="home-price-num"><span className="amt">₹3,149</span></div>
                            <div className="home-price-perday">₹8.6 / day</div>
                            <div style={{ fontSize: '11px', color: 'var(--green)', fontWeight: 'bold', marginTop: '4px', marginBottom: '8px' }}>+ First Time Discount Applied</div>
                            <div className="home-price-sub">Billed once a year.</div>
                            <ul className="home-feat-list">
                                <li><span className="home-check green">✓</span>AI Review Replies</li>
                                <li><span className="home-check green">✓</span>Keyword Discovery</li>
                                <li><span className="home-check green">✓</span>Photo Scheduler</li>
                                <li><span className="home-check green">✓</span>1 GBP Location</li>
                                <li><span className="home-check green">✓</span>Priority Support</li>
                            </ul>
                            <button className="home-price-btn solid" onClick={handleLogin}>Start Free Demo</button>
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
