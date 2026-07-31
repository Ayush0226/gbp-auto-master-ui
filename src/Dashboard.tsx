import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';

// Dummy Google Locations for the demo
const MOCK_LOCATIONS = [
    { id: 'loc1', name: "Rohini AC & Plumbing", reviews: 214, rating: 4.9, subscribed: true },
    { id: 'loc2', name: "Rohini Home Interiors", reviews: 96, rating: 4.6, subscribed: false },
    { id: 'loc3', name: "Pitampura Dental Care", reviews: 341, rating: 4.8, subscribed: false }
];

export default function MasterDashboardPage() {
    const [user, setUser] = useState<any>(null);
    const [hasGoogleConnected, setHasGoogleConnected] = useState(false);
    
    // Core App State
    const [appState, setAppState] = useState<'loading' | 'demo-select' | 'demo-running' | 'demo-success' | 'payment' | 'dashboard'>('loading');
    const [activeView, setActiveView] = useState('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    
    // Demo State
    const [demoSelectedLoc, setDemoSelectedLoc] = useState<string | null>(null);
    const [demoResultNames, setDemoResultNames] = useState<string[]>([]);
    
    // Payment State
    const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'half_yearly' | 'yearly'>('half_yearly');
    const [discountApplied, setDiscountApplied] = useState<string>('none');
    const [promoCode, setPromoCode] = useState('');
    
    const PRICING_PLANS = {
        monthly: { name: 'Monthly', original: 360, discounted: 289 },
        half_yearly: { name: 'Half-Yearly', original: 2160, discounted: 1649 },
        yearly: { name: 'Yearly', original: 4380, discounted: 3149 }
    };
    
    const router = {
        push: (path: string) => { window.location.href = path; }
    };

    // Calendar State
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [selectedDate, setSelectedDate] = useState<number | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [postText, setPostText] = useState('');
    const [loadingAction, setLoadingAction] = useState(false);
    const [scheduledPosts, setScheduledPosts] = useState<any>({
        6: [{ caption: 'Monsoon AC servicing offer', img: true }],
        14: [{ caption: 'Before/after pipe repair', img: true }],
        22: [{ caption: 'Team spotlight photo', img: true }, { caption: 'Customer testimonial card', img: true }],
    });
    const [isSchedulingNew, setIsSchedulingNew] = useState(false);

    // AI Brain State
    const [isAiActive, setIsAiActive] = useState(true);
    const [replyTo1Star, setReplyTo1Star] = useState(false);
    const [aiTone, setAiTone] = useState('Professional');
    const [customInstructions, setCustomInstructions] = useState('');

    // Locations State
    const [activeLocationId, setActiveLocationId] = useState<string>('loc1');
    const activeLocationName = MOCK_LOCATIONS.find(l => l.id === activeLocationId)?.name || "Rohini AC & Plumbing";

    useEffect(() => {
        const initializeDashboard = async () => {
            const searchParams = new URLSearchParams(window.location.search);
            const idToken = searchParams.get('id_token');

            if (idToken) {
                const { data, error } = await supabase.auth.signInWithIdToken({
                    provider: 'google',
                    token: idToken,
                });
                if (!error && data.user) {
                    window.history.replaceState({}, document.title, "/dashboard");
                    await checkUserRoute(data.user);
                    return;
                }
            }

            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) {
                router.push('/');
                return;
            }
            
            await checkUserRoute(session.user);
        };

        initializeDashboard();
    }, []);

    const checkUserRoute = async (currentUser: any) => {
        setUser(currentUser);
        setHasGoogleConnected(true);

        const metadata = currentUser.user_metadata || {};
        const demoUsed = metadata.demo_used === true;
        const subStatus = metadata.subscription_status || 'none';
        
        if (!demoUsed) {
            setAppState('demo-select');
        } else if (subStatus === 'none') {
            setAppState('payment');
        } else {
            setAppState('dashboard');
        }
    };

    // ==========================================
    // DEMO & PAYMENT FLOWS
    // ==========================================
    
    const handleRunDemo = async () => {
        if (!demoSelectedLoc) return;
        setAppState('demo-running');
        
        // Simulating the Python Render backend processing 2 newest reviews
        setTimeout(async () => {
            // Update supabase user metadata to prevent taking demo again
            await supabase.auth.updateUser({
                data: { demo_used: true }
            });
            
            setDemoResultNames(['Ankit Verma', 'Priya Sharma']);
            setAppState('demo-success');
        }, 3500);
    };

    const handleCheckout = async () => {
        try {
            const res = await fetch("https://gbp-auto-master-backend.onrender.com/api/payment/create-order", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    plan_id: selectedPlan,
                    promo_code: discountApplied === 'none' ? '' : discountApplied,
                    user_id: user?.id || 'test_user_id'
                })
            });
            const data = await res.json();

            if (data.free_trial) {
                // Backend bypassed Razorpay for ATYAUNSUHJ and activated subscription
                setAppState('dashboard');
                return;
            }

            const options = {
                key: "rzp_test_TIyI2A54AzLbux", // Remember to change to Live Key later
                amount: data.amount,
                currency: "INR",
                name: "GBP Auto Master",
                description: `Enterprise AI - ${PRICING_PLANS[selectedPlan].name}`,
                order_id: data.order_id,
                handler: async function (response: any) {
                    // Securely verify signature on backend
                    const verifyRes = await fetch("https://gbp-auto-master-backend.onrender.com/api/payment/verify", {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature,
                            user_id: user?.id || 'test_user_id'
                        })
                    });
                    const verifyData = await verifyRes.json();
                    if (verifyData.status === 'success') {
                        setAppState('dashboard');
                    } else {
                        alert("Payment verification failed!");
                    }
                },
                prefill: {
                    name: user?.user_metadata?.full_name || "Business Owner",
                    email: user?.email || "",
                },
                theme: {
                    color: "#3b82f6"
                }
            };

            const rzp1 = new (window as any).Razorpay(options);
            rzp1.open();
        } catch (err) {
            console.error("Error creating order", err);
            alert("Error initiating checkout. Please try again.");
        }
    };

    const applyPromo = () => {
        if (promoCode === 'FIRSTUNDER10') {
            setDiscountApplied('FIRSTUNDER10');
        } else if (promoCode === 'ATYAUNSUHJ') {
            setDiscountApplied('ATYAUNSUHJ');
        } else {
            setDiscountApplied('none');
            alert("Invalid or expired code");
        }
    };

    // ==========================================
    // DASHBOARD FUNCTIONS
    // ==========================================

    const handleSchedule = async () => {
        if (!selectedDate) return;
        setLoadingAction(true);
        
        // Mocking the upload process
        setTimeout(() => {
            const newPost = { caption: postText || 'New scheduled post', img: true };
            setScheduledPosts(prev => ({
                ...prev,
                [selectedDate]: [...(prev[selectedDate] || []), newPost]
            }));
            
            setIsSchedulingNew(false);
            setPostText('');
            setLoadingAction(false);
        }, 1000);
    };

    const cancelPost = (day: number, idx: number) => {
        setScheduledPosts(prev => {
            const newPosts = [...prev[day]];
            newPosts.splice(idx, 1);
            return { ...prev, [day]: newPosts };
        });
    };

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

    if (appState === 'loading') {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--obsidian)' }}>
                <div className="noise"></div>
                <div className="glow" style={{ top: '40%', left: '40%', width: '200px', height: '200px', background: 'var(--blue)' }}></div>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', border: '3px solid rgba(59,130,246,.2)', borderTopColor: 'var(--blue)', animation: 'spin .8s linear infinite' }}></div>
            </div>
        );
    }

    return (
        <div className="app-shell">
            <div className="noise"></div>

            {/* SIDEBAR */}
            <aside className={`sidebar glass ${sidebarOpen ? 'open' : ''}`} id="sidebar">
                <div className="sidebar-logo">GBP Auto <span className="grad-blue">Master</span></div>

                <div className="active-location-badge glass">
                    <span className="dot"></span>
                    Managing <b>{activeLocationName}</b>
                </div>

                <nav>
                    <div className={`nav-item ${activeView === 'dashboard' ? 'active' : ''}`} onClick={() => { setActiveView('dashboard'); }}>
                        <span className="ic">◆</span> Dashboard
                    </div>
                    <div className={`nav-item ${activeView === 'calendar' ? 'active' : ''}`} onClick={() => { setActiveView('calendar'); }}>
                        <span className="ic">▦</span> Content Calendar
                    </div>
                    <div className={`nav-item ${activeView === 'analytics' ? 'active' : ''}`} onClick={() => { setActiveView('analytics'); }}>
                        <span className="ic">◈</span> Analytics & SEO
                    </div>
                    <div className={`nav-item ${activeView === 'brain' ? 'active' : ''}`} onClick={() => { setActiveView('brain'); }}>
                        <span className="ic">◉</span> AI Brain Settings
                    </div>
                    <div className={`nav-item ${activeView === 'locations' ? 'active' : ''}`} onClick={() => { setActiveView('locations'); }}>
                        <span className="ic">▤</span> Switch Locations
                    </div>
                    <div className={`nav-item ${activeView === 'billing' ? 'active' : ''}`} onClick={() => { setActiveView('billing'); }}>
                        <span className="ic">💳</span> Billing
                    </div>
                </nav>

                <div className="sidebar-foot" style={{ cursor: 'pointer', color: 'var(--red-soft)' }} onClick={() => supabase.auth.signOut().then(() => router.push('/'))}>
                    Sign Out
                </div>
            </aside>

            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                <div className="mobile-topbar">
                    <div className="sidebar-logo" style={{ padding: 0 }}>GBP Auto <span className="grad-blue">Master</span></div>
                </div>

                <main className="main">
                    
                    {/* ===================== PAGE: ONBOARDING ===================== */}
                    {['demo-select', 'demo-running', 'demo-success', 'payment'].includes(appState) && (
                        <section className="page active">
                            <div className="page-head">
                                <h2>Onboarding</h2>
                                <p>Set up your AI Engine.</p>
                            </div>

                            {appState === 'demo-select' && (
                                <div className="card glass">
                                    <h3 style={{ fontSize: '16px', marginBottom: '4px' }}>Select a Google Business Profile</h3>
                                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,.5)', margin: '0 0 18px' }}>Choose one profile to run the free AI demo on.</p>

                                    <div className="grid grid-2">
                                        {MOCK_LOCATIONS.map(loc => (
                                            <div key={loc.id} className="card-sm glass glass-hover" onClick={() => setDemoSelectedLoc(loc.id)} style={{ cursor: 'pointer', border: demoSelectedLoc === loc.id ? '1px solid rgba(59,130,246,.35)' : '' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    {demoSelectedLoc === loc.id && <span className="badge-pill b-blue">Selected</span>}
                                                </div>
                                                <p style={{ fontWeight: 600, fontSize: '14px', margin: '10px 0 2px' }}>{loc.name}</p>
                                                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,.45)', margin: 0 }}>{loc.reviews} reviews · ★ {loc.rating}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <button className="btn btn-green" style={{ marginTop: '20px' }} disabled={!demoSelectedLoc} onClick={handleRunDemo}>Start Demo →</button>
                                </div>
                            )}

                            {appState === 'demo-running' && (
                                <div className="card glass" style={{ textAlign: 'center', padding: '48px 24px' }}>
                                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', border: '3px solid rgba(59,130,246,.2)', borderTopColor: 'var(--blue)', margin: '0 auto 18px', animation: 'spin .8s linear infinite' }}></div>
                                    <p style={{ fontWeight: 600 }}>AI is analyzing recent reviews…</p>
                                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,.5)' }}>Fetching the 2 newest unreplied reviews and generating replies.</p>
                                </div>
                            )}

                            {appState === 'demo-success' && (
                                <div className="card glass">
                                    <span className="badge-pill b-green">✓ Demo complete</span>
                                    <h3 style={{ fontSize: '18px', margin: '12px 0 16px' }}>The AI just replied to 2 real reviews:</h3>
                                    <div className="grid grid-2">
                                        {demoResultNames.map((name, i) => (
                                            <div key={i} className="card-sm" style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)' }}>
                                                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,.45)', margin: '0 0 4px' }}>Reply sent to</p>
                                                <p style={{ fontWeight: 600, fontSize: '14px', margin: 0 }}>{name}</p>
                                                <p style={{ fontSize: '12.5px', color: 'rgba(255,255,255,.6)', marginTop: '8px' }}>"Thank you {name}! We're thrilled our team could help so quickly…"</p>
                                            </div>
                                        ))}
                                    </div>
                                    <button className="btn btn-primary" style={{ marginTop: '20px' }} onClick={() => setAppState('payment')}>Continue to Pricing →</button>
                                </div>
                            )}

                            {appState === 'payment' && (
                                <div className="card glass">
                                    <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Choose your plan</h3>

                                    <div className="grid grid-3">
                                        {(Object.keys(PRICING_PLANS) as Array<keyof typeof PRICING_PLANS>).map((key) => (
                                            <div key={key} className="card-sm glass glass-hover" onClick={() => setSelectedPlan(key)} style={{ cursor: 'pointer', border: selectedPlan === key ? '1px solid rgba(59,130,246,.4)' : '' }}>
                                                <p style={{ fontSize: '12px', color: selectedPlan === key ? 'var(--blue-soft)' : 'rgba(255,255,255,.5)' }}>{PRICING_PLANS[key].name}</p>
                                                <p style={{ fontWeight: 700, fontSize: '20px', marginTop: '4px' }}>₹{PRICING_PLANS[key].original}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <div style={{ marginTop: '20px' }}>
                                        <label className="field-label">Promo code</label>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <input type="text" placeholder="e.g. FIRSTUNDER10" value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())} />
                                            <button className="btn btn-ghost btn-sm" onClick={applyPromo}>Apply</button>
                                        </div>
                                        {discountApplied === 'FIRSTUNDER10' && <p style={{ fontSize: '12px', marginTop: '8px', color: 'var(--blue-soft)', fontWeight: 'bold' }}>✓ First Time Discount Applied</p>}
                                        {discountApplied === 'ATYAUNSUHJ' && <p style={{ fontSize: '12px', marginTop: '8px', color: 'var(--green-soft)', fontWeight: 'bold' }}>✨ Secret 100% Discount Applied (Billing Skipped for 1st Cycle)</p>}
                                    </div>

                                    <div className="card-sm" style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,.5)', margin: 0 }}>Total payable</p>
                                            {discountApplied !== 'none' && <p style={{ fontSize: '12px', color: 'rgba(255,255,255,.35)', margin: '2px 0 0', textDecoration: 'line-through' }}>₹{PRICING_PLANS[selectedPlan].original}</p>}
                                        </div>
                                        <p style={{ fontSize: '26px', fontWeight: 800 }}>
                                            ₹{discountApplied === 'FIRSTUNDER10' ? PRICING_PLANS[selectedPlan].discounted : (discountApplied === 'ATYAUNSUHJ' ? 0 : PRICING_PLANS[selectedPlan].original)}
                                        </p>
                                    </div>

                                    <button className="btn btn-green btn-block" style={{ marginTop: '18px' }} onClick={handleCheckout}>
                                        {discountApplied === 'ATYAUNSUHJ' ? 'Activate Free Trial' : 'Pay with Razorpay'}
                                    </button>
                                </div>
                            )}
                        </section>
                    )}

                    {/* ===================== PAGE: DASHBOARD ===================== */}
                    {appState === 'dashboard' && activeView === 'dashboard' && (
                        <section className="page active">
                            <div className="glow" style={{ top: '10%', right: '10%', width: '400px', height: '400px', background: 'var(--blue)' }}></div>

                            <div className="page-head">
                                <h2>Master Dashboard</h2>
                                <p>Live activity for <b style={{ color: '#fff' }}>{activeLocationName}</b>.</p>
                            </div>

                            <div className="grid grid-3" style={{ marginBottom: '20px' }}>
                                <div className="card glass glass-hover" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                    <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 12px var(--green)', flexShrink: 0, animation: 'pulse 2s ease-in-out infinite' }}></span>
                                    <div>
                                        <p style={{ fontWeight: 600, fontSize: '14px', margin: 0 }}>Engine Connected</p>
                                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,.45)', margin: '2px 0 0' }}>Python API is monitoring live</p>
                                    </div>
                                </div>
                                <div className="card glass glass-hover">
                                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,.5)' }}>Hours Saved this month</p>
                                    <p style={{ fontSize: '28px', fontWeight: 800, marginTop: '6px' }} className="grad-blue">18.4 hrs</p>
                                </div>
                                <div className="card glass glass-hover">
                                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,.5)' }}>Keywords Injected</p>
                                    <p style={{ fontSize: '28px', fontWeight: 800, marginTop: '6px', color: 'var(--green-soft)' }}>247</p>
                                </div>
                            </div>

                            <div className="card glass">
                                <h3 style={{ fontSize: '15px', marginBottom: '14px' }}>Live Review Feed</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    
                                    <div className="card-sm" style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                                            <div>
                                                <p style={{ fontWeight: 600, fontSize: '13.5px', margin: 0 }}>Ankit Verma <span style={{ color: 'var(--orange-soft)' }}>★★★★★</span></p>
                                                <p style={{ fontSize: '12.5px', color: 'rgba(255,255,255,.55)', margin: '6px 0 0' }}>"Fixed our AC within an hour, incredibly professional."</p>
                                            </div>
                                            <span className="badge-pill b-gray" style={{ flexShrink: 0 }}>2h ago</span>
                                        </div>
                                        <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,.06)' }}>
                                            <p style={{ fontSize: '11px', color: 'var(--blue-soft)', fontWeight: 600, margin: '0 0 4px' }}>AI reply published</p>
                                            <p style={{ fontSize: '12.5px', color: 'rgba(255,255,255,.6)', margin: 0 }}>"Thank you Ankit! Our emergency AC repair team is always ready — glad we could help fast."</p>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </section>
                    )}

                    {/* ===================== PAGE: CALENDAR ===================== */}
                    {appState === 'dashboard' && activeView === 'calendar' && (
                        <section className="page active">
                            <div className="glow" style={{ top: '40%', left: '-10%', width: '300px', height: '300px', background: 'var(--blue)' }}></div>

                            <div className="page-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
                                <div>
                                    <h2>Content Calendar</h2>
                                    <p>July 2026 · click a day to see or schedule posts.</p>
                                </div>
                                <button className="btn btn-green btn-sm" onClick={() => setIsSchedulingNew(true)}>+ Schedule New Post</button>
                            </div>

                            <div className="card glass" style={{ padding: '18px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '6px', fontSize: '11px', color: 'rgba(255,255,255,.4)', textAlign: 'center', marginBottom: '8px' }}>
                                    <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '6px' }}>
                                    {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`}></div>)}
                                    {Array.from({ length: daysInMonth }).map((_, i) => {
                                        const day = i + 1;
                                        const hasPost = scheduledPosts[day] && scheduledPosts[day].length > 0;
                                        return (
                                            <div 
                                                key={day} 
                                                className="card-sm" 
                                                style={{ minHeight: '56px', cursor: 'pointer', background: 'rgba(255,255,255,.02)', border: selectedDate === day ? '1px solid rgba(59,130,246,.5)' : '1px solid rgba(255,255,255,.06)', padding: '8px', transition: 'border-color .2s ease' }}
                                                onClick={() => setSelectedDate(day)}
                                            >
                                                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,.6)' }}>{day}</div>
                                                {hasPost && <div style={{ marginTop: '6px', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 6px var(--green)' }}></div>}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {selectedDate && (
                                <div className="card glass" style={{ marginTop: '18px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                        <h3 style={{ fontSize: '15px' }}>July {selectedDate}</h3>
                                        <button className="btn btn-ghost btn-sm" onClick={() => setIsSchedulingNew(true)}>+ Add post</button>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {scheduledPosts[selectedDate]?.map((post: any, idx: number) => (
                                            <div key={idx} className="card-sm" style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <span style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(59,130,246,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📷</span>
                                                    <span style={{ fontSize: '13px' }}>{post.caption}</span>
                                                </div>
                                                <button className="btn-red-ghost btn" onClick={() => cancelPost(selectedDate, idx)}>Cancel</button>
                                            </div>
                                        ))}
                                        {(!scheduledPosts[selectedDate] || scheduledPosts[selectedDate].length === 0) && (
                                            <p style={{ fontSize: '12.5px', color: 'rgba(255,255,255,.4)' }}>No posts scheduled for this day yet.</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {isSchedulingNew && (
                                <div style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                                    <div className="card glass" style={{ maxWidth: '420px', width: '100%' }}>
                                        <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Schedule new post</h3>
                                        
                                        <label className="field-label">Date (July)</label>
                                        <input type="text" value={selectedDate || 1} onChange={(e) => setSelectedDate(parseInt(e.target.value) || 1)} style={{ marginBottom: '14px' }} />
                                        
                                        <label className="field-label">Image</label>
                                        <div style={{ border: '1px dashed rgba(255,255,255,.2)', borderRadius: '12px', padding: '24px', textAlign: 'center', fontSize: '12.5px', color: 'rgba(255,255,255,.4)', marginBottom: '14px' }}>
                                            📷 Drop an image or click to upload
                                        </div>
                                        
                                        <label className="field-label">Caption (optional)</label>
                                        <textarea rows={3} placeholder="New summer discount on AC servicing!" value={postText} onChange={(e) => setPostText(e.target.value)}></textarea>
                                        
                                        <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
                                            <button className="btn btn-ghost btn-block" onClick={() => setIsSchedulingNew(false)}>Cancel</button>
                                            <button className="btn btn-green btn-block" onClick={handleSchedule}>{loadingAction ? '...' : 'Confirm'}</button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </section>
                    )}

                    {/* ===================== PAGE: ANALYTICS ===================== */}
                    {appState === 'dashboard' && activeView === 'analytics' && (
                        <section className="page active">
                            <div className="glow" style={{ bottom: '10%', right: '-10%', width: '400px', height: '400px', background: 'var(--green)' }}></div>

                            <div className="page-head">
                                <h2>Analytics & SEO</h2>
                                <p>Local ranking performance and AI traffic insights.</p>
                            </div>

                            {/* 1. Traffic & Conversion Metrics */}
                            <div className="grid grid-3" style={{ marginBottom: '18px' }}>
                                <div className="card glass">
                                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,.5)' }}>Total Map Views</p>
                                    <p style={{ fontSize: '28px', fontWeight: 800, marginTop: '6px' }} className="grad-blue">14.2k</p>
                                    <p style={{ fontSize: '11.5px', color: 'var(--green-soft)', marginTop: '4px' }}>▲ +12% this week</p>
                                </div>
                                <div className="card glass">
                                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,.5)' }}>Website Clicks</p>
                                    <p style={{ fontSize: '28px', fontWeight: 800, marginTop: '6px' }}>842</p>
                                    <p style={{ fontSize: '11.5px', color: 'var(--green-soft)', marginTop: '4px' }}>▲ +5% this week</p>
                                </div>
                                <div className="card glass">
                                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,.5)' }}>Calls & Directions</p>
                                    <p style={{ fontSize: '28px', fontWeight: 800, marginTop: '6px' }}>156</p>
                                    <p style={{ fontSize: '11.5px', color: 'var(--green-soft)', marginTop: '4px' }}>▲ +24% this week</p>
                                </div>
                            </div>

                            <div className="grid grid-2" style={{ marginBottom: '18px' }}>
                                {/* 2. Review Sentiment */}
                                <div className="card glass">
                                    <h3 style={{ fontSize: '15px', marginBottom: '16px' }}>Review Sentiment (Last 30 Days)</h3>
                                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                        <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'conic-gradient(var(--green) 0% 80%, var(--orange) 80% 90%, var(--red) 90% 100%)', flexShrink: 0 }}></div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}><span style={{color: 'var(--green-soft)'}}>■ Positive</span><span>80%</span></div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}><span style={{color: 'var(--orange-soft)'}}>■ Neutral</span><span>10%</span></div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}><span style={{color: 'var(--red-soft)'}}>■ Negative</span><span>10%</span></div>
                                        </div>
                                    </div>
                                    <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,.08)' }}>
                                        <p style={{ fontSize: '11px', color: 'var(--blue-soft)', fontWeight: 600, marginBottom: '4px' }}>AI Extracted Insights:</p>
                                        <p style={{ fontSize: '12.5px', color: 'rgba(255,255,255,.6)', margin: 0 }}>The most common negative feedback is regarding "wait times during weekends".</p>
                                    </div>
                                </div>

                                {/* 3. Competitor Benchmarking & Speed */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                                    <div className="card glass">
                                        <h3 style={{ fontSize: '15px', marginBottom: '16px' }}>Local Competitor Leaderboard</h3>
                                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,.5)', marginBottom: '16px' }}>For keyword "AC repair near me"</p>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <div className="card-sm" style={{ background: 'rgba(59,130,246,.1)', border: '1px solid rgba(59,130,246,.3)', display: 'flex', justifyContent: 'space-between', padding: '10px 14px' }}>
                                                <span style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--blue-soft)' }}>1. {activeLocationName} (You)</span>
                                                <span style={{ fontSize: '12px' }}>★ 4.9</span>
                                            </div>
                                            <div className="card-sm" style={{ background: 'rgba(255,255,255,.02)', display: 'flex', justifyContent: 'space-between', padding: '10px 14px' }}>
                                                <span style={{ fontSize: '13.5px' }}>2. Sharma Plumbing Co.</span>
                                                <span style={{ fontSize: '12px' }}>★ 4.3</span>
                                            </div>
                                            <div className="card-sm" style={{ background: 'rgba(255,255,255,.02)', display: 'flex', justifyContent: 'space-between', padding: '10px 14px' }}>
                                                <span style={{ fontSize: '13.5px' }}>3. Delhi Quick Fix</span>
                                                <span style={{ fontSize: '12px' }}>★ 4.1</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="card glass" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,.5)' }}>AI Avg Response Time</p>
                                            <p style={{ fontSize: '20px', fontWeight: 800, marginTop: '4px' }}>1.2 mins</p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,.5)' }}>Response Rate</p>
                                            <p style={{ fontSize: '20px', fontWeight: 800, marginTop: '4px', color: 'var(--green-soft)' }}>100%</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 4. Search Queries AI Widget */}
                            <div className="card glass">
                                <h3 style={{ fontSize: '15px', marginBottom: '6px' }}>Search Query Insights</h3>
                                <p style={{ fontSize: '12.5px', color: 'rgba(255,255,255,.5)', marginBottom: '20px' }}>The exact words people typed into Google to find your profile this week.</p>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
                                        <span>"plumber near me"</span>
                                        <span style={{ color: 'var(--blue-soft)' }}>42% of traffic</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
                                        <span>"ac repair rohini"</span>
                                        <span style={{ color: 'var(--blue-soft)' }}>28% of traffic</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
                                        <span>"emergency water leak fix"</span>
                                        <span style={{ color: 'var(--blue-soft)' }}>15% of traffic</span>
                                    </div>
                                </div>

                                <div className="card-sm" style={{ background: 'rgba(52,168,83,.05)', border: '1px solid rgba(52,168,83,.2)', marginTop: '20px' }}>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                        <span style={{ fontSize: '20px' }}>✨</span>
                                        <div>
                                            <p style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--green-soft)', margin: '0 0 4px' }}>AI Suggestion: High Value Keyword Detected</p>
                                            <p style={{ fontSize: '12.5px', color: 'rgba(255,255,255,.7)', margin: '0 0 12px', lineHeight: 1.5 }}>15% of your traffic is searching for <b>"emergency water leak fix"</b>. Should the AI start organically injecting this into your future 5-star replies?</p>
                                            <button className="btn btn-green btn-sm" onClick={() => alert('Keyword added to SEO Tracker!')}>Yes, Target Keyword</button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 5. SEO Target Keywords Tracker */}
                            <div className="card glass" style={{ marginTop: '18px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <h3 style={{ fontSize: '15px' }}>SEO Injection Tracker</h3>
                                    <button className="btn btn-ghost btn-sm">+ Add Target</button>
                                </div>
                                <div className="grid grid-2">
                                    <div className="card-sm" style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.08)' }}>
                                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,.5)', marginBottom: '8px' }}>Keywords You Want (Target)</p>
                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                            <span className="badge-pill b-gray">cheap plumber rohini</span>
                                            <span className="badge-pill b-gray">best ac repair</span>
                                            <span className="badge-pill b-gray">local geyser fix</span>
                                        </div>
                                    </div>
                                    <div className="card-sm" style={{ background: 'rgba(52,168,83,.05)', border: '1px solid rgba(52,168,83,.2)' }}>
                                        <p style={{ fontSize: '12px', color: 'var(--green-soft)', marginBottom: '8px', fontWeight: 600 }}>Keywords AI is Actively Injecting</p>
                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                            <span className="badge-pill b-green">cheap plumber rohini</span>
                                            <span className="badge-pill b-green">emergency water leak fix</span>
                                            <span className="badge-pill b-gray" style={{ opacity: 0.5 }}>pending sync...</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* ===================== PAGE: AI BRAIN SETTINGS ===================== */}
                    {appState === 'dashboard' && activeView === 'brain' && (
                        <section className="page active">
                            <div className="page-head">
                                <h2>AI Brain Settings</h2>
                                <p>Control center for the autopilot engine on this location.</p>
                            </div>

                            <div className="card glass" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <div>
                                    <p style={{ fontWeight: 600, fontSize: '15px', margin: 0 }}>Master Autopilot Switch</p>
                                    <p style={{ fontSize: '12.5px', color: 'rgba(255,255,255,.5)', margin: '4px 0 0' }}>Turn off to instantly stop replying to new reviews.</p>
                                </div>
                                <div className={`toggle ${isAiActive ? 'on' : ''}`} onClick={() => setIsAiActive(!isAiActive)}><span className="knob"></span></div>
                            </div>

                            <div className="card glass" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                    <div className={`checkbox ${replyTo1Star ? 'on' : ''}`} onClick={() => setReplyTo1Star(!replyTo1Star)}>
                                        {replyTo1Star ? '✓' : ''}
                                    </div>
                                    <div>
                                        <p style={{ fontWeight: 600, fontSize: '14.5px', margin: 0 }}>Reply to negative reviews</p>
                                        <p style={{ fontSize: '12.5px', color: 'rgba(255,255,255,.5)', margin: '4px 0 0' }}>If unchecked, the AI skips 1 and 2-star reviews so you can handle upset customers personally.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="card glass" style={{ marginBottom: '16px' }}>
                                <label className="field-label">AI Persona & Tone</label>
                                <select value={aiTone} onChange={(e) => setAiTone(e.target.value)}>
                                    <option>Professional</option>
                                    <option>Friendly</option>
                                    <option>Casual</option>
                                </select>
                            </div>

                            <div className="card glass">
                                <label className="field-label">Custom Instructions</label>
                                <textarea rows={3} value={customInstructions} onChange={(e) => setCustomInstructions(e.target.value)} placeholder="e.g. Always mention our 30-day return policy"></textarea>
                                <button className="btn btn-primary btn-sm" style={{ marginTop: '12px' }} onClick={() => alert('Settings Saved!')}>Save Settings</button>
                            </div>
                        </section>
                    )}

                    {/* ===================== PAGE: SWITCH LOCATIONS ===================== */}
                    {appState === 'dashboard' && activeView === 'locations' && (
                        <section className="page active">
                            <div className="page-head">
                                <h2>Switch Locations</h2>
                                <p>Every Google Business Profile you're currently paying for.</p>
                            </div>

                            <div className="grid grid-3">
                                {MOCK_LOCATIONS.map(loc => (
                                    <div 
                                        key={loc.id} 
                                        className="card glass glass-hover" 
                                        style={{ cursor: 'pointer', border: activeLocationId === loc.id ? '1px solid rgba(59,130,246,.4)' : '1px solid rgba(255,255,255,.08)' }}
                                    >
                                        {activeLocationId === loc.id && <span className="badge-pill b-blue" style={{ marginBottom: '10px', display: 'inline-block' }}>Currently Active</span>}
                                        {!loc.subscribed && <span className="badge-pill b-orange" style={{ marginBottom: '10px', display: 'inline-block' }}>Upgrade Required</span>}
                                        
                                        <p style={{ fontWeight: 700, fontSize: '15px', margin: '0 0 6px' }}>{loc.name}</p>
                                        <p style={{ fontSize: '12.5px', color: 'rgba(255,255,255,.5)', margin: '0 0 16px' }}>{loc.reviews} reviews · ★ {loc.rating} avg</p>
                                        
                                        {loc.subscribed ? (
                                            <button className="btn btn-ghost btn-sm btn-block" onClick={() => { setActiveLocationId(loc.id); setActiveView('dashboard'); }}>Switch to Profile</button>
                                        ) : (
                                            <button className="btn btn-primary btn-sm btn-block" onClick={() => { setActiveLocationId(loc.id); setActiveView('billing'); }}>Activate Automation</button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* ===================== PAGE: BILLING & SUBSCRIPTION ===================== */}
                    {appState === 'dashboard' && activeView === 'billing' && (
                        <section className="page active">
                            <div className="page-head">
                                <h2>Billing & Subscription</h2>
                                <p>Manage your plans for <b>{activeLocationName}</b>.</p>
                            </div>

                            <div className="grid grid-2">
                                <div className="card glass">
                                    <h3 style={{ fontSize: '15px', marginBottom: '16px' }}>Current Plan: Half-Yearly</h3>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '10px' }}>
                                        <p style={{ fontSize: '32px', fontWeight: 800, margin: 0 }} className="grad-blue">₹1,649</p>
                                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,.5)', margin: 0, paddingBottom: '4px' }}>/ 6 months</p>
                                    </div>
                                    <p style={{ fontSize: '12px', color: 'var(--green-soft)', marginBottom: '16px', fontWeight: 600 }}>Active</p>
                                    
                                    <div style={{ height: '6px', background: 'rgba(255,255,255,.1)', borderRadius: '4px', overflow: 'hidden', marginBottom: '8px' }}>
                                        <div style={{ height: '100%', width: '40%', background: 'var(--blue)' }}></div>
                                    </div>
                                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,.5)' }}>Renews on January 15, 2027 (112 days left)</p>
                                    
                                    <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                        <button className="btn btn-primary btn-sm">Manage Billing</button>
                                        <button className="btn btn-red-ghost btn-sm">Cancel Plan</button>
                </main>

                {/* MOBILE BOTTOM NAV */}
                {appState === 'dashboard' && (
                    <nav className="mobile-bottom-nav">
                        <div className={`mob-nav-item ${activeView === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveView('dashboard')}>
                            <span className="ic">◆</span>
                            <span>Home</span>
                        </div>
                        <div className={`mob-nav-item ${activeView === 'calendar' ? 'active' : ''}`} onClick={() => setActiveView('calendar')}>
                            <span className="ic">▦</span>
                            <span>Calendar</span>
                        </div>
                        <div className={`mob-nav-item ${activeView === 'analytics' ? 'active' : ''}`} onClick={() => setActiveView('analytics')}>
                            <span className="ic">◈</span>
                            <span>Analytics</span>
                        </div>
                        <div className={`mob-nav-item ${activeView === 'billing' ? 'active' : ''}`} onClick={() => setActiveView('billing')}>
                            <span className="ic">💳</span>
                            <span>Billing</span>
                        </div>
                    </nav>
                )}
            </div>
        </div>
    );
}
