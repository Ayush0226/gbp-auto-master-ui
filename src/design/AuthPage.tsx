import { useState } from 'react';
import { supabase } from '../lib/supabase';
import SiteShell, { usePageMeta } from './SiteShell';
import Icon from './Icon';
import { trackEvent } from './analytics';

export function GoogleBusinessConnectButton({ label = 'Connect Google Business Profile' }: { label?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function connect() {
    setBusy(true); setError('');
    sessionStorage.setItem('gbp_connection_started', 'true');
    trackEvent('google_connection_started');
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: 'https://www.googleapis.com/auth/business.manage',
        queryParams: { access_type: 'offline', prompt: 'consent' },
        redirectTo: `${window.location.origin}/onboarding`,
      },
    });
    if (authError) { setError('Google connection could not start. Please try again.'); setBusy(false); }
  }
  return <div className="st-auth-action"><button className="st-button st-button-green" disabled={busy} onClick={connect}>{busy ? 'Opening Google…' : label}<Icon name="arrowUp" size={16}/></button>{error&&<p role="alert" className="st-error">{error}</p>}</div>;
}

export default function AuthPage() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  usePageMeta('Create your account', 'Create a GBP Auto Master account, then connect Google Business Profile in a separate, clearly explained step.', { noIndex: true, path: '/signup' });
  async function signIn() {
    setBusy(true); setError(''); trackEvent('signup_started', { provider: 'google' });
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard-v2` },
    });
    if (authError) { setError('Sign-in could not start. Please try again.'); setBusy(false); }
  }
  return <SiteShell title="Create your account" description="Create your GBP Auto Master account before choosing whether to connect Google Business Profile." noIndex path="/signup">
    <div className="st-container st-auth-page">
      <section><span className="st-eyebrow">ACCOUNT FIRST. CONNECTION SECOND.</span><h1>Start free.<br/><em>Connect when you’re ready.</em></h1><p>Create your GBP Auto Master account with Google. On the next screen, we explain the separate Business Profile permission before you approve it.</p><button className="st-button st-button-green" onClick={signIn} disabled={busy}>{busy?'Opening secure sign-in…':'Continue with Google'}<Icon name="arrowUp" size={17}/></button>{error&&<p role="alert" className="st-error">{error}</p>}<small>Creating an account does not publish, reply to reviews, or manage a business profile.</small></section>
      <aside><span className="st-pill">WHAT HAPPENS NEXT</span>{[
        ['1','Create your account','Basic name and email for your GBP Auto Master account.'],
        ['2','Review Google access','See why Business Profile permission is needed before connecting.'],
        ['3','Choose your locations','Only profiles managed by the approved Google account can appear.'],
        ['4','Approve every paid action','Drafts are free to review. Costs are shown before publishing.'],
      ].map(([n,title,text])=><div key={n}><b>{n}</b><span><strong>{title}</strong><small>{text}</small></span></div>)}</aside>
    </div>
  </SiteShell>;
}
