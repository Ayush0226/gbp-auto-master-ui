import { useEffect, useMemo, useState } from 'react';
import { supabase } from './lib/supabase';
import './OAuthConsent.css';

type AuthorizationDetails = {
  authorization_id: string;
  redirect_uri: string;
  client: {
    id: string;
    name: string;
    uri: string;
  };
  user: {
    id: string;
    email: string;
  };
  scope: string;
};

const scopeDescriptions: Record<string, string> = {
  openid: 'Confirm your GBP Master account identity',
  email: 'See the email address connected to your account',
  profile: 'See your basic account profile',
  phone: 'See the phone number connected to your account',
  offline_access: 'Keep this approved connection active without asking you to sign in repeatedly',
};

export default function OAuthConsent() {
  const authorizationId = useMemo(
    () => new URLSearchParams(window.location.search).get('authorization_id'),
    [],
  );
  const [details, setDetails] = useState<AuthorizationDetails | null>(null);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadAuthorization() {
      if (!authorizationId) {
        setError('This connection request is missing its authorization ID. Start again from your AI app.');
        setSignedIn(false);
        return;
      }

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (!active) return;
      if (userError || !userData.user) {
        setSignedIn(false);
        return;
      }

      setSignedIn(true);
      const { data, error: detailsError } =
        await supabase.auth.oauth.getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (detailsError || !data) {
        setError(detailsError?.message || 'This connection request is invalid or has expired.');
        return;
      }

      if ('redirect_url' in data) {
        window.location.assign(data.redirect_url);
        return;
      }
      setDetails(data as AuthorizationDetails);
    }

    void loadAuthorization();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  const signIn = async () => {
    if (!authorizationId) return;
    setBusy(true);
    setError('');
    const returnUrl = new URL('/oauth/consent', window.location.origin);
    returnUrl.searchParams.set('authorization_id', authorizationId);
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: 'https://www.googleapis.com/auth/business.manage',
        queryParams: { access_type: 'offline', prompt: 'consent' },
        redirectTo: returnUrl.toString(),
      },
    });
    if (signInError) {
      setError(signInError.message);
      setBusy(false);
    }
  };

  const decide = async (decision: 'approve' | 'deny') => {
    if (!authorizationId) return;
    setBusy(true);
    setError('');
    const response = decision === 'approve'
      ? await supabase.auth.oauth.approveAuthorization(authorizationId, { skipBrowserRedirect: true })
      : await supabase.auth.oauth.denyAuthorization(authorizationId, { skipBrowserRedirect: true });

    if (response.error || !response.data?.redirect_url) {
      setError(response.error?.message || 'GBP Master could not complete this connection request.');
      setBusy(false);
      return;
    }
    window.location.assign(response.data.redirect_url);
  };

  const scopes = details?.scope.split(/\s+/).filter(Boolean) || [];
  const clientName = details?.client.name || 'AI application';

  return (
    <main className="oauth-consent-page">
      <section className="oauth-consent-card" aria-live="polite">
        <div className="oauth-brand">GBP Master</div>

        {error ? (
          <>
            <h1>Connection could not continue</h1>
            <p className="oauth-error">{error}</p>
            <a className="oauth-secondary-link" href="/">Return to GBP Auto Master</a>
          </>
        ) : signedIn === false ? (
          <>
            <h1>Sign in to connect GBP Master</h1>
            <p>Use the GBP Auto Master account that owns the business locations you want to manage.</p>
            <button className="oauth-primary" type="button" disabled={busy} onClick={signIn}>
              {busy ? 'Opening sign in…' : 'Continue with Google'}
            </button>
          </>
        ) : !details ? (
          <>
            <h1>Checking connection…</h1>
            <p>GBP Master is verifying this authorization request.</p>
          </>
        ) : (
          <>
            <h1>Connect {clientName}?</h1>
            <p>
              Signed in as <strong>{details.user.email}</strong>. This connection can use GBP Master
              for the business locations owned by this account.
            </p>

            <div className="oauth-permissions">
              <h2>GBP Master access</h2>
              <ul>
                <li>View connected business accounts, locations, credits, reviews, campaigns, and delivery history</li>
                <li>Create review-reply drafts and manage account or location automation rules</li>
                <li>Publish approved replies and create, schedule, or cancel multi-location content campaigns</li>
              </ul>
              {scopes.length > 0 && (
                <>
                  <h2>Account information</h2>
                  <ul>
                    {scopes.map((scope) => (
                      <li key={scope}>{scopeDescriptions[scope] || scope}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            <p className="oauth-note">
              The AI application will not receive your Google password or Google refresh token.
              You can revoke this connection later from your GBP Master account settings.
            </p>

            <div className="oauth-actions">
              <button className="oauth-secondary" type="button" disabled={busy} onClick={() => void decide('deny')}>
                Deny
              </button>
              <button className="oauth-primary" type="button" disabled={busy} onClick={() => void decide('approve')}>
                {busy ? 'Connecting…' : 'Allow connection'}
              </button>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
