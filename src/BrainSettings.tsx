import React, { useState, useEffect } from 'react';

interface BrainSettingsProps {
    user: any;
    activeLocationId: string;
    providerToken: string;
    showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export default function BrainSettings({ 
    user, 
    activeLocationId, 
    providerToken, 
    showToast 
}: BrainSettingsProps) {
    const API_URL = import.meta.env.VITE_API_URL || '';

    const [isAiActive, setIsAiActive] = useState(true);
    const [replyTo1Star, setReplyTo1Star] = useState(false);
    const [aiTone, setAiTone] = useState('Professional');
    const [customInstructions, setCustomInstructions] = useState('');
    const [targetKeywords, setTargetKeywords] = useState<string[]>([]);
    const [keywordInputText, setKeywordInputText] = useState('');
    const [searchKeywords, setSearchKeywords] = useState<any[]>([]);
    const [loadingAction, setLoadingAction] = useState(false);
    const [maxSeoKeywords, setMaxSeoKeywords] = useState(5);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user) return;
            try {
                const res = await fetch(`${API_URL}/api/user/profile`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: user?.id })
                });
                if(res.ok) {
                    const data = await res.json();
                    if (data.max_seo_keywords) {
                        setMaxSeoKeywords(data.max_seo_keywords);
                    }
                    if (data.is_ai_active !== undefined) setIsAiActive(data.is_ai_active);
                    if (data.reply_to_1_star !== undefined) setReplyTo1Star(data.reply_to_1_star);
                    if (data.ai_tone !== undefined) setAiTone(data.ai_tone);
                    if (data.custom_instructions !== undefined) setCustomInstructions(data.custom_instructions);
                    if (data.active_keywords !== undefined) {
                        setTargetKeywords(data.active_keywords);
                        setKeywordInputText(data.active_keywords.join(', '));
                    }
                    if (data.search_keywords !== undefined) setSearchKeywords(data.search_keywords);
                }
            } catch (err) {
                console.error("Failed to fetch profile", err);
            }
        };
        fetchProfile();
    }, [user, API_URL]);

    const saveUserSettings = async (settings: any) => {
        try {
            const res = await fetch(`${API_URL}/api/user/save-ai-settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user?.id,
                    location_id: activeLocationId,
                    settings: settings
                })
            });
            if (res.ok) {
                showToast('Settings saved successfully!', 'success');
            } else {
                showToast('Failed to save settings', 'error');
            }
        } catch (e) {
            showToast('Error saving settings', 'error');
        }
    };

    return (
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
                        const res = await fetch(`${API_URL}/api/google/register-webhook`, {
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
                <label className="field-label">Target SEO Keywords (Max: {maxSeoKeywords})</label>
                <p style={{ fontSize: '12.5px', color: 'rgba(255,255,255,.5)', margin: '0 0 12px' }}>
                    Select auto-discovered local keywords or manually type your own separated by commas. AI will organically inject these into review replies.
                </p>
                
                {searchKeywords && searchKeywords.length > 0 && (
                    <div style={{ 
                        maxHeight: '150px', 
                        overflowY: 'auto', 
                        background: 'rgba(255,255,255,.02)', 
                        border: '1px solid rgba(255,255,255,.05)', 
                        borderRadius: '8px', 
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        marginBottom: '12px'
                    }}>
                        {searchKeywords.map((kw: any, idx: number) => {
                            const isActive = targetKeywords.includes(kw.searchKeyword);
                            return (
                                <div 
                                    key={idx} 
                                    style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                                    onClick={() => {
                                        let newKws;
                                        if (isActive) {
                                            newKws = targetKeywords.filter(k => k !== kw.searchKeyword);
                                        } else {
                                            if (targetKeywords.length >= maxSeoKeywords) {
                                                showToast(`You can only select up to ${maxSeoKeywords} keywords on your current plan.`, 'error');
                                                return;
                                            }
                                            newKws = [...targetKeywords, kw.searchKeyword];
                                        }
                                        setTargetKeywords(newKws);
                                        setKeywordInputText(newKws.join(', '));
                                    }}
                                >
                                    <div className={`checkbox ${isActive ? 'on' : ''}`}>
                                        {isActive ? '✓' : ''}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ margin: 0, fontSize: '14px', color: isActive ? '#fff' : 'rgba(255,255,255,.7)' }}>{kw.searchKeyword}</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={{ fontSize: '12px', color: 'var(--green-soft)' }}>{kw.monthlyImpressionsValue} views/mo</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
                
                <textarea 
                    className="input" 
                    style={{ width: '100%', padding: '10px' }} 
                    rows={2} 
                    value={keywordInputText} 
                    onChange={(e) => {
                        const keywords = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                        if (keywords.length <= maxSeoKeywords) {
                            setKeywordInputText(e.target.value);
                            setTargetKeywords(keywords);
                        } else {
                            showToast(`Max ${maxSeoKeywords} keywords allowed.`, 'error');
                        }
                    }} 
                    placeholder="e.g. Preschool in Kalyan, Best Daycare near me"
                ></textarea>
            </div>

            <div className="card glass">
                <label className="field-label">Custom Instructions</label>
                <textarea className="input" rows={3} value={customInstructions} onChange={(e) => setCustomInstructions(e.target.value)} placeholder="e.g. Always mention our 30-day return policy"></textarea>
                <button className="btn btn-primary btn-sm" style={{ marginTop: '12px' }} onClick={() => {
                    saveUserSettings({ 
                        is_ai_active: isAiActive, 
                        reply_to_1_star: replyTo1Star, 
                        ai_tone: aiTone, 
                        custom_instructions: customInstructions,
                        active_keywords: targetKeywords 
                    });
                }}>Save Settings</button>
            </div>
        </section>
    );
}
