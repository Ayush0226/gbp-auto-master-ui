import { apiFetch } from './lib/api';
import { useCallback, useEffect, useState } from 'react';

export default function ReviewManager({ 
    liveReviews, 
    setLiveReviews, 
    loadingReviews, 
    syncingReviews, 
    providerToken, 
    user, 
    activeLocationId, 
    handleSyncReviews,
    onReviewsChanged,
    refreshTokens,
    showToast 
}: any) {
    const API_URL = import.meta.env.VITE_API_URL || 'https://gbp-auto-master-backend-us.onrender.com';
    const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
    const [editReplyText, setEditReplyText] = useState('');
    const [savingReplyId, setSavingReplyId] = useState<string | null>(null);
    const [replyJobs, setReplyJobs] = useState<any[]>([]);

    const fetchReplyJobs = useCallback(async () => {
        try {
            const response = await apiFetch(`${API_URL}/api/platform/review-jobs?limit=50`);
            if (response.ok) {
                const data = await response.json();
                setReplyJobs((data.jobs || []).filter((job: any) => !activeLocationId || job.location_id === activeLocationId));
            }
        } catch (error) {
            console.error('Could not load review reply queue', error);
        }
    }, [API_URL, activeLocationId]);

    useEffect(() => { fetchReplyJobs(); }, [fetchReplyJobs]);

    const updateReplyJob = async (jobId: string, action: 'approve' | 'cancel') => {
        try {
            const response = await apiFetch(`${API_URL}/api/platform/review-jobs/${jobId}/${action}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: action === 'approve' ? JSON.stringify({ publish_at: null }) : '{}',
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.detail || `Could not ${action} reply`);
            showToast(action === 'approve' ? 'Reply approved. Publishing costs 2.5 credits.' : 'Reply cancelled.', 'success');
            fetchReplyJobs();
            refreshTokens?.();
        } catch (error: any) {
            showToast(error.message || `Could not ${action} reply`, 'error');
        }
    };

    const handlePostManualReply = async (reviewId: string, replyText: string) => {
        if (!replyText.trim()) {
            showToast("Reply cannot be empty", "error");
            return;
        }
        setSavingReplyId(reviewId);
        try {
            const res = await apiFetch(`${API_URL}/api/google/post-reply`, {
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
                setLiveReviews((prev: any) => prev.map((r: any) => r.id === reviewId ? { ...r, has_reply: true, reply_comment: replyText } : r));
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

    const handleDeleteReply = async (reviewId: string) => {
        const confirmed = window.confirm("Are you sure you want to delete this reply? The AI will generate a new SEO-optimized reply on the next sync.");
        if (!confirmed) return;
        
        setSavingReplyId(reviewId);
        try {
            const res = await apiFetch(`${API_URL}/api/google/delete-reply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider_token: providerToken,
                    review_id: reviewId
                })
            });
            const data = await res.json();
            if (data.status === 'success') {
                showToast("Reply deleted successfully!", "success");
                setLiveReviews((prev: any) => prev.map((r: any) => r.id === reviewId ? { ...r, has_reply: false, reply_comment: '' } : r));
                setEditingReviewId(null);
            } else {
                showToast("Failed to delete: " + data.message, "error");
            }
        } catch (e: any) {
            showToast("Network Error: " + e.message, "error");
        } finally {
            setSavingReplyId(null);
        }
    };

    const handleBatchReply = async (count: number) => {
        showToast(`Triggering reply to ${count} reviews...`, "info");
        try {
            const res = await apiFetch(`${API_URL}/api/reviews/batch-reply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user?.id,
                    location_id: activeLocationId,
                    account_id: '', // Backend resolves the verified Google account.
                    access_token: providerToken,
                    count
                })
            });
            if (res.ok) {
                const data = await res.json();
                const sent = data.replied?.filter((reply: any) => reply.status === "published").length || 0;
                showToast(`${sent} replies published.`, sent ? "success" : "info");
                onReviewsChanged?.(); refreshTokens?.();
            } else {
                showToast("Failed to batch reply.", "error");
            }
        } catch (e: any) {
            showToast("Network Error: " + e.message, "error");
        }
    };

    const handleRegenerateReply = async (reviewId: string, reviewText: string, starRating: string) => {
        setSavingReplyId(reviewId);
        try {
            const res = await apiFetch(`${API_URL}/api/reviews/regenerate-reply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user?.id,
                    review_name: reviewId,
                    review_text: reviewText || '',
                    star_rating: starRating || 'FIVE',
                    location_id: activeLocationId,
                    access_token: providerToken
                })
            });
            if (res.ok) {
                showToast("Reply regenerated!", "success");
                onReviewsChanged?.(); refreshTokens?.();
            } else {
                showToast("Failed to regenerate reply", "error");
            }
        } catch (e: any) {
            showToast("Network Error: " + e.message, "error");
        } finally {
            setSavingReplyId(null);
        }
    };

    return (
        <div className="card glass">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                    <h3 style={{ fontSize: '15px', margin: 0 }}>Google Review Manager</h3>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,.5)', margin: '4px 0 0' }}>The AI replies automatically. You can also manually push replies.</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                        className="btn btn-ghost btn-sm" 
                        onClick={() => handleBatchReply(5)}
                    >
                        Reply to 5 Reviews
                    </button>
                    <button 
                        className="btn btn-ghost btn-sm" 
                        onClick={() => handleBatchReply(25)}
                    >
                        Reply to All Unreplied (Max 25)
                    </button>
                    <button 
                        className="btn btn-green btn-sm" 
                        onClick={handleSyncReviews}
                        disabled={syncingReviews || loadingReviews}
                    >
                        {syncingReviews ? 'Syncing...' : 'Sync Reviews'}
                    </button>
                </div>
            </div>

            {replyJobs.some(job => ['draft', 'pending_approval', 'scheduled', 'failed'].includes(job.status)) && (
                <div className="card-sm" style={{ marginBottom: '16px', background: 'rgba(66,133,244,.06)', border: '1px solid rgba(66,133,244,.25)' }}>
                    <h3 style={{ fontSize: '14px', margin: '0 0 10px' }}>AI reply queue</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {replyJobs.filter(job => ['draft', 'pending_approval', 'scheduled', 'failed'].includes(job.status)).map(job => (
                            <div key={job.id} style={{ padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,.03)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                                    <strong style={{ fontSize: '12px' }}>{job.rating}/5 review · {job.status.replace('_', ' ')}</strong>
                                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,.5)' }}>{job.scheduled_for ? new Date(job.scheduled_for).toLocaleString() : 'Not scheduled'}</span>
                                </div>
                                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,.65)', margin: '7px 0' }}>{job.review_text || 'Rating without a written comment'}</p>
                                <p style={{ fontSize: '13px', margin: '7px 0' }}>{job.draft_text}</p>
                                {job.last_error && <p style={{ fontSize: '11px', color: '#fca5a5' }}>{job.last_error}</p>}
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {['draft', 'pending_approval', 'failed'].includes(job.status) && (
                                        <button className="btn btn-green btn-sm" onClick={() => updateReplyJob(job.id, 'approve')}>Approve · 2.5 credits</button>
                                    )}
                                    <button className="btn btn-ghost btn-sm" onClick={() => updateReplyJob(job.id, 'cancel')}>Cancel</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {loadingReviews ? (
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,.5)' }}>Loading your real Google Reviews...</p>
                ) : !liveReviews || liveReviews.length === 0 ? (
                    <div className="card-sm" style={{ background: 'rgba(255,255,255,.03)', border: '1px dashed rgba(255,255,255,.2)', textAlign: 'center', padding: '32px 20px' }}>
                        <p style={{ fontWeight: 600, fontSize: '14px', margin: '0 0 6px' }}>No reviews found for this location.</p>
                        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,.5)', margin: 0 }}>Once customers leave reviews, they will appear here.</p>
                    </div>
                ) : (
                    liveReviews.slice(0, 12).map((rev: any, i: number) => (
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
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <p style={{ fontSize: '11px', color: 'var(--green-soft)', margin: '0 0 4px', fontWeight: 'bold' }}>Our Reply:</p>
                                        <button 
                                            className="btn btn-ghost btn-sm" 
                                            style={{ padding: '2px 8px', fontSize: '10px' }}
                                            onClick={() => handleRegenerateReply(rev.id, rev.comment, rev.rating)}
                                            disabled={savingReplyId === rev.id}
                                        >
                                            {savingReplyId === rev.id ? '...' : '🔄 Regenerate'}
                                        </button>
                                    </div>
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
                                        <>
                                            {rev.has_reply && (
                                                <button 
                                                    className="btn btn-ghost btn-sm" 
                                                    style={{ padding: '2px 8px', fontSize: '10px', color: 'var(--red-soft)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                                                    onClick={() => handleDeleteReply(rev.id)}
                                                    disabled={savingReplyId === rev.id}
                                                >
                                                    {savingReplyId === rev.id ? '...' : '🗑️ Delete Reply'}
                                                </button>
                                            )}
                                            <button 
                                                className="btn btn-ghost btn-sm" 
                                                style={{ padding: '2px 8px', fontSize: '10px' }}
                                                onClick={() => {
                                                    setEditingReviewId(rev.id);
                                                    setEditReplyText(rev.reply_comment || '');
                                                }}
                                            >
                                                ✎ {rev.has_reply ? 'Edit Reply' : 'Add Reply'}
                                            </button>
                                        </>
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
    );
}
