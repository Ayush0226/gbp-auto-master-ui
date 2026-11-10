import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from './lib/api';
import AccessCodeForm from './AccessCodeForm';
import './SubscriptionPage.css';

export default function SubscriptionPage() {
  const [subscription, setSubscription] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const loadPlan = useCallback(async () => {
    try {
      const response = await apiFetch('/api/platform/overview');
      if (!response.ok) throw new Error('Could not load your current access.');
      const result = await response.json();
      setSubscription(result.subscription);
      setError('');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not load your current access.');
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { void loadPlan(); }, [loadPlan]);

  const lifetime = subscription?.is_lifetime && subscription?.status === 'active';
  const label = lifetime ? 'Yearly · Lifetime access' : subscription?.plan_type?.replace(/_/g, ' ') || 'Free';
  return <section className="page active access-page">
    <div className="page-head"><span className="workspace-kicker">YOUR ACCESS</span><h2>Plans & access</h2><p>Activate your launch code to unlock lifetime access to all current GBP Master features.</p></div>
    {error && <div role="alert" className="access-load-error"><p>{error}</p><button className="btn btn-ghost" onClick={loadPlan}>Try again</button></div>}
    <div className="access-layout">
    <div className="access-main">
    <div className="card glass access-summary-card" aria-busy={loading}>
      <span className="access-status">{loading ? 'Checking access' : lifetime ? 'Lifetime active' : 'Current plan'}</span>
      <h3>{loading ? 'Loading your plan…' : label}</h3>
      {lifetime ? <><p>No expiry date. No renewal payment.</p><p>Unlimited app usage, connected locations and SEO keywords across all currently supported features.</p></> : <p>{subscription?.expires_at ? `Current access until ${new Date(subscription.expires_at).toLocaleDateString()}` : 'Your account is ready for an access code.'}</p>}
      <p className="access-payment-note">Payment checkout is temporarily paused.</p>
    </div>
    {!lifetime && <AccessCodeForm onActivated={loadPlan} />}
    </div>
    <aside className="card glass access-benefits"><h3>Included with lifetime access</h3><ul><li>Review drafts, replies and automation</li><li>Content scheduling and campaigns across connected locations</li><li>Analytics, local rank reports and PDF downloads</li><li>Competitor insights, SEO keywords and planning tools</li><li>Media library and supported MCP connections</li></ul><p>Google permissions, provider availability and your chosen publishing rules still apply.</p></aside>
    </div>
  </section>;
}
