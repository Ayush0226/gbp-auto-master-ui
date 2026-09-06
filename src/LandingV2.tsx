import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './lib/supabase';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';
import './LandingV2.css';

const ParticleField = () => {
  const ref = useRef<any>();
  const [sphere] = useState(() => {
    const positions = new Float32Array(3000 * 3);
    for (let i = 0; i < 3000; i++) {
      const r = 2.5 * Math.cbrt(Math.random());
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    return positions;
  });

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta / 10;
      ref.current.rotation.y -= delta / 15;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false}>
        <PointMaterial transparent color="#2F6FFF" size={0.015} sizeAttenuation={true} depthWrite={false} />
      </Points>
    </group>
  );
};

const AutoScroller = () => {
  const reviews = [
    { author: "Rahul M.", text: "Absolutely brilliant service. My AC was fixed in 30 minutes.", reply: "Thank you Rahul! We always strive for 30-min AC repair across Delhi." },
    { author: "Sneha P.", text: "The team was very professional and the pricing was fair.", reply: "Thanks Sneha! Fair pricing and professional plumbing is our promise." },
    { author: "Amit K.", text: "Highly recommend for anyone needing quick electrical work.", reply: "Appreciate it Amit! Our electricians are always on standby." },
    { author: "Priya S.", text: "Great experience. Clean, fast, and polite.", reply: "Thank you Priya! We're glad you loved the fast service." },
  ];
  
  // Duplicate to create seamless infinite loop
  const loopReviews = [...reviews, ...reviews, ...reviews];

  return (
    <div className="lv2-scroller-container lv2-fade-up lv2-delay-1">
      <div className="lv2-scroller-track">
        {loopReviews.map((r, i) => (
          <div key={i} className="lv2-review-card">
            <div className="lv2-review-header">
              <div className="lv2-review-author">
                <div className="lv2-avatar">{r.author.charAt(0)}</div>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>{r.author}</div>
              </div>
              <div className="lv2-stars">★★★★★</div>
            </div>
            <div style={{ fontSize: '13.5px', color: 'var(--lv2-muted-on-dark)' }}>"{r.text}"</div>
            <div className="lv2-ai-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20"></path><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
              Auto-Replied in 1.2s
            </div>
            <div style={{ fontSize: '13px', color: '#fff', borderLeft: '2px solid var(--lv2-blue)', paddingLeft: '10px', marginTop: '4px' }}>
              {r.reply}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const LandingV2: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [loadingLogin, setLoadingLogin] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // IntersectionObserver for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    const elements = containerRef.current?.querySelectorAll('.lv2-fade-up');
    elements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  // Google OAuth Login
  const handleGoogleLogin = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    try {
      setLoadingLogin(true);
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'https://www.googleapis.com/auth/business.manage',
          queryParams: { access_type: 'offline', prompt: 'consent' },
          redirectTo: `${window.location.origin}/dashboard-v2`,
        },
      });
    } catch (err) {
      console.error('Login error:', err);
      setLoadingLogin(false);
    }
  };

  const toggleFaq = (index: number) => {
    setOpenFaq((prev) => (prev === index ? null : index));
  };

  const faqs = [
    {
      q: 'Do I need technical skills to connect my Google Business Profile?',
      a: 'No. You simply click "Login with Google" and approve permissions. Our system automatically discovers your locations and begins syncing within seconds.',
    },
    {
      q: 'What happens if I run out of tokens before my monthly reset?',
      a: 'Your dashboard remains 100% accessible! Only automated AI actions pause. You can purchase a ₹500 top-up pack for 450 tokens anytime to instantly resume automated review replies.',
    },
    {
      q: 'Can I use the app without buying a monthly subscription?',
      a: 'Yes! You can explore the dashboard, use free starting tokens, or buy a ₹500 pay-as-you-go pack. You are never forced into an upfront subscription.',
    },
    {
      q: 'What is the difference between Half-Yearly and Yearly plans?',
      a: 'The Half-Yearly plan provides 600 tokens/month. The Yearly plan provides 750 tokens/month and unlocks the exclusive Live Competitor Leaderboard to track 4 local businesses in your category.',
    },
    {
      q: 'Will replies sound like real humans or generic robotic bots?',
      a: 'Replies are drafted using advanced localized language models. You choose the tone (Professional, Friendly, Empathetic), and you can set exact SEO keywords for the AI to weave into each reply.',
    },
  ];

  return (
    <div className="landing-v2-container" ref={containerRef}>
      {/* Navigation */}
      <header className="lv2-nav">
        <div className="lv2-nav-row">
          <a href="/v2" className="lv2-logo">
            <span className="lv2-logo-mark">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </span>
            <span>GBP Auto Master</span>
          </a>

          <nav className="lv2-nav-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
          </nav>

          <div className="lv2-nav-cta">
            <a href="/dashboard" className="lv2-btn lv2-btn-ghost">
              Dashboard
            </a>
            <button
              onClick={handleGoogleLogin}
              disabled={loadingLogin}
              className="lv2-btn lv2-btn-primary"
            >
              {loadingLogin ? 'Connecting...' : 'Start Free'}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="lv2-hero">
        <div className="lv2-canvas-container">
          <Canvas camera={{ position: [0, 0, 3] }}>
            <ParticleField />
          </Canvas>
        </div>
        
        <div className="lv2-wrap">
          <div className="lv2-fade-up">
            <div className="lv2-tag-free">✨ Free Access &bull; Token-Based Freedom</div>
            <h1 style={{ position: 'relative', zIndex: 10 }}>Your Google reviews, answered on autopilot.</h1>
            <p className="lv2-lead" style={{ position: 'relative', zIndex: 10 }}>
              Connect your Google Business Profile, earn or top-up tokens, and let AI reply to reviews, inject SEO keywords, and boost your Map Pack rankings. Never locked behind a forced paywall.
            </p>

            <div className="lv2-cta-row" style={{ position: 'relative', zIndex: 10 }}>
              <button
                onClick={handleGoogleLogin}
                disabled={loadingLogin}
                className="lv2-btn lv2-btn-primary"
                style={{ fontSize: '16px', padding: '14px 28px' }}
              >
                {loadingLogin ? 'Connecting...' : 'Connect With Google — Free'}
              </button>
              <a href="#pricing" className="lv2-btn lv2-btn-ghost" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.25)' }}>
                View Token Plans
              </a>
            </div>

            <div className="lv2-response-promise" style={{ position: 'relative', zIndex: 10 }}>
              <span style={{ fontSize: '20px' }}>⏱</span>
              <span>
                <strong>Response-Time Promise:</strong> AI drafts personalized responses within minutes of customer reviews landing on your profile.
              </span>
            </div>
          </div>

          {/* Auto Scroller (Replacing the Token Meter) */}
          <AutoScroller />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="lv2-section">
        <div className="lv2-wrap">
          <div className="lv2-section-head lv2-fade-up">
            <h2>Everything your Google profile needs, 24/7 on autopilot</h2>
            <p>One unified dashboard. Five background systems keeping your local business ranking in the Google Map 3-Pack.</p>
          </div>

          <div className="lv2-features-grid">
            <div className="lv2-feature-card bento-wide lv2-fade-up">
              <div className="lv2-feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.38 8.38 0 0 1-8.5-8.5A8.38 8.38 0 0 1 12.5 3a8.38 8.38 0 0 1 8.5 8.5Z" />
                </svg>
              </div>
              <div>
                <h3>AI Auto-Replier</h3>
                <p>Detects every customer review instantly and generates thoughtful, customized responses matching your preferred tone (Professional, Friendly, or Empathetic).</p>
              </div>
            </div>

            <div className="lv2-feature-card bento-standard lv2-fade-up lv2-delay-1">
              <div className="lv2-feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3v18h18M8 17V10m5 7V6m5 11v-4" />
                </svg>
              </div>
              <div>
                <h3>Performance Analytics</h3>
                <p>Tracks search impressions, direction requests, phone calls, and website visits.</p>
              </div>
            </div>

            <div className="lv2-feature-card bento-standard lv2-fade-up">
              <div className="lv2-feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="17" rx="2" />
                  <path d="M3 9h18M8 3v3M16 3v3" />
                </svg>
              </div>
              <div>
                <h3>Content Calendar</h3>
                <p>Plan and auto-drip updates and photos during Google's peak search hours.</p>
              </div>
            </div>

            <div className="lv2-feature-card bento-wide lv2-fade-up lv2-delay-1">
              <div className="lv2-feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm10 17-4.35-4.35" />
                </svg>
              </div>
              <div>
                <h3>Local SEO Keyword Injection</h3>
                <p>Naturally inserts your chosen high-converting local search phrases (e.g. "best dental clinic") into review replies to elevate Map Pack prominence.</p>
              </div>
            </div>

            <div className="lv2-feature-card bento-full lv2-fade-up">
              <div className="lv2-feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 3v3m0 12v3m9-9h-3M6 12H3m14.6-6.6-2.1 2.1M8.5 15.5l-2.1 2.1m11.2 0-2.1-2.1M8.5 8.5 6.4 6.4" />
                </svg>
              </div>
              <div>
                <h3>AI SEO Consultant Chatbot</h3>
                <p>Ask tactical questions about your local SEO anytime. The AI inspects your profile data and delivers actionable ranking advice without expensive agency fees.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works — Dark Zigzag Timeline */}
      <section id="how-it-works" className="lv2-section lv2-how-section">
        <div className="lv2-wrap">
          <div className="lv2-section-head lv2-fade-up">
            <h2>How it works: A seamless automated flow</h2>
            <p>Runs automatically in the background while you focus on serving your customers.</p>
          </div>

          <div className="lv2-timeline">
            <div className="lv2-timeline-step lv2-fade-up">
              <div className="lv2-timeline-node">
                <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
              </div>
              <div className="lv2-timeline-content">
                <div className="lv2-timeline-num">Step 01</div>
                <h4>Review Arrives</h4>
                <p>Google notifies your profile of a new customer rating or written review in real time.</p>
              </div>
            </div>

            <div className="lv2-timeline-step lv2-fade-up">
              <div className="lv2-timeline-node">
                <svg viewBox="0 0 24 24"><path d="M12 2a4 4 0 0 0-4 4c0 2 2 3.5 2 5h4c0-1.5 2-3 2-5a4 4 0 0 0-4-4Z" /><path d="M10 17v1a2 2 0 0 0 4 0v-1" /><line x1="10" y1="13" x2="14" y2="13" /></svg>
              </div>
              <div className="lv2-timeline-content">
                <div className="lv2-timeline-num">Step 02</div>
                <h4>AI Analyzes &amp; Drafts</h4>
                <p>The AI reviews sentiment, applies your target keywords, and drafts a localized human response in seconds.</p>
              </div>
            </div>

            <div className="lv2-timeline-step lv2-fade-up">
              <div className="lv2-timeline-node">
                <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
              <div className="lv2-timeline-content">
                <div className="lv2-timeline-num">Step 03</div>
                <h4>Published to Google</h4>
                <p>Reply is safely submitted via official Google APIs. Your review response goes live within minutes.</p>
              </div>
            </div>

            <div className="lv2-timeline-step lv2-fade-up">
              <div className="lv2-timeline-node">
                <svg viewBox="0 0 24 24"><path d="M3 3v18h18" /><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" /></svg>
              </div>
              <div className="lv2-timeline-content">
                <div className="lv2-timeline-num">Step 04</div>
                <h4>Live Metric Updates</h4>
                <p>Your token ledger and local search visibility metrics update instantaneously on your dashboard.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="lv2-section">
        <div className="lv2-wrap">
          <div className="lv2-section-head lv2-fade-up">
            <h2>Transparent Plans: Subscriptions &amp; Token Freedom</h2>
            <p>Start free, top-up tokens when needed, or select a recurring plan with monthly token refills.</p>
          </div>

          <div className="lv2-pricing-grid">
            {/* Free Forever */}
            <div className="lv2-price-card lv2-fade-up">
              <h3>Free Forever</h3>
              <div className="lv2-price">
                ₹0<span> / forever</span>
              </div>
              <p className="lv2-desc">Explore the dashboard and start growing with daily token rewards.</p>
              <ul className="lv2-feature-list">
                <li>
                  <div className="lv2-check">✓</div> <span><b>60 Tokens</b> (2/day login reward)</span>
                </li>
                <li>
                  <div className="lv2-check">✓</div> <span><b>2 SEO Keywords</b></span>
                </li>
                <li>
                  <div className="lv2-check">✓</div> <span>Automated Review Replies</span>
                </li>
                <li>
                  <div className="lv2-check">✓</div> <span>Post Scheduling Calendar</span>
                </li>
                <li className="dim">
                  <div className="lv2-check" style={{ background: 'transparent', border: '1px solid var(--lv2-line)', color: 'var(--lv2-muted)' }}>✕</div>
                  <span>Competitor Leaderboard</span>
                </li>
              </ul>
              <button
                onClick={handleGoogleLogin}
                disabled={loadingLogin}
                className="lv2-btn lv2-btn-primary"
                style={{ width: '100%' }}
              >
                {loadingLogin ? 'Connecting...' : 'Start Free'}
              </button>
            </div>

            {/* Monthly Starter */}
            <div className="lv2-price-card lv2-fade-up lv2-delay-1">
              <h3>Monthly Starter</h3>
              <div className="lv2-price">
                ₹999<span> / month</span>
              </div>
              <p className="lv2-desc">Ideal for small neighborhood shops managing steady review volume.</p>
              <ul className="lv2-feature-list">
                <li>
                  <div className="lv2-check">✓</div> <span><b>350 AI Tokens</b> monthly refill</span>
                </li>
                <li>
                  <div className="lv2-check">✓</div> <span><b>5 SEO Keywords</b></span>
                </li>
                <li>
                  <div className="lv2-check">✓</div> <span>Automated Review Replies</span>
                </li>
                <li>
                  <div className="lv2-check">✓</div> <span>Post Scheduling Calendar</span>
                </li>
                <li className="dim">
                  <div className="lv2-check" style={{ background: 'transparent', border: '1px solid var(--lv2-line)', color: 'var(--lv2-muted)' }}>✕</div>
                  <span>Competitor Leaderboard</span>
                </li>
              </ul>
              <a href="/v2" onClick={handleGoogleLogin} className="lv2-btn lv2-btn-ghost" style={{ width: '100%' }}>
                Select Monthly
              </a>
            </div>

            {/* Half-Yearly Growth (Featured) */}
            <div className="lv2-price-card featured lv2-fade-up lv2-delay-2">
              <div className="lv2-badge-recommended">POPULAR VALUE</div>
              <h3>Half-Yearly Growth</h3>
              <div className="lv2-price">
                ₹4,000<span> / 6 months</span>
              </div>
              <p className="lv2-desc">High token volume at substantial savings for expanding local businesses.</p>
              <ul className="lv2-feature-list">
                <li>
                  <div className="lv2-check">✓</div> <span><b>600 AI Tokens</b> monthly refill</span>
                </li>
                <li>
                  <div className="lv2-check">✓</div> <span><b>10 SEO Keywords</b></span>
                </li>
                <li>
                  <div className="lv2-check">✓</div> <span>Automated Review Replies</span>
                </li>
                <li>
                  <div className="lv2-check">✓</div> <span>Post Scheduling Calendar</span>
                </li>
                <li className="dim">
                  <div className="lv2-check" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.4)' }}>✕</div>
                  <span>Competitor Leaderboard</span>
                </li>
              </ul>
              <button onClick={handleGoogleLogin} className="lv2-btn" style={{ width: '100%', background: '#fff', color: 'var(--lv2-ink)' }}>
                Select Half-Yearly
              </button>
            </div>

            {/* Yearly Domination */}
            <div className="lv2-price-card lv2-fade-up lv2-delay-3">
              <h3>Yearly Domination</h3>
              <div className="lv2-price">
                ₹8,500<span> / 12 months</span>
              </div>
              <p className="lv2-desc">Complete market dominance tier with full competitor tracking intelligence.</p>
              <ul className="lv2-feature-list">
                <li>
                  <div className="lv2-check">✓</div> <span><b>750 AI Tokens</b> monthly refill</span>
                </li>
                <li>
                  <div className="lv2-check">✓</div> <span><b>15 SEO Keywords</b></span>
                </li>
                <li>
                  <div className="lv2-check">✓</div> <span>Automated Review Replies</span>
                </li>
                <li>
                  <div className="lv2-check">✓</div> <span>Post Scheduling Calendar</span>
                </li>
                <li>
                  <div className="lv2-check">✓</div> <span><b>Live Competitor Leaderboard</b></span>
                </li>
              </ul>
              <button onClick={handleGoogleLogin} className="lv2-btn lv2-btn-ghost" style={{ width: '100%' }}>
                Select Yearly
              </button>
            </div>
          </div>

          {/* Top-up pack */}
          <div className="lv2-topup-banner lv2-fade-up lv2-delay-1">
            <div>
              <h4>Need extra tokens? Top up anytime.</h4>
              <p>
                Tokens never expire and roll over month-to-month. Prefer no recurring subscription? You can run entirely on top-up tokens with complete freedom.
              </p>
            </div>
            <div className="lv2-topup-price">
              <b>₹500</b>
              <span>450 AI Tokens</span>
            </div>
          </div>

          {/* Freemium & Earn banner */}
          <div className="lv2-freemium-banner lv2-fade-up lv2-delay-2">
            <h4>🎁 Earn Free Tokens &bull; Zero Forced Paywalls</h4>
            <p>
              Log in with Google to explore your analytics dashboard immediately. Earn extra tokens by completing your SEO profile setup and referring fellow business owners!
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section id="faq" className="lv2-section" style={{ background: '#fff', borderTop: '1px solid var(--lv2-line)' }}>
        <div className="lv2-wrap">
          <div className="lv2-section-head lv2-fade-up">
            <h2>Frequently Asked Questions</h2>
            <p>Everything you need to know about GBP Auto Master, tokens, and Google connections.</p>
          </div>

          <div className="lv2-faq-list lv2-fade-up">
            {faqs.map((faq, idx) => (
              <div key={idx} className={`lv2-faq-item ${openFaq === idx ? 'open' : ''}`}>
                <button className="lv2-faq-question" onClick={() => toggleFaq(idx)}>
                  <span>{faq.q}</span>
                  <span className="lv2-faq-icon">+</span>
                </button>
                {openFaq === idx && <div className="lv2-faq-answer">{faq.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final Call To Action */}
      <section className="lv2-section">
        <div className="lv2-wrap">
          <div className="lv2-final-cta lv2-fade-up">
            <div>
              <h2>Stop writing review replies at 11 PM. Let the AI handle it.</h2>
              <p style={{ color: 'var(--lv2-muted-on-dark)', margin: '12px 0 0', fontSize: '16px' }}>
                Join local businesses automating their Google Business growth.
              </p>
            </div>
            <button
              onClick={handleGoogleLogin}
              disabled={loadingLogin}
              className="lv2-btn"
              style={{ background: '#fff', color: 'var(--lv2-blue-deep)', fontWeight: 700, padding: '14px 28px' }}
            >
              {loadingLogin ? 'Connecting...' : 'Start Free With Google'}
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="lv2-footer">
        <div className="lv2-wrap lv2-footer-grid">
          <div>
            <div className="lv2-logo" style={{ color: '#fff' }}>
              <span className="lv2-logo-mark">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </span>
              <span>GBP Auto Master</span>
            </div>
            <p style={{ maxWidth: '34ch', marginTop: '16px', color: 'var(--lv2-muted-on-dark)', fontSize: '14px' }}>
              AI-powered local SEO and Google Business Profile automation software for businesses.
            </p>
          </div>

          <div>
            <h5>Product</h5>
            <ul>
              <li><a href="#features">Features</a></li>
              <li><a href="#how-it-works">How It Works</a></li>
              <li><a href="#pricing">Pricing</a></li>
              <li><a href="/dashboard">Dashboard</a></li>
            </ul>
          </div>

          <div>
            <h5>Company</h5>
            <ul>
              <li><a href="#faq">FAQ</a></li>
              <li><a href="mailto:support@gbpautomaster.in">Support Email</a></li>
            </ul>
          </div>

          <div>
            <h5>Legal &amp; Compliance</h5>
            <ul>
              <li><a href="/privacy">Privacy Policy</a></li>
              <li><a href="/terms">Terms of Service</a></li>
              <li><a href="/refund">Refund Policy</a></li>
            </ul>
          </div>
        </div>

        <div className="lv2-footer-bottom">
          <span>&copy; {new Date().getFullYear()} GBP Auto Master. All rights reserved.</span>
          <span>
            <a href="/privacy" style={{ textDecoration: 'underline', marginRight: '14px' }}>Privacy</a>
            <a href="/terms" style={{ textDecoration: 'underline', marginRight: '14px' }}>Terms</a>
            <a href="/refund" style={{ textDecoration: 'underline' }}>Refunds</a>
          </span>
        </div>
      </footer>
    </div>
  );
};

export default LandingV2;
