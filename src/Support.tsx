export default function Support() {
    return (
        <div className="app-shell" style={{ overflowY: 'auto' }}>
            <header className="home-topbar" style={{ position: 'relative', top: 0 }}>
                <div className="home-logo">GBP Auto <span className="grad-blue">Master</span></div>
                <nav><a href="/" className="home-btn-secondary home-glass">← Back to Home</a></nav>
            </header>
            <section className="home-section" style={{ paddingTop: 60, paddingBottom: 60 }}>
                <div className="legal-container"><div className="legal-card">
                    <h1 className="home-grad-metal">Support</h1>
                    <p>Get help with connecting Google Business Profile, credits, reviews, scheduled content, automation, and local rank reports.</p>
                    <h2>Contact</h2>
                    <p>Email <a href="mailto:support@gbpautomaster.in">support@gbpautomaster.in</a>. Include your account email, affected business location, and a short description of the issue. Never send Google access tokens, refresh tokens, passwords, or payment card details.</p>
                    <h2>Account and data requests</h2>
                    <p>Use the same support address for account deletion, data access, or correction requests. We will verify account ownership before acting.</p>
                    <h2>Service status</h2>
                    <p>If an automated action fails, retry only after checking its status in your dashboard to avoid creating duplicate public content.</p>
                </div></div>
            </section>
        </div>
    );
}
