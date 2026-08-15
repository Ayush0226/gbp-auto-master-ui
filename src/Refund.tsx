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

            <section className="home-section" style={{ paddingTop: '60px', paddingBottom: '60px' }}>
                <div className="legal-container">
                    <div className="legal-card">
                        <h1 className="home-grad-metal">Cancellation & Refund Policy</h1>
                        <p style={{ color: 'rgba(255,255,255,.5)' }}>Last Updated: {new Date().toLocaleDateString()}</p>

                        <h2>1. Subscription Cancellations</h2>
                        <p>
                            You may cancel your GBP Auto Master subscription at any time directly from your dashboard or by contacting support. Your cancellation will take effect at the end of your current paid billing cycle. You will not be billed again, and you will continue to have access to our AI automation services until the end of your prepaid period.
                        </p>

                        <h2>2. No Refunds</h2>
                        <p>
                            Because our software incurs immediate costs for AI API generation (Groq) and server usage upon account activation, <strong>all subscription sales are final and non-refundable</strong>. 
                            <br/><br/>
                            We do not provide prorated refunds for mid-cycle cancellations, nor do we issue refunds if you simply forget to cancel your subscription prior to the auto-renewal date. 
                        </p>

                        <h2>3. Chargebacks and Payment Disputes</h2>
                        <p>
                            If you initiate a chargeback or dispute with your bank or credit card company without first attempting to resolve the issue with our support team, we reserve the right to immediately suspend your account and contest the chargeback by providing this mutually agreed-upon policy to the payment gateway (Razorpay) and the issuing bank.
                        </p>

                        <h2>4. Contact Us</h2>
                        <p>
                            If you need help cancelling your account, please reach out to us:
                        </p>
                        <ul style={{ paddingLeft: '20px', listStyleType: 'none' }}>
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
