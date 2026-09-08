import React, { useState } from 'react';

interface RankAnalysisProps {
    analyticsData: any;
    activeLocationId: string;
    user: any;
    liveReviews: any[];
    showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
    searchKeywords: any[];
    providerToken: string;
    refreshTokens?: () => void;
}

export default function RankAnalysis({
    analyticsData, activeLocationId, user, liveReviews, showToast, searchKeywords, providerToken, refreshTokens
}: RankAnalysisProps) {
    const API_URL = import.meta.env.VITE_API_URL || 'https://gbp-auto-master-backend-us.onrender.com';
    const [generatingReport, setGeneratingReport] = useState(false);
    const [seoKeywords, setSeoKeywords] = useState<any[]>([]);
    const [planType, setPlanType] = useState<string>('');
    const [searchKeyword, setSearchKeyword] = useState('');
    const [scanningCompetitors, setScanningCompetitors] = useState(false);
    const [competitorResults, setCompetitorResults] = useState<any[]>([]);
    const [reportResults, setReportResults] = useState<Record<string, any>>({});

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

    const downloadKeywordPdf = async (keyword: string, reportText?: string, competitors?: any[]) => {
        showToast(`Generating PDF for ${keyword}...`, 'info');
        try {
            const jsPDF = (await import('jspdf')).default;
            const pdf = new jsPDF('p', 'mm', 'a4');
            
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(22);
            pdf.text(`Rank Analysis & Competitor Report`, 14, 22);
            
            pdf.setFontSize(14);
            pdf.setFont("helvetica", "normal");
            pdf.text(`Target Keyword: "${keyword}"`, 14, 32);
            pdf.text(`Date Generated: ${new Date().toLocaleDateString()}`, 14, 40);

            let yPos = 55;

            // Usage Stats
            const usageCount = liveReviews ? liveReviews.filter((r: any) => r.reviewReply?.comment?.toLowerCase().includes(keyword.toLowerCase())).length : 0;
            const totalReplies = liveReviews ? liveReviews.filter((r: any) => r.reviewReply?.comment).length : 0;
            pdf.setFont("helvetica", "bold");
            pdf.text(`Your Business Setup:`, 14, yPos);
            yPos += 8;
            pdf.setFont("helvetica", "normal");
            pdf.text(`AI Reply Usage: Weaved ${usageCount} times across ${totalReplies} replies.`, 14, yPos);
            yPos += 15;

            // Competitors
            if (competitors && competitors.length > 0) {
                pdf.setFont("helvetica", "bold");
                pdf.text(`Local Top 10 Competitors for "${keyword}"`, 14, yPos);
                yPos += 8;
                pdf.setFont("helvetica", "normal");
                competitors.forEach((c: any, idx: number) => {
                    if (yPos > 270) { pdf.addPage(); yPos = 20; }
                    pdf.text(`#${idx + 1} - ${c.name} (Rating: ${c.rating}, Reviews: ${c.reviews})`, 14, yPos);
                    yPos += 8;
                });
                yPos += 10;
            }

            // AI Report
            if (reportText) {
                if (yPos > 250) { pdf.addPage(); yPos = 20; }
                pdf.setFont("helvetica", "bold");
                pdf.text(`AI Intelligence Analysis`, 14, yPos);
                yPos += 10;
                pdf.setFont("helvetica", "normal");
                
                const splitText = pdf.splitTextToSize(reportText, 180);
                splitText.forEach((line: string) => {
                    if (yPos > 280) {
                        pdf.addPage();
                        yPos = 20;
                    }
                    pdf.text(line, 14, yPos);
                    yPos += 7;
                });
            } else {
                pdf.text("No AI analysis report available. Use the 'Generate Report' button.", 14, yPos);
            }

            pdf.save(`Rank_Report_${keyword.replace(/[^a-z0-9]/gi, '_')}.pdf`);
            showToast("PDF downloaded successfully!", "success");
        } catch (e) {
            console.error(e);
            showToast("Failed to generate PDF", "error");
        }
    };



    React.useEffect(() => {
        if (user?.id) {
            // Fetch plan type
            fetch(`${API_URL}/api/user/profile`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user.id })
            })
            .then(res => res.json())
            .then(data => {
                if (data.plan_type) {
                    setPlanType(data.plan_type);
                }
            })
            .catch(e => console.error("Failed to fetch profile", e));
        }

        if (user?.id && activeLocationId) {
            // Fetch location-specific SEO keywords
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
                    setSeoKeywords([]);
                }
            })
            .catch(e => console.error("Failed to fetch settings", e));
        }
    }, [user?.id, activeLocationId, API_URL]);

    const handleGenerateReport = async (keyword: string) => {
        if (planType === 'free') {
            showToast("Competitor Rank Reports are only available on paid plans.", "error");
            return;
        }

        try {
            const balRes = await fetch(`${API_URL}/api/tokens/balance`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user?.id })
            });
            const balData = await balRes.json();
            if (balData.balance < 10) {
                showToast("Insufficient tokens (need 10)", "error");
                return;
            }
        } catch (e: any) {
            showToast("Failed to check token balance", "error");
            return;
        }

        setGeneratingReport(true);
        showToast("Generating report...", "info");
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
            if (data.status === 'success') {
                showToast(`Report generated successfully for "${keyword}"! Downloading...`, 'success');
                downloadKeywordPdf(keyword, data.report, data.competitors);
                if (refreshTokens) refreshTokens();
            } else {
                showToast(data.detail || data.message || "Failed to generate report", "error");
            }
        } catch (e) {
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

            </div>

            {/* User SEO Keywords Section */}
            <div className="card glass" style={{ marginTop: '24px' }}>
                <h3 style={{ fontSize: '15px', marginBottom: '16px' }}>Your SEO Keywords</h3>
                {seoKeywords.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
                        {seoKeywords.map((kw, idx) => {
                            const usageCount = liveReviews ? liveReviews.filter((r: any) => r.reviewReply?.comment?.toLowerCase().includes(kw.toLowerCase())).length : 0;
                            const totalReplies = liveReviews ? liveReviews.filter((r: any) => r.reviewReply?.comment).length : 0;
                            const usagePct = totalReplies > 0 ? (usageCount / totalReplies) * 100 : 0;
                            
                            return (
                                <div key={idx} className="keyword-card" style={{ background: 'rgba(255,255,255,.05)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,.1)' }}>
                                    <p className="kw-name" style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 8px', color: '#fff' }}>{kw}</p>
                                    <p className="kw-stat" style={{ fontSize: '13px', margin: '0 0 8px', color: 'rgba(255,255,255,.7)' }}>
                                        AI Usage: {usageCount} times in replies
                                    </p>
                                    <div className="kw-usage-bar" style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,.1)', borderRadius: '3px', overflow: 'hidden', marginBottom: '16px' }}>
                                        <div className="kw-usage-fill" style={{ width: `${usagePct}%`, height: '100%', background: 'var(--green)' }}></div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <button 
                                            className="btn btn-ghost btn-sm" 
                                            onClick={() => handleGenerateReport(kw)}
                                            disabled={generatingReport}
                                            style={{ width: '100%', background: 'rgba(255,255,255,.05)' }}
                                        >
                                            {generatingReport ? 'Scanning Competitors...' : 'dY"S Generate Report (10 tokens)'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,.5)' }}>No SEO keywords found in your profile.</p>
                )}
            </div>

        </section>
    );
}
