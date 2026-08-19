import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';

export default function AdminDashboard() {
    const [adminUser, setAdminUser] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const router = {
        push: (path: string) => { window.location.href = path; }
    };

    useEffect(() => {
        const checkAdmin = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) {
                router.push('/');
                return;
            }

            const email = session.user.email;
            if (email !== 'ayushsony126@gmail.com' && email !== 'aryansoni12567@gmail.com') {
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
    const totalSubscribed = users.filter(u => Object.values(u.subscriptions || {}).some((s: any) => s.status === 'active')).length;
    const totalConnected = users.filter(u => u.has_google_token).length;

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

    return (
        <div className="app-shell" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div className="noise"></div>
            
            <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,.02)', backdropFilter: 'blur(10px)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ fontSize: '20px', fontWeight: 'bold' }}>Master <span className="grad-blue">Admin</span></div>
                    <span className="badge-pill b-blue" style={{ fontSize: '11px' }}>Owner View</span>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn" style={{ background: 'var(--blue)', color: 'white', padding: '6px 16px', fontSize: '13px' }} onClick={runScan}>⚡ Run Weekly Competitor Scan</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => router.push('/dashboard')}>← Back to App</button>
                </div>
            </div>

            <div style={{ padding: '30px', flex: 1, maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
                <div className="grid grid-3" style={{ marginBottom: '30px' }}>
                    <div className="card glass glass-hover">
                        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,.5)' }}>Total Registered Users</p>
                        <p style={{ fontSize: '32px', fontWeight: 800, marginTop: '8px' }} className="grad-blue">{totalUsers}</p>
                    </div>
                    <div className="card glass glass-hover">
                        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,.5)' }}>Active Subscriptions</p>
                        <p style={{ fontSize: '32px', fontWeight: 800, marginTop: '8px', color: 'var(--green-soft)' }}>{totalSubscribed}</p>
                    </div>
                    <div className="card glass glass-hover">
                        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,.5)' }}>Google Connected</p>
                        <p style={{ fontSize: '32px', fontWeight: 800, marginTop: '8px' }}>{totalConnected}</p>
                    </div>
                </div>

                <div className="card glass" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
                        <h3 style={{ margin: 0, fontSize: '16px' }}>Client Database</h3>
                    </div>
                    
                    {error && (
                        <div style={{ padding: '20px', color: 'var(--red-soft)' }}>
                            Error: {error}
                        </div>
                    )}

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: 'rgba(255,255,255,.02)' }}>
                                    <th style={{ padding: '16px', fontWeight: 600, color: 'rgba(255,255,255,.6)', borderBottom: '1px solid rgba(255,255,255,.08)' }}>User</th>
                                    <th style={{ padding: '16px', fontWeight: 600, color: 'rgba(255,255,255,.6)', borderBottom: '1px solid rgba(255,255,255,.08)' }}>Sign Up Date</th>
                                    <th style={{ padding: '16px', fontWeight: 600, color: 'rgba(255,255,255,.6)', borderBottom: '1px solid rgba(255,255,255,.08)' }}>Demo Status</th>
                                    <th style={{ padding: '16px', fontWeight: 600, color: 'rgba(255,255,255,.6)', borderBottom: '1px solid rgba(255,255,255,.08)' }}>Google Conn.</th>
                                    <th style={{ padding: '16px', fontWeight: 600, color: 'rgba(255,255,255,.6)', borderBottom: '1px solid rgba(255,255,255,.08)' }}>Subscriptions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map(u => (
                                    <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                                        <td style={{ padding: '16px' }}>
                                            <div style={{ fontWeight: 600, marginBottom: '4px' }}>{u.full_name || 'Unknown Name'}</div>
                                            <div style={{ color: 'rgba(255,255,255,.5)', fontSize: '12px' }}>{u.email}</div>
                                        </td>
                                        <td style={{ padding: '16px', color: 'rgba(255,255,255,.7)' }}>
                                            {new Date(u.created_at).toLocaleDateString()}
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            {u.demo_used ? <span className="badge-pill b-green" style={{ fontSize: '10px' }}>✓ Demo Finished</span> : <span className="badge-pill" style={{ fontSize: '10px', opacity: 0.5 }}>Pending</span>}
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            {u.has_google_token ? <span style={{ color: 'var(--green-soft)' }}>Connected</span> : <span style={{ color: 'rgba(255,255,255,.3)' }}>Not Linked</span>}
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            {Object.keys(u.subscriptions || {}).length > 0 ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    {Object.entries(u.subscriptions).map(([loc, sub]: [string, any]) => (
                                                        <div key={loc} style={{ fontSize: '12px', background: 'rgba(255,255,255,.05)', padding: '4px 8px', borderRadius: '4px' }}>
                                                            <span style={{ color: sub.status === 'active' ? 'var(--green-soft)' : 'var(--red-soft)' }}>● {sub.plan_id}</span> ({loc})
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span style={{ color: 'rgba(255,255,255,.3)' }}>No subs</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {users.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'rgba(255,255,255,.5)' }}>No users found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
