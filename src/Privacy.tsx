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

            <section className="home-section" style={{ paddingTop: '60px', paddingBottom: '60px' }}>
                <div className="home-wrap" style={{ maxWidth: '800px' }}>
                    <div className="card glass">
                        <h1 className="home-grad-metal" style={{ fontSize: '32px', marginBottom: '24px' }}>Privacy Policy</h1>
                        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,.7)', marginBottom: '32px' }}>Last Updated: {new Date().toLocaleDateString()}</p>

                        <h2 style={{ fontSize: '20px', marginBottom: '12px', color: 'var(--blue-soft)' }}>1. Information We Collect</h2>
                        <p style={{ fontSize: '15px', lineHeight: 1.6, marginBottom: '24px' }}>
                            We collect information from you when you register on our site or securely connect your Google Business Profile via OAuth. This includes your name, email address, profile picture, and Google location data necessary to perform our automation services.
                        </p>

                        <h2 style={{ fontSize: '20px', marginBottom: '12px', color: 'var(--blue-soft)' }}>2. How We Use Your Information</h2>
                        <p style={{ fontSize: '15px', lineHeight: 1.6, marginBottom: '24px' }}>
                            Any of the information we collect from you may be used to personalize your experience, improve our website, process transactions securely via Razorpay, and provide the AI automation services (e.g. replying to reviews on your behalf).
                        </p>

                        <h2 style={{ fontSize: '20px', marginBottom: '12px', color: 'var(--blue-soft)' }}>3. Google API Services Usage Disclosure</h2>
                        <p style={{ fontSize: '15px', lineHeight: 1.6, marginBottom: '12px' }}>
                            GBP Auto Master's use and transfer to any other app of information received from Google APIs will adhere to the <a href="https://developers.google.com/terms/api-services-user-data-policy#additional_requirements_for_specific_api_scopes" target="_blank" rel="noreferrer" style={{ color: 'var(--blue-soft)', textDecoration: 'underline' }}>Google API Services User Data Policy</a>, including the Limited Use requirements.
                        </p>
                        <ul style={{ fontSize: '15px', lineHeight: 1.6, paddingLeft: '20px', marginBottom: '24px', color: 'rgba(255,255,255,.8)' }}>
                            <li style={{ marginBottom: '8px' }}>We do not use Google Workspace APIs to develop, improve, or train generalized AI and/or ML models.</li>
                            <li>We only request access to the specific data (e.g., your Google Business Profile reviews and metrics) required to provide our service.</li>
                        </ul>

                        <h2 style={{ fontSize: '20px', marginBottom: '12px', color: 'var(--blue-soft)' }}>4. Third-Party AI Data Processors</h2>
                        <p style={{ fontSize: '15px', lineHeight: 1.6, marginBottom: '24px' }}>
                            To provide you with intelligent automated review replies and SEO insights, we securely transmit specific public business data (such as review text and search query metrics) to our third-party Artificial Intelligence partners (including Groq). We never sell your data to advertisers, and we do not transmit sensitive Personally Identifiable Information (PII) beyond what is strictly necessary to generate AI responses for your business.
                        </p>

                        <h2 style={{ fontSize: '20px', marginBottom: '12px', color: 'var(--blue-soft)' }}>5. Data Protection and Security</h2>
                        <p style={{ fontSize: '15px', lineHeight: 1.6, marginBottom: '24px' }}>
                            We implement a variety of security measures including secure OAuth 2.0 flows and encrypted database storage to maintain the safety of your personal information. 
                        </p>

                        <h2 style={{ fontSize: '20px', marginBottom: '12px', color: 'var(--blue-soft)' }}>6. Contact Us</h2>
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
