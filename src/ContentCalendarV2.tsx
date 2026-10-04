import { useCallback, useEffect, useMemo, useState } from 'react';
import { API_URL, apiFetch } from './lib/api';
import { supabase } from './lib/supabase';

type Location = { id: string; name: string; account_id?: string };
type Delivery = { location_id: string; status: string; last_error?: string | null };
type Campaign = {
    id: string;
    title: string;
    topic_type: 'STANDARD' | 'EVENT' | 'OFFER';
    summary: string;
    status: string;
    scheduled_for?: string | null;
    locations: Delivery[];
};

const STATUS_COLORS: Record<string, string> = {
    draft: '#94a3b8', awaiting_approval: '#f59e0b', scheduled: '#3b82f6',
    processing: '#a855f7', partially_published: '#f97316', published: '#22c55e',
    failed: '#ef4444', cancelled: '#64748b',
};

function localInputValue(date: Date) {
    const offset = date.getTimezoneOffset() * 60_000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export default function ContentCalendarV2({
    user, liveLocations, activeLocationId, tokenBalance, refreshTokens, showToast,
}: {
    user: any;
    liveLocations: Location[];
    activeLocationId: string;
    tokenBalance: number;
    refreshTokens: () => void;
    showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}) {
    const today = new Date();
    const [month, setMonth] = useState(today.getMonth());
    const [year, setYear] = useState(today.getFullYear());
    const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(false);
    const [composerOpen, setComposerOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [summary, setSummary] = useState('');
    const [topicType, setTopicType] = useState<'STANDARD' | 'EVENT' | 'OFFER'>('STANDARD');
    const [locationIds, setLocationIds] = useState<string[]>([]);
    const [publishLocal, setPublishLocal] = useState(localInputValue(new Date(Date.now() + 86_400_000)));
    const [ctaType, setCtaType] = useState('LEARN_MORE');
    const [ctaUrl, setCtaUrl] = useState('');
    const [eventTitle, setEventTitle] = useState('');
    const [eventEndLocal, setEventEndLocal] = useState(localInputValue(new Date(Date.now() + 2 * 86_400_000)));
    const [couponCode, setCouponCode] = useState('');
    const [terms, setTerms] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';

    const monthStart = useMemo(() => new Date(year, month, 1), [year, month]);
    const firstDay = monthStart.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthEnd = useMemo(() => new Date(year, month + 1, 1), [year, month]);
    const monthStartIso = monthStart.toISOString();
    const monthEndIso = monthEnd.toISOString();

    const fetchCampaigns = useCallback(async () => {
        if (!user) return;
        try {
            const params = new URLSearchParams({
                from_time: monthStartIso,
                to_time: monthEndIso,
                limit: '300',
            });
            const response = await apiFetch(`${API_URL}/api/platform/campaigns?${params}`);
            if (!response.ok) throw new Error('Could not load the content calendar');
            const data = await response.json();
            setCampaigns(data.campaigns || []);
        } catch (error: any) {
            showToast(error.message || 'Could not load the content calendar', 'error');
        }
    }, [user?.id, monthStartIso, monthEndIso]);

    useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);
    useEffect(() => {
        if (!locationIds.length && activeLocationId) setLocationIds([activeLocationId]);
    }, [activeLocationId, locationIds.length]);

    const campaignsByDay = useMemo(() => {
        const grouped: Record<number, Campaign[]> = {};
        for (const campaign of campaigns) {
            if (!campaign.scheduled_for) continue;
            const date = new Date(campaign.scheduled_for);
            if (date.getFullYear() !== year || date.getMonth() !== month) continue;
            (grouped[date.getDate()] ||= []).push(campaign);
        }
        return grouped;
    }, [campaigns, month, year]);

    const openComposer = (day?: number) => {
        const targetDay = day || selectedDay || today.getDate();
        const target = new Date(year, month, targetDay, 10, 0, 0);
        if (target <= new Date()) target.setDate(target.getDate() + 1);
        setSelectedDay(target.getDate());
        setPublishLocal(localInputValue(target));
        setComposerOpen(true);
    };

    const toggleLocation = (id: string) => {
        setLocationIds(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id]);
    };

    const uploadMedia = async (): Promise<string | null> => {
        if (!file) return null;
        const safeName = file.name.replace(/[^A-Za-z0-9._-]/g, '_');
        const objectPath = `${user.id}/${crypto.randomUUID()}_${safeName}`;
        const uploaded = await supabase.storage.from('calendar_images').upload(objectPath, file);
        if (uploaded.error) throw uploaded.error;
        const publicUrl = supabase.storage.from('calendar_images').getPublicUrl(objectPath).data.publicUrl;
        const response = await apiFetch(`${API_URL}/api/platform/media`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                object_path: objectPath,
                public_url: publicUrl,
                media_kind: file.type.startsWith('video/') ? 'video' : 'photo',
                mime_type: file.type || 'application/octet-stream',
                byte_size: file.size,
            }),
        });
        if (!response.ok) throw new Error('The media uploaded but could not be registered');
        return (await response.json()).asset.id;
    };

    const createAndSchedule = async () => {
        if (!title.trim() || !summary.trim()) return showToast('Add a campaign title and post text.', 'error');
        if (!locationIds.length) return showToast('Select at least one business location.', 'error');
        const publishDate = new Date(publishLocal);
        if (!publishLocal || Number.isNaN(publishDate.getTime()) || publishDate <= new Date()) return showToast('Choose a future publication time.', 'error');
        if (topicType !== 'STANDARD' && !eventTitle.trim()) return showToast('Add an event or offer title.', 'error');
        if (topicType !== 'STANDARD' && new Date(eventEndLocal) <= publishDate) return showToast('The event end must be after publication.', 'error');
        const totalCost = locationIds.length * 5;
        if (tokenBalance < totalCost) return showToast(`This campaign needs ${totalCost} credits.`, 'error');
        setLoading(true);
        try {
            const mediaAssetId = await uploadMedia();
            const campaignResponse = await apiFetch(`${API_URL}/api/platform/campaigns`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: title.trim(), topic_type: topicType, summary: summary.trim(), timezone,
                    location_ids: locationIds, media_asset_id: mediaAssetId,
                    call_to_action: ctaUrl ? { action_type: ctaType, url: ctaUrl } : null,
                    event_details: topicType === 'STANDARD' ? null : {
                        title: eventTitle.trim(), start_time: publishDate.toISOString(), end_time: new Date(eventEndLocal).toISOString(),
                    },
                    offer_details: topicType === 'OFFER' ? { coupon_code: couponCode.trim(), terms_conditions: terms.trim() } : null,
                }),
            });
            const draft = await campaignResponse.json();
            if (!campaignResponse.ok) throw new Error(draft.detail || 'Could not create the campaign');
            const scheduleResponse = await apiFetch(`${API_URL}/api/platform/campaigns/${draft.campaign_id}/schedule`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ publish_at: publishDate.toISOString() }),
            });
            const scheduled = await scheduleResponse.json();
            if (!scheduleResponse.ok) throw new Error(scheduled.detail || 'The draft was saved but could not be scheduled');
            showToast(`Campaign scheduled for ${scheduled.location_count} location${scheduled.location_count === 1 ? '' : 's'}. ${scheduled.credits_charged} credits used.`, 'success');
            setTitle(''); setSummary(''); setFile(null); setCouponCode(''); setTerms('');
            setComposerOpen(false);
            await fetchCampaigns();
            refreshTokens();
        } catch (error: any) {
            showToast(error.message || 'Could not schedule the campaign', 'error');
        } finally {
            setLoading(false);
        }
    };

    const cancelCampaign = async (campaign: Campaign) => {
        setLoading(true);
        try {
            const response = await apiFetch(`${API_URL}/api/platform/campaigns/${campaign.id}/cancel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: '{}',
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.detail || 'Could not cancel the campaign');
            showToast('Campaign cancelled. The original scheduling charge was not refunded.', 'info');
            await fetchCampaigns();
        } catch (error: any) {
            showToast(error.message || 'Could not cancel the campaign', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="page active">
            <div className="page-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <h2 style={{ margin: 0 }}>Content Studio</h2>
                        <button className="btn btn-ghost btn-sm" onClick={() => month === 0 ? (setMonth(11), setYear(year - 1)) : setMonth(month - 1)}>&lt;</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => month === 11 ? (setMonth(0), setYear(year + 1)) : setMonth(month + 1)}>&gt;</button>
                    </div>
                    <p>{monthStart.toLocaleString('default', { month: 'long', year: 'numeric' })} · campaigns across all selected locations</p>
                </div>
                <button className="btn btn-green btn-sm" onClick={() => openComposer()}>+ New campaign</button>
            </div>

            <div className="card glass" style={{ padding: 18 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6, fontSize: 11, color: 'rgba(255,255,255,.4)', textAlign: 'center', marginBottom: 8 }}>
                    {'Sun Mon Tue Wed Thu Fri Sat'.split(' ').map(day => <span key={day}>{day}</span>)}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6 }}>
                    {Array.from({ length: firstDay }).map((_, index) => <div key={`empty-${index}`} />)}
                    {Array.from({ length: daysInMonth }).map((_, index) => {
                        const day = index + 1;
                        return <button key={day} className="card-sm" onClick={() => setSelectedDay(day)} style={{ minHeight: 76, textAlign: 'left', cursor: 'pointer', background: 'rgba(255,255,255,.02)', border: selectedDay === day ? '1px solid rgba(59,130,246,.6)' : '1px solid rgba(255,255,255,.06)', color: 'inherit' }}>
                            <span style={{ fontSize: 12 }}>{day}</span>
                            <div style={{ display: 'flex', gap: 4, marginTop: 10, flexWrap: 'wrap' }}>
                                {(campaignsByDay[day] || []).slice(0, 5).map(item => <span key={item.id} title={`${item.title}: ${item.status}`} style={{ width: 7, height: 7, borderRadius: 9, background: STATUS_COLORS[item.status] || '#94a3b8' }} />)}
                            </div>
                        </button>;
                    })}
                </div>
            </div>

            {selectedDay && <div className="card glass" style={{ marginTop: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3>{monthStart.toLocaleString('default', { month: 'long' })} {selectedDay}</h3>
                    <button className="btn btn-ghost btn-sm" onClick={() => openComposer(selectedDay)}>+ Add campaign</button>
                </div>
                {(campaignsByDay[selectedDay] || []).map(campaign => <div key={campaign.id} className="card-sm" style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                    <div><strong>{campaign.title}</strong><div style={{ fontSize: 12, color: 'rgba(255,255,255,.55)', marginTop: 4 }}>{campaign.topic_type} · {campaign.locations.length} location{campaign.locations.length === 1 ? '' : 's'} · <span style={{ color: STATUS_COLORS[campaign.status] }}>{campaign.status.replaceAll('_', ' ')}</span></div></div>
                    {['draft', 'awaiting_approval', 'scheduled'].includes(campaign.status) && <button className="btn btn-red-ghost btn-sm" disabled={loading} onClick={() => cancelCampaign(campaign)}>Cancel</button>}
                </div>)}
                {!(campaignsByDay[selectedDay] || []).length && <p style={{ color: 'rgba(255,255,255,.45)' }}>No campaigns scheduled for this day.</p>}
            </div>}

            {composerOpen && <div style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(0,0,0,.72)', overflowY: 'auto', padding: 24 }}>
                <div className="card glass" style={{ maxWidth: 680, margin: '30px auto' }}>
                    <h3>Schedule a content campaign</h3>
                    <p style={{ color: 'var(--orange-soft)', fontWeight: 700 }}>{locationIds.length * 5} credits for {locationIds.length} selected location{locationIds.length === 1 ? '' : 's'}</p>
                    <label className="field-label">Campaign title</label><input value={title} onChange={e => setTitle(e.target.value)} placeholder="Diwali admissions offer" />
                    <label className="field-label">Google post type</label><select className="input" value={topicType} onChange={e => setTopicType(e.target.value as any)}><option value="STANDARD">Update</option><option value="EVENT">Event</option><option value="OFFER">Offer</option></select>
                    <label className="field-label">Post text</label><textarea rows={4} value={summary} onChange={e => setSummary(e.target.value)} placeholder="Write the message customers will see on Google…" />
                    <label className="field-label">Business locations</label>
                    <div style={{ display: 'grid', gap: 8, marginBottom: 14 }}>{liveLocations.map(location => <label key={location.id} className="card-sm" style={{ display: 'flex', gap: 10, alignItems: 'center', cursor: 'pointer' }}><input type="checkbox" checked={locationIds.includes(location.id)} onChange={() => toggleLocation(location.id)} /> <span>{location.name}</span></label>)}</div>
                    <label className="field-label">Publish date and time ({timezone})</label><input type="datetime-local" value={publishLocal} onChange={e => setPublishLocal(e.target.value)} />
                    {topicType !== 'STANDARD' && <><label className="field-label">{topicType === 'OFFER' ? 'Offer' : 'Event'} title</label><input value={eventTitle} onChange={e => setEventTitle(e.target.value)} /><label className="field-label">End date and time</label><input type="datetime-local" value={eventEndLocal} onChange={e => setEventEndLocal(e.target.value)} /></>}
                    {topicType === 'OFFER' && <><label className="field-label">Coupon code (optional)</label><input value={couponCode} onChange={e => setCouponCode(e.target.value)} /><label className="field-label">Terms (optional)</label><textarea rows={2} value={terms} onChange={e => setTerms(e.target.value)} /></>}
                    <label className="field-label">Call to action</label><div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 10 }}><select className="input" value={ctaType} onChange={e => setCtaType(e.target.value)}><option>LEARN_MORE</option><option>BOOK</option><option>SIGN_UP</option><option>ORDER</option><option>SHOP</option></select><input type="url" value={ctaUrl} onChange={e => setCtaUrl(e.target.value)} placeholder="https://example.com" /></div>
                    <label className="field-label">Photo (optional)</label><input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} />
                    <div style={{ display: 'flex', gap: 10, marginTop: 22 }}><button className="btn btn-ghost btn-block" disabled={loading} onClick={() => setComposerOpen(false)}>Keep editing later</button><button className="btn btn-green btn-block" disabled={loading} onClick={createAndSchedule}>{loading ? 'Scheduling…' : `Schedule campaign · ${locationIds.length * 5} credits`}</button></div>
                </div>
            </div>}
        </section>
    );
}
