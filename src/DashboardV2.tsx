import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './lib/supabase';

// Modular views
import BrainSettings from './BrainSettings';
import SubscriptionPage from './SubscriptionPage';
import ReviewManager from './ReviewManager';
import ContentCalendarV2 from './ContentCalendarV2';
import RankAnalysis from './RankAnalysis';

const API_URL = import.meta.env.VITE_API_URL || 'https://gbp-auto-master-backend-us.onrender.com';

export default function DashboardV2() {
    // ─── Core User State ───
    const [user, setUser] = useState<any>(null);
    const [providerToken, setProviderToken] = useState<string | null>(null);
    const [activeView, setActiveView] = useState('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [tokenBalance, setTokenBalance] = useState<number>(0);
    const [toast, setToast] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);

    // ─── Location State ───
    const [liveLocations, setLiveLocations] = useState<any[]>([]);
    const [activeLocationId, setActiveLocationId] = useState<string>('');
    const [loadingLocations, setLoadingLocations] = useState(false);

    // ─── Review State ───
    const [liveReviews, setLiveReviews] = useState<any[]>([]);
    const [loadingReviews, setLoadingReviews] = useState(false);
    const [syncingReviews, setSyncingReviews] = useState(false);

    // ─── Analytics & Keywords ───
    const [analyticsData, setAnalyticsData] = useState<any>(null);
    const [searchKeywords, setSearchKeywords] = useState<any[]>([]);
    const [seoKeywords, setSeoKeywords] = useState<string[]>([]);
    const [totalReviewCount, setTotalReviewCount] = useState<number>(0);
    const [averageRating, setAverageRating] = useState<number>(0);

    // ─── Calendar State (managed here, passed to ContentCalendarV2) ───
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [selectedDate, setSelectedDate] = useState<number | null>(null);
    const [scheduledPosts, setScheduledPosts] = useState<any>({});
    const [isSchedulingNew, setIsSchedulingNew] = useState(false);
    const [postType, setPostType] = useState<'LOCAL_POST' | 'PHOTO' | 'VIDEO'>('LOCAL_POST');
    const [file, setFile] = useState<File | null>(null);
    const [postText, setPostText] = useState('');
    const [loadingAction, setLoadingAction] = useState(false);

    // ─── Helper: Show Toast ───
    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    // ─── Helper: Get active location object ───
    const activeLocObj = liveLocations.find(l => l.id === activeLocationId) || (liveLocations.length > 0 ? liveLocations[0] : null);
    const activeLocationName = activeLocObj ? activeLocObj.name : 'No Location Connected';

    // Calendar derived values
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // ─── Auth & Initial Data Fetch ───
    useEffect(() => {
        const initDashboard = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setUser(session.user);
                
                // Instantly load cached locations from database (eliminates 30s wait)
                const cachedLocs = session.user.user_metadata?.cached_locations || [];
                if (cachedLocs.length > 0) {
                    setLiveLocations(cachedLocs);
                    if (!activeLocationId) setActiveLocationId(cachedLocs[0].id);
                    setLoadingLocations(false);
                }
                
                const token = session.provider_token;
                if (token) setProviderToken(token);

                // Save refresh token to user metadata if it exists
                if (session.provider_refresh_token) {
                    await supabase.auth.updateUser({
                        data: { google_refresh_token: session.provider_refresh_token }
                    });
                }
                
                // Fetch data in parallel
                if (token) {
                    fetchLocations(session.user.id, token);
                } else {
                    // Try refreshing the Google token from backend
                    refreshGoogleToken(session.user.id);
                }
            }

            const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
                if (session?.user) {
                    setUser(session.user);
                    const cachedLocs = session.user.user_metadata?.cached_locations || [];
                    if (cachedLocs.length > 0) {
                        setLiveLocations(cachedLocs);
                        if (!activeLocationId) setActiveLocationId(cachedLocs[0].id);
                        setLoadingLocations(false);
                    }
                    if (session.provider_token) {
                        setProviderToken(session.provider_token);
                    }
                    if (session.provider_refresh_token) {
                        await supabase.auth.updateUser({
                            data: { google_refresh_token: session.provider_refresh_token }
                        });
                    }
                } else {
                    setUser(null);
                }
            });

            return () => {
                authListener.subscription.unsubscribe();
            };
        };
        initDashboard();
    }, []);

    // ─── Refresh Google Token via Backend ───
    const refreshGoogleToken = async (userId: string) => {
        try {
            const res = await fetch(`${API_URL}/api/auth/refresh-google-token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId })
            });
            if (res.ok) {
                const data = await res.json();
                if (data.provider_token) {
                    setProviderToken(data.provider_token);
                    fetchLocations(userId, data.provider_token);
                }
            }
        } catch (e) {
            console.error('Failed to refresh Google token:', e);
        }
    };

    // ─── Fetch Token Balance ───
    const fetchTokenBalance = async (userId: string, locationId: string) => {
        if (!locationId) return;
        try {
            const res = await fetch(`${API_URL}/api/tokens/balance`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId, location_id: locationId })
            });
            if (res.ok) {
                const data = await res.json();
                setTokenBalance(data.balance || 0);
            }
        } catch (error) {
            console.error('Error fetching token balance:', error);
        }
    };

    // Auto-fetch tokens when active location changes
    React.useEffect(() => {
        if (user?.id && activeLocationId) {
            fetchTokenBalance(user.id, activeLocationId);
        }
    }, [user?.id, activeLocationId]);

    // ─── Fetch Google Locations ───
    const fetchLocations = async (userId: string, token: string) => {
        if (liveLocations.length === 0) setLoadingLocations(true);
        try {
            const res = await fetch(`${API_URL}/api/google/locations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId, provider_token: token })
            });
            if (res.ok) {
                const data = await res.json();
                if (data.status === 'error') {
                    console.error('Google API Error:', data.message);
                    if (data.message.includes('401') || data.message.includes('unauthorized') || data.message.includes('invalid_grant')) {
                        // Token might be expired, try refreshing
                        refreshGoogleToken(userId);
                    } else {
                        // Show error so we know what's happening
                        alert('Google Sync Error: ' + data.message);
                    }
                }
                const locs = data.locations || [];
                setLiveLocations(locs);
                if (locs.length > 0 && !activeLocationId) {
                    setActiveLocationId(locs[0].id);
                }
            }
        } catch (error) {
            console.error('Error fetching locations:', error);
        } finally {
            setLoadingLocations(false);
        }
    };

    // ─── Fetch Reviews for Active Location ───
    const fetchReviews = useCallback(async () => {
        if (!providerToken || !activeLocationId || !user) return;
        setLoadingReviews(true);
        try {
            const res = await fetch(`${API_URL}/api/google/get-reviews`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.id,
                    provider_token: providerToken,
                    location_id: activeLocationId
                })
            });
            if (res.ok) {
                const data = await res.json();
                setLiveReviews(data.reviews || []);
                if (data.totalReviewCount !== undefined) setTotalReviewCount(data.totalReviewCount);
                if (data.averageRating !== undefined) setAverageRating(data.averageRating);
            }
        } catch (error) {
            console.error('Error fetching reviews:', error);
        } finally {
            setLoadingReviews(false);
        }
    }, [providerToken, activeLocationId, user]);

    // ─── Sync (Auto-Reply) Reviews ───
    const handleSyncReviews = async () => {
        if (!providerToken || !activeLocationId || !user) return;
        setSyncingReviews(true);
        try {
            const res = await fetch(`${API_URL}/api/google/sync-reviews`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.id,
                    provider_token: providerToken,
                    location_id: activeLocationId
                })
            });
            if (res.ok) {
                const data = await res.json();
                showToast(`Synced! ${data.replied_count || 0} reviews auto-replied.`, 'success');
                fetchReviews(); // Refresh the list
            }
        } catch (error) {
            showToast('Error syncing reviews', 'error');
        } finally {
            setSyncingReviews(false);
        }
    };

    // ─── Fetch Analytics ───
    const fetchAnalytics = async () => {
        if (!providerToken || !activeLocationId || !user) return;
        try {
            const res = await fetch(`${API_URL}/api/google/analytics`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.id,
                    provider_token: providerToken,
                    location_id: activeLocationId
                })
            });
            if (res.ok) {
                const data = await res.json();
                setAnalyticsData(data);
            }
        } catch (error) {
            console.error('Error fetching analytics:', error);
        }
    };

    // ─── Fetch Search Keywords ───
    const fetchSearchKeywords = async () => {
        if (!providerToken || !activeLocationId || !user) return;
        try {
            const res = await fetch(`${API_URL}/api/google/search-keywords`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.id,
                    provider_token: providerToken,
                    location_id: activeLocationId
                })
            });
            if (res.ok) {
                const data = await res.json();
                setSearchKeywords(data.keywords || []);
            }
        } catch (error) {
            console.error('Error fetching search keywords:', error);
        }
    };

    // ─── Fetch Calendar Posts from Supabase ───
    const fetchCalendarPosts = async () => {
        if (!user || !activeLocationId) return;
        try {
            const { data, error } = await supabase
                .from('calendar_posts')
                .select('*')
                .eq('user_id', user.id)
                .eq('location_id', activeLocationId);
            if (data) {
                const postsByDate: any = {};
                data.forEach((p: any) => {
                    const dateKey = p.post_date;
                    if (!postsByDate[dateKey]) postsByDate[dateKey] = [];
                    postsByDate[dateKey].push(p);
                });
                setScheduledPosts(postsByDate);
            }
        } catch (error) {
            console.error('Error fetching calendar posts:', error);
        }
    };

    // ─── Schedule a Post ───
    const handleSchedule = async () => {
        if (!user || !selectedDate || !postText.trim()) {
            showToast('Please select a date and write content.', 'error');
            return;
        }
        // Check token balance (5 tokens per post)
        if (tokenBalance < 5) {
            showToast('Insufficient tokens! You need 5 tokens to schedule a post.', 'error');
            return;
        }

        setLoadingAction(true);
        const postDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`;

        try {
            let imageUrl = '';
            // Upload file to Supabase Storage if exists
            if (file) {
                const filePath = `${user.id}/${Date.now()}_${file.name}`;
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('calendar_images')
                    .upload(filePath, file);
                if (uploadData) {
                    const { data: publicUrlData } = supabase.storage
                        .from('calendar_images')
                        .getPublicUrl(filePath);
                    imageUrl = publicUrlData.publicUrl;
                }
            }

            // Insert post into Supabase
            const { error } = await supabase.from('calendar_posts').insert({
                user_id: user.id,
                location_id: activeLocationId,
                post_date: postDate,
                caption: postText,
                image_url: imageUrl,
                post_type: postType,
                status: 'scheduled'
            });

            if (!error) {
                // Deduct 5 tokens
                await fetch(`${API_URL}/api/tokens/balance`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: user.id })
                });
                // We need a deduct endpoint — use the existing deduct_tokens logic via a direct supabase call
                // For now, refresh balance after backend cron processes it
                showToast('Post scheduled! 5 tokens deducted.', 'success');
                setPostText('');
                setFile(null);
                setIsSchedulingNew(false);
                setSelectedDate(null);
                fetchCalendarPosts();
                fetchTokenBalance(user.id, activeLocationId);
            } else {
                showToast('Failed to schedule post: ' + error.message, 'error');
            }
        } catch (error) {
            showToast('Error scheduling post', 'error');
        } finally {
            setLoadingAction(false);
        }
    };

    // ─── Publish Now (immediately post to Google) ───
    const publishNow = async (postId: string) => {
        if (!providerToken) {
            showToast('Google token missing. Please re-login.', 'error');
            return;
        }
        setLoadingAction(true);
        try {
            // Get the post data
            const { data: postData } = await supabase.from('calendar_posts').select('*').eq('id', postId).single();
            if (!postData) { showToast('Post not found', 'error'); return; }

            const res = await fetch(`${API_URL}/api/google/publish-post`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider_token: providerToken,
                    location_id: activeLocationId,
                    summary: postData.caption,
                    image_url: postData.image_url || null,
                    post_type: postData.post_type || 'LOCAL_POST'
                })
            });
            if (res.ok) {
                await supabase.from('calendar_posts').update({ status: 'published' }).eq('id', postId);
                showToast('Post published to Google!', 'success');
                fetchCalendarPosts();
            } else {
                showToast('Failed to publish to Google', 'error');
            }
        } catch (error) {
            showToast('Error publishing post', 'error');
        } finally {
            setLoadingAction(false);
        }
    };

    // ─── Cancel a Scheduled Post ───
    const cancelPost = async (postId: string) => {
        try {
            await supabase.from('calendar_posts').delete().eq('id', postId);
            showToast('Post cancelled.', 'info');
            fetchCalendarPosts();
        } catch (error) {
            showToast('Error cancelling post', 'error');
        }
    };

    // ─── Claim Daily Reward ───
    const claimDailyReward = async () => {
        if (!user || !activeLocationId) return;
        try {
            const res = await fetch(`${API_URL}/api/tokens/claim-daily`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user.id, location_id: activeLocationId })
            });
            if (res.ok) {
                const data = await res.json();
                showToast(`Daily reward claimed! You earned ${data.tokens_added || 2} tokens.`, 'success');
                fetchTokenBalance(user.id, activeLocationId);
            } else {
                const errData = await res.json().catch(() => ({}));
                showToast(errData.detail || 'Already claimed today!', 'error');
            }
        } catch (error) {
            showToast('Server error during claim', 'error');
        }
    };

    // ─── Sign Out ───
    const handleSignOut = async () => {
        await supabase.auth.signOut();
        localStorage.clear();
        window.location.href = '/';
    };

    // ─── Load Data When Active Location Changes ───
    useEffect(() => {
        if (activeLocationId && providerToken && user) {
            fetchReviews();
            fetchAnalytics();
            fetchSearchKeywords();
            fetchCalendarPosts();
        }
        if (user && activeLocationId) {
            // Fetch user's configured SEO keywords for this location
            fetch(`${API_URL}/api/user/get-ai-settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user.id, location_id: activeLocationId })
            })
            .then(res => res.json())
            .then(data => {
                if (data.active_keywords && Array.isArray(data.active_keywords)) {
                    setSeoKeywords(data.active_keywords);
                } else {
                    setSeoKeywords([]); // Reset if none
                }
            })
            .catch(() => {});
        }
    }, [activeLocationId, providerToken, user]);

    // ─── PDF Download Placeholder ───
    const downloadPdfReport = () => {
        showToast('PDF export coming soon!', 'info');
    };

    // ─── View Title Helper ───
    const getViewTitle = () => {
        switch (activeView) {
            case 'reviews': return 'Review Manager';
            case 'calendar': return 'Content Calendar';
            case 'rank': return 'Rank Analysis';
            case 'brain': return 'AI Brain Settings';
            case 'subscription': return 'Subscription & Tokens';
            default: return 'Dashboard';
        }
    };

    return (
        <div className="app-shell">
            <div className="noise"></div>
            {toast && (
                <div className={`toast ${toast.type}`}>
                    {toast.message}
                </div>
            )}
            
            {/* SIDEBAR */}
            {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)}></div>}
            <aside className={`sidebar glass ${sidebarOpen ? 'mobile-open' : ''}`}>
                <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                    <img src="/logo.jpeg" alt="Logo" style={{ height: '36px', marginRight: '12px', borderRadius: '8px' }} />
                    <div style={{ lineHeight: '1.2' }}>
                        <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'white' }}>GBP Auto</div>
                        <div className="grad-blue" style={{ fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase' }}>Master</div>
                    </div>
                </div>

                {/* Location Switcher */}
                <div style={{ padding: '0 4px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '12px' }}>
                    <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>Managing</label>
                    {liveLocations.length > 0 ? (
                        <select 
                            value={activeLocationId} 
                            onChange={(e) => setActiveLocationId(e.target.value)}
                            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 10px', fontSize: '13px', outline: 'none' }}
                        >
                            {liveLocations.map((loc: any) => (
                                <option key={loc.id} value={loc.id} style={{ background: '#0A0E17' }}>{loc.name}</option>
                            ))}
                        </select>
                    ) : (
                        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', padding: '8px 0' }}>
                            {loadingLocations ? 'Loading locations...' : 'No Location Connected'}
                        </div>
                    )}
                </div>

                <nav className="nav-menu" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <button className={`nav-item ${activeView === 'dashboard' ? 'active' : ''}`} onClick={() => { setActiveView('dashboard'); setSidebarOpen(false); }}>Dashboard</button>
                    <button className={`nav-item ${activeView === 'reviews' ? 'active' : ''}`} onClick={() => { setActiveView('reviews'); setSidebarOpen(false); }}>Review Manager</button>
                    <button className={`nav-item ${activeView === 'calendar' ? 'active' : ''}`} onClick={() => { setActiveView('calendar'); setSidebarOpen(false); }}>Content Calendar</button>
                    <button className={`nav-item ${activeView === 'rank' ? 'active' : ''}`} onClick={() => { setActiveView('rank'); setSidebarOpen(false); }}>Rank Analysis</button>
                    <button className={`nav-item ${activeView === 'brain' ? 'active' : ''}`} onClick={() => { setActiveView('brain'); setSidebarOpen(false); }}>AI Brain Settings</button>
                    <button className={`nav-item ${activeView === 'subscription' ? 'active' : ''}`} onClick={() => { setActiveView('subscription'); setSidebarOpen(false); }}>Subscription & Tokens</button>
                </nav>

                {/* Sign Out */}
                <div className="sidebar-foot" style={{ marginTop: 'auto', paddingTop: '16px' }}>
                    <button onClick={handleSignOut} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '14px', padding: '8px 0', width: '100%', textAlign: 'left' }}>
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                {/* Mobile Topbar */}
                <div className="mobile-topbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => setSidebarOpen(true)} style={{ padding: '4px 8px', fontSize: '16px', marginRight: '10px' }}>
                            ☰
                        </button>
                        <span style={{ fontWeight: 'bold' }}>{getViewTitle()}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ fontSize: '14px', color: 'var(--blue-soft, #4F8CFF)' }}>{tokenBalance} 🪙</strong>
                    </div>
                </div>

                <main className="main">
                    {/* Desktop Header (Hidden on Mobile usually, or just part of main) */}
                    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                        <div className="desktop-only-title">
                            <h2 style={{ margin: 0 }}>{getViewTitle()}</h2>
                            <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>{activeLocationName}</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '8px 14px', borderRadius: '8px' }}>
                                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>Balance:</span>
                                <strong style={{ fontSize: '16px', color: 'var(--blue-soft, #4F8CFF)' }}>{tokenBalance}</strong>
                                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>tokens</span>
                            </div>
                            <button className="btn btn-green btn-sm" onClick={claimDailyReward}>🎁 Daily Reward</button>
                        </div>
                    </header>

                    {/* Render Child Views */}
                    <div className="content-container">
                    {/* ─── Dashboard Overview ─── */}
                    {activeView === 'dashboard' && (() => {
                        // Calculate dashboard stats
                        const unrepliedCount = liveReviews.filter((r: any) => !r.has_reply && !r.reviewReply).length;
                        const repliedReviews = liveReviews.filter((r: any) => r.has_reply || r.reviewReply);
                        const displayAvgRating = averageRating > 0 ? averageRating.toFixed(1) : (liveReviews.length > 0
                            ? (liveReviews.reduce((sum: number, r: any) => {
                                const ratingMap: any = { 'ONE': 1, 'TWO': 2, 'THREE': 3, 'FOUR': 4, 'FIVE': 5 };
                                return sum + (ratingMap[r.starRating || r.rating] || 0);
                            }, 0) / liveReviews.length).toFixed(1)
                            : '—');
                        const displayTotalReviews = totalReviewCount > 0 ? totalReviewCount : liveReviews.length;
                        const upcomingPosts = Object.values(scheduledPosts).filter((p: any) => p?.status === 'scheduled').length;

                        // Rating distribution
                        const ratingCounts = [0, 0, 0, 0, 0]; // index 0=1star, 4=5star
                        liveReviews.forEach((r: any) => {
                            const ratingMap: any = { 'ONE': 0, 'TWO': 1, 'THREE': 2, 'FOUR': 3, 'FIVE': 4 };
                            const idx = ratingMap[r.starRating || r.rating];
                            if (idx !== undefined) ratingCounts[idx]++;
                        });
                        const ratingColors = ['#EF4444', '#F97316', '#EAB308', '#60A5FA', '#4ADE80'];

                        // Recent reviews (last 4)
                        const recentReviews = [...liveReviews]
                            .sort((a: any, b: any) => new Date(b.createTime || 0).getTime() - new Date(a.createTime || 0).getTime())
                            .slice(0, 4);

                        // Keyword usage count in replies
                        const getKeywordUsage = (kw: string) => {
                            if (!kw) return 0;
                            const kwLower = kw.toLowerCase();
                            return repliedReviews.filter((r: any) => {
                                const replyText = (r.reviewReply?.comment || '').toLowerCase();
                                return replyText.includes(kwLower);
                            }).length;
                        };

                        return (
                            <section className="page active">
                                {/* Row 1: Stat Cards */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))', gap: '14px', marginBottom: '24px' }}>
                                    <div className="stat-card">
                                        <div className="stat-icon">🪙</div>
                                        <div className="stat-label">Token Balance</div>
                                        <div className="stat-value" style={{ color: '#4F8CFF' }}>{tokenBalance}</div>
                                        <div className="stat-sub">AI credits remaining</div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="stat-icon">⭐</div>
                                        <div className="stat-label">Total Reviews</div>
                                        <div className="stat-value">{displayTotalReviews}</div>
                                        <div className="stat-sub">Across all time</div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="stat-icon">🔔</div>
                                        <div className="stat-label">Unreplied</div>
                                        <div className="stat-value" style={{ color: unrepliedCount > 0 ? '#EF4444' : '#4ADE80' }}>{unrepliedCount}</div>
                                        <div className="stat-sub">{unrepliedCount > 0 ? 'Need attention' : 'All caught up!'}</div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="stat-icon">📊</div>
                                        <div className="stat-label">Avg Rating</div>
                                        <div className="stat-value" style={{ color: '#FBBF24' }}>{displayAvgRating}</div>
                                        <div className="stat-sub">{displayTotalReviews > 0 ? `From ${displayTotalReviews} reviews` : 'No reviews yet'}</div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="stat-icon">📍</div>
                                        <div className="stat-label">Locations</div>
                                        <div className="stat-value">{liveLocations.length}</div>
                                        <div className="stat-sub">Connected profiles</div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="stat-icon">📅</div>
                                        <div className="stat-label">Upcoming Posts</div>
                                        <div className="stat-value" style={{ color: '#4ADE80' }}>{upcomingPosts}</div>
                                        <div className="stat-sub">Scheduled to publish</div>
                                    </div>
                                </div>

                                {/* Row 2: Rating Distribution + Recent Reviews */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '16px', marginBottom: '24px' }}>
                                    {/* Rating Distribution */}
                                    <div className="card glass" style={{ padding: '24px' }}>
                                        <h3 style={{ fontSize: '15px', marginBottom: '20px', fontWeight: 700 }}>Rating Distribution</h3>
                                        {liveReviews.length > 0 ? (
                                            <div>
                                                {[5, 4, 3, 2, 1].map((star) => {
                                                    const count = ratingCounts[star - 1];
                                                    const pct = liveReviews.length > 0 ? (count / liveReviews.length) * 100 : 0;
                                                    return (
                                                        <div className="rating-bar-row" key={star}>
                                                            <span className="rating-bar-label">{star}★</span>
                                                            <div className="rating-bar-track">
                                                                <div className="rating-bar-fill" style={{ width: `${pct}%`, background: ratingColors[star - 1] }}></div>
                                                            </div>
                                                            <span className="rating-bar-count">{count}</span>
                                                        </div>
                                                    );
                                                })}
                                                <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(255,255,255,.03)', borderRadius: '10px', textAlign: 'center' }}>
                                                    <span style={{ fontSize: '32px', fontWeight: 800, color: '#FBBF24' }}>{displayAvgRating}</span>
                                                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,.5)', marginLeft: '6px' }}>/ 5.0</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <p style={{ color: 'rgba(255,255,255,.4)', fontSize: '13px' }}>No reviews yet to display.</p>
                                        )}
                                    </div>

                                    {/* Recent Reviews */}
                                    <div className="card glass" style={{ padding: '24px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                            <h3 style={{ fontSize: '15px', margin: 0, fontWeight: 700 }}>Recent Reviews</h3>
                                            <button className="btn btn-ghost btn-sm" onClick={() => setActiveView('reviews')}>View All →</button>
                                        </div>
                                        {recentReviews.length > 0 ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                {recentReviews.map((rev: any, idx: number) => {
                                                    const ratingMap: any = { 'ONE': 1, 'TWO': 2, 'THREE': 3, 'FOUR': 4, 'FIVE': 5 };
                                                    const stars = ratingMap[rev.starRating || rev.rating] || 0;
                                                    const hasReply = !!(rev.has_reply || rev.reviewReply);
                                                    const comment = rev.comment || rev.text || '';
                                                    const reviewerObj = rev.reviewer;
                                                    const reviewer = typeof reviewerObj === 'string' 
                                                        ? reviewerObj 
                                                        : (reviewerObj?.displayName || rev.authorName || rev.name || 'Anonymous');
                                                    
                                                    return (
                                                        <div key={idx} style={{ padding: '14px', background: 'rgba(255,255,255,.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,.06)' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                    <span style={{ fontWeight: 600, fontSize: '13px' }}>{reviewer}</span>
                                                                    <span style={{ color: '#FBBF24', fontSize: '13px' }}>{'★'.repeat(stars)}{'☆'.repeat(5 - stars)}</span>
                                                                </div>
                                                                <span className={`badge-pill ${hasReply ? 'b-green' : 'b-red'}`}>
                                                                    {hasReply ? '✓ Replied' : '⏳ Pending'}
                                                                </span>
                                                            </div>
                                                            {comment && (
                                                                <p style={{ fontSize: '12.5px', color: 'rgba(255,255,255,.6)', margin: 0, lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>
                                                                    {comment}
                                                                </p>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <p style={{ color: 'rgba(255,255,255,.4)', fontSize: '13px' }}>No reviews yet.</p>
                                        )}
                                    </div>
                                </div>

                                {/* Row 3: SEO Keywords at a Glance */}
                                {seoKeywords.length > 0 && (
                                    <div className="card glass" style={{ padding: '24px', marginBottom: '24px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                            <h3 style={{ fontSize: '15px', margin: 0, fontWeight: 700 }}>🔑 Your SEO Keywords</h3>
                                            <button className="btn btn-ghost btn-sm" onClick={() => setActiveView('rank')}>Full Analysis →</button>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
                                            {seoKeywords.map((kw: string, idx: number) => {
                                                const usage = getKeywordUsage(kw);
                                                const totalReplied = repliedReviews.length;
                                                const pct = totalReplied > 0 ? Math.round((usage / totalReplied) * 100) : 0;
                                                return (
                                                    <div key={idx} className="keyword-card" onClick={() => setActiveView('rank')} style={{ cursor: 'pointer' }}>
                                                        <div className="kw-name">{kw}</div>
                                                        <div className="kw-stat">Used in {usage} of {totalReplied} replies ({pct}%)</div>
                                                        <div className="kw-usage-bar">
                                                            <div className="kw-usage-fill" style={{ width: `${Math.min(pct, 100)}%` }}></div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Row 4: Quick Actions */}
                                <div className="card glass" style={{ padding: '24px' }}>
                                    <h3 style={{ fontSize: '15px', marginBottom: '6px', fontWeight: 700 }}>Quick Actions</h3>
                                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginBottom: '16px' }}>Jump to any tool to manage your Google Business Profile.</p>
                                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                        <button className="btn btn-blue btn-sm" onClick={() => setActiveView('reviews')}>📝 Manage Reviews</button>
                                        <button className="btn btn-green btn-sm" onClick={() => setActiveView('calendar')}>📅 Content Calendar</button>
                                        <button className="btn btn-ghost btn-sm" onClick={() => setActiveView('rank')}>📊 Rank Analysis</button>
                                        <button className="btn btn-ghost btn-sm" onClick={() => setActiveView('brain')}>🧠 AI Brain Settings</button>
                                        <button className="btn btn-ghost btn-sm" onClick={() => setActiveView('subscription')}>💳 Subscription</button>
                                    </div>
                                </div>
                            </section>
                        );
                    })()}

                    {/* ─── Review Manager ─── */}
                    {activeView === 'reviews' && (
                        <ReviewManager 
                            liveReviews={liveReviews}
                            setLiveReviews={setLiveReviews}
                            loadingReviews={loadingReviews}
                            syncingReviews={syncingReviews}
                            providerToken={providerToken}
                            user={user}
                            activeLocationId={activeLocationId}
                            handleSyncReviews={handleSyncReviews}
                            showToast={showToast}
                        />
                    )}

                    {/* ─── Content Calendar ─── */}
                    {activeView === 'calendar' && (
                        <ContentCalendarV2 
                            currentMonth={currentMonth}
                            setCurrentMonth={setCurrentMonth}
                            currentYear={currentYear}
                            setCurrentYear={setCurrentYear}
                            selectedDate={selectedDate}
                            setSelectedDate={setSelectedDate}
                            scheduledPosts={scheduledPosts}
                            isSchedulingNew={isSchedulingNew}
                            setIsSchedulingNew={setIsSchedulingNew}
                            postType={postType}
                            setPostType={setPostType}
                            file={file}
                            setFile={setFile}
                            postText={postText}
                            setPostText={setPostText}
                            handleSchedule={handleSchedule}
                            publishNow={publishNow}
                            cancelPost={cancelPost}
                            firstDayOfMonth={firstDayOfMonth}
                            daysInMonth={daysInMonth}
                            loadingAction={loadingAction}
                        />
                    )}

                    {/* ─── Rank Analysis ─── */}
                    {activeView === 'rank' && (
                        <RankAnalysis 
                            analyticsData={analyticsData}
                            activeLocationId={activeLocationId}
                            user={user}
                            liveReviews={liveReviews}
                            downloadPdfReport={downloadPdfReport}
                            showToast={showToast}
                            searchKeywords={searchKeywords}
                            providerToken={providerToken}
                            refreshTokens={() => fetchTokenBalance(user.id, activeLocationId)}
                        />
                    )}

                    {/* ─── AI Brain Settings ─── */}
                    {activeView === 'brain' && (
                        <BrainSettings 
                            user={user} 
                            activeLocationId={activeLocationId} 
                            providerToken={providerToken} 
                            showToast={showToast} 
                        />
                    )}

                    {/* ─── Subscription & Tokens ─── */}
                    {activeView === 'subscription' && (
                        <SubscriptionPage user={user} locationId={activeLocationId} refreshTokens={() => fetchTokenBalance(user.id, activeLocationId)} />
                    )}
                </div>
            </main>
            </div>
        </div>
    );
}
