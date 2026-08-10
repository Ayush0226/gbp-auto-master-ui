export default function Privacy() {
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
                        <h1 className="home-grad-metal" style={{ fontSize: '32px', marginBottom: '24px' }}>Privacy Policy</h1>
                        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,.7)', marginBottom: '32px' }}>Last Updated: {new Date().toLocaleDateString()}</p>

                        <h2 style={{ fontSize: '20px', marginBottom: '12px', color: 'var(--blue-soft)' }}>1. Information We Collect</h2>
                        <p style={{ fontSize: '15px', lineHeight: 1.6, marginBottom: '24px' }}>
                            We collect information from you when you register on our site or connect your Google Business Profile. This includes your name, email address, profile picture, and Google location data necessary to perform our automation services.
                        </p>

                        <h2 style={{ fontSize: '20px', marginBottom: '12px', color: 'var(--blue-soft)' }}>2. How We Use Your Information</h2>
                        <p style={{ fontSize: '15px', lineHeight: 1.6, marginBottom: '24px' }}>
                            Any of the information we collect from you may be used to personalize your experience, improve our website, process transactions securely via Razorpay, and provide the AI automation services (e.g. replying to reviews on your behalf).
                        </p>

                        <h2 style={{ fontSize: '20px', marginBottom: '12px', color: 'var(--blue-soft)' }}>3. Data Protection and Security</h2>
                        <p style={{ fontSize: '15px', lineHeight: 1.6, marginBottom: '24px' }}>
                            We implement a variety of security measures including secure OAuth 2.0 flows and encrypted database storage to maintain the safety of your personal information. We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties.
                        </p>

                        <h2 style={{ fontSize: '20px', marginBottom: '12px', color: 'var(--blue-soft)' }}>4. Contact Us</h2>
                        <p style={{ fontSize: '15px', lineHeight: 1.6, marginBottom: '8px' }}>
                            If there are any questions regarding this privacy policy, you may contact us using the information below:
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
