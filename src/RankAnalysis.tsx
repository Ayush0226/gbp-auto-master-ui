import React, { useState } from 'react';

export default function RankAnalysis({
    analyticsData, activeLocationId, user, liveReviews, showToast, searchKeywords, providerToken
}: any) {
    const API_URL = import.meta.env.VITE_API_URL || '';
    const [generatingReport, setGeneratingReport] = useState(false);
    const [seoKeywords, setSeoKeywords] = useState<any[]>([]);
    const [planType, setPlanType] = useState<string>('');
    const [searchKeyword, setSearchKeyword] = useState('');
    const [scanningCompetitors, setScanningCompetitors] = useState(false);
    const [competitorResults, setCompetitorResults] = useState<any[]>([]);

    const handleDownloadPdf = async () => {
        showToast('Generating PDF...', 'info');
        try {
            const element = document.getElementById('rank-analysis-content');
            if (!element) return;
            const html2canvas = (await import('html2canvas')).default;
            const jsPDF = (await import('jspdf')).default;
            const canvas = await html2canvas(element, { backgroundColor: '#0A0E17' });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgWidth = 210;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
            pdf.save('rank-analysis-report.pdf');
            showToast('PDF downloaded!', 'success');
        } catch (e) {
            showToast('PDF generation failed: ' + e, 'error');
        }
    };

    const handleScanCompetitors = async () => {
        if (!searchKeyword) {
            showToast("Please enter a keyword", "error");
            return;
        }
        setScanningCompetitors(true);
        try {
            const res = await fetch(`${API_URL}/api/google/competitors`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user?.id,
                    location_name: activeLocationId,
                    keyword: searchKeyword
                })
            });
            const data = await res.json();
            if (res.ok && data.results) {
                setCompetitorResults(data.results);
                showToast("Scan complete!", "success");
            } else {
                showToast("Failed to scan competitors", "error");
            }
        } catch (e: any) {
            showToast("Error scanning competitors", "error");
        } finally {
            setScanningCompetitors(false);
        }
    };

    React.useEffect(() => {
        if (user?.id) {
            fetch(`${API_URL}/api/user/profile`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user.id })
            })
            .then(res => res.json())
            .then(data => {
                if (data.seo_keywords) {
                    setSeoKeywords(data.seo_keywords);
                }
                if (data.plan_type) {
                    setPlanType(data.plan_type);
                }
            })
            .catch(e => console.error("Failed to fetch profile", e));
        }
    }, [user?.id, API_URL]);

    const handleGenerateReport = async (keyword: string = 'general') => {
        try {
            const balRes = await fetch(`${API_URL}/api/tokens/balance`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user?.id })
            });
            const balData = await balRes.json();
            if (balData.balance < 15) {
                showToast("Insufficient tokens (need 15)", "error");
                return;
            }
        } catch (e: any) {
            showToast("Failed to check token balance", "error");
            return;
        }

        setGeneratingReport(true);
        showToast("Using 15 tokens to generate report...", "info");
        try {
            const res = await fetch(`${API_URL}/api/rank/generate-report`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user?.id,
                    keyword: keyword,
                    location_id: activeLocationId,
                    access_token: providerToken
                })
            });
            const data = await res.json();
            if (res.ok) {
                showToast("Report generated successfully!", "success");
            } else {
                showToast("Failed to generate report", "error");
            }
        } catch (e: any) {
            showToast("Error generating report", "error");
        } finally {
            setGeneratingReport(false);
        }
    };

    const getMetricTotal = (metricName: string) => {
        if (!analyticsData || !analyticsData.multiDailyMetricTimeSeries) return 0;
        const series = analyticsData.multiDailyMetricTimeSeries.find((s: any) => s.dailyMetric === metricName);
        if (!series || !series.timeSeries || !series.timeSeries.datedValues) return 0;
        return series.timeSeries.datedValues.reduce((acc: number, val: any) => acc + parseInt(val.value || 0), 0);
    };

    const messages = getMetricTotal('BUSINESS_CONVERSATIONS');
    const bookings = getMetricTotal('BUSINESS_BOOKINGS');
    const foodOrders = getMetricTotal('FOOD_ORDERS');

    let positive = 0;
    let neutral = 0;
    let negative = 0;
    if (liveReviews && liveReviews.length > 0) {
        liveReviews.forEach((rev: any) => {
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
        <section className="page active" id="rank-analysis-content">
            <div className="glow" style={{ bottom: '10%', right: '-10%', width: '400px', height: '400px', background: 'var(--green)' }}></div>

            <div className="page-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h2 style={{ margin: 0 }}>Rank Pusher</h2>
                    <p style={{ marginTop: '4px' }}>Local ranking performance and AI traffic insights.</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-green btn-sm" onClick={handleDownloadPdf}>✨ Detailed Rank Analysis</button>
                    <button 
                        className="btn btn-ghost btn-sm" 
                        onClick={() => handleGenerateReport('general')}
                        disabled={generatingReport}
                    >
                        {generatingReport ? 'Generating...' : 'Generate Report (15 tokens)'}
                    </button>
                </div>
            </div>

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

            {/* SEO Keywords Grid */}
            <div className="card glass" style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '15px', marginBottom: '16px' }}>Top SEO Keywords for this location</h3>
                {searchKeywords && searchKeywords.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                        {searchKeywords.slice(0, 12).map((kw: any, idx: number) => (
                            <div key={idx} style={{ background: 'rgba(255,255,255,.05)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,.1)' }}>
                                <p style={{ fontSize: '14px', fontWeight: 'bold', margin: '0 0 4px', color: '#fff' }}>{kw.searchKeyword}</p>
                                <p style={{ fontSize: '12px', color: 'var(--green-soft)', margin: 0 }}>{kw.monthlyImpressionsValue || 0} views/mo</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,.5)' }}>No keywords fetched yet.</p>
                )}
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
                                                <p style={{ margin: 0, fontWeight: 'bold', color: '#fbbf24', fontSize: '14px' }}>★ {typeof comp.rating === 'number' ? comp.rating.toFixed(1) : comp.rating}</p>
                                                <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,.5)' }}>{comp.reviews} {comp.reviews === 'N/A' ? '' : 'reviews'}</p>
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
                                    <button className="btn btn-green btn-sm" onClick={handleDownloadPdf}>📄 Download PDF</button>
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

            {/* User SEO Keywords Section */}
            <div className="card glass" style={{ marginTop: '24px' }}>
                <h3 style={{ fontSize: '15px', marginBottom: '16px' }}>Your SEO Keywords</h3>
                {seoKeywords.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
                        {seoKeywords.map((kw, idx) => (
                            <div key={idx} style={{ background: 'rgba(255,255,255,.05)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,.1)' }}>
                                <p style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 12px', color: '#fff' }}>{kw}</p>
                                <button 
                                    className="btn btn-ghost btn-sm" 
                                    onClick={() => handleGenerateReport(kw)}
                                    disabled={generatingReport}
                                    style={{ width: '100%' }}
                                >
                                    {generatingReport ? 'Generating...' : 'Generate Report (15 tokens)'}
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,.5)' }}>No SEO keywords found in your profile.</p>
                )}
            </div>

            {/* Competitor Leaderboard (Yearly Only) */}
            <div className="card glass" style={{ marginTop: '24px' }}>
                <h3 style={{ fontSize: '15px', marginBottom: '16px' }}>On-Demand Competitor Leaderboard</h3>
                {planType === 'yearly' ? (
                    <div>
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                            <input 
                                type="text" 
                                className="input" 
                                placeholder="Enter keyword (e.g., AC repair near me)" 
                                value={searchKeyword}
                                onChange={(e) => setSearchKeyword(e.target.value)}
                                style={{ flex: 1 }}
                            />
                            <button 
                                className="btn btn-green" 
                                onClick={handleScanCompetitors}
                                disabled={scanningCompetitors}
                            >
                                {scanningCompetitors ? 'Scanning...' : 'Scan Competitors'}
                            </button>
                        </div>

                        {competitorResults.length > 0 && (
                            <div style={{ background: 'var(--bg-dark)', borderRadius: '8px', padding: '12px' }}>
                                {competitorResults.map((comp: any, idx: number) => (
                                    <div key={idx} style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        padding: '12px 16px', 
                                        marginBottom: '8px',
                                        borderRadius: '8px',
                                        background: 'rgba(255,255,255,.02)',
                                        border: '1px solid rgba(255,255,255,.05)'
                                    }}>
                                        <div style={{ width: '30px', fontWeight: 'bold', color: 'var(--orange-soft)' }}>
                                            #{comp.rank || (idx + 1)}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ margin: 0, fontWeight: 600, fontSize: '14px', color: '#fff' }}>
                                                {comp.name || comp.business_name}
                                            </p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <p style={{ margin: 0, fontWeight: 'bold', color: '#fbbf24', fontSize: '14px' }}>
                                                ★ {typeof comp.rating === 'number' ? comp.rating.toFixed(1) : comp.rating}
                                            </p>
                                            <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,.5)' }}>
                                                {comp.reviews} reviews
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '30px 20px', background: 'rgba(255,255,255,.02)', borderRadius: '8px', border: '1px dashed rgba(255,255,255,.1)' }}>
                        <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔒</div>
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>Locked Feature</h4>
                        <p style={{ color: 'rgba(255,255,255,.5)', fontSize: '14px', margin: 0 }}>Upgrade to Yearly plan to unlock On-Demand Competitor Leaderboard</p>
                    </div>
                )}
            </div>
        </section>
    );
}
