import { apiFetch } from './lib/api';
import { useState, useEffect } from 'react';
import Icon from './design/Icon';

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
    const API_URL = import.meta.env.VITE_API_URL || 'https://gbp-auto-master-backend-us.onrender.com';

    const [isAiActive, setIsAiActive] = useState(true);
    const [replyTo1Star, setReplyTo1Star] = useState(false);
    const [aiTone, setAiTone] = useState('Professional');
    const [customInstructions, setCustomInstructions] = useState('');
    const [targetKeywords, setTargetKeywords] = useState<string[]>([]);
    const [keywordInputText, setKeywordInputText] = useState('');
    const [searchKeywords, setSearchKeywords] = useState<any[]>([]);
    const [loadingAction, setLoadingAction] = useState(false);
    const [maxSeoKeywords, setMaxSeoKeywords] = useState(5);
    const [automationMode, setAutomationMode] = useState<'draft' | 'approval' | 'auto_publish'>('approval');
    const [delayMinutes, setDelayMinutes] = useState(0);
    const [dailyLimit, setDailyLimit] = useState(20);
    const [loadingSettings, setLoadingSettings] = useState(true);
    const [webhookConnected, setWebhookConnected] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            if (!user || !activeLocationId) return;
            setLoadingSettings(true);
            try {
                // Get max keywords from profile
                const profRes = await apiFetch(`${API_URL}/api/user/profile`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: user?.id, location_id: activeLocationId })
                });
                if(profRes.ok) {
                    const profData = await profRes.json();
                    if (profData.max_seo_keywords) setMaxSeoKeywords(profData.max_seo_keywords);
                }

                // Get AI settings for specific location
                const res = await apiFetch(`${API_URL}/api/user/get-ai-settings`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: user?.id, location_id: activeLocationId })
                });
                if(res.ok) {
                    const data = await res.json();
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

                const rulesRes = await apiFetch(`${API_URL}/api/platform/automation-rules`);
                if (rulesRes.ok) {
                    const rulesData = await rulesRes.json();
                    const rule = (rulesData.rules || []).find((item: any) => item.location_id === activeLocationId);
                    if (rule) {
                        setIsAiActive(rule.enabled);
                        setAutomationMode(rule.mode);
                        setAiTone(rule.tone || 'Professional');
                        setCustomInstructions(rule.custom_instructions || '');
                        setDelayMinutes(rule.delay_minutes || 0);
                        setDailyLimit(rule.daily_limit || 20);
                        setReplyTo1Star((rule.min_rating || 1) <= 1);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch settings", err);
            } finally {
                setLoadingSettings(false);
            }
        };
        fetchSettings();
    }, [user, activeLocationId, API_URL]);

    const saveAllSettings = async (options?: { mode?: 'draft' | 'approval' | 'auto_publish'; enabled?: boolean; quiet?: boolean }) => {
        if (!activeLocationId) {
            showToast('Select a Google Business Profile location first.', 'error');
            return false;
        }
        setLoadingAction(true);
        try {
            const nextMode = options?.mode ?? automationMode;
            const nextEnabled = options?.enabled ?? isAiActive;
            const automation = await apiFetch(`${API_URL}/api/platform/automation-rules`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    location_id: activeLocationId,
                    name: 'Review automation',
                    enabled: nextEnabled,
                    mode: nextMode,
                    min_rating: replyTo1Star ? 1 : 3,
                    max_rating: 5,
                    tone: aiTone,
                    language: 'auto',
                    custom_instructions: customInstructions,
                    delay_minutes: delayMinutes,
                    daily_limit: dailyLimit,
                    blocked_terms: [],
                }),
            });
            if (!automation.ok) {
                const body = await automation.json().catch(() => ({}));
                throw new Error(body.detail || 'Could not save review automation');
            }
            const legacy = await apiFetch(`${API_URL}/api/user/save-ai-settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user?.id,
                    location_id: activeLocationId,
                    settings: {
                        is_ai_active: nextEnabled,
                        reply_to_1_star: replyTo1Star,
                        ai_tone: aiTone,
                        custom_instructions: customInstructions,
                        active_keywords: targetKeywords,
                    },
                }),
            });
            if (!legacy.ok) console.warn('Legacy AI preferences did not sync; platform automation was saved.');
            setAutomationMode(nextMode);
            setIsAiActive(nextEnabled);
            if (!options?.quiet) showToast('Review automation settings saved.', 'success');
            return true;
        } catch (error: any) {
            showToast(error.message || 'Could not save review automation', 'error');
            return false;
        } finally {
            setLoadingAction(false);
        }
    };

    const registerWebhook = async (quiet = false) => {
        const res = await apiFetch(`${API_URL}/api/google/register-webhook`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ provider_token: providerToken || 'stored-google-connection', location_id: activeLocationId, user_id: user?.id })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.detail || data.message || 'Could not register Google notifications');
        setWebhookConnected(true);
        if (!quiet) showToast('Google review notifications are connected.', 'success');
    };

    const enableAutopilot = async () => {
        setLoadingAction(true);
        try {
            const saved = await saveAllSettings({ mode: 'auto_publish', enabled: true, quiet: true });
            if (!saved) return;
            await registerWebhook(true);
            showToast('Autopilot is live. New qualifying reviews will be replied to automatically.', 'success');
        } catch (error: any) {
            showToast(`Autopilot rule was saved, but Google notifications are not connected: ${error.message || 'please reconnect Google'}.`, 'error');
        } finally {
            setLoadingAction(false);
        }
    };

    return (
        <section className="page active">
            <div className="page-head">
                <span className="workspace-kicker">AUTOMATION</span>
                <h2>AI Brain Settings</h2>
                <p>Choose exactly how new Google reviews should be handled for this location.</p>
            </div>

            <div className={`autopilot-hero ${isAiActive && automationMode === 'auto_publish' ? 'is-live' : ''}`}>
                <div className="autopilot-orbit"><Icon name="spark" size={24}/></div>
                <div className="autopilot-copy">
                    <span className="workspace-kicker">{isAiActive && automationMode === 'auto_publish' ? 'AUTOPILOT LIVE' : 'AUTOPILOT READY'}</span>
                    <h3>{isAiActive && automationMode === 'auto_publish' ? 'New reviews can be handled while you work.' : 'Put new review replies on autopilot.'}</h3>
                    <p>Google sends the review to GBP Master, AI writes a reply using these rules, and eligible replies publish after your chosen delay. Each published reply uses 2.5 credits.</p>
                </div>
                <button className="btn btn-green" disabled={loadingAction || loadingSettings || !activeLocationId} onClick={enableAutopilot}>
                    {loadingAction ? 'Configuring…' : isAiActive && automationMode === 'auto_publish' ? 'Reconnect notifications' : 'Enable autopilot'}
                </button>
            </div>

            <div className="automation-flow" aria-label="Automatic review reply flow">
                <span><b>01</b> New Google review</span><i>→</i><span><b>02</b> AI applies your rules</span><i>→</i><span><b>03</b> Reply publishes</span>
            </div>

            <div className="card glass" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                    <p style={{ fontWeight: 600, fontSize: '15px', margin: 0 }}>Master Autopilot Switch</p>
                    <p style={{ fontSize: '12.5px', color: 'var(--live-muted, rgba(255,255,255,.5))', margin: '4px 0 0' }}>Turn off to stop creating or publishing replies for incoming reviews.</p>
                </div>
                <div className={`toggle ${isAiActive ? 'on' : ''}`} onClick={() => setIsAiActive(!isAiActive)}><span className="knob"></span></div>
            </div>

            <div className="card glass" style={{ marginBottom: '16px' }}>
                <label className="field-label">Publishing workflow</label>
                <select value={automationMode} onChange={(event) => setAutomationMode(event.target.value as any)}>
                    <option value="draft">Draft only</option>
                    <option value="approval">Wait for approval</option>
                    <option value="auto_publish">Publish automatically</option>
                </select>
                <p style={{ fontSize: '12.5px', color: 'var(--live-muted, rgba(255,255,255,.5))', margin: '8px 0 0' }}>
                    Draft only stores suggestions. Approval waits for you or your AI agent. Automatic mode publishes qualifying replies after the delay.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '12px', marginTop: '14px' }}>
                    <div>
                        <label className="field-label">Delay (minutes)</label>
                        <input className="input" type="number" min={0} max={10080} value={delayMinutes} onChange={(event) => setDelayMinutes(Number(event.target.value))} />
                    </div>
                    <div>
                        <label className="field-label">Daily limit</label>
                        <input className="input" type="number" min={1} max={500} value={dailyLimit} onChange={(event) => setDailyLimit(Number(event.target.value))} />
                    </div>
                </div>
            </div>

            <div className="card glass" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', background: 'rgba(52,168,83,.05)', border: '1px solid rgba(52,168,83,.2)' }}>
                <div>
                    <p style={{ fontWeight: 600, fontSize: '15px', color: 'var(--green-soft)', margin: 0 }}>Enable Instant Google Webhooks</p>
                    <p style={{ fontSize: '12.5px', color: 'var(--live-muted, rgba(255,255,255,.6))', margin: '4px 0 0', lineHeight: 1.5 }}>Link your Google Account to our Pub/Sub Webhook so AI replies instantly in seconds, bypassing cron jobs.</p>
                </div>
                <button className="btn btn-green btn-sm" onClick={async () => {
                    setLoadingAction(true);
                    try {
                        await registerWebhook();
                    } catch (e: any) {
                        showToast(e.message || 'Server error during webhook registration', 'error');
                    } finally {
                        setLoadingAction(false);
                    }
                }}>{loadingAction ? 'Connecting...' : webhookConnected ? 'Connected' : 'Connect Google notifications'}</button>
            </div>

            <div className="card glass" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div className={`checkbox ${replyTo1Star ? 'on' : ''}`} onClick={() => setReplyTo1Star(!replyTo1Star)}>
                        {replyTo1Star ? '✓' : ''}
                    </div>
                    <div>
                        <p style={{ fontWeight: 600, fontSize: '14.5px', margin: 0 }}>Reply to negative reviews</p>
                        <p style={{ fontSize: '12.5px', color: 'var(--live-muted, rgba(255,255,255,.5))', margin: '4px 0 0' }}>If unchecked, the AI skips 1 and 2-star reviews so you can handle upset customers personally.</p>
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
                <p style={{ fontSize: '12.5px', color: 'var(--live-muted, rgba(255,255,255,.5))', margin: '0 0 12px' }}>
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
                <button className="btn btn-primary btn-sm" style={{ marginTop: '12px' }} disabled={loadingAction || loadingSettings} onClick={() => { void saveAllSettings(); }}>
                    {loadingAction ? 'Saving...' : 'Save Settings'}
                </button>
            </div>
        </section>
    );
}
