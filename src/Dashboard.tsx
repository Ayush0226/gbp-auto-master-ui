import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import AdminDashboard from './AdminDashboard';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Dummy Google Locations for the demo
const MOCK_LOCATIONS = [
    { id: 'loc1', name: "Rohini AC & Plumbing", reviews: 214, rating: 4.9, subscribed: true },
    { id: 'loc2', name: "Rohini Home Interiors", reviews: 96, rating: 4.6, subscribed: false },
    { id: 'loc3', name: "Pitampura Dental Care", reviews: 341, rating: 4.8, subscribed: false }
];

export default function MasterDashboardPage() {
    const [adminOverride, setAdminOverride] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [hasGoogleConnected, setHasGoogleConnected] = useState(false);
    const [toast, setToast] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        if (message.toLowerCase().includes('0 ai replies')) return; // Prune spam
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };
    const [providerToken, setProviderToken] = useState<string | null>(null);
    const [liveLocations, setLiveLocations] = useState<any[]>([]);
    
    // Core App State
    const [appState, setAppState] = useState<'loading' | 'demo-select' | 'demo-running' | 'demo-success' | 'payment' | 'dashboard'>('loading');
    const [activeView, setActiveView] = useState('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    
    // Demo State
    const [demoSelectedLoc, setDemoSelectedLoc] = useState<string | null>(null);
    const [demoResultNames, setDemoResultNames] = useState<any[]>([]);
    
    // Payment State
    const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'half_yearly' | 'yearly'>('half_yearly');
    const [discountApplied, setDiscountApplied] = useState<string>('none');
    const [promoCode, setPromoCode] = useState('');
    
    const PRICING_PLANS = {
        half_yearly: { name: 'Half-Yearly', original: 2999, discounted: 1999 },
        yearly: { name: 'Yearly', original: 5500, discounted: 3999 }
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
    const [postType, setPostType] = useState<'LOCAL_POST' | 'PHOTO' | 'VIDEO'>('LOCAL_POST');
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
    const activeLocationName = activeLocObj ? activeLocObj.name : "No Location Connected";
    
    // Analytics State
    const [analyticsData, setAnalyticsData] = useState<any>(null);
    const isActiveSubscribed = activeLocObj ? activeLocObj.subscribed : false;

    // Reviews State
    const [liveReviews, setLiveReviews] = useState<any[]>([]);
    const [loadingReviews, setLoadingReviews] = useState(false);
    const [syncingReviews, setSyncingReviews] = useState(false);
    
    // Inline Review Editing
    const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
    const [editReplyText, setEditReplyText] = useState('');
    const [savingReplyId, setSavingReplyId] = useState<string | null>(null);

    // AI Configuration State
    const [newKeyword, setNewKeyword] = useState('');
    const [targetKeywords, setTargetKeywords] = useState<string[]>([]);
    const [competitorKeyword, setCompetitorKeyword] = useState('');
    const [competitors, setCompetitors] = useState<any[]>([]);
    const [loadingCompetitors, setLoadingCompetitors] = useState(false);
    const [searchKeywords, setSearchKeywords] = useState<any[]>([]);

    // Chatbot State
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatHistory, setChatHistory] = useState<any[]>([{role: 'ai', content: 'Hi! I am your AI Business Consultant. You can ask me to analyze your latest reviews, summarize your SEO keywords, or give you advice based on your GBP analytics.'}]);
    const [chatInput, setChatInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    
    // Report Modal State
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportGenerating, setReportGenerating] = useState(false);

    // PWA Install State
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // Check if user is already in PWA mode
        if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true) {
            setIsStandalone(true);
        }

        // Detect iOS
        const ua = window.navigator.userAgent;
        const webkit = !!ua.match(/WebKit/i);
        const isIPad = !!ua.match(/iPad/i);
        const isIPhone = !!ua.match(/iPhone/i);
        const isIOS = isIPad || isIPhone;
        const isSafari = isIOS && webkit && !ua.match(/CriOS/i);
        
        if (isIOS && isSafari) {
            setIsIOS(true);
        }

        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, []);

    const [reportData, setReportData] = useState<{ summary: string; action_items: string[] } | null>(null);
    const [reportError, setReportError] = useState<string | null>(null);

    const generateReport = async () => {
        setShowReportModal(true);
        setReportGenerating(true);
        setReportError(null);
        try {
            const contextDump = `Live Reviews: ${liveReviews?.length}, Competitors: ${competitors?.length}, Rank: ${activeLocObj?.rank || 'N/A'}`;
            const resp = await fetch('https://gbp-auto-master-backend-us.onrender.com/api/ai/generate-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user?.id, context_dump: contextDump })
            });
            const data = await resp.json();
            if (data.status === 'success') {
                setReportData(data.report);
            } else {
                setReportError(data.detail || data.message || "Unknown server error");
                showToast("Failed to generate report", "error");
            }
        } catch (e: any) {
            setReportError(e.message || "Network Error");
            showToast("Network Error", "error");
        } finally {
            setReportGenerating(false);
        }
    };

    const handleInstallPWA = async () => {
        if (isIOS) {
            showToast("To install: Tap the 'Share' icon at the bottom of Safari, then tap 'Add to Home Screen'.", "info");
            return;
        }
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setDeferredPrompt(null);
            }
        } else {
            showToast("App install is currently not ready. Ensure you are using Chrome or Safari.", "info");
        }
    };

    const handleSendChat = async () => {
        if (!chatInput.trim()) return;
        
        const newMsg = { role: 'user', content: chatInput };
        setChatHistory(prev => [...prev, newMsg]);
        setChatInput('');
        setChatLoading(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("Not logged in");

            const contextDump = `
STRICT SYSTEM INSTRUCTION: You are TAAY, a strict GBP (Google Business Profile) and SEO consultant. YOU MUST NEVER answer general knowledge questions, write code, or go off-topic. If the user asks something unrelated to their GBP reviews, keywords, or local SEO performance, you MUST politely refuse and steer them back to their business profile analytics. Keep responses short, professional, and directly actionable.

Live Reviews (Recent 15): ${JSON.stringify((liveReviews || []).slice(0, 15))}
Search Keywords (Top 20): ${JSON.stringify((searchKeywords || []).slice(0, 20))}
Target SEO Keywords: ${JSON.stringify(targetKeywords || [])}
Analytics: ${JSON.stringify(analyticsData || {})}
            `;

            const resp = await fetch('https://gbp-auto-master-backend-us.onrender.com/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user?.id,
                    message: chatInput,
                    history: chatHistory.filter(m => m.role !== 'system'),
                    context_dump: contextDump
                })
            });

            const data = await resp.json();
            if (data.status === 'success') {
                setChatHistory(prev => [...prev, { role: 'ai', content: data.reply }]);
            } else {
                console.error("AI Chat API Error:", data);
                setChatHistory(prev => [...prev, { role: 'ai', content: 'Oops! I encountered an error checking your data.' }]);
            }
        } catch (e) {
            console.error("AI Chat Fetch Error:", e);
            setChatHistory(prev => [...prev, { role: 'ai', content: 'Failed to connect to the AI engine.' }]);
        }
        setChatLoading(false);
    };

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

            const email = session.user.email;
            if (email === 'ayushsony126@gmail.com') {
                setIsAdmin(true);
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
            
            let currentProviderToken = session.provider_token || null;
            
            if (!currentProviderToken && session.user?.user_metadata?.google_refresh_token) {
                try {
                    const resp = await fetch('https://gbp-auto-master-backend-us.onrender.com/api/auth/refresh-google-token', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ user_id: session.user.id })
                    });
                    const data = await resp.json();
                    if (data.status === 'success' && data.provider_token) {
                        currentProviderToken = data.provider_token;
                    }
                } catch (e) {
                    console.error("Failed to refresh Google Token", e);
                }
            }
            
            await checkUserRoute(session.user, currentProviderToken);
        };

        initializeDashboard();
    }, []);

    // Fetch User Settings (Keywords & AI Config)
    useEffect(() => {
        if (user?.id) {
            supabase.from('user_settings').select('*').eq('user_id', user.id).single()
                .then(({ data, error }) => {
                    if (data && !error) {
                        setTargetKeywords(data.active_keywords || []);
                        setIsAiActive(data.is_ai_active ?? true);
                        setReplyTo1Star(data.reply_to_1_star ?? false);
                        setAiTone(data.ai_tone || 'Professional');
                        setCustomInstructions(data.custom_instructions || '');
                    } else if (error && error.code === 'PGRST116') {
                        // Settings don't exist yet, we will insert them on first save
                    }
                });
        }
    }, [user]);

    const saveUserSettings = async (updates: any) => {
        if (!user?.id) return;
        
        // Try to update first
        const { data, error } = await supabase.from('user_settings')
            .update(updates)
            .eq('user_id', user.id)
            .select();
            
        // If update fails because row doesn't exist, insert it
        if (!data || data.length === 0) {
            await supabase.from('user_settings').insert({
                user_id: user.id,
                ...updates
            });
        }
    };

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
            fetch('https://gbp-auto-master-backend-us.onrender.com/api/google/locations', {
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
            fetch('https://gbp-auto-master-backend-us.onrender.com/api/google/get-reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user.id, provider_token: providerToken, location_id: activeLocationId })
            })
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success') {
                    const sortedReviews = (data.reviews || []).sort((a: any, b: any) => {
                        if (a.has_reply === b.has_reply) {
                            return new Date(b.createTime).getTime() - new Date(a.createTime).getTime();
                        }
                        return a.has_reply ? 1 : -1;
                    });
                    setLiveReviews(sortedReviews);
                    setLiveLocations(prev => prev.map(loc => {
                        if (loc.id === activeLocationId) {
                            return { 
                                ...loc, 
                                reviews: data.totalReviewCount || loc.reviews,
                                rating: data.averageRating || loc.rating,
                                recentAnswered: data.recentAnswered || 0,
                                totalFetched: data.totalFetched || 0
                            };
                        }
                        return loc;
                    }));
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoadingReviews(false));
        }
    }, [appState, activeLocationId, providerToken, user]);

    // Auto-Register Webhook Silently
    useEffect(() => {
        if (appState === 'dashboard' && providerToken && user && activeLocationId && activeLocationId !== 'loc1') {
            fetch('https://gbp-auto-master-backend-us.onrender.com/api/google/register-webhook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user.id, provider_token: providerToken, location_id: activeLocationId })
            }).catch(e => console.error("Silent webhook registration failed:", e));
        }
    }, [appState, activeLocationId, providerToken, user]);

    const handleSyncReviews = async () => {
        if (!providerToken || !user || !activeLocationId) return;
        setSyncingReviews(true);
        try {
            const res = await fetch('https://gbp-auto-master-backend-us.onrender.com/api/google/sync-reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user.id, provider_token: providerToken, location_id: activeLocationId })
            });
            const data = await res.json();
            
            if (data.status === 'error') {
                showToast(data.message, "error");
            } else {
                showToast(data.message || "Sync Complete!", "success");
            }
            
            // Refetch reviews after sync
            const freshRes = await fetch('https://gbp-auto-master-backend-us.onrender.com/api/google/get-reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user.id, provider_token: providerToken, location_id: activeLocationId })
            });
            const freshData = await freshRes.json();
            if (freshData.status === 'success') {
                const sortedReviews = (freshData.reviews || []).sort((a: any, b: any) => {
                    if (a.has_reply === b.has_reply) {
                        return new Date(b.createTime).getTime() - new Date(a.createTime).getTime();
                    }
                    return a.has_reply ? 1 : -1;
                });
                setLiveReviews(sortedReviews);
                setLiveLocations(prev => prev.map(loc => {
                    if (loc.id === activeLocationId) {
                        return { 
                            ...loc, 
                            reviews: freshData.totalReviewCount || loc.reviews,
                            rating: freshData.averageRating || loc.rating,
                            recentAnswered: freshData.recentAnswered || 0,
                            totalFetched: freshData.totalFetched || 0
                        };
                    }
                    return loc;
                }));
            }
        } catch (e) {
            console.error(e);
            showToast("Error syncing reviews", "error");
        }
        setSyncingReviews(false);
    };

    const handlePostManualReply = async (reviewId: string, replyText: string) => {
        if (!replyText.trim()) {
            showToast("Reply cannot be empty", "error");
            return;
        }
        setSavingReplyId(reviewId);
        try {
            const res = await fetch('https://gbp-auto-master-backend-us.onrender.com/api/google/post-reply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider_token: providerToken,
                    review_id: reviewId,
                    reply_text: replyText
                })
            });
            const data = await res.json();
            if (data.status === 'success') {
                showToast("Reply updated successfully!", "success");
                setLiveReviews(prev => prev.map(r => r.id === reviewId ? { ...r, has_reply: true, reply_comment: replyText } : r));
                setEditingReviewId(null);
            } else {
                showToast("Failed to post: " + data.message, "error");
            }
        } catch (e: any) {
            showToast("Network Error: " + e.message, "error");
        } finally {
            setSavingReplyId(null);
        }
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
                        postsByDay[day].push({ id: post.id, caption: post.caption, image_url: post.image_url, img: !!post.image_url, post_type: post.post_type || 'LOCAL_POST' });
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
        if (appState === 'dashboard' && activeView === 'analytics' && providerToken && activeLocationId) {
            if (activeLocationId === 'loc1') {
                // Pitch-ready dummy data
                setAnalyticsData({
                    multiDailyMetricTimeSeries: [
                        { dailyMetric: 'BUSINESS_IMPRESSIONS_DESKTOP_SEARCH', timeSeries: { datedValues: [{value: 3200}] } },
                        { dailyMetric: 'BUSINESS_IMPRESSIONS_MOBILE_SEARCH', timeSeries: { datedValues: [{value: 9500}] } },
                        { dailyMetric: 'BUSINESS_IMPRESSIONS_DESKTOP_MAPS', timeSeries: { datedValues: [{value: 8400}] } },
                        { dailyMetric: 'BUSINESS_IMPRESSIONS_MOBILE_MAPS', timeSeries: { datedValues: [{value: 24200}] } },
                        { dailyMetric: 'WEBSITE_CLICKS', timeSeries: { datedValues: [{value: 842}] } },
                        { dailyMetric: 'CALL_CLICKS', timeSeries: { datedValues: [{value: 120}] } },
                        { dailyMetric: 'BUSINESS_DIRECTION_REQUESTS', timeSeries: { datedValues: [{value: 36}] } },
                        { dailyMetric: 'BUSINESS_CONVERSATIONS', timeSeries: { datedValues: [{value: 34}] } },
                        { dailyMetric: 'BUSINESS_BOOKINGS', timeSeries: { datedValues: [{value: 12}] } },
                        { dailyMetric: 'FOOD_ORDERS', timeSeries: { datedValues: [{value: 8}] } }
                    ]
                });
                setSearchKeywords([
                    { searchKeyword: 'plumber near me', monthlyImpressionsValue: 4500 },
                    { searchKeyword: 'ac repair rohini', monthlyImpressionsValue: 3200 },
                    { searchKeyword: 'geyser installation', monthlyImpressionsValue: 1800 },
                    { searchKeyword: 'emergency plumber delhi', monthlyImpressionsValue: 950 },
                    { searchKeyword: 'water leak repair', monthlyImpressionsValue: 620 }
                ]);
            } else {
                fetch('https://gbp-auto-master-backend-us.onrender.com/api/google/analytics', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: user.id, provider_token: providerToken, location_id: activeLocationId })
                })
                .then(res => res.json())
                .then(data => {
                    if (data.status === 'success') {
                        setAnalyticsData(data.analytics);
                    } else {
                        console.error("Analytics Backend Error:", data);
                        // Silently handle analytics errors (e.g. 403 API not enabled) instead of spamming toast
                    }
                })
                .catch(err => {
                    console.error("Analytics Fetch Error:", err);
                    showToast(`Network Error fetching analytics.`, 'error');
                });
                
                fetch('https://gbp-auto-master-backend-us.onrender.com/api/google/search-keywords', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: user?.id, provider_token: providerToken, location_id: activeLocationId })
                })
                .then(res => res.json())
                .then(data => {
                    if (data.status === 'success') {
                        setSearchKeywords(data.keywords || []);
                    }
                })
                .catch(err => console.error(err));
            }
        }
    }, [appState, activeView, activeLocationId, providerToken, user]);

    // ==========================================
    // DEMO & PAYMENT FLOWS
    // ==========================================
    
    const handleRunDemo = async () => {
        if (!demoSelectedLoc) return;
        setAppState('demo-running');
        
        try {
            const res = await fetch("https://gbp-auto-master-backend-us.onrender.com/api/google/run-demo", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user?.id, provider_token: providerToken, location_id: demoSelectedLoc })
            });
            const data = await res.json();
            
            if (data.status === 'success') {
                await supabase.auth.updateUser({
                    data: { demo_used: true }
                });
                setDemoResultNames(data.replies);
                setAppState('demo-success');
            } else {
                showToast("Demo failed: " + data.message, "error");
                setAppState('demo-select');
            }
        } catch (e) {
            console.error(e);
            showToast("Network error running demo", "error");
            setAppState('demo-select');
        }
    };

    const downloadPdfReport = async () => {
        const input = document.getElementById('pdf-report-container');
        if (!input) return;
        
        try {
            showToast("Generating PDF report...", "info");
            const canvas = await html2canvas(input, { scale: 2, useCORS: true, backgroundColor: '#0a0a0a' });
            const imgData = canvas.toDataURL('image/png');
            
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Rank_Analysis_Report.pdf`);
            showToast("PDF downloaded successfully!", "success");
        } catch (error) {
            console.error("PDF generation error:", error);
            showToast("Failed to generate PDF.", "error");
        }
    };

    const downloadDemoPdf = async () => {
        const input = document.getElementById('demo-pdf-container');
        if (!input) return;
        
        try {
            showToast("Generating PDF demo report...", "info");
            const canvas = await html2canvas(input, { scale: 2, useCORS: true, backgroundColor: '#0a0a0a' });
            const imgData = canvas.toDataURL('image/png');
            
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`AI_Demo_Report.pdf`);
            showToast("PDF downloaded successfully!", "success");
        } catch (error) {
            console.error("PDF generation error:", error);
            showToast("Failed to generate PDF.", "error");
        }
    };

    const handleCheckout = async () => {
        try {
            const res = await fetch("https://gbp-auto-master-backend-us.onrender.com/api/payment/create-order", {
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
                showToast("Backend Error during create-order: " + (data.detail || JSON.stringify(data)), "error");
                return;
            }

            if (data.free_trial) {
                // Backend bypassed Razorpay for ATYAUNSUHJ and activated subscription
                showToast('100% Free Trial Activated successfully!', 'success');
                setLiveLocations(prev => prev.map(l => l.id === activeLocationId ? { ...l, subscribed: true } : l));
                return;
            }

            const keyRes = await fetch("https://gbp-auto-master-backend-us.onrender.com/api/payment/key");
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
                    const verifyRes = await fetch("https://gbp-auto-master-backend-us.onrender.com/api/payment/verify", {
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
                        showToast("Payment verification failed! Server said: " + (verifyData.detail || JSON.stringify(verifyData)), "error");
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
            showToast("Error initiating checkout. Please try again.", "error");
        }
    };

    const applyPromo = () => {
        if (promoCode === 'FIRSTUNDER10') {
            setDiscountApplied('FIRSTUNDER10');
            showToast('Discount Applied: FIRSTUNDER10', 'success');
        } else if (promoCode === 'ATYAUNSUHJ') {
            setDiscountApplied('ATYAUNSUHJ');
            showToast('100% Free Trial Code Applied!', 'success');
        } else {
            setDiscountApplied('none');
            showToast("Invalid or expired code", "error");
        }
    };

    // ==========================================
    // DASHBOARD FUNCTIONS
    // ==========================================

    const handleSchedule = async () => {
        if (!selectedDate || !user) return;

        // Hidden limit of 30 posts/photos/videos per month
        const totalPosts = Object.values(scheduledPosts).reduce((acc: number, posts: any) => acc + (posts?.length || 0), 0);
        if (totalPosts >= 30) {
            showToast("You have reached the limit of 30 scheduled items per month.", "error");
            return;
        }

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
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (postDateObj.getTime() <= today.getTime()) {
                const confirmed = window.confirm("Since this is scheduled for today (or the past), it will be published to Google Maps immediately. Continue?");
                if (!confirmed) {
                    setLoadingAction(false);
                    return;
                }
                
                // Publish immediately
                const res = await fetch("https://gbp-auto-master-backend-us.onrender.com/api/google/publish-post", {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        provider_token: providerToken,
                        location_id: activeLocationId,
                        summary: postText,
                        image_url: image_url,
                        post_type: postType
                    })
                });
                const data = await res.json();
                if (data.status === 'success') {
                    showToast('Successfully published to Google Business Profile immediately!', 'success');
                    setIsSchedulingNew(false);
                    setPostText('');
                    setFile(null);
                    setPostType('LOCAL_POST');
                } else {
                    showToast('Error publishing to Google: ' + data.message, 'error');
                }
                setLoadingAction(false);
                return;
            }

            // Future date logic
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
                    post_type: postType,
                    status: 'scheduled'
                }
            ]).select();

            if (error) throw error;

            setScheduledPosts((prev: any) => ({
                ...prev,
                [selectedDate]: [...(prev[selectedDate] || []), { id: insertData[0].id, caption: postText, image_url: image_url, img: !!image_url, post_type: postType }]
            }));
            
            setIsSchedulingNew(false);
            setPostText('');
            setFile(null);
            setPostType('LOCAL_POST');
        } catch (error) {
            console.error('Error scheduling post:', error);
            showToast("Error scheduling post", "error");
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
            const res = await fetch("https://gbp-auto-master-backend-us.onrender.com/api/google/publish-post", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider_token: providerToken,
                    location_id: activeLocationId,
                    summary: post.caption,
                    image_url: post.image_url,
                    post_type: post.post_type || 'LOCAL_POST'
                })
            });
            const data = await res.json();
            if (data.status === 'success') {
                showToast('Successfully published to Google Business Profile!', 'success');
            } else {
                showToast('Error publishing to Google: ' + data.message, 'error');
            }
        } catch (e) {
            showToast('Server error while publishing', 'error');
        } finally {
            setLoadingAction(false);
        }
    };

    const fetchCompetitors = async () => {
        if (!user || !providerToken) return;
        setLoadingCompetitors(true);
        try {
            const res = await fetch('https://gbp-auto-master-backend-us.onrender.com/api/google/competitors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user.id, location_name: activeLocationName, keyword: competitorKeyword })
            });
            const data = await res.json();
            if (data.status === 'success') {
                setCompetitors(data.competitors);
            } else {
                showToast("Error finding competitors", "error");
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

    if (isAdmin && !adminOverride) {
        return <AdminDashboard onBackToApp={() => setAdminOverride(true)} />;
    }

    return (
        <div className="app-shell">
            <div className="noise"></div>

            {/* SIDEBAR */}
            {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)}></div>}
            <aside className={`sidebar glass ${sidebarOpen ? 'mobile-open' : ''}`} id="sidebar">
                <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', marginBottom: '30px' }}>
                    <img src="/logo.jpg" alt="Logo" style={{ height: '42px', marginRight: '14px', borderRadius: '8px' }} />
                    <div style={{ lineHeight: '1.2' }}>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'white' }}>GBP Auto</div>
                        <div className="grad-blue" style={{ fontSize: '14px', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Master</div>
                    </div>
                </div>

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
                        <span className="ic">◈</span> Rank Pusher
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
                    {(!isStandalone && (deferredPrompt || isIOS)) && (
                        <div className="nav-item" onClick={handleInstallPWA} style={{ color: 'var(--green-soft)', border: '1px dashed rgba(52,168,83,.4)', marginTop: '12px', background: 'rgba(52,168,83,.05)' }}>
                            <span className="ic">📱</span> Install App
                        </div>
                    )}
                </nav>

                <div className="sidebar-foot" style={{ cursor: 'pointer', color: 'var(--red-soft)' }} onClick={() => supabase.auth.signOut().then(() => router.push('/'))}>
                    Sign Out
                </div>
            </aside>

            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                <div className="mobile-topbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setSidebarOpen(!sidebarOpen)} style={{ padding: '4px 8px', fontSize: '16px', marginRight: '10px', display: 'flex' }}>
                        ☰
                    </button>
                    <div className="sidebar-logo" style={{ padding: 0, margin: 0 }}>GBP Auto <span className="grad-blue">Master</span></div>
                    
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
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                        <span className="badge-pill b-green">✓ Demo complete</span>
                                        <button className="btn btn-green btn-sm" onClick={downloadDemoPdf}>📄 Download Demo Report</button>
                                    </div>
                                    <div id="demo-pdf-container" style={{ background: 'var(--bg-dark)', padding: '24px', borderRadius: '12px' }}>
                                        <h3 style={{ fontSize: '18px', margin: '0 0 16px' }}>The AI just replied to 2 real reviews:</h3>
                                        <div className="grid grid-2">
                                            {demoResultNames.map((replyObj, i) => (
                                                <div key={i} className="card-sm" style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)' }}>
                                                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,.45)', margin: '0 0 4px' }}>Review from</p>
                                                    <p style={{ fontWeight: 600, fontSize: '14px', margin: 0 }}>{replyObj.reviewer}</p>
                                                    <p style={{ fontSize: '12.5px', color: 'rgba(255,255,255,.6)', marginTop: '8px', fontStyle: 'italic', borderLeft: '2px solid rgba(255,255,255,.2)', paddingLeft: '8px' }}>"{replyObj.comment}"</p>
                                                    <p style={{ fontSize: '12px', color: 'var(--green-soft)', marginTop: '12px', marginBottom: '4px', fontWeight: 'bold' }}>AI Auto-Reply live on Google:</p>
                                                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,.9)', margin: 0, lineHeight: '1.4' }}>"{replyObj.ai_reply}"</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <button className="btn btn-primary" style={{ marginTop: '20px' }} onClick={() => setAppState('payment')}>Continue to Pricing →</button>
                                </div>
                            )}

                            {appState === 'payment' && (
                                <div className="card glass" style={{ maxWidth: '700px', margin: '0 auto', padding: '32px' }}>
                                    <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>Activate AI Engine for {activeLocationName}</h3>
                                    <p style={{ fontSize: '14px', color: 'rgba(255,255,255,.6)', marginBottom: '24px' }}>Choose a plan to instantly automate your Google Business Profile and outrank local competitors.</p>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px', background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.05)', borderRadius: '12px', padding: '20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ color: 'var(--green-soft)', fontSize: '16px' }}>✓</span>
                                            <span style={{ fontSize: '13.5px', color: 'rgba(255,255,255,.8)' }}>24/7 AI Auto-Replier</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ color: 'var(--green-soft)', fontSize: '16px' }}>✓</span>
                                            <span style={{ fontSize: '13.5px', color: 'rgba(255,255,255,.8)' }}>Auto SEO Keyword Injection</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ color: 'var(--green-soft)', fontSize: '16px' }}>✓</span>
                                            <span style={{ fontSize: '13.5px', color: 'rgba(255,255,255,.8)' }}>Automated Calendar Posts</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ color: 'var(--green-soft)', fontSize: '16px' }}>✓</span>
                                            <span style={{ fontSize: '13.5px', color: 'rgba(255,255,255,.8)' }}>Local Competitor Tracking</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ color: 'var(--green-soft)', fontSize: '16px' }}>✓</span>
                                            <span style={{ fontSize: '13.5px', color: 'rgba(255,255,255,.8)' }}>Detailed Rank Analysis</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ color: 'var(--green-soft)', fontSize: '16px' }}>✓</span>
                                            <span style={{ fontSize: '13.5px', color: 'rgba(255,255,255,.8)' }}>Premium VIP Support</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-3">
                                        {(Object.keys(PRICING_PLANS) as Array<keyof typeof PRICING_PLANS>).map((key) => (
                                            <div key={key} className="card-sm glass glass-hover" onClick={() => setSelectedPlan(key)} style={{ cursor: 'pointer', border: selectedPlan === key ? '1px solid rgba(59,130,246,.4)' : '' }}>
                                                <p style={{ fontSize: '12px', color: selectedPlan === key ? 'var(--blue-soft)' : 'rgba(255,255,255,.5)' }}>{PRICING_PLANS[key].name}</p>
                                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '4px' }}>
                                                    <p style={{ fontWeight: 700, fontSize: '20px', margin: 0 }}>₹{PRICING_PLANS[key].discounted}</p>
                                                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,.4)', textDecoration: 'line-through', margin: 0 }}>₹{PRICING_PLANS[key].original}</p>
                                                </div>
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
                                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,.5)' }}>Replied Reviews (Recent)</p>
                                    <p style={{ fontSize: '24px', fontWeight: 800, marginTop: '6px', color: 'var(--green-soft)' }}>
                                        {activeLocObj?.recentAnswered !== undefined ? `${activeLocObj.recentAnswered}/${activeLocObj.totalFetched}` : '...'}
                                    </p>
                                </div>
                            </div>

                            <div className="card glass">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                    <div>
                                        <h3 style={{ fontSize: '15px', margin: 0 }}>Live Review Feed (Latest 12)</h3>
                                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,.5)', margin: '4px 0 0' }}>The AI replies automatically. You can also manually push replies.</p>
                                    </div>
                                    <button 
                                        className="btn btn-ghost btn-sm" 
                                        onClick={handleSyncReviews}
                                        disabled={syncingReviews || loadingReviews}
                                    >
                                        {syncingReviews ? 'Syncing...' : 'Reply to 4 Reviews'}
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
                                        liveReviews.slice(0, 12).map((rev, i) => (
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
                                                
                                                {rev.has_reply && editingReviewId !== rev.id && (
                                                    <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(52,168,83,.05)', borderLeft: '2px solid var(--green-soft)' }}>
                                                        <p style={{ fontSize: '11px', color: 'var(--green-soft)', margin: '0 0 4px', fontWeight: 'bold' }}>Our Reply:</p>
                                                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,.9)', margin: 0 }}>{rev.reply_comment || 'Replied'}</p>
                                                    </div>
                                                )}

                                                {editingReviewId === rev.id && (
                                                    <div style={{ marginTop: '12px' }}>
                                                        <textarea 
                                                            className="input" 
                                                            rows={3} 
                                                            style={{ width: '100%', marginBottom: '8px' }}
                                                            value={editReplyText}
                                                            onChange={(e) => setEditReplyText(e.target.value)}
                                                            placeholder="Type your new reply here..."
                                                        />
                                                        <div style={{ display: 'flex', gap: '8px' }}>
                                                            <button 
                                                                className="btn btn-green btn-sm" 
                                                                onClick={() => handlePostManualReply(rev.id, editReplyText)}
                                                                disabled={savingReplyId === rev.id}
                                                            >
                                                                {savingReplyId === rev.id ? 'Saving...' : 'Save Reply'}
                                                            </button>
                                                            <button 
                                                                className="btn btn-ghost btn-sm" 
                                                                onClick={() => setEditingReviewId(null)}
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                                                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,.4)', margin: 0 }}>
                                                        {new Date(rev.createTime).toLocaleDateString()}
                                                    </p>
                                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                        {editingReviewId !== rev.id && (
                                                            <button 
                                                                className="btn btn-ghost btn-sm" 
                                                                style={{ padding: '2px 8px', fontSize: '10px' }}
                                                                onClick={() => {
                                                                    setEditingReviewId(rev.id);
                                                                    setEditReplyText(rev.reply_comment || '');
                                                                }}
                                                            >
                                                                ✎ Edit Reply
                                                            </button>
                                                        )}
                                                        {rev.has_reply ? (
                                                            <span className="badge-pill b-green" style={{ padding: '2px 8px', fontSize: '10px' }}>✓ Replied</span>
                                                        ) : (
                                                            <span className="badge-pill" style={{ padding: '2px 8px', fontSize: '10px', background: 'rgba(255,255,255,.1)' }}>Unreplied</span>
                                                        )}
                                                    </div>
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
                                                    <span style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(59,130,246,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        {post.post_type === 'VIDEO' ? '🎥' : post.post_type === 'PHOTO' ? '🖼️' : '📷'}
                                                    </span>
                                                    <span style={{ fontSize: '13px' }}>{post.post_type === 'LOCAL_POST' ? post.caption : post.post_type.replace('_', ' ')}</span>
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
                                        
                                        <label className="field-label">Media Type</label>
                                        <select className="input" style={{ marginBottom: '14px', width: '100%', padding: '8px' }} value={postType} onChange={(e) => setPostType(e.target.value as any)}>
                                            <option value="LOCAL_POST">Google Update (Local Post)</option>
                                            <option value="PHOTO">Photo Gallery Upload</option>
                                            <option value="VIDEO">Video Gallery Upload</option>
                                        </select>

                                        <label className="field-label">Date ({new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' })})</label>
                                        <input type="text" value={selectedDate || 1} onChange={(e) => setSelectedDate(parseInt(e.target.value) || 1)} style={{ marginBottom: '14px' }} />
                                        
                                        <label className="field-label">{postType === 'VIDEO' ? 'Video' : 'Image'}</label>
                                        <label style={{ display: 'block', border: '1px dashed rgba(255,255,255,.2)', borderRadius: '12px', padding: '24px', textAlign: 'center', fontSize: '12.5px', color: 'rgba(255,255,255,.4)', marginBottom: '14px', cursor: 'pointer' }}>
                                            {file ? file.name : (postType === 'VIDEO' ? "🎥 Click to upload video" : "📷 Click to upload image")}
                                            <input type="file" accept={postType === 'VIDEO' ? "video/*" : "image/*"} onChange={(e) => setFile(e.target.files?.[0] || null)} style={{ display: 'none' }} />
                                        </label>
                                        
                                        {postType === 'LOCAL_POST' && (
                                            <>
                                                <label className="field-label">Caption (optional)</label>
                                                <textarea rows={3} placeholder="New summer discount on AC servicing!" value={postText} onChange={(e) => setPostText(e.target.value)}></textarea>
                                            </>
                                        )}
                                        
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

                            <div className="page-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                                <div>
                                    <h2 style={{ margin: 0 }}>Rank Pusher</h2>
                                    <p style={{ marginTop: '4px' }}>Local ranking performance and AI traffic insights.</p>
                                </div>
                                <button className="btn btn-green btn-sm" onClick={generateReport}>✨ Detailed Rank Analysis</button>
                            </div>

                            {(() => {
                                const getMetricTotal = (metricName: string) => {
                                    if (!analyticsData || !analyticsData.multiDailyMetricTimeSeries) return 0;
                                    const series = analyticsData.multiDailyMetricTimeSeries.find((s: any) => s.dailyMetric === metricName);
                                    if (!series || !series.timeSeries || !series.timeSeries.datedValues) return 0;
                                    return series.timeSeries.datedValues.reduce((acc: number, val: any) => acc + parseInt(val.value || 0), 0);
                                };

                                const messages = getMetricTotal('BUSINESS_CONVERSATIONS');
                                const bookings = getMetricTotal('BUSINESS_BOOKINGS');
                                const foodOrders = getMetricTotal('FOOD_ORDERS');

                                // Real Sentiment Calculation
                                let positive = 0;
                                let neutral = 0;
                                let negative = 0;
                                if (liveReviews && liveReviews.length > 0) {
                                    liveReviews.forEach(rev => {
                                        if (rev.rating === 'FIVE' || rev.rating === 'FOUR') positive++;
                                        else if (rev.rating === 'THREE') neutral++;
                                        else negative++;
                                    });
                                }
                                const totalRevs = positive + neutral + negative;
                                const posPct = totalRevs > 0 ? Math.round((positive / totalRevs) * 100) : 0;
                                const neuPct = totalRevs > 0 ? Math.round((neutral / totalRevs) * 100) : 0;
                                const negPct = totalRevs > 0 ? 100 - posPct - neuPct : 0;

                                return (
                                    <>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                                            {messages > 0 && (
                                                <div className="card glass glass-hover animate-in" style={{ '--delay': '0.5s' } as any}>
                                                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,.5)' }}>Messages (Chat)</p>
                                                    <p style={{ fontSize: '24px', fontWeight: 800, marginTop: '6px', color: 'var(--blue-soft)' }}>{messages.toLocaleString()}</p>
                                                </div>
                                            )}
                                            {bookings > 0 && (
                                                <div className="card glass glass-hover animate-in" style={{ '--delay': '0.6s' } as any}>
                                                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,.5)' }}>Bookings Made</p>
                                                    <p style={{ fontSize: '24px', fontWeight: 800, marginTop: '6px', color: 'var(--green-soft)' }}>{bookings.toLocaleString()}</p>
                                                </div>
                                            )}
                                            {foodOrders > 0 && (
                                                <div className="card glass glass-hover animate-in" style={{ '--delay': '0.7s' } as any}>
                                                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,.5)' }}>Food Orders</p>
                                                    <p style={{ fontSize: '24px', fontWeight: 800, marginTop: '6px', color: 'var(--orange-soft)' }}>{foodOrders.toLocaleString()}</p>
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ marginBottom: '18px' }}>
                                            {/* Review Sentiment */}
                                            <div className="card glass glass-hover">
                                                <h3 style={{ fontSize: '15px', marginBottom: '16px' }}>Review Sentiment (Based on {totalRevs} tracked reviews)</h3>
                                                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                                                    {totalRevs > 0 ? (
                                                        <>
                                                            <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: `conic-gradient(var(--green) 0% ${posPct}%, var(--orange) ${posPct}% ${posPct + neuPct}%, var(--red) ${posPct + neuPct}% 100%)`, flexShrink: 0 }}></div>
                                                            <div style={{ flex: 1, minWidth: '150px' }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}><span style={{color: 'var(--green-soft)'}}>■ Positive (4-5★)</span><span>{posPct}%</span></div>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}><span style={{color: 'var(--orange-soft)'}}>■ Neutral (3★)</span><span>{neuPct}%</span></div>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}><span style={{color: 'var(--red-soft)'}}>■ Negative (1-2★)</span><span>{negPct}%</span></div>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,.5)' }}>Not enough reviews to calculate sentiment yet.</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        {/* Competitor Intel Section */}
                                        {(() => {
                                            const intel = user?.user_metadata?.competitor_intel?.[activeLocationId];
                                            if (!intel) {
                                                return (
                                                    <div className="card glass" style={{ textAlign: 'center', padding: '60px 20px', marginTop: '24px' }}>
                                                        <div style={{ fontSize: '40px', margin: '0 0 16px' }}>🏆</div>
                                                        <h3 style={{ fontSize: '18px', margin: '0 0 8px' }}>Waiting for Weekly Scan</h3>
                                                        <p style={{ color: 'rgba(255,255,255,.5)', maxWidth: '400px', margin: '0 auto' }}>Your local competitor leaderboard is generated every week by the admin. Check back later.</p>
                                                    </div>
                                                );
                                            }

                                            const { leaderboard, ai_report, last_scanned } = intel;
                                            return (
                                                <div style={{ marginTop: '32px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                                        <div>
                                                            <h3 style={{ fontSize: '18px', margin: 0 }}>Competitor Leaderboard</h3>
                                                            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,.5)', margin: 0 }}>Last Scanned: {new Date(last_scanned).toLocaleString()}</p>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-2" style={{ alignItems: 'start', padding: '16px', background: 'var(--bg-dark)', borderRadius: '12px' }}>
                                                        {/* Left: The Leaderboard */}
                                                        <div className="card glass" style={{ padding: 0, overflow: 'hidden' }}>
                                                            <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,.05)' }}>
                                                                <h3 style={{ fontSize: '15px', margin: 0 }}>Local Top 10 Scoreboard</h3>
                                                            </div>
                                                            <div style={{ padding: '10px' }}>
                                                                {leaderboard.map((comp: any, idx: number) => (
                                                                    <div key={idx} style={{ 
                                                                        display: 'flex', 
                                                                        alignItems: 'center', 
                                                                        padding: '12px 16px', 
                                                                        marginBottom: '8px',
                                                                        borderRadius: '8px',
                                                                        background: comp.is_user ? 'rgba(59,130,246,.15)' : 'rgba(255,255,255,.02)',
                                                                        border: comp.is_user ? '1px solid rgba(59,130,246,.4)' : '1px solid rgba(255,255,255,.05)'
                                                                    }}>
                                                                        <div style={{ width: '30px', fontWeight: 'bold', color: comp.rank <= 3 ? 'var(--orange-soft)' : 'rgba(255,255,255,.5)' }}>
                                                                            #{comp.rank}
                                                                        </div>
                                                                        <div style={{ flex: 1 }}>
                                                                            <p style={{ margin: 0, fontWeight: 600, fontSize: '14px', color: comp.is_user ? 'var(--blue-soft)' : '#fff' }}>
                                                                                {comp.name}
                                                                            </p>
                                                                        </div>
                                                                        <div style={{ textAlign: 'right' }}>
                                                                            <p style={{ margin: 0, fontWeight: 'bold', color: '#fbbf24', fontSize: '14px' }}>★ {comp.rating.toFixed(1)}</p>
                                                                            <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,.5)' }}>{comp.reviews} reviews</p>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* Right: Goods and Bads */}
                                                        <div id="pdf-report-container" className="card glass">
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                    <span style={{ fontSize: '24px' }}>🤖</span>
                                                                    <div>
                                                                        <h3 style={{ fontSize: '15px', margin: 0 }}>Detailed Rank Analysis</h3>
                                                                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,.5)', margin: 0 }}>AI Audit of your GBP vs Competitors</p>
                                                                    </div>
                                                                </div>
                                                                <button className="btn btn-green btn-sm" onClick={downloadPdfReport}>📄 Download PDF</button>
                                                            </div>
                                                            
                                                            <div style={{ 
                                                                background: 'rgba(255,255,255,.03)', 
                                                                border: '1px dashed rgba(255,255,255,.1)', 
                                                                padding: '20px', 
                                                                borderRadius: '8px',
                                                                fontSize: '14px',
                                                                lineHeight: 1.6,
                                                                color: 'rgba(255,255,255,.8)'
                                                            }}>
                                                                {ai_report.split('\n').map((line: string, i: number) => {
                                                                    const text = line.trim();
                                                                    if (text.startsWith('PROS:')) return <h4 key={i} style={{color: 'var(--green-soft)', marginTop: '10px', marginBottom: '6px'}}>✅ PROS</h4>;
                                                                    if (text.startsWith('CONS:')) return <h4 key={i} style={{color: 'var(--red-soft)', marginTop: '16px', marginBottom: '6px'}}>❌ CONS</h4>;
                                                                    if (text.startsWith('ACTION PLAN:')) return <h4 key={i} style={{color: 'var(--blue-soft)', marginTop: '16px', marginBottom: '6px'}}>🚀 ACTION PLAN</h4>;
                                                                    if (text.length === 0) return null;
                                                                    return <p key={i} style={{ margin: '0 0 6px 0', paddingLeft: '8px', borderLeft: '2px solid rgba(255,255,255,.1)' }}>{text}</p>;
                                                                })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </>
                                );
                            })()}
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

                            <div className="card glass" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', background: 'rgba(52,168,83,.05)', border: '1px solid rgba(52,168,83,.2)' }}>
                                <div>
                                    <p style={{ fontWeight: 600, fontSize: '15px', color: 'var(--green-soft)', margin: 0 }}>Enable Instant Google Webhooks</p>
                                    <p style={{ fontSize: '12.5px', color: 'rgba(255,255,255,.6)', margin: '4px 0 0', lineHeight: 1.5 }}>Link your Google Account to our Pub/Sub Webhook so AI replies instantly in seconds, bypassing cron jobs.</p>
                                </div>
                                <button className="btn btn-green btn-sm" onClick={async () => {
                                    setLoadingAction(true);
                                    try {
                                        const res = await fetch("https://gbp-auto-master-backend-us.onrender.com/api/google/register-webhook", {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                provider_token: providerToken,
                                                location_id: activeLocationId,
                                                user_id: user?.id
                                            })
                                        });
                                        const data = await res.json();
                                        if (data.status === 'success') {
                                            showToast('Webhook successfully registered! Instant replies are now live.', 'success');
                                        } else {
                                            showToast('Error registering Webhook: ' + data.message, 'error');
                                        }
                                    } catch (e) {
                                        showToast('Server error during webhook registration', 'error');
                                    } finally {
                                        setLoadingAction(false);
                                    }
                                }}>{loadingAction ? 'Connecting...' : 'Connect Webhook'}</button>
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

                            <div className="card glass" style={{ marginBottom: '16px' }}>
                                <label className="field-label">Target SEO Keywords (Comma Separated)</label>
                                <textarea rows={2} value={targetKeywords.join(', ')} onChange={(e) => setTargetKeywords(e.target.value.split(',').map(s => s.trim()).filter(s => s))} placeholder="e.g. Best Plumber, Emergency Pipe Repair"></textarea>
                            </div>

                            <div className="card glass">
                                <label className="field-label">Custom Instructions</label>
                                <textarea rows={3} value={customInstructions} onChange={(e) => setCustomInstructions(e.target.value)} placeholder="e.g. Always mention our 30-day return policy"></textarea>
                                <button className="btn btn-primary btn-sm" style={{ marginTop: '12px' }} onClick={() => {
                                    saveUserSettings({ 
                                        is_ai_active: isAiActive, 
                                        reply_to_1_star: replyTo1Star, 
                                        ai_tone: aiTone, 
                                        custom_instructions: customInstructions,
                                        active_keywords: targetKeywords 
                                    });
                                    showToast('Settings Saved successfully!', 'success');
                                }}>Save Settings</button>
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
                                            {activeLocObj.plan_details.auto_renew === false ? 'Expires on' : 'Renews on'} {new Date(activeLocObj.plan_details.expires_at).toLocaleDateString()} 
                                            ({Math.ceil((new Date(activeLocObj.plan_details.expires_at).getTime() - new Date().getTime()) / (1000 * 3600 * 24))} days left)
                                        </p>
                                        
                                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                            <button className="btn btn-primary btn-sm">Manage Billing / Update Card</button>
                                            {activeLocObj.plan_details.auto_renew !== false && (
                                                <button 
                                                    className="btn btn-ghost btn-sm" 
                                                    style={{ color: '#ef4444' }}
                                                    onClick={async () => {
                                                        if (window.confirm("Are you sure you want to cancel? You will lose AI automation at the end of your billing cycle.")) {
                                                            try {
                                                                const res = await fetch(`${API_BASE}/api/billing/cancel`, {
                                                                    method: 'POST',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify({ user_id: session.user.id, location_id: activeLocationId })
                                                                });
                                                                if (res.ok) {
                                                                    alert("Subscription cancelled successfully.");
                                                                    window.location.reload();
                                                                }
                                                            } catch (err) {
                                                                alert("Failed to cancel subscription");
                                                            }
                                                        }
                                                    }}
                                                >
                                                    Cancel Auto-Renew
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="card glass">
                                    <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Activate Automation for {activeLocationName}</h3>
                                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,.6)', marginBottom: '20px' }}>This location currently does not have an active AI subscription. Choose a plan below to activate.</p>
                                    <div className="grid grid-3">
                                        {(Object.keys(PRICING_PLANS) as Array<keyof typeof PRICING_PLANS>).map((key) => {
                                            const plan = PRICING_PLANS[key];
                                            const days = key === 'monthly' ? 30 : (key === 'half_yearly' ? 180 : 365);
                                            const perDay = (plan.discounted / days).toFixed(1);
                                            const discountAmt = plan.original - plan.discounted;
                                            
                                            return (
                                                <div key={key} className="card-sm glass glass-hover" onClick={() => setSelectedPlan(key)} style={{ cursor: 'pointer', position: 'relative', border: selectedPlan === key ? '1px solid rgba(59,130,246,.4)' : '' }}>
                                                    {key === 'yearly' && <span className="badge-pill b-green" style={{ position: 'absolute', top: '-10px', right: '-10px', fontSize: '10px' }}>Best Value</span>}
                                                    <p style={{ fontSize: '13px', color: selectedPlan === key ? 'var(--blue-soft)' : 'rgba(255,255,255,.5)' }}>{plan.name}</p>
                                                    
                                                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', marginTop: '4px' }}>
                                                        <p style={{ fontWeight: 700, fontSize: '24px', margin: 0 }}>₹{plan.discounted}</p>
                                                        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,.4)', textDecoration: 'line-through', paddingBottom: '3px', margin: 0 }}>₹{plan.original}</p>
                                                    </div>
                                                    
                                                    <p style={{ fontSize: '11px', color: 'var(--green-soft)', marginTop: '6px', fontWeight: 600 }}>Save ₹{discountAmt} (1st-time user)</p>
                                                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,.5)', marginTop: '4px' }}>Just ₹{perDay} / day</p>
                                                </div>
                                            );
                                        })}
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
                        <div className={`mob-nav-item ${activeView === 'brain' ? 'active' : ''}`} onClick={() => setActiveView('brain')}>
                            <span className="ic">🧠</span>
                            <span>Brain</span>
                        </div>
                        <div className={`mob-nav-item ${activeView === 'billing' ? 'active' : ''}`} onClick={() => setActiveView('billing')}>
                            <span className="ic">💳</span>
                            <span>Billing</span>
                        </div>
                    </nav>
                )}
            </div>

            {/* FLOATING TAAY!! AI ASSISTANT WIDGET */}
            {appState === 'dashboard' && (
                <>
                    {/* The Chat Window */}
                    <div className={`chat-widget-window glass ${isChatOpen ? 'open' : ''}`}>
                        <div className="taay-header">
                            <div className="taay-header-left">
                                <div className="taay-avatar-sm">
                                    <img src="/taay-avatar.jpg" alt="TAAY!!" />
                                    <div className="taay-avatar-status"></div>
                                </div>
                                <div>
                                    <h3 className="taay-name">TAAY!! <span className="taay-badge">AI</span></h3>
                                    <p className="taay-status-text">{chatLoading ? '🔊 Speaking...' : '● Online'}</p>
                                </div>
                            </div>
                            <button className="btn btn-ghost btn-sm" onClick={() => setIsChatOpen(false)} style={{ padding: '4px', fontSize: '16px' }}>✕</button>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }} className="custom-scroll">
                            {chatHistory.length === 0 && (
                                <div className="taay-welcome">
                                    <div className="taay-welcome-avatar">
                                        <img src="/taay-avatar.jpg" alt="TAAY!!" />
                                    </div>
                                    <h3 style={{ fontSize: '16px', marginBottom: '4px' }}>Hey! I'm <span className="grad-blue">TAAY!!</span></h3>
                                    <p style={{ fontSize: '12.5px', color: 'rgba(255,255,255,.5)', margin: 0 }}>Your AI business consultant. Ask me anything about your reviews, SEO, or business strategy!</p>
                                </div>
                            )}
                            {chatHistory.map((msg, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: '8px', alignItems: 'flex-end' }}>
                                    {msg.role === 'ai' && (
                                        <div className="taay-msg-avatar">
                                            <img src="/taay-avatar.jpg" alt="T" />
                                        </div>
                                    )}
                                    <div style={{
                                        background: msg.role === 'user' ? 'var(--blue)' : 'rgba(255,255,255,.05)',
                                        border: msg.role === 'user' ? 'none' : '1px solid rgba(255,255,255,.1)',
                                        padding: '10px 14px',
                                        borderRadius: '12px',
                                        borderBottomRightRadius: msg.role === 'user' ? '4px' : '12px',
                                        borderBottomLeftRadius: msg.role === 'ai' ? '4px' : '12px',
                                        maxWidth: '80%',
                                        fontSize: '13px',
                                        lineHeight: '1.5',
                                        whiteSpace: 'pre-wrap'
                                    }}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {chatLoading && (
                                <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '8px', alignItems: 'flex-end' }}>
                                    <div className="taay-msg-avatar speaking">
                                        <img src="/taay-avatar.jpg" alt="T" />
                                    </div>
                                    <div className="taay-typing-indicator">
                                        <span></span><span></span><span></span>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,.1)', display: 'flex', gap: '8px' }}>
                            <input 
                                type="text" 
                                className="input" 
                                placeholder="Ask TAAY!! anything..." 
                                style={{ flex: 1, padding: '10px' }}
                                value={chatInput}
                                onChange={e => setChatInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSendChat()}
                            />
                            <button className="btn btn-primary" onClick={handleSendChat} disabled={chatLoading || !chatInput.trim()} style={{ padding: '0 16px' }}>
                                ↗
                            </button>
                        </div>
                    </div>

                    {/* The Floating TAAY!! Avatar Button */}
                    <button 
                        className={`chat-widget-fab ${isChatOpen ? 'hide' : ''}`}
                        onClick={() => setIsChatOpen(true)}
                    >
                        <div className="taay-fab-ring"></div>
                        <div className="taay-fab-ring ring-2"></div>
                        <img src="/taay-avatar.jpg" alt="TAAY!!" className="taay-fab-img" />
                    </button>
                </>
            )}

            {showReportModal && (
                <div className="modal-backdrop" onClick={() => setShowReportModal(false)}>
                    <div className="modal-content glass" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', width: '90%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ fontSize: '20px', margin: 0 }}>✨ Detailed Rank Analysis</h2>
                            <button className="btn btn-ghost btn-sm" onClick={() => setShowReportModal(false)}>✕</button>
                        </div>
                        {reportGenerating ? (
                            <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                <div className="taay-typing-indicator" style={{ justifyContent: 'center', marginBottom: '16px' }}>
                                    <span></span><span></span><span></span>
                                </div>
                                <p style={{ color: 'rgba(255,255,255,.6)' }}>TAAY!! is generating your comprehensive SEO report...</p>
                            </div>
                        ) : reportData ? (
                            <div>
                                <h3 style={{ fontSize: '16px', color: 'var(--green-soft)', marginBottom: '8px' }}>Executive Summary</h3>
                                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,.8)', lineHeight: 1.6, marginBottom: '20px' }}>
                                    {reportData.summary}
                                </p>

                                <h3 style={{ fontSize: '16px', color: 'var(--blue-soft)', marginBottom: '8px' }}>Action Items</h3>
                                <ul style={{ paddingLeft: '20px', fontSize: '14px', color: 'rgba(255,255,255,.8)', lineHeight: 1.6 }}>
                                    {reportData.action_items.map((item, idx) => (
                                        <li key={idx} style={{ marginBottom: '6px' }}>{item}</li>
                                    ))}
                                </ul>

                                <button className="btn btn-primary btn-block" style={{ marginTop: '24px' }} onClick={() => setShowReportModal(false)}>Got it!</button>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '20px' }}>
                                <p style={{ color: 'var(--red-soft)' }}>Failed to load report data.</p>
                                {reportError && <p style={{ color: 'rgba(255,255,255,.5)', fontSize: '12px', marginTop: '10px' }}>{reportError}</p>}
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

