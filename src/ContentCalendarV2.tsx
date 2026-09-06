import React from 'react';

export default function ContentCalendarV2({
    currentMonth, setCurrentMonth, currentYear, setCurrentYear,
    selectedDate, setSelectedDate, scheduledPosts,
    isSchedulingNew, setIsSchedulingNew,
    postType, setPostType, file, setFile,
    postText, setPostText, handleSchedule,
    publishNow, cancelPost, firstDayOfMonth, daysInMonth,
    loadingAction
}: any) {
    return (
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
                        <h3 style={{ fontSize: '16px', marginBottom: '8px' }}>Schedule new post</h3>
                        <p style={{ fontSize: '13px', color: 'var(--orange-soft)', marginBottom: '16px', fontWeight: 'bold' }}>
                            ⚠️ Scheduling this post uses 5 tokens
                        </p>
                        
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
    );
}
