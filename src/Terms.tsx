import { LegalLayout } from './design/PublicPages';

export default function Terms() {
    return <LegalLayout title="Terms of service">
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
                            Current plans are prepaid and do not renew automatically. Before payment, checkout shows the price, included credits, duration, and any applicable taxes. Payments are processed securely via Razorpay. Refund eligibility is governed by our Cancellation & Refund Policy.
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
    </LegalLayout>;
}
