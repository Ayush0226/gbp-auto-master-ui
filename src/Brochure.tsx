
export default function Brochure() {
    return (
        <div style={{
            backgroundColor: '#0F1115',
            color: '#E2E8F0',
            minHeight: '100vh',
            fontFamily: '""Inter"", -apple-system, BlinkMacSystemFont, ""Segoe UI"", Roboto, sans-serif',
            padding: '60px 20px',
            lineHeight: 1.6
        }}>
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                
                {/* Header */}
                <header style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '50px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '40px' }}>
                    <div style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)', color: 'white', padding: '20px', borderRadius: '16px', fontSize: '28px', fontWeight: 900, boxShadow: '0 8px 24px rgba(59,130,246,0.25)' }}>
                        GBP
                    </div>
                    <div>
                        <h1 style={{ fontSize: '48px', fontWeight: 900, margin: '0 0 8px 0', letterSpacing: '-1px' }}>
                            <span style={{ color: '#FFFFFF' }}>GBP Auto</span><span style={{ color: '#10B981' }}>Master</span>
                        </h1>
                        <p style={{ fontSize: '20px', color: '#94A3B8', margin: 0, fontWeight: 400 }}>
                            The Ultimate AI Autopilot for Google Business Profiles
                        </p>
                    </div>
                </header>

                {/* Introduction */}
                <section style={{ marginBottom: '60px' }}>
                    <h2 style={{ fontSize: '28px', color: '#FFFFFF', borderLeft: '4px solid #3B82F6', paddingLeft: '16px', marginBottom: '24px', fontWeight: 800 }}>
                        The Power of Total Automation
                    </h2>
                    <p style={{ color: '#CBD5E1', fontSize: '16px', textAlign: 'justify', lineHeight: 1.8 }}>
                        Google's algorithm heavily rewards businesses that actively engage with their customers and post regular updates. 
                        <strong> GBP AutoMaster</strong> puts your entire local SEO strategy on autopilot using advanced Artificial Intelligence. 
                        It secures your spot in the coveted Google "Map Pack" by ensuring 100% response rates, intelligent keyword usage, and consistent profile activity.
                    </p>
                </section>

                {/* Core Features */}
                <section style={{ marginBottom: '60px' }}>
                    <h2 style={{ fontSize: '28px', color: '#FFFFFF', borderLeft: '4px solid #3B82F6', paddingLeft: '16px', marginBottom: '32px', fontWeight: 800 }}>
                        Comprehensive Feature Suite
                    </h2>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
                        
                        {/* Feature 1 & 2 */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
                            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '32px', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'linear-gradient(90deg, #3B82F6, #60A5FA)' }}></div>
                                <h3 style={{ fontSize: '20px', color: '#60A5FA', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', fontWeight: 700 }}>
                                    <span style={{ fontSize: '24px' }}>??</span> 24/7 AI Auto-Replier
                                </h3>
                                <p style={{ fontSize: '15px', color: '#94A3B8', marginBottom: '0', lineHeight: 1.6 }}>
                                    Our proprietary AI engine analyzes the sentiment of every incoming review and instantly writes a personalized, professional response. It custom-handles 1-star reviews with empathy and amplifies 5-star reviews with gratitude.
                                </p>
                            </div>

                            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '32px', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'linear-gradient(90deg, #10B981, #34D399)' }}></div>
                                <h3 style={{ fontSize: '20px', color: '#10B981', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', fontWeight: 700 }}>
                                    <span style={{ fontSize: '24px' }}>??</span> Auto SEO Keyword Injection
                                </h3>
                                <p style={{ fontSize: '15px', color: '#94A3B8', marginBottom: '0', lineHeight: 1.6 }}>
                                    Stop guessing what keywords work. Define your target local keywords (e.g., "plumber in Rohini"), and the AI will naturally weave them into your review replies to boost your search indexing and Map Pack ranking.
                                </p>
                            </div>
                        </div>

                        {/* Feature 3 & 4 */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
                            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '32px', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'linear-gradient(90deg, #F59E0B, #FBBF24)' }}></div>
                                <h3 style={{ fontSize: '20px', color: '#FBBF24', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', fontWeight: 700 }}>
                                    <span style={{ fontSize: '24px' }}>??</span> Automated Content Calendar
                                </h3>
                                <p style={{ fontSize: '15px', color: '#94A3B8', marginBottom: '0', lineHeight: 1.6 }}>
                                    Keep your profile fresh without the daily hassle. Upload promotional offers or photos and schedule posts months in advance. Our visual calendar plans your entire local marketing strategy in minutes.
                                </p>
                            </div>

                            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '32px', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'linear-gradient(90deg, #8B5CF6, #A78BFA)' }}></div>
                                <h3 style={{ fontSize: '20px', color: '#A78BFA', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', fontWeight: 700 }}>
                                    <span style={{ fontSize: '24px' }}>??</span> Competitor Rank Pusher
                                </h3>
                                <p style={{ fontSize: '15px', color: '#94A3B8', marginBottom: '0', lineHeight: 1.6 }}>
                                    Track exactly where you stand. Monitor your local competitors' ratings and activity, and get actionable, data-driven insights to push your business past them to the #1 spot on Google Maps.
                                </p>
                            </div>
                        </div>
                        
                        {/* Feature 5 & 6 */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
                            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '32px', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'linear-gradient(90deg, #EC4899, #F472B6)' }}></div>
                                <h3 style={{ fontSize: '20px', color: '#F472B6', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', fontWeight: 700 }}>
                                    <span style={{ fontSize: '24px' }}>?</span> Master Autopilot Control
                                </h3>
                                <p style={{ fontSize: '15px', color: '#94A3B8', marginBottom: '0', lineHeight: 1.6 }}>
                                    Full control over your AI. Personalize exactly how the AI speaks to your customers by selecting its tone (Professional, Casual, Friendly) and adding custom brand instructions.
                                </p>
                            </div>

                            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '32px', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'linear-gradient(90deg, #06B6D4, #22D3EE)' }}></div>
                                <h3 style={{ fontSize: '20px', color: '#22D3EE', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', fontWeight: 700 }}>
                                    <span style={{ fontSize: '24px' }}>??</span> Multi-Location Management
                                </h3>
                                <p style={{ fontSize: '15px', color: '#94A3B8', marginBottom: '0', lineHeight: 1.6 }}>
                                    Own 5 clinics or 10 restaurants? No problem. Connect all your storefronts securely via OAuth and manage every single location from one unified, high-level analytics dashboard.
                                </p>
                            </div>
                        </div>

                    </div>
                </section>

                {/* Benefits / Pros (No Cons) */}
                <section style={{ marginBottom: '60px' }}>
                    <h2 style={{ fontSize: '28px', color: '#FFFFFF', borderLeft: '4px solid #10B981', paddingLeft: '16px', marginBottom: '32px', fontWeight: 800 }}>
                        The GBP AutoMaster Advantage
                    </h2>
                    
                    <div style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '16px', padding: '40px' }}>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                            <li style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                                <div style={{ color: '#10B981', fontSize: '24px' }}>?</div> 
                                <div>
                                    <strong style={{ display: 'block', fontSize: '16px', color: '#E2E8F0', marginBottom: '4px' }}>100% Response Rate</strong>
                                    <span style={{ color: '#94A3B8', fontSize: '14px' }}>Actively boosts your Map Pack ranking by showing Google you are highly responsive.</span>
                                </div>
                            </li>
                            <li style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                                <div style={{ color: '#10B981', fontSize: '24px' }}>?</div> 
                                <div>
                                    <strong style={{ display: 'block', fontSize: '16px', color: '#E2E8F0', marginBottom: '4px' }}>SEO Domination</strong>
                                    <span style={{ color: '#94A3B8', fontSize: '14px' }}>AI intelligently injects target SEO keywords into every reply automatically.</span>
                                </div>
                            </li>
                            <li style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                                <div style={{ color: '#10B981', fontSize: '24px' }}>?</div> 
                                <div>
                                    <strong style={{ display: 'block', fontSize: '16px', color: '#E2E8F0', marginBottom: '4px' }}>Establish Customer Trust</strong>
                                    <span style={{ color: '#94A3B8', fontSize: '14px' }}>Consistent profile activity and empathetic responses signal deep trust to new customers.</span>
                                </div>
                            </li>
                            <li style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                                <div style={{ color: '#10B981', fontSize: '24px' }}>?</div> 
                                <div>
                                    <strong style={{ display: 'block', fontSize: '16px', color: '#E2E8F0', marginBottom: '4px' }}>Reclaim Your Time</strong>
                                    <span style={{ color: '#94A3B8', fontSize: '14px' }}>Complete hands-off automation. Save 5+ hours a week and focus entirely on your business.</span>
                                </div>
                            </li>
                        </ul>
                    </div>
                </section>

                {/* How It Works */}
                <section style={{ marginBottom: '60px' }}>
                    <h2 style={{ fontSize: '28px', color: '#FFFFFF', borderLeft: '4px solid #3B82F6', paddingLeft: '16px', marginBottom: '32px', fontWeight: 800 }}>
                        Getting Started in 3 Steps
                    </h2>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ color: '#60A5FA', fontSize: '32px', fontWeight: 900, marginBottom: '12px', opacity: 0.8 }}>1</div>
                            <strong style={{ display: 'block', fontSize: '18px', color: '#FFFFFF', marginBottom: '8px' }}>Secure Connection</strong>
                            <div style={{ color: '#94A3B8', fontSize: '14px', lineHeight: 1.6 }}>Connect your Google Account safely via OAuth in 1 click to fetch your locations.</div>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ color: '#60A5FA', fontSize: '32px', fontWeight: 900, marginBottom: '12px', opacity: 0.8 }}>2</div>
                            <strong style={{ display: 'block', fontSize: '18px', color: '#FFFFFF', marginBottom: '8px' }}>AI Configuration</strong>
                            <div style={{ color: '#94A3B8', fontSize: '14px', lineHeight: 1.6 }}>Toggle the Autopilot switch, set your brand's tone of voice, and add custom SEO instructions.</div>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ color: '#60A5FA', fontSize: '32px', fontWeight: 900, marginBottom: '12px', opacity: 0.8 }}>3</div>
                            <strong style={{ display: 'block', fontSize: '18px', color: '#FFFFFF', marginBottom: '8px' }}>Hands-Free Growth</strong>
                            <div style={{ color: '#94A3B8', fontSize: '14px', lineHeight: 1.6 }}>Sit back as the AI monitors your profile 24/7, replies instantly, and publishes updates.</div>
                        </div>
                    </div>
                </section>

                {/* Pricing */}
                <section style={{ marginBottom: '60px' }}>
                    <h2 style={{ fontSize: '28px', color: '#FFFFFF', borderLeft: '4px solid #3B82F6', paddingLeft: '16px', marginBottom: '32px', fontWeight: 800 }}>
                        Simple, Transparent Pricing
                    </h2>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                        {/* Monthly */}
                        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '32px', textAlign: 'center' }}>
                            <h3 style={{ fontSize: '20px', color: '#E2E8F0', marginBottom: '12px', fontWeight: 800 }}>Monthly Starter</h3>
                            <div style={{ fontSize: '42px', fontWeight: 900, color: '#FFFFFF', marginBottom: '12px' }}>
                                ?500 <span style={{ fontSize: '16px', color: '#94A3B8', fontWeight: 400 }}>/ mo</span>
                            </div>
                            <p style={{ color: '#60A5FA', fontSize: '14px', margin: 0, fontWeight: 500 }}>
                                Perfect for trying the AI out
                            </p>
                        </div>
                        
                        {/* Half-Yearly */}
                        <div style={{ background: 'linear-gradient(180deg, rgba(59,130,246,0.1) 0%, rgba(255,255,255,0.02) 100%)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '16px', padding: '32px', textAlign: 'center', position: 'relative' }}>
                            <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: '#3B82F6', color: 'white', padding: '6px 16px', borderRadius: '100px', fontSize: '12px', fontWeight: 800, letterSpacing: '1px' }}>
                                MOST POPULAR
                            </div>
                            <h3 style={{ fontSize: '20px', color: '#60A5FA', marginBottom: '12px', fontWeight: 800 }}>Half-Yearly Plan</h3>
                            <div style={{ fontSize: '16px', color: '#94A3B8', textDecoration: 'line-through', marginBottom: '4px' }}>?3,000</div>
                            <div style={{ fontSize: '42px', fontWeight: 900, color: '#FFFFFF', marginBottom: '12px' }}>
                                ?2,500 <span style={{ fontSize: '16px', color: '#94A3B8', fontWeight: 400 }}>/ 6 mos</span>
                            </div>
                            <p style={{ color: '#60A5FA', fontSize: '14px', margin: 0, fontWeight: 500 }}>
                                Ideal for steady growth
                            </p>
                        </div>

                        {/* Yearly */}
                        <div style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '16px', padding: '32px', textAlign: 'center' }}>
                            <h3 style={{ fontSize: '20px', color: '#10B981', marginBottom: '12px', fontWeight: 800 }}>Yearly Domination</h3>
                            <div style={{ fontSize: '16px', color: '#94A3B8', textDecoration: 'line-through', marginBottom: '4px' }}>?6,000</div>
                            <div style={{ fontSize: '42px', fontWeight: 900, color: '#FFFFFF', marginBottom: '12px' }}>
                                ?5,000 <span style={{ fontSize: '16px', color: '#94A3B8', fontWeight: 400 }}>/ yr</span>
                            </div>
                            <p style={{ color: '#10B981', fontSize: '14px', margin: 0, fontWeight: 500 }}>
                                Save over 15% instantly
                            </p>
                        </div>
                    </div>
                </section>
                
                <footer style={{ textAlign: 'center', color: '#64748B', fontSize: '14px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '30px' }}>
                    <strong>GBP AutoMaster</strong><br/>
                    Securely powered by Google APIs and advanced AI Models.
                </footer>
            </div>
        </div>
    );
}
