import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';

export default function AdminDashboard({ onBackToApp }: { onBackToApp?: () => void }) {
    const [adminUser, setAdminUser] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('clients');

    const [sidebarOpen, setSidebarOpen] = useState(false);

    const [reviewQueueUser, setReviewQueueUser] = useState<any>(null);
    const [loadingDrafts, setLoadingDrafts] = useState(false);
    const [reviewDrafts, setReviewDrafts] = useState<any[]>([]);

    const [seoModalUser, setSeoModalUser] = useState<any>(null);
    const [seoKeywords, setSeoKeywords] = useState<string>('');
    const [savingSeo, setSavingSeo] = useState(false);

    const [calendarModalUser, setCalendarModalUser] = useState<any>(null);
    const [userPosts, setUserPosts] = useState<any[]>([]);
    const [loadingPosts, setLoadingPosts] = useState(false);

    const [toast, setToast] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const router = {
        push: (path: string) => {
            if (path === '/dashboard' && onBackToApp) {
                onBackToApp();
            } else {
                window.location.href = path;
            }
        }
    };

    const downloadUserReport = async (u: any) => {
        try {
            const activeLoc = Object.keys(u.subscriptions || {}).find(loc => u.subscriptions[loc].status === 'active');
            if (!activeLoc) {
                showToast("User has no active subscriptions.", "error");
                return;
            }
            const intel = u.user_metadata?.competitor_intel?.[activeLoc];
            if (!intel) {
                showToast("No scan data available for this user yet.", "error");
                return;
            }
            
            showToast(`Generating report for ${u.full_name}...`, "info");
            
            const { jsPDF } = await import('jspdf');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            
            // Header
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(22);
            pdf.setTextColor(0, 51, 102);
            pdf.text("Detailed Rank Analysis", 15, 25);
            
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(11);
            pdf.setTextColor(100, 100, 100);
            pdf.text(`Business Name: ${u.full_name}`, 15, 33);
            const displayLoc = activeLoc.length > 80 ? activeLoc.substring(0, 80) + "..." : activeLoc;
            pdf.text(`Location: ${displayLoc}`, 15, 39);
            pdf.text(`Generated on: ${new Date(intel.last_scanned).toLocaleString()}`, 15, 45);
            
            // Introduction text (Detailed for customer)
            pdf.setFont("helvetica", "italic");
            pdf.setFontSize(10);
            pdf.setTextColor(80, 80, 80);
            const introText = "This report provides an AI-driven analysis of your Google Business Profile's local search performance compared to your top competitors. Higher rankings translate directly to more visibility, traffic, and revenue.";
            const splitIntro = pdf.splitTextToSize(introText, pageWidth - 30);
            let introY = 55;
            splitIntro.forEach((line: string) => {
                pdf.text(line, 15, introY);
                introY += 5;
            });

            pdf.setDrawColor(200, 200, 200);
            pdf.line(15, introY + 5, pageWidth - 15, introY + 5);
            
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(16);
            pdf.setTextColor(0, 0, 0);
            pdf.text("Competitor Leaderboard", 15, introY + 15);
            
            let y = introY + 25;
            intel.leaderboard.forEach((c: any) => {
                pdf.setFont("helvetica", "bold");
                pdf.setTextColor(c.is_user ? 0 : 50, c.is_user ? 100 : 50, c.is_user ? 200 : 50);
                const displayName = c.name.length > 55 ? c.name.substring(0, 55) + '...' : c.name;
                pdf.text(`#${c.rank}  ${displayName}`, 15, y);
                
                pdf.setFont("helvetica", "normal");
                pdf.setTextColor(100, 100, 100);
                pdf.text(`${c.rating} Stars | ${c.reviews} Reviews`, pageWidth - 60, y);
                y += 10;
            });
            
            y += 5;
            pdf.setDrawColor(200, 200, 200);
            pdf.line(15, y, pageWidth - 15, y);
            y += 12;
            
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(16);
            pdf.setTextColor(0, 0, 0);
            pdf.text("AI Strategy Report", 15, y);
            y += 8;
            
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(11);
            pdf.setTextColor(40, 40, 40);
            
            const rawText = intel.ai_report || "No AI report generated.";
            // Filter out <think> blocks
            const noThinkText = rawText.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
            // Simple markdown-to-text parser for PDF
            const cleanText = noThinkText.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').replace(/#/g, '');
            const paragraphs = cleanText.split('\n\n');
            
            paragraphs.forEach((p: string) => {
                const lines = pdf.splitTextToSize(p.trim(), pageWidth - 30);
                lines.forEach((lineText: string) => {
                    if (y > 280) {
                        pdf.addPage();
                        y = 20;
                    }
                    pdf.text(lineText, 15, y);
                    y += 6;
                });
                y += 4; // Extra space between paragraphs
            });
            
            pdf.save(`Rank_Analysis_${u.full_name}.pdf`);
            showToast("PDF downloaded successfully!", "success");
        } catch (e: any) {
            showToast("PDF Error: " + e.message, 'error');
        }
    };

    useEffect(() => {
        const checkAdmin = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) {
                router.push('/');
                return;
            }

            const email = session.user.email;
            if (email !== 'ayushsony126@gmail.com') {
                router.push('/dashboard');
                return;
            }

            setAdminUser(session.user);
            fetchUsers(email);
        };

        checkAdmin();
    }, []);

    const fetchUsers = async (adminEmail: string) => {
        try {
            const res = await fetch('https://gbp-auto-master-backend-us.onrender.com/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ admin_email: adminEmail })
            });

            const data = await res.json();
            if (data.status === 'success') {
                setUsers(data.users || []);
            } else {
                setError(data.detail || data.message || "Failed to fetch users");
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--obsidian)' }}>
                <div className="noise"></div>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', border: '3px solid rgba(59,130,246,.2)', borderTopColor: 'var(--blue)', animation: 'spin .8s linear infinite' }}></div>
            </div>
        );
    }

    // Calculations
    const totalUsers = users.length;
    const activeSubsList = users.flatMap(u => Object.values(u.subscriptions || {}).filter((s: any) => s.status === 'active'));
    const totalSubscribed = activeSubsList.length;
    const totalConnected = users.filter(u => u.has_google_token).length;
    
    // Estimate MRR (Monthly Recurring Revenue)
    const mrr = activeSubsList.reduce((acc: number, sub: any) => {
        if (sub.plan_id === 'half_yearly') return acc + (1999 / 6);
        if (sub.plan_id === 'yearly') return acc + (3999 / 12);
        return acc;
    }, 0);

    const runScan = async () => {
        if (!confirm("Are you sure you want to run the weekly competitor scan for all users? This will consume AI tokens.")) return;
        setLoading(true);
        try {
            const res = await fetch('https://gbp-auto-master-backend-us.onrender.com/api/admin/run-competitor-scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ admin_email: adminUser.email })
            });
            const data = await res.json();
            if (data.status === 'success') {
                showToast(data.message, 'success');
                fetchUsers(adminUser.email);
            } else {
                showToast("Error: " + data.message, 'error');
                setLoading(false);
            }
        } catch (e: any) {
            showToast(e.message, 'error');
            setLoading(false);
        }
    };

    const openReviewQueue = async (u: any) => {
        setReviewQueueUser(u);
        setLoadingDrafts(true);
        setReviewDrafts([]);
        
        try {
            // 1. Get offline provider token for this user
            const authRes = await fetch('https://gbp-auto-master-backend-us.onrender.com/api/auth/refresh-google-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: u.id })
            });
            const authData = await authRes.json();
            if (authData.status !== 'success') {
                showToast("Failed to get Google Token for user. Are they connected?", 'error');
                setLoadingDrafts(false);
                return;
            }
            
            // Get location ID (just grab the first active one)
            const activeLoc = Object.keys(u.subscriptions || {}).find(loc => u.subscriptions[loc].status === 'active');
            if (!activeLoc) {
                showToast("User has no active subscriptions.", 'error');
                setLoadingDrafts(false);
                return;
            }
            
            // Ensure location_id has the 'locations/' prefix for the Google API path
            const locationPath = activeLoc.includes('locations/') ? activeLoc : `locations/${activeLoc}`;

            // 2. Fetch Drafts
            const draftRes = await fetch('https://gbp-auto-master-backend-us.onrender.com/api/google/draft-reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: u.id,
                    provider_token: authData.provider_token,
                    location_id: locationPath
                })
            });
            
            const draftData = await draftRes.json();
            if (draftData.status === 'success') {
                setReviewDrafts(draftData.drafts || []);
            } else {
                showToast("Error fetching drafts: " + draftData.message, 'error');
            }
        } catch (e: any) {
            showToast(e.message, 'error');
        } finally {
            setLoadingDrafts(false);
        }
    };

    const postDraftReply = async (reviewId: string, replyText: string, idx: number) => {
        try {
            // Get offline token again
            const authRes = await fetch('https://gbp-auto-master-backend-us.onrender.com/api/auth/refresh-google-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: reviewQueueUser.id })
            });
            const authData = await authRes.json();
            if (authData.status !== 'success') throw new Error("Token refresh failed");

            const postRes = await fetch('https://gbp-auto-master-backend-us.onrender.com/api/google/post-reply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider_token: authData.provider_token,
                    review_id: reviewId,
                    reply_text: replyText
                })
            });
            const postData = await postRes.json();
            if (postData.status === 'success') {
                showToast("Reply posted successfully!", 'success');
                // Remove from queue
                const newDrafts = [...reviewDrafts];
                newDrafts.splice(idx, 1);
                setReviewDrafts(newDrafts);
            } else {
                showToast("Failed to post: " + postData.message, 'error');
            }
        } catch(e: any) {
            showToast(e.message, 'error');
        }
    };

    const openSeoModal = (user: any) => {
        setSeoModalUser(user);
        const activeLoc = Object.keys(user.subscriptions || {}).find(loc => user.subscriptions[loc].status === 'active');
        if (activeLoc && user.user_metadata?.ai_settings?.[activeLoc]?.active_keywords) {
            setSeoKeywords(user.user_metadata.ai_settings[activeLoc].active_keywords.join(', '));
        } else {
            setSeoKeywords('');
        }
    };

    const saveSeoSettings = async () => {
        if (!seoModalUser) return;
        setSavingSeo(true);
        try {
            const activeLoc = Object.keys(seoModalUser.subscriptions || {}).find(loc => seoModalUser.subscriptions[loc].status === 'active') || 'loc1';
            const keywordsArray = seoKeywords.split(',').map(k => k.trim()).filter(k => k);
            
            const currentSettings = seoModalUser.user_metadata?.ai_settings?.[activeLoc] || {};
            const newSettings = { ...currentSettings, active_keywords: keywordsArray };
            
            const res = await fetch('https://gbp-auto-master-backend-us.onrender.com/api/user/save-ai-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: seoModalUser.id,
                    location_id: activeLoc,
                    settings: newSettings
                })
            });
            
            if (res.ok) {
                showToast("SEO Keywords updated for user!", "success");
                setSeoModalUser(null);
                fetchUsers(adminUser.email); // refresh
            } else {
                showToast("Failed to save settings", "error");
            }
        } catch (e: any) {
            showToast(e.message, "error");
        } finally {
            setSavingSeo(false);
        }
    };

    const openCalendarModal = async (user: any) => {
        setCalendarModalUser(user);
        setLoadingPosts(true);
        setUserPosts([]);
        try {
            const res = await fetch('https://gbp-auto-master-backend-us.onrender.com/api/admin/calendar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ admin_email: adminUser.email, target_user_id: user.id })
            });
            const data = await res.json();
            if (data.status === 'success') {
                setUserPosts(data.posts);
            }
        } catch (e: any) {
            showToast("Failed to fetch calendar", "error");
        } finally {
            setLoadingPosts(false);
        }
    };

    const filteredUsers = users.filter(u => 
        (u.full_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
        (u.email?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    ).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return (
        <div className="app-shell">
            <div className="noise"></div>

            {/* Admin Sidebar */}
            {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)}></div>}
            <aside className={`sidebar glass ${sidebarOpen ? 'mobile-open' : ''}`} id="sidebar">
                <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', marginBottom: '30px' }}>
                    <div style={{ lineHeight: '1.2' }}>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'white' }}>Master <span className="grad-blue">Admin</span></div>
                        <div style={{ fontSize: '12px', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--blue-soft)' }}>God Mode</div>
                    </div>
                </div>

                <nav>
                    <div className={`nav-item ${activeTab === 'clients' ? 'active' : ''}`} onClick={() => { setActiveTab('clients'); setSidebarOpen(false); }}>
                        <span className="ic">👥</span> Client Database
                    </div>
                    <div className={`nav-item ${activeTab === 'revenue' ? 'active' : ''}`} onClick={() => { setActiveTab('revenue'); setSidebarOpen(false); }}>
                        <span className="ic">📈</span> Revenue Metrics
                    </div>
                    <div className={`nav-item ${activeTab === 'system' ? 'active' : ''}`} onClick={() => { setActiveTab('system'); setSidebarOpen(false); }}>
                        <span className="ic">⚙️</span> System Actions
                    </div>
                </nav>

                <div className="sidebar-foot" style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button className="btn btn-ghost" style={{ width: '100%', display: 'flex', gap: '10px', justifyContent: 'center', border: '1px solid rgba(255,255,255,.1)' }} onClick={() => router.push('/dashboard')}>
                        <span>←</span> Back to App
                    </button>
                    <button className="btn btn-ghost" style={{ width: '100%', display: 'flex', gap: '10px', justifyContent: 'center', color: 'var(--red-soft)' }} onClick={async () => { await supabase.auth.signOut(); window.location.href='/'; }}>
                        <span>👋</span> Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                {/* Mobile Header */}
                <div className="mobile-topbar" style={{ justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setSidebarOpen(!sidebarOpen)} style={{ padding: '4px 8px', fontSize: '16px', marginRight: '10px', display: 'flex' }}>
                        ☰
                    </button>
                    <div style={{ fontWeight: 'bold', fontSize: '16px' }}>Master <span className="grad-blue">Admin</span></div>
                    <button className="btn btn-ghost btn-sm" style={{ padding: '6px 12px', color: 'var(--red-soft)', fontSize: '11px', background: 'rgba(239, 68, 68, .1)', border: '1px solid rgba(239, 68, 68, .2)' }} onClick={async () => { await supabase.auth.signOut(); window.location.href='/'; }}>Sign Out</button>
                </div>

                <main className="main">
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
                        <div>
                            <h2 style={{ fontSize: '28px', margin: '0 0 8px' }}>Admin Overview</h2>
                            <p style={{ color: 'rgba(255,255,255,.5)', margin: 0 }}>Monitor business health and manage client accounts.</p>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button className="btn btn-green" onClick={runScan}>⚡ Run Competitor Scan</button>
                        </div>
                    </div>

                    <div className="grid grid-4" style={{ marginBottom: '40px' }}>
                        <div className="card glass glass-hover animate-in" style={{ '--delay': '0.1s' } as any}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(59,130,246,.1)', color: 'var(--blue-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', marginBottom: '16px' }}>👥</div>
                            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,.5)' }}>Total Users</p>
                            <p style={{ fontSize: '32px', fontWeight: 800, marginTop: '8px' }}>{totalUsers}</p>
                        </div>
                        <div className="card glass glass-hover animate-in" style={{ '--delay': '0.2s' } as any}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(52,168,83,.1)', color: 'var(--green-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', marginBottom: '16px' }}>💳</div>
                            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,.5)' }}>Active Subscriptions</p>
                            <p style={{ fontSize: '32px', fontWeight: 800, marginTop: '8px' }}>{totalSubscribed}</p>
                        </div>
                        <div className="card glass glass-hover animate-in" style={{ '--delay': '0.3s' } as any}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,193,7,.1)', color: 'var(--orange-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', marginBottom: '16px' }}>🔗</div>
                            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,.5)' }}>Google Connected</p>
                            <p style={{ fontSize: '32px', fontWeight: 800, marginTop: '8px' }}>{totalConnected}</p>
                        </div>
                        <div className="card glass glass-hover animate-in" style={{ '--delay': '0.4s' } as any}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', marginBottom: '16px' }}>💰</div>
                            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,.5)' }}>Est. Monthly Revenue (MRR)</p>
                            <p style={{ fontSize: '32px', fontWeight: 800, marginTop: '8px' }}>₹{Math.round(mrr).toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="card glass" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                            <h3 style={{ margin: 0, fontSize: '18px' }}>Client Database</h3>
                            <input 
                                type="text" 
                                className="input" 
                                placeholder="Search by name or email..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{ width: '100%', maxWidth: '300px', padding: '8px 16px', background: 'rgba(0,0,0,.2)' }}
                            />
                        </div>
                        
                        {error && (
                            <div style={{ padding: '20px', color: 'var(--red-soft)', background: 'rgba(239,68,68,.1)' }}>
                                Error: {error}
                            </div>
                        )}

                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px', textAlign: 'left', minWidth: '800px' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(255,255,255,.02)' }}>
                                        <th style={{ padding: '16px 24px', fontWeight: 600, color: 'rgba(255,255,255,.5)', borderBottom: '1px solid rgba(255,255,255,.08)' }}>Client Details</th>
                                        <th style={{ padding: '16px 24px', fontWeight: 600, color: 'rgba(255,255,255,.5)', borderBottom: '1px solid rgba(255,255,255,.08)' }}>Sign Up Date</th>
                                        <th style={{ padding: '16px 24px', fontWeight: 600, color: 'rgba(255,255,255,.5)', borderBottom: '1px solid rgba(255,255,255,.08)' }}>Demo Status</th>
                                        <th style={{ padding: '16px 24px', fontWeight: 600, color: 'rgba(255,255,255,.5)', borderBottom: '1px solid rgba(255,255,255,.08)' }}>Google API Status</th>
                                        <th style={{ padding: '16px 24px', fontWeight: 600, color: 'rgba(255,255,255,.5)', borderBottom: '1px solid rgba(255,255,255,.08)' }}>Subscriptions</th>
                                        <th style={{ padding: '16px 24px', fontWeight: 600, color: 'rgba(255,255,255,.5)', borderBottom: '1px solid rgba(255,255,255,.08)' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map(u => (
                                        <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,.04)' }} className="table-row-hover">
                                            <td style={{ padding: '16px 24px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--blue)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px' }}>
                                                        {(u.full_name || 'U')[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 600, marginBottom: '2px', color: 'white' }}>{u.full_name || 'Unknown Name'}</div>
                                                        <div style={{ color: 'rgba(255,255,255,.5)', fontSize: '12px' }}>{u.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px 24px', color: 'rgba(255,255,255,.7)' }}>
                                                {new Date(u.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                            </td>
                                            <td style={{ padding: '16px 24px' }}>
                                                {u.demo_used 
                                                    ? <span className="badge-pill b-green" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><span>✓</span> Completed</span> 
                                                    : <span className="badge-pill b-gray">Pending</span>}
                                            </td>
                                            <td style={{ padding: '16px 24px' }}>
                                                {u.has_google_token 
                                                    ? <span className="badge-pill b-blue" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><span>🔗</span> Connected</span> 
                                                    : <span className="badge-pill b-gray">Not Linked</span>}
                                            </td>
                                            <td style={{ padding: '16px 24px' }}>
                                                {Object.keys(u.subscriptions || {}).length > 0 ? (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                        {Object.entries(u.subscriptions).map(([loc, sub]: [string, any]) => (
                                                            <div key={loc} style={{ fontSize: '12px', background: 'rgba(255,255,255,.05)', padding: '6px 10px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                                                                <span style={{ fontWeight: 600, color: sub.status === 'active' ? 'var(--green-soft)' : 'var(--red-soft)' }}>{sub.plan_id.replace('_', ' ').toUpperCase()}</span> 
                                                                <span style={{ color: 'rgba(255,255,255,.5)', maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{loc}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span style={{ color: 'rgba(255,255,255,.3)', fontStyle: 'italic' }}>No active plans</span>
                                                )}
                                            </td>
                                            <td style={{ padding: '16px 24px' }}>
                                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                    <button className="btn btn-ghost btn-sm" style={{ padding: '6px 10px' }} onClick={() => openReviewQueue(u)}>Reviews</button>
                                                    <button className="btn btn-ghost btn-sm" style={{ padding: '6px 10px' }} onClick={() => downloadUserReport(u)}>Rank PDF</button>
                                                    <button className="btn btn-ghost btn-sm" style={{ padding: '6px 10px' }} onClick={() => openSeoModal(u)}>SEO</button>
                                                    <button className="btn btn-ghost btn-sm" style={{ padding: '6px 10px' }} onClick={() => openCalendarModal(u)}>Calendar</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredUsers.length === 0 && !loading && (
                                        <tr>
                                            <td colSpan={5} style={{ padding: '48px', textAlign: 'center', color: 'rgba(255,255,255,.5)' }}>
                                                <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔍</div>
                                                <div>No clients match your search criteria.</div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
            </div>

            {/* Review Queue Modal */}
            {reviewQueueUser && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(8px)' }}>
                    <div className="card glass" style={{ maxWidth: '800px', width: '100%', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
                        <button 
                            onClick={() => setReviewQueueUser(null)}
                            style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' }}
                        >✕</button>

                        <h2 style={{ fontSize: '24px', margin: '0 0 8px' }}>Review Approval Queue</h2>
                        <p style={{ color: 'var(--green-soft)', marginBottom: '24px' }}>Managing reviews for {reviewQueueUser.full_name}</p>

                        {loadingDrafts ? (
                            <div style={{ textAlign: 'center', padding: '40px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid rgba(59,130,246,.2)', borderTopColor: 'var(--blue)', animation: 'spin .8s linear infinite', margin: '0 auto 16px' }}></div>
                                <p>Fetching unreplied reviews and generating AI drafts...</p>
                            </div>
                        ) : reviewDrafts.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {reviewDrafts.map((draft, idx) => (
                                    <div key={idx} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '8px', padding: '20px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                            <div style={{ fontWeight: 'bold' }}>{draft.reviewer}</div>
                                            <div style={{ color: '#fbbf24' }}>{draft.rating}</div>
                                        </div>
                                        <div style={{ fontStyle: 'italic', color: 'rgba(255,255,255,.7)', marginBottom: '16px' }}>
                                            "{draft.comment}"
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '12px', color: 'var(--green-soft)', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>✨ AI Draft (Edit before sending):</label>
                                            <textarea 
                                                className="input" 
                                                rows={3} 
                                                style={{ width: '100%', marginBottom: '12px' }}
                                                value={draft.draft_reply}
                                                onChange={(e) => {
                                                    const newDrafts = [...reviewDrafts];
                                                    newDrafts[idx].draft_reply = e.target.value;
                                                    setReviewDrafts(newDrafts);
                                                }}
                                            />
                                            <button 
                                                className="btn btn-green btn-sm" 
                                                onClick={() => postDraftReply(draft.review_id, draft.draft_reply, idx)}
                                            >
                                                Approve & Post Reply
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,.5)' }}>
                                <div style={{ fontSize: '32px', marginBottom: '12px' }}>🎉</div>
                                <p>No unreplied reviews! All caught up.</p>
                                <p style={{ fontSize: '12px', marginTop: '8px' }}>Any unreplied reviews left unattended will automatically post at midnight.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
            {/* SEO Modal */}
            {seoModalUser && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div className="card glass" style={{ width: '100%', maxWidth: '500px', background: 'var(--obsidian)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, fontSize: '18px' }}>SEO Keywords: {seoModalUser.full_name}</h3>
                            <button className="btn btn-ghost btn-sm" onClick={() => setSeoModalUser(null)}>✕</button>
                        </div>
                        <label className="field-label">Target Keywords (comma separated)</label>
                        <textarea 
                            className="input" 
                            rows={3}
                            value={seoKeywords} 
                            onChange={(e) => setSeoKeywords(e.target.value)} 
                            placeholder="e.g. Best Cafe in Delhi, Affordable Cafe"
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                            <button className="btn btn-ghost" onClick={() => setSeoModalUser(null)}>Cancel</button>
                            <button className="btn btn-green" onClick={saveSeoSettings} disabled={savingSeo}>{savingSeo ? 'Saving...' : 'Save Keywords'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Calendar Modal */}
            {calendarModalUser && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div className="card glass" style={{ width: '100%', maxWidth: '600px', background: 'var(--obsidian)', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, fontSize: '18px' }}>Content Calendar: {calendarModalUser.full_name}</h3>
                            <button className="btn btn-ghost btn-sm" onClick={() => setCalendarModalUser(null)}>✕</button>
                        </div>
                        
                        <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {loadingPosts ? (
                                <p style={{ color: 'rgba(255,255,255,.5)' }}>Loading calendar...</p>
                            ) : userPosts.length === 0 ? (
                                <p style={{ color: 'rgba(255,255,255,.5)' }}>No posts scheduled or published.</p>
                            ) : (
                                userPosts.map((p, idx) => (
                                    <div key={idx} style={{ padding: '12px', background: 'rgba(255,255,255,.05)', borderRadius: '12px', border: '1px solid rgba(255,255,255,.1)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--blue-soft)' }}>{new Date(p.post_date).toLocaleDateString()}</span>
                                            <span className={`badge-pill ${p.status === 'published' ? 'b-green' : 'b-orange'}`}>{p.status.toUpperCase()}</span>
                                        </div>
                                        {p.image_url && <img src={p.image_url} alt="post" style={{ width: '100%', maxHeight: '150px', objectFit: 'cover', borderRadius: '8px', marginBottom: '10px' }} />}
                                        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,.8)', margin: 0, whiteSpace: 'pre-wrap' }}>{p.caption}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
            
            {toast && (
                <div style={{
                    position: 'fixed',
                    bottom: '24px',
                    right: '24px',
                    maxWidth: '400px',
                    wordBreak: 'break-word',
                    background: toast.type === 'error' ? 'rgba(239, 68, 68, 0.85)' : (toast.type === 'success' ? 'rgba(34, 197, 94, 0.85)' : 'rgba(59, 130, 246, 0.85)'),
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#fff',
                    padding: '12px 20px',
                    borderRadius: '12px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                    zIndex: 99999,
                    animation: 'slideInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    fontWeight: 600,
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                }}>
                    <span style={{ fontSize: '16px', flexShrink: 0 }}>{toast.type === 'success' ? '✓' : (toast.type === 'error' ? '✕' : 'ℹ')}</span>
                    <div style={{ lineHeight: '1.4' }}>{toast.message}</div>
                </div>
            )}
        </div>
    );
}
