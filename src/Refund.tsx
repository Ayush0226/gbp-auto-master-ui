export default function Refund() {
    return (
        <div className="app-shell" style={{ overflowY: 'auto' }}>
            <div className="noise"></div>
            
            <header className="home-topbar" style={{ position: 'relative', top: 0 }}>
                <div className="home-logo">GBP Auto <span className="grad-blue">Master</span></div>
                <nav>
                    <a href="/" className="home-btn-secondary home-glass">← Back to Home</a>
                </nav>
            </header>

            <section className="home-section" style={{ paddingTop: '60px' }}>
                <div className="home-wrap" style={{ maxWidth: '800px' }}>
                    <div className="card glass">
                        <h1 className="home-grad-metal" style={{ fontSize: '32px', marginBottom: '24px' }}>Cancellation & Refund Policy</h1>
                        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,.7)', marginBottom: '32px' }}>Last Updated: {new Date().toLocaleDateString()}</p>

                        <h2 style={{ fontSize: '20px', marginBottom: '12px', color: 'var(--blue-soft)' }}>1. Cancellations</h2>
                        <p style={{ fontSize: '15px', lineHeight: 1.6, marginBottom: '24px' }}>
                            You may cancel your subscription at any time. Cancellation will take effect at the end of your current billing cycle. You will continue to have access to the service until the end of your prepaid period.
                        </p>

                        <h2 style={{ fontSize: '20px', marginBottom: '12px', color: 'var(--blue-soft)' }}>2. Refunds</h2>
                        <p style={{ fontSize: '15px', lineHeight: 1.6, marginBottom: '24px' }}>
                            We offer a strict 7-day money-back guarantee for all new subscriptions. If you are unsatisfied with our service within the first 7 days of your initial purchase, you may request a full refund by contacting our support team.
                        </p>

                        <h2 style={{ fontSize: '20px', marginBottom: '12px', color: 'var(--blue-soft)' }}>3. Non-Refundable Items</h2>
                        <p style={{ fontSize: '15px', lineHeight: 1.6, marginBottom: '24px' }}>
                            After the initial 7-day period, all payments are non-refundable. We do not provide prorated refunds for mid-cycle cancellations.
                        </p>

                        <h2 style={{ fontSize: '20px', marginBottom: '12px', color: 'var(--blue-soft)' }}>4. How to Request a Refund</h2>
                        <p style={{ fontSize: '15px', lineHeight: 1.6, marginBottom: '8px' }}>
                            To request a refund within the eligible timeframe, please contact us with your account details:
                        </p>
                        <ul style={{ fontSize: '15px', lineHeight: 1.6, color: 'rgba(255,255,255,.8)', paddingLeft: '20px' }}>
                            <li>Owner: <b>Ayush Sony</b></li>
                            <li>Email: <b>ayushsony126@gmail.com</b></li>
                            <li>Phone: <b>+91 93720 60163</b></li>
                        </ul>
                    </div>
                </div>
            </section>
        </div>
    );
}
