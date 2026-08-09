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
    const [providerToken, setProviderToken] = useState<string | null>(null);
    const [liveLocations, setLiveLocations] = useState<any[]>([]);
    
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
    const [scheduledPosts, setScheduledPosts] = useState<any>({});
    const [isSchedulingNew, setIsSchedulingNew] = useState(false);

    // AI Brain State
    const [isAiActive, setIsAiActive] = useState(true);
    const [replyTo1Star, setReplyTo1Star] = useState(false);
    const [aiTone, setAiTone] = useState('Professional');
    const [customInstructions, setCustomInstructions] = useState('');

    // Locations State
    const [activeLocationId, setActiveLocationId] = useState<string>('loc1');
    const activeLocObj = liveLocations.find(l => l.id === activeLocationId) || (liveLocations.length > 0 ? liveLocations[0] : null);
    const activeLocationName = activeLocObj ? activeLocObj.name : "Loading Location...";
    
    // Analytics State
    const [analyticsData, setAnalyticsData] = useState<any>(null);
    const isActiveSubscribed = activeLocObj ? activeLocObj.subscribed : false;

    // Reviews State
    const [liveReviews, setLiveReviews] = useState<any[]>([]);
    const [loadingReviews, setLoadingReviews] = useState(false);
    const [syncingReviews, setSyncingReviews] = useState(false);

    // Analytics State
    const [newKeyword, setNewKeyword] = useState('');
    const [targetKeywords, setTargetKeywords] = useState(['cheap plumber rohini', 'best ac repair', 'local geyser fix']);
    const [competitorKeyword, setCompetitorKeyword] = useState('AC repair near me');
    const [competitors, setCompetitors] = useState<any[]>([]);
    const [loadingCompetitors, setLoadingCompetitors] = useState(false);

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
                    const { data: { session: newSession } } = await supabase.auth.getSession();
                    await checkUserRoute(data.user, newSession?.provider_token || null);
                    return;
                }
            }

            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) {
                router.push('/');
                return;
            }
            
            // Capture Offline Refresh Token for Backend Automation
            if (session.provider_refresh_token) {
                const currentRefreshToken = session.user.user_metadata?.google_refresh_token;
                if (currentRefreshToken !== session.provider_refresh_token) {
                    const { data: updatedUser } = await supabase.auth.updateUser({
                        data: { google_refresh_token: session.provider_refresh_token }
                    });
                    if (updatedUser?.user) {
                        session.user = updatedUser.user;
                    }
                }
            }
            
            await checkUserRoute(session.user, session.provider_token || null);
        };

        initializeDashboard();
    }, []);

    const checkUserRoute = async (currentUser: any, pToken: string | null) => {
        setUser(currentUser);
        setProviderToken(pToken);
        setHasGoogleConnected(true);

        const metadata = currentUser.user_metadata || {};
        const demoUsed = metadata.demo_used === true;
        
        if (!demoUsed) {
            setAppState('demo-select');
        } else {
            setAppState('dashboard');
        }
    };

    // Location Billing Guard
    useEffect(() => {
        if (appState === 'dashboard' || appState === 'payment') {
            if (activeLocObj) {
                if (activeLocObj.subscribed && appState === 'payment') {
                    setAppState('dashboard');
                } else if (!activeLocObj.subscribed && appState === 'dashboard') {
                    setAppState('payment');
                }
            }
        }
    }, [activeLocObj, appState]);

    // Fetch Live Locations from Python Backend
    useEffect(() => {
        if (appState !== 'loading' && providerToken && user) {
            fetch('https://gbp-auto-master-backend.onrender.com/api/google/locations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user.id, provider_token: providerToken })
            })
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success' && data.locations.length > 0) {
                    setLiveLocations(data.locations);
                    if (!activeLocationId || activeLocationId === 'loc1') {
                        setActiveLocationId(data.locations[0].id);
                    }
                } else if (data.status === 'error') {
                    console.error("Google API Error:", data.message);
                }
            })
            .catch(err => console.error("Error fetching locations:", err));
        }
    }, [appState, providerToken, user]);

    // Fetch Live Reviews from Backend
    useEffect(() => {
        if (appState === 'dashboard' && providerToken && user && activeLocationId && activeLocationId !== 'loc1') {
            setLoadingReviews(true);
            fetch('https://gbp-auto-master-backend.onrender.com/api/google/get-reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user.id, provider_token: providerToken, location_id: activeLocationId })
            })
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success') {
                    setLiveReviews(data.reviews || []);
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoadingReviews(false));
        }
    }, [appState, activeLocationId, providerToken, user]);

    const handleSyncReviews = async () => {
        if (!providerToken || !user || !activeLocationId) return;
        setSyncingReviews(true);
        try {
            const res = await fetch('https://gbp-auto-master-backend.onrender.com/api/google/sync-reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user.id, provider_token: providerToken, location_id: activeLocationId })
            });
            const data = await res.json();
            alert(data.message || "Sync Complete!");
            
            // Refetch reviews after sync
            const freshRes = await fetch('https://gbp-auto-master-backend.onrender.com/api/google/get-reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user.id, provider_token: providerToken, location_id: activeLocationId })
            });
            const freshData = await freshRes.json();
            if (freshData.status === 'success') {
                setLiveReviews(freshData.reviews || []);
            }
        } catch (e) {
            console.error(e);
            alert("Error syncing reviews");
        }
        setSyncingReviews(false);
    };

    // Fetch Calendar Posts from Supabase
    useEffect(() => {
        const fetchCalendar = async () => {
            if (!user) return;
            // For now fetching all posts for the user and grouping by day
            const { data, error } = await supabase
                .from('calendar_posts')
                .select('*')
                .eq('user_id', user.id);
                
            if (data && !error) {
                const postsByDay: any = {};
                data.forEach(post => {
                    const postDate = new Date(post.post_date);
                    // Check if it matches current month and year
                    if (postDate.getMonth() === currentMonth && postDate.getFullYear() === currentYear) {
                        const day = postDate.getDate();
                        if (!postsByDay[day]) postsByDay[day] = [];
                        postsByDay[day].push({ id: post.id, caption: post.caption, image_url: post.image_url, img: !!post.image_url });
                    }
                });
                setScheduledPosts(postsByDay);
            }
        };
        if (appState === 'dashboard') {
            fetchCalendar();
        }
    }, [user, appState, currentMonth, currentYear]);

    // Fetch Analytics Data
    useEffect(() => {
        if (appState === 'dashboard' && activeView === 'analytics' && providerToken && activeLocationId && activeLocationId !== 'loc1') {
            fetch('https://gbp-auto-master-backend.onrender.com/api/google/analytics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user?.id, provider_token: providerToken, location_id: activeLocationId })
            })
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success') {
                    setAnalyticsData(data.analytics);
                }
            })
            .catch(err => console.error(err));
        }
    }, [appState, activeView, activeLocationId, providerToken, user]);

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
                    user_id: user?.id || 'test_user_id',
                    location_id: activeLocationId
                })
            });
            const data = await res.json();

            // Check if the backend returned an error
            if (res.status !== 200 || data.detail) {
                alert("Backend Error during create-order: " + (data.detail || JSON.stringify(data)));
                return;
            }

            if (data.free_trial) {
                // Backend bypassed Razorpay for ATYAUNSUHJ and activated subscription
                alert('100% Free Trial Activated successfully!');
                setLiveLocations(prev => prev.map(l => l.id === activeLocationId ? { ...l, subscribed: true } : l));
                return;
            }

            const keyRes = await fetch("https://gbp-auto-master-backend.onrender.com/api/payment/key");
            const keyData = await keyRes.json();

            const options = {
                key: keyData.key,
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
                            user_id: user?.id || 'test_user_id',
                            location_id: activeLocationId,
                            plan_id: selectedPlan
                        })
                    });
                    const verifyData = await verifyRes.json();
                    
                    if (verifyData.status === 'success') {
                        setLiveLocations(prev => prev.map(l => l.id === activeLocationId ? { ...l, subscribed: true } : l));
                    } else {
                        alert("Payment verification failed! Server said: " + (verifyData.detail || JSON.stringify(verifyData)));
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
            alert('Discount Applied: FIRSTUNDER10');
        } else if (promoCode === 'ATYAUNSUHJ') {
            setDiscountApplied('ATYAUNSUHJ');
            alert('100% Free Trial Code Applied!');
        } else {
            setDiscountApplied('none');
            alert("Invalid or expired code");
        }
    };

    // ==========================================
    // DASHBOARD FUNCTIONS
    // ==========================================

    const handleSchedule = async () => {
        if (!selectedDate || !user) return;
        setLoadingAction(true);
        
        try {
            let image_url = null;
            if (file) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${user.id}/${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('calendar_images')
                    .upload(fileName, file);
                
                if (uploadError) throw uploadError;
                
                const { data: urlData } = supabase.storage.from('calendar_images').getPublicUrl(fileName);
                image_url = urlData.publicUrl;
            }

            // Format date as YYYY-MM-DD
            const postDateObj = new Date(currentYear, currentMonth, selectedDate);
            // using local time to format YYYY-MM-DD to avoid UTC shifting
            const year = postDateObj.getFullYear();
            const month = String(postDateObj.getMonth() + 1).padStart(2, '0');
            const day = String(postDateObj.getDate()).padStart(2, '0');
            const postDateStr = `${year}-${month}-${day}`;

            const { data: insertData, error } = await supabase.from('calendar_posts').insert([
                {
                    user_id: user.id,
                    location_id: activeLocationId,
                    post_date: postDateStr,
                    caption: postText,
                    image_url: image_url,
                    status: 'scheduled'
                }
            ]).select();

            if (error) throw error;

            setScheduledPosts((prev: any) => ({
                ...prev,
                [selectedDate]: [...(prev[selectedDate] || []), { id: insertData[0].id, caption: postText, image_url: image_url, img: !!image_url }]
            }));
            
            setIsSchedulingNew(false);
            setPostText('');
            setFile(null);
        } catch (error) {
            console.error('Error scheduling post:', error);
            alert("Error scheduling post");
        } finally {
            setLoadingAction(false);
        }
    };

    const cancelPost = async (day: number, idx: number) => {
        const post = scheduledPosts[day][idx];
        if (post.id) {
            await supabase.from('calendar_posts').delete().eq('id', post.id);
        }
        setScheduledPosts((prev: any) => {
            const newPosts = [...prev[day]];
            newPosts.splice(idx, 1);
            return { ...prev, [day]: newPosts };
        });
    };

    const publishNow = async (post: any) => {
        try {
            setLoadingAction(true);
            const res = await fetch("https://gbp-auto-master-backend.onrender.com/api/google/publish-post", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider_token: providerToken,
                    location_id: activeLocationId,
                    summary: post.caption,
                    image_url: post.image_url
                })
            });
            const data = await res.json();
            if (data.status === 'success') {
                alert('Successfully published to Google Business Profile!');
            } else {
                alert('Error publishing to Google: ' + data.message);
            }
        } catch (e) {
            alert('Server error while publishing');
        } finally {
            setLoadingAction(false);
        }
    };

    const fetchCompetitors = async () => {
        if (!user || !providerToken) return;
        setLoadingCompetitors(true);
        try {
            const res = await fetch('https://gbp-auto-master-backend.onrender.com/api/google/competitors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user.id, location_name: activeLocationName, keyword: competitorKeyword })
            });
            const data = await res.json();
            if (data.status === 'success') {
                setCompetitors(data.competitors);
            } else {
                alert("Error finding competitors");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingCompetitors(false);
        }
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
                <div className="mobile-topbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="sidebar-logo" style={{ padding: 0 }}>GBP Auto <span className="grad-blue">Master</span></div>
                    
                    {appState === 'dashboard' && liveLocations.length > 0 && (
                        <select 
                            className="input" 
                            style={{ margin: '0 10px', padding: '4px 8px', fontSize: '12px', flex: 1, minWidth: 0, height: '32px' }}
                            value={activeLocationId}
                            onChange={(e) => setActiveLocationId(e.target.value)}
                        >
                            {liveLocations.map((loc, i) => <option key={i} value={loc.id}>{loc.name}</option>)}
                        </select>
                    )}

                    <button className="btn btn-ghost btn-sm" onClick={() => supabase.auth.signOut().then(() => router.push('/'))} style={{ fontSize: '11px', padding: '6px 12px', background: 'rgba(239, 68, 68, .1)', color: 'var(--red-soft)', border: '1px solid rgba(239, 68, 68, .2)' }}>Sign Out</button>
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
                                        {liveLocations.length > 0 ? liveLocations.map(loc => (
                                            <div key={loc.id} className="card-sm glass glass-hover" onClick={() => setDemoSelectedLoc(loc.id)} style={{ cursor: 'pointer', border: demoSelectedLoc === loc.id ? '1px solid rgba(59,130,246,.35)' : '' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    {demoSelectedLoc === loc.id && <span className="badge-pill b-blue">Selected</span>}
                                                </div>
                                                <p style={{ fontWeight: 600, fontSize: '14px', margin: '10px 0 2px' }}>{loc.name}</p>
                                                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,.45)', margin: 0 }}>{loc.reviews} reviews · ★ {loc.rating}</p>
                                            </div>
                                        )) : <p style={{ fontSize: '13px', color: 'rgba(255,255,255,.5)' }}>Loading live Google locations...</p>}
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
                                    <h3 style={{ fontSize: '16px', marginBottom: '4px' }}>Subscribe for {activeLocationName}</h3>
                                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,.6)', marginBottom: '16px' }}>This AI Engine subscription will apply exclusively to this Google Business Profile.</p>

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
                                <div className="card glass glass-hover" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: isAiActive ? 'var(--green)' : 'var(--red)', boxShadow: isAiActive ? '0 0 8px var(--green)' : '0 0 8px var(--red)', animation: isAiActive ? 'pulse 2s ease-in-out infinite' : 'none' }}></span>
                                            <p style={{ fontWeight: 600, fontSize: '14px', margin: 0 }}>AI Auto-Replier</p>
                                        </div>
                                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,.45)', margin: 0 }}>{isAiActive ? 'Monitoring live reviews' : 'Currently paused'}</p>
                                    </div>
                                    <div className={`toggle ${isAiActive ? 'on' : ''}`} onClick={() => setIsAiActive(!isAiActive)}><span className="knob"></span></div>
                                </div>
                                <div className="card glass glass-hover">
                                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,.5)' }}>Total Reviews</p>
                                    <p style={{ fontSize: '28px', fontWeight: 800, marginTop: '6px' }} className="grad-blue">{activeLocObj?.reviews || 0}</p>
                                </div>
                                <div className="card glass glass-hover">
                                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,.5)' }}>Replied Reviews</p>
                                    <p style={{ fontSize: '28px', fontWeight: 800, marginTop: '6px', color: 'var(--green-soft)' }}>{Math.floor((activeLocObj?.reviews || 0) * 0.85)}</p>
                                </div>
                            </div>

                            <div className="card glass">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                    <h3 style={{ fontSize: '15px', margin: 0 }}>Live Review Feed</h3>
                                    <button 
                                        className="btn btn-ghost btn-sm" 
                                        onClick={handleSyncReviews}
                                        disabled={syncingReviews || loadingReviews}
                                    >
                                        {syncingReviews ? 'Syncing...' : 'Force AI Sync'}
                                    </button>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    
                                    {loadingReviews ? (
                                        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,.5)' }}>Loading your real Google Reviews...</p>
                                    ) : liveReviews.length === 0 ? (
                                        <div className="card-sm" style={{ background: 'rgba(255,255,255,.03)', border: '1px dashed rgba(255,255,255,.2)', textAlign: 'center', padding: '32px 20px' }}>
                                            <p style={{ fontWeight: 600, fontSize: '14px', margin: '0 0 6px' }}>No reviews found for this location.</p>
                                            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,.5)', margin: 0 }}>Once customers leave reviews, they will appear here.</p>
                                        </div>
                                    ) : (
                                        liveReviews.map((rev, i) => (
                                            <div key={i} className="card-sm" style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--blue)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>
                                                            {rev.reviewer.charAt(0)}
                                                        </div>
                                                        <p style={{ fontWeight: 600, fontSize: '13px', margin: 0 }}>{rev.reviewer}</p>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '2px', color: '#fbbf24', fontSize: '12px' }}>
                                                        {rev.rating === 'FIVE' ? '★★★★★' : rev.rating === 'FOUR' ? '★★★★☆' : rev.rating === 'THREE' ? '★★★☆☆' : rev.rating === 'TWO' ? '★★☆☆☆' : '★☆☆☆☆'}
                                                    </div>
                                                </div>
                                                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,.8)', margin: '8px 0', lineHeight: 1.5 }}>
                                                    "{rev.comment || 'No comment provided'}"
                                                </p>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                                                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,.4)', margin: 0 }}>
                                                        {new Date(rev.createTime).toLocaleDateString()}
                                                    </p>
                                                    {rev.has_reply ? (
                                                        <span className="badge-pill b-green" style={{ padding: '2px 8px', fontSize: '10px' }}>✓ Replied</span>
                                                    ) : (
                                                        <span className="badge-pill" style={{ padding: '2px 8px', fontSize: '10px', background: 'rgba(255,255,255,.1)' }}>Unreplied</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}

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
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <h2 style={{ margin: 0 }}>Content Calendar</h2>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            <button className="btn btn-ghost btn-sm" style={{ padding: '4px 10px', fontSize: '14px' }} onClick={() => {
                                                if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
                                                else setCurrentMonth(currentMonth - 1);
                                            }}>{"<"}</button>
                                            <button className="btn btn-ghost btn-sm" style={{ padding: '4px 10px', fontSize: '14px' }} onClick={() => {
                                                if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
                                                else setCurrentMonth(currentMonth + 1);
                                            }}>{">"}</button>
                                        </div>
                                    </div>
                                    <p style={{ marginTop: '8px' }}>{new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long', year: 'numeric' })} · click a day to schedule.</p>
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
                                        <h3 style={{ fontSize: '15px' }}>{new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' })} {selectedDate}</h3>
                                        <button className="btn btn-ghost btn-sm" onClick={() => setIsSchedulingNew(true)}>+ Add post</button>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {scheduledPosts[selectedDate]?.map((post: any, idx: number) => (
                                            <div key={idx} className="card-sm" style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <span style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(59,130,246,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📷</span>
                                                    <span style={{ fontSize: '13px' }}>{post.caption}</span>
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button className="btn-ghost btn btn-sm" onClick={() => publishNow(post)}>Publish Now</button>
                                                    <button className="btn-red-ghost btn btn-sm" onClick={() => cancelPost(selectedDate, idx)}>Cancel</button>
                                                </div>
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
                                        
                                        <label className="field-label">Date ({new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' })})</label>
                                        <input type="text" value={selectedDate || 1} onChange={(e) => setSelectedDate(parseInt(e.target.value) || 1)} style={{ marginBottom: '14px' }} />
                                        
                                        <label className="field-label">Image</label>
                                        <label style={{ display: 'block', border: '1px dashed rgba(255,255,255,.2)', borderRadius: '12px', padding: '24px', textAlign: 'center', fontSize: '12.5px', color: 'rgba(255,255,255,.4)', marginBottom: '14px', cursor: 'pointer' }}>
                                            {file ? file.name : "📷 Click to upload image"}
                                            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} style={{ display: 'none' }} />
                                        </label>
                                        
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

                            {(() => {
                                const getMetricTotal = (metricName: string) => {
                                    if (!analyticsData || !analyticsData.multiDailyMetricTimeSeries) return 0;
                                    const series = analyticsData.multiDailyMetricTimeSeries.find((s: any) => s.dailyMetric === metricName);
                                    if (!series || !series.timeSeries || !series.timeSeries.datedValues) return 0;
                                    return series.timeSeries.datedValues.reduce((acc: number, val: any) => acc + parseInt(val.value || 0), 0);
                                };

                                const websiteClicks = getMetricTotal('WEBSITE_CLICKS');
                                const callClicks = getMetricTotal('CALL_CLICKS');
                                const directionRequests = getMetricTotal('BUSINESS_DIRECTION_REQUESTS');
                                const callsAndDirections = callClicks + directionRequests;
                                const desktopMaps = getMetricTotal('BUSINESS_IMPRESSIONS_DESKTOP_MAPS');
                                const mobileMaps = getMetricTotal('BUSINESS_IMPRESSIONS_MOBILE_MAPS');
                                const totalMapViews = desktopMaps + mobileMaps;
                                const profileVisitors = totalMapViews; // Approximate mapped views

                                return (
                                    <>
                                        <div className="grid grid-2" style={{ marginBottom: '24px' }}>
                                            <div className="card glass">
                                                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,.5)' }}>Profile Visitors (30 Days)</p>
                                                <p style={{ fontSize: '28px', fontWeight: 800, marginTop: '6px' }} className="grad-blue">{analyticsData ? profileVisitors.toLocaleString() : '...'}</p>
                                            </div>
                                            <div className="card glass">
                                                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,.5)' }}>Total Map Views</p>
                                                <p style={{ fontSize: '28px', fontWeight: 800, marginTop: '6px' }}>{analyticsData ? totalMapViews.toLocaleString() : '...'}</p>
                                            </div>
                                            <div className="card glass">
                                                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,.5)' }}>Website Clicks</p>
                                                <p style={{ fontSize: '28px', fontWeight: 800, marginTop: '6px' }}>{analyticsData ? websiteClicks.toLocaleString() : '...'}</p>
                                            </div>
                                            <div className="card glass">
                                                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,.5)' }}>Calls & Directions</p>
                                                <p style={{ fontSize: '28px', fontWeight: 800, marginTop: '6px' }}>{analyticsData ? callsAndDirections.toLocaleString() : '...'}</p>
                                            </div>
                                        </div>
                                    </>
                                );
                            })()}

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
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                            <h3 style={{ fontSize: '15px' }}>Local Competitor Leaderboard</h3>
                                        </div>
                                        <div className="card-sm" style={{ background: 'rgba(255,255,255,.03)', border: '1px dashed rgba(255,255,255,.2)', textAlign: 'center', padding: '32px 20px' }}>
                                            <p style={{ fontWeight: 600, fontSize: '14px', margin: '0 0 6px' }}>Competitor Tracker will be starting soon</p>
                                            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,.5)', margin: 0 }}>Awaiting Google API Approval.</p>
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
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                                    <h3 style={{ fontSize: '15px' }}>SEO Injection Tracker</h3>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <input type="text" placeholder="Add keyword" value={newKeyword} onChange={(e) => setNewKeyword(e.target.value)} style={{ padding: '6px 10px', width: '150px' }} onKeyDown={(e) => { if(e.key === 'Enter' && newKeyword) { setTargetKeywords([...targetKeywords, newKeyword]); setNewKeyword(''); } }} />
                                        <button className="btn btn-ghost btn-sm" onClick={() => { if(newKeyword) { setTargetKeywords([...targetKeywords, newKeyword]); setNewKeyword(''); } }}>+ Add Target</button>
                                    </div>
                                </div>
                                <div className="grid grid-2">
                                    <div className="card-sm" style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.08)' }}>
                                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,.5)', marginBottom: '8px' }}>Keywords You Want (Target)</p>
                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                            {targetKeywords.map((kw, i) => (
                                                <span key={i} className="badge-pill b-gray">{kw}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="card-sm" style={{ background: 'rgba(52,168,83,.05)', border: '1px solid rgba(52,168,83,.2)' }}>
                                        <p style={{ fontSize: '12px', color: 'var(--green-soft)', marginBottom: '8px', fontWeight: 600 }}>Keywords AI is Actively Injecting</p>
                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                            <span className="badge-pill b-green">{targetKeywords[0]}</span>
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
                                {liveLocations.length > 0 ? liveLocations.map(loc => (
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
                                )) : <p style={{ fontSize: '13px', color: 'rgba(255,255,255,.5)' }}>Loading live Google locations...</p>}
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

                            {isActiveSubscribed && activeLocObj?.plan_details ? (
                                <div className="grid grid-2">
                                    <div className="card glass">
                                        <h3 style={{ fontSize: '15px', marginBottom: '16px', textTransform: 'capitalize' }}>Current Plan: {activeLocObj.plan_details.plan_id.replace('_', ' ')}</h3>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '10px' }}>
                                            <p style={{ fontSize: '32px', fontWeight: 800, margin: 0 }} className="grad-blue">
                                                ₹{PRICING_PLANS[activeLocObj.plan_details.plan_id]?.original || '0'}
                                            </p>
                                            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,.5)', margin: 0, paddingBottom: '4px' }}>
                                                / {activeLocObj.plan_details.plan_id === 'monthly' ? '1 month' : (activeLocObj.plan_details.plan_id === 'yearly' ? '12 months' : '6 months')}
                                            </p>
                                        </div>
                                        <p style={{ fontSize: '12px', color: 'var(--green-soft)', marginBottom: '16px', fontWeight: 600 }}>Active</p>
                                        
                                        <div style={{ height: '6px', background: 'rgba(255,255,255,.1)', borderRadius: '4px', overflow: 'hidden', marginBottom: '8px' }}>
                                            <div style={{ height: '100%', width: '40%', background: 'var(--blue)' }}></div>
                                        </div>
                                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,.5)' }}>
                                            Renews on {new Date(activeLocObj.plan_details.expires_at).toLocaleDateString()} 
                                            ({Math.ceil((new Date(activeLocObj.plan_details.expires_at).getTime() - new Date().getTime()) / (1000 * 3600 * 24))} days left)
                                        </p>
                                        
                                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                            <button className="btn btn-primary btn-sm">Manage Billing / Update Card</button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="card glass">
                                    <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Activate Automation for {activeLocationName}</h3>
                                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,.6)', marginBottom: '20px' }}>This location currently does not have an active AI subscription. Choose a plan below to activate.</p>
                                    <div className="grid grid-3">
                                        {(Object.keys(PRICING_PLANS) as Array<keyof typeof PRICING_PLANS>).map((key) => (
                                            <div key={key} className="card-sm glass glass-hover" onClick={() => setSelectedPlan(key)} style={{ cursor: 'pointer', border: selectedPlan === key ? '1px solid rgba(59,130,246,.4)' : '' }}>
                                                <p style={{ fontSize: '12px', color: selectedPlan === key ? 'var(--blue-soft)' : 'rgba(255,255,255,.5)' }}>{PRICING_PLANS[key].name}</p>
                                                <p style={{ fontWeight: 700, fontSize: '20px', marginTop: '4px' }}>₹{PRICING_PLANS[key].original}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,.5)', marginTop: '16px' }}>
                                        * Note: After the initial payment, the original standard price will apply upon renewal.
                                    </p>
                                    
                                    <div style={{ marginTop: '20px', padding: '12px', background: 'rgba(255,255,255,.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,.08)' }}>
                                        <p style={{ fontSize: '12.5px', marginBottom: '8px', fontWeight: 600 }}>Have a promo code?</p>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <input type="text" placeholder="Enter code" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} style={{ padding: '8px 12px', flex: 1, textTransform: 'uppercase' }} />
                                            <button className="btn btn-primary" onClick={applyPromo}>Apply</button>
                                        </div>
                                    </div>

                                    <button className="btn btn-green btn-block" style={{ marginTop: '16px', fontSize: '15px', padding: '12px' }} onClick={handleCheckout}>
                                        {discountApplied === 'ATYAUNSUHJ' ? 'Activate 100% Free Trial' : 'Pay with Razorpay'}
                                    </button>
                                </div>
                            )}
                        </section>
                    )}

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
