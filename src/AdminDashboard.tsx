import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';

export default function AdminDashboard({ onBackToApp }: { onBackToApp?: () => void }) {
    const [adminUser, setAdminUser] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('clients');

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
                alert(data.message);
                fetchUsers(adminUser.email);
            } else {
                alert("Error: " + data.message);
                setLoading(false);
            }
        } catch (e: any) {
            alert(e.message);
            setLoading(false);
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

                <div className="sidebar-foot" style={{ marginTop: 'auto' }}>
                    <button className="btn btn-ghost" style={{ width: '100%', display: 'flex', gap: '10px', justifyContent: 'center', border: '1px solid rgba(255,255,255,.1)' }} onClick={() => router.push('/dashboard')}>
                        <span>←</span> Back to App
                    </button>
                </div>
            </aside>

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
        </div>
    );
}
