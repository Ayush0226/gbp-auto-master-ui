import { LegalLayout } from './design/PublicPages';

export default function Privacy() {
    return <LegalLayout title="Privacy policy">
                        <h2>1. Information We Collect</h2>
                        <p>
                            We collect information from you when you register on our site or securely connect your Google Business Profile via OAuth. This includes your name, email address, profile picture, and Google location data necessary to perform our automation services.
                        </p>

                        <h2>2. How We Use Your Information</h2>
                        <p>
                            Any of the information we collect from you may be used to personalize your experience, improve our website, process transactions securely via Razorpay, and provide the AI automation services (e.g. replying to reviews on your behalf).
                        </p>

                        <h2>3. Google API Services Usage Disclosure</h2>
                        <p>
                            GBP Auto Master's use and transfer to any other app of information received from Google APIs will adhere to the <a href="https://developers.google.com/terms/api-services-user-data-policy#additional_requirements_for_specific_api_scopes" target="_blank" rel="noreferrer" style={{ color: 'var(--blue-soft)', textDecoration: 'underline' }}>Google API Services User Data Policy</a>, including the Limited Use requirements.
                        </p>
                        <ul style={{ paddingLeft: '20px', listStyleType: 'disc' }}>
                            <li style={{ marginBottom: '8px' }}>We do not use Google Workspace APIs to develop, improve, or train generalized AI and/or ML models.</li>
                            <li>We only request access to the specific data (e.g., your Google Business Profile reviews and metrics) required to provide our service.</li>
                        </ul>

                        <h2>4. Third-Party AI Data Processors</h2>
                        <p>
                            To provide you with intelligent automated review replies and SEO insights, we securely transmit specific public business data (such as review text and search query metrics) to our third-party Artificial Intelligence partners (including Groq). We never sell your data to advertisers, and we do not transmit sensitive Personally Identifiable Information (PII) beyond what is strictly necessary to generate AI responses for your business.
                        </p>

                        <h2>5. Data Protection and Security</h2>
                        <p>
                            We implement a variety of security measures including secure OAuth 2.0 flows and encrypted database storage to maintain the safety of your personal information. 
                        </p>

                        <h2>6. Local Rank Reports</h2>
                        <p>
                            When you request a local rank report, we send the keyword and business search area to SerpApi to retrieve Google local search results. We use the connected business name and Google Place ID, when available, to identify its measured position. Google OAuth credentials are not sent to SerpApi.
                        </p>

                        <h2>7. Data Requests and Deletion</h2>
                        <p>
                            You may request access, correction, or deletion of your GBP Auto Master account data by contacting support@gbpautomaster.in. We verify account ownership before completing a request and retain records only as required for security, billing, dispute resolution, and legal obligations.
                        </p>
                        <p><b>To disconnect Google:</b> open your Google Account’s third-party connections, select GBP Auto Master, and remove access. This stops new Google Business Profile access but does not itself delete your GBP Auto Master account.</p>
                        <p><b>To delete your account and stored data:</b> email <a href="mailto:support@gbpautomaster.in?subject=GBP%20Auto%20Master%20account%20deletion" style={{ color: 'var(--blue-soft)', textDecoration: 'underline' }}>support@gbpautomaster.in</a> from the address used for your account with the subject “GBP Auto Master account deletion”. We will verify ownership, cancel pending automation, and confirm when deletion is complete.</p>

                        <h2>8. Contact Us</h2>
                        <p>
                            If there are any questions regarding this privacy policy, you may contact us using the information below:
                        </p>
                        <ul style={{ paddingLeft: '20px', listStyleType: 'none' }}>
                            <li>Owner: <b>Ayush Sony</b></li>
                            <li>Email: <b>ayushsony126@gmail.com</b></li>
                            <li>Phone: <b>+91 93720 60163</b></li>
                        </ul>
    </LegalLayout>;
}
