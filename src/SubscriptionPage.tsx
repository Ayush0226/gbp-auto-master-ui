import React, { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'https://gbp-auto-master-backend-us.onrender.com';

interface SubscriptionPageProps {
    user: any;
    locationId: string;
    refreshTokens?: () => void;
}

export default function SubscriptionPage({ user, locationId, refreshTokens }: SubscriptionPageProps) {
    const [selectedPlan, setSelectedPlan] = useState<string>('monthly');
    const [discountApplied, setDiscountApplied] = useState<string>('none');
    const [promoCode, setPromoCode] = useState('');
    const [promoDiscount, setPromoDiscount] = useState<number>(0);
    const [adminPromo, setAdminPromo] = useState('');
    const [tokenBalance, setTokenBalance] = useState<number>(0);
    const [ledgerHistory, setLedgerHistory] = useState<any[]>([]);
    const [currentPlanData, setCurrentPlanData] = useState<any>(null);
    const [statusMsg, setStatusMsg] = useState<{ text: string, type: 'success' | 'error' | 'info' } | null>(null);

    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://checkout.js'; // Ensure correct URL
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
        return () => { document.body.removeChild(script); };
    }, []);

    const PRICING_PLANS: any = {
        free: { name: 'Free Forever', price: 0, tokens: 60, keywords: 2, competitor: false },
        monthly: { name: 'Monthly Starter', price: 600, tokens: 350, keywords: 5, competitor: false },
        half_yearly: { name: 'Half-Yearly Growth', price: 3200, tokens: 600, keywords: 10, competitor: true },
        yearly: { name: 'Yearly Domination', price: 6000, tokens: 750, keywords: 15, competitor: true },
    };

    const planTiers: any = {
        free: 0,
        monthly: 1,
        half_yearly: 2,
        yearly: 3
    };

    const currentTier = currentPlanData?.plan_type ? (planTiers[currentPlanData.plan_type] ?? -1) : -1;

    useEffect(() => {
        if (user && locationId) {
            fetchTokenBalance();
            fetchUserProfile();
        }
    }, [user, locationId]);

    const showStatus = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
        setStatusMsg({ text, type });
        setTimeout(() => setStatusMsg(null), 5000);
    };

    const fetchUserProfile = async () => {
        try {
            const res = await fetch(`${API_URL}/api/user/profile`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user.id })
            });
            if (res.ok) {
                const data = await res.json();
                setCurrentPlanData(data);
            }
        } catch (error) {
            console.error("Error fetching user profile", error);
        }
    };

    const fetchTokenBalance = async () => {
        if (!user) return;
        try {
            const res = await fetch(`${API_URL}/api/tokens/balance`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user.id })
            });
            if (res.ok) {
                const data = await res.json();
                setTokenBalance(data.balance || 0);
                setLedgerHistory(data.history || []);
                if (refreshTokens) refreshTokens();
            }
        } catch (error) {
            console.error("Error fetching token balance", error);
        }
    };

    const applyPromo = async () => {
        if (!promoCode) {
            setDiscountApplied('none');
            setPromoDiscount(0);
            return;
        }
        try {
            const res = await fetch(`${API_URL}/api/payment/validate-promo`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: promoCode, user_id: user?.id })
            });
            const data = await res.json();
            if (res.ok && data.valid) {
                setDiscountApplied(promoCode);
                setPromoDiscount(data.discount_percentage || 0);
                showStatus(`Promo code applied! ${data.discount_percentage}% discount.`, 'success');
            } else {
                setDiscountApplied('none');
                setPromoDiscount(0);
                showStatus('Invalid promo code', 'error');
            }
        } catch (error) {
            console.error('Error validating promo code:', error);
            showStatus('Failed to validate promo code', 'error');
        }
    };

    const handleCheckout = async (planId: string) => {
        try {
            const planPrice = PRICING_PLANS[planId]?.price || 0;
            const finalPrice = Math.max(0, planPrice * (1 - promoDiscount / 100));

            // 1. Create order on backend
            const orderRes = await fetch(`${API_URL}/api/payment/create-order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan_id: planId, promo_code: discountApplied !== 'none' ? discountApplied : '', user_id: user?.id })
            });
            const orderData = await orderRes.json();
            
            if (finalPrice === 0) {
                if (orderData.status === 'success' || (!orderData.order_id && orderData.status === 'success')) {
                    showStatus('Plan activated successfully!', 'success');
                    setTimeout(() => window.location.reload(), 1500);
                } else {
                    showStatus('Failed to activate free plan', 'error');
                }
                return;
            }

            if (!orderData.order_id) { showStatus('Failed to create order', 'error'); return; }

            // 2. Get Razorpay key
            const keyRes = await fetch(`${API_URL}/api/payment/key`);
            const keyData = await keyRes.json();

            // 3. Open Razorpay modal
            const options = {
                key: keyData.key,
                amount: orderData.amount,
                currency: 'INR',
                name: 'GBP Auto Master',
                description: `${PRICING_PLANS[planId]?.name} Plan`,
                order_id: orderData.order_id,
                handler: async (response: any) => {
                    // 4. Verify payment
                    const verifyRes = await fetch(`${API_URL}/api/payment/verify`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature,
                            user_id: user?.id,
                            location_id: locationId,
                            plan_id: planId
                        })
                    });
                    if (verifyRes.ok) {
                        showStatus('Payment successful! Plan upgraded.', 'success');
                        setTimeout(() => window.location.reload(), 1500);
                    }
                },
                prefill: { email: user?.email },
                theme: { color: '#2F6FFF' }
            };
            const rzp = new (window as any).Razorpay(options);
            rzp.open();
        } catch (e) {
            showStatus('Payment error: ' + e, 'error');
        }
    };

    const handleTopUp = async (packId: string, amount: number) => {
        try {
            const orderRes = await fetch(`${API_URL}/api/payment/create-topup-order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user?.id, pack_id: packId, promo_code: discountApplied !== 'none' ? discountApplied : '' })
            });
            const orderData = await orderRes.json();
            if (!orderData.order_id) { showStatus('Failed to create order', 'error'); return; }

            const keyRes = await fetch(`${API_URL}/api/payment/key`);
            const keyData = await keyRes.json();

            const options = {
                key: keyData.key,
                amount: orderData.amount,
                currency: 'INR',
                name: 'GBP Auto Master',
                description: 'Token Top-Up',
                order_id: orderData.order_id,
                handler: async (response: any) => {
                    const verifyRes = await fetch(`${API_URL}/api/payment/verify-topup`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature,
                            user_id: user?.id,
                            location_id: locationId,
                            pack_id: packId
                        })
                    });
                    if (verifyRes.ok) {
                        showStatus('Top-up successful!', 'success');
                        fetchTokenBalance();
                    }
                },
                prefill: { email: user?.email },
                theme: { color: '#2F6FFF' }
            };
            const rzp = new (window as any).Razorpay(options);
            rzp.open();
        } catch (e) {
            showStatus('Payment error: ' + e, 'error');
        }
    };

    const redeemAdminPromo = async () => {
        if (!adminPromo) return;
        try {
            const res = await fetch(`${API_URL}/api/tokens/redeem-promo`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user.id, location_id: locationId, promo_code: adminPromo })
            });
            if (res.ok) {
                showStatus('Promo code redeemed! Added 1000 tokens.', 'success');
                setAdminPromo('');
                fetchTokenBalance();
                if (refreshTokens) refreshTokens();
            } else {
                showStatus('Invalid promo code', 'error');
            }
        } catch (error) {
            showStatus('Failed to redeem code', 'error');
        }
    };

    return (
        <section className="page active">
            <div className="page-head">
                <h2>Subscription & Tokens</h2>
                <p>Manage your billing and AI tokens.</p>
            </div>

            {statusMsg && (
                <div style={{
                    padding: '12px 16px',
                    marginBottom: '16px',
                    borderRadius: '8px',
                    background: statusMsg.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : statusMsg.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                    border: `1px solid ${statusMsg.type === 'error' ? 'var(--red-soft)' : statusMsg.type === 'success' ? 'var(--green-soft)' : 'var(--blue-soft)'}`,
                    color: '#fff',
                    maxWidth: '700px'
                }}>
                    {statusMsg.text}
                </div>
            )}

            {currentPlanData && (
                <div className="card glass" style={{ maxWidth: '700px', margin: '0 0 32px 0', padding: '32px' }}>
                    <h3 style={{ fontSize: '20px', marginBottom: '16px' }}>Current Plan Details</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,.5)', margin: 0 }}>Plan</p>
                            <p style={{ fontWeight: 'bold' }}>{currentPlanData.plan_name || 'Free'}</p>
                        </div>
                        <div>
                            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,.5)', margin: 0 }}>Business</p>
                            <p style={{ fontWeight: 'bold' }}>{currentPlanData.business_name || 'N/A'}</p>
                        </div>
                        <div>
                            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,.5)', margin: 0 }}>User</p>
                            <p style={{ fontWeight: 'bold' }}>{currentPlanData.name || user?.email}</p>
                        </div>
                        <div>
                            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,.5)', margin: 0 }}>Max Keywords</p>
                            <p style={{ fontWeight: 'bold' }}>{currentPlanData.max_keywords || 0}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="card glass" style={{ maxWidth: '700px', margin: '0 0 32px 0', padding: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div>
                        <h3 style={{ fontSize: '20px', marginBottom: '4px' }}>Token Balance</h3>
                        <p style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--blue-soft)' }}>{tokenBalance} Tokens</p>
                    </div>
                </div>

                <div style={{ marginTop: '32px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '24px' }}>
                    <h4 style={{ marginBottom: '16px' }}>Top-Up Token Packs</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="card-sm" style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.05)' }}>
                            <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>Standard Top-Up</p>
                            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,.7)', marginBottom: '16px' }}>450 tokens for ₹500</p>
                            <button className="btn btn-sm btn-ghost" onClick={() => handleTopUp('standard', 500)}>Buy Now</button>
                        </div>
                        <div className="card-sm" style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.05)' }}>
                            <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>Bulk Top-Up</p>
                            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,.7)', marginBottom: '16px' }}>1000 tokens for ₹900</p>
                            <button className="btn btn-sm btn-ghost" onClick={() => handleTopUp('bulk', 900)}>Buy Now</button>
                        </div>
                    </div>
                </div>
                {ledgerHistory.length > 0 && (
                    <div style={{ marginTop: '24px' }}>
                        <h4 style={{ marginBottom: '12px' }}>Recent Token Activity</h4>
                        <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '8px', padding: '16px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 2fr', gap: '8px', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                                <span>Date</span>
                                <span>Action</span>
                                <span>Amount</span>
                                <span>Description</span>
                            </div>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                {ledgerHistory.map((item, index) => (
                                    <li key={index} style={{ padding: '8px 0', borderBottom: index < ledgerHistory.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 2fr', gap: '8px', alignItems: 'center', fontSize: '14px' }}>
                                        <span style={{ color: 'rgba(255,255,255,0.7)' }}>{new Date(item.created_at || Date.now()).toLocaleDateString()}</span>
                                        <span style={{ color: 'rgba(255,255,255,0.9)' }}>{item.action_type || '-'}</span>
                                        <span style={{ color: item.amount > 0 ? 'var(--green-soft)' : 'var(--red-soft)', fontWeight: 'bold' }}>{item.amount > 0 ? '+' : ''}{item.amount}</span>
                                        <span style={{ color: 'rgba(255,255,255,0.7)' }}>{item.description}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}
            </div>

            <div className="card glass" style={{ maxWidth: '700px', padding: '32px' }}>
                <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>Activate AI Engine</h3>
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
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
                    {Object.keys(PRICING_PLANS).map((key) => {
                        const tier = planTiers[key];
                        return (
                            <div key={key} className="card-sm glass glass-hover" onClick={() => setSelectedPlan(key)} style={{ cursor: 'pointer', border: selectedPlan === key ? '1px solid rgba(59,130,246,.4)' : '' }}>
                                <p style={{ fontSize: '12px', color: selectedPlan === key ? 'var(--blue-soft)' : 'rgba(255,255,255,.5)' }}>{PRICING_PLANS[key].name}</p>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '4px' }}>
                                    <p style={{ fontWeight: 700, fontSize: '20px', margin: 0 }}>₹{PRICING_PLANS[key].price}</p>
                                </div>
                                <div style={{ marginTop: '8px', fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>
                                    <div>{PRICING_PLANS[key].tokens} Tokens</div>
                                    <div>{PRICING_PLANS[key].keywords} Keywords</div>
                                    {PRICING_PLANS[key].competitor && <div>Competitor Tracking</div>}
                                </div>
                                {tier === currentTier ? (
                                    <div style={{ marginTop: '16px', padding: '6px 0', textAlign: 'center', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', color: 'var(--blue-soft)' }}>Current Plan</div>
                                ) : tier > currentTier ? (
                                    <button className="btn btn-sm btn-primary" style={{ marginTop: '16px', width: '100%' }} onClick={(e) => { e.stopPropagation(); handleCheckout(key); }}>Upgrade</button>
                                ) : null}
                            </div>
                        );
                    })}
                </div>

                <div style={{ marginTop: '20px' }}>
                    <label className="field-label">Promo code</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input type="text" className="input" placeholder="e.g. FIRSTUNDER10" value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())} />
                        <button className="btn btn-ghost btn-sm" onClick={applyPromo}>Apply</button>
                    </div>
                    {discountApplied !== 'none' && <p style={{ fontSize: '12px', marginTop: '8px', color: 'var(--green-soft)', fontWeight: 'bold' }}>✓ Discount Applied: {promoDiscount}% off</p>}
                </div>

                <div className="card-sm" style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,.5)', margin: 0 }}>Total payable</p>
                    </div>
                    <p style={{ fontSize: '26px', fontWeight: 800 }}>
                        ₹{Math.max(0, (PRICING_PLANS[selectedPlan]?.price || 0) * (1 - promoDiscount / 100)).toFixed(0)}
                    </p>
                </div>

                {selectedPlan !== 'free' && (
                    <button className="btn btn-green btn-block" style={{ marginTop: '18px' }} onClick={() => handleCheckout(selectedPlan)}>
                        {promoDiscount === 100 ? 'Activate Free Trial' : 'Pay with Razorpay'}
                    </button>
                )}
            </div>

            <div className="card glass" style={{ maxWidth: '700px', padding: '32px', marginTop: '24px' }}>
                <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>Redeem Promo Code</h3>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,.6)', marginBottom: '16px' }}>Have a special promo code? Redeem it here for extra tokens on this location.</p>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <input type="text" className="input" placeholder="Enter admin promo code" value={adminPromo} onChange={(e) => setAdminPromo(e.target.value)} />
                    <button className="btn btn-ghost" onClick={redeemAdminPromo}>Redeem</button>
                </div>
            </div>
        </section>
    );
}
