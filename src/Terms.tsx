export default function Terms() {
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
                        <h1 className="home-grad-metal">Terms & Conditions</h1>
                        <p style={{ color: 'rgba(255,255,255,.5)' }}>Last Updated: {new Date().toLocaleDateString()}</p>

                        <h2>1. Introduction</h2>
                        <p>
                            Welcome to GBP Auto Master. By accessing our website and using our AI automation services, you agree to comply with and be bound by these terms and conditions, our Privacy Policy, and our Cancellation & Refund Policy.
                        </p>

                        <h2>2. Services Provided and AI Usage</h2>
                        <p>
                            We provide automated management of Google Business Profiles using artificial intelligence. While our AI is designed to be highly accurate, we do not guarantee the perfection of AI-generated content (such as review replies or SEO insights). You agree that GBP Auto Master is not liable for any business losses, reputational damage, or account suspensions resulting from the use of our automated AI tools.
                        </p>

                        <h2>3. User Responsibilities</h2>
                        <p>
                            By connecting your Google account via OAuth, you grant us permission to act on your behalf to manage your profile data. You represent that you are the authorized owner or manager of the connected business profile.
                        </p>

                        <h2>4. Billing and Subscriptions</h2>
                        <p>
                            Subscriptions auto-renew unless cancelled prior to the renewal date. All payments are processed securely via Razorpay. As outlined in our Cancellation & Refund Policy, all subscription sales are final and non-refundable due to the immediate costs associated with AI processing.
                        </p>

                        <h2>5. Contact Information</h2>
                        <p>
                            If you have any questions about these Terms, please contact us:
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
