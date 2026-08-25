import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';

export default function AdminDashboard({ onBackToApp }: { onBackToApp?: () => void }) {
    const [adminUser, setAdminUser] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('clients');

    // Review Queue State
    const [reviewQueueUser, setReviewQueueUser] = useState<any>(null);
    const [loadingDrafts, setLoadingDrafts] = useState(false);
    const [reviewDrafts, setReviewDrafts] = useState<any[]>([]);

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

    const filteredUsers = users.filter(u => 
        (u.full_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
        (u.email?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    ).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return (
        <div className="app-shell">
            <div className="noise"></div>

            {/* Admin Sidebar */}
            <aside className="sidebar glass" id="sidebar">
                <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', marginBottom: '30px' }}>
                    <div style={{ lineHeight: '1.2' }}>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'white' }}>Master <span className="grad-blue">Admin</span></div>
                        <div style={{ fontSize: '12px', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--blue-soft)' }}>God Mode</div>
                    </div>
                </div>

                <nav>
                    <div className={`nav-item ${activeTab === 'clients' ? 'active' : ''}`} onClick={() => setActiveTab('clients')}>
                        <span className="ic">👥</span> Client Database
                    </div>
                    <div className={`nav-item ${activeTab === 'revenue' ? 'active' : ''}`} onClick={() => setActiveTab('revenue')}>
                        <span className="ic">📈</span> Revenue Metrics
                    </div>
                    <div className={`nav-item ${activeTab === 'system' ? 'active' : ''}`} onClick={() => setActiveTab('system')}>
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

            {/* Mobile Header */}
            <div className="mobile-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', background: 'rgba(5,5,5,0.8)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontWeight: 'bold', fontSize: '18px' }}>Master Admin</div>
                <button className="btn btn-ghost btn-sm" style={{ padding: '6px 12px', color: 'var(--red-soft)' }} onClick={async () => { await supabase.auth.signOut(); window.location.href='/'; }}>Sign Out</button>
            </div>

            {/* Main Content */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                <main className="main" style={{ padding: '40px' }}>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
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
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: '18px' }}>Client Database</h3>
                            <input 
                                type="text" 
                                className="input" 
                                placeholder="Search by name or email..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{ width: '300px', padding: '8px 16px', background: 'rgba(0,0,0,.2)' }}
                            />
                        </div>
                        
                        {error && (
                            <div style={{ padding: '20px', color: 'var(--red-soft)', background: 'rgba(239,68,68,.1)' }}>
                                Error: {error}
                            </div>
                        )}

                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px', textAlign: 'left' }}>
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
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button className="btn btn-ghost btn-sm" style={{ padding: '6px 10px' }} onClick={() => openReviewQueue(u)}>Reviews</button>
                                                    <button className="btn btn-ghost btn-sm" style={{ padding: '6px 10px' }} onClick={() => alert("Calendar for " + u.full_name)}>Calendar</button>
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
