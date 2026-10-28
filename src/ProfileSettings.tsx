import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from './lib/api';
import { supabase } from './lib/supabase';
import Icon from './design/Icon';

interface ProfileSettingsProps {
  user: any;
  locationCount: number;
  tokenBalance: number;
  onUserUpdated: (user: any) => void;
  onSignOut: () => void;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export default function ProfileSettings({ user, locationCount, tokenBalance, onUserUpdated, onSignOut, showToast }: ProfileSettingsProps) {
  const initialName = user?.user_metadata?.full_name || user?.user_metadata?.name || '';
  const [fullName, setFullName] = useState(initialName);
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata');
  const [locale, setLocale] = useState(navigator.language || 'en-IN');
  const [saving, setSaving] = useState(false);
  const [overview, setOverview] = useState<any>(null);

  useEffect(() => {
    apiFetch('/api/platform/overview')
      .then(async response => response.ok ? response.json() : Promise.reject(new Error('Could not load account overview')))
      .then(setOverview)
      .catch(() => setOverview(null));
  }, []);

  const initials = useMemo(() => {
    const source = fullName || user?.email || 'G';
    return source.split(/\s+|@/).filter(Boolean).slice(0, 2).map((part: string) => part[0]?.toUpperCase()).join('');
  }, [fullName, user?.email]);

  const saveProfile = async () => {
    const cleanName = fullName.trim();
    if (!cleanName) {
      showToast('Add your name before saving.', 'error');
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase.auth.updateUser({ data: { full_name: cleanName, name: cleanName } });
      if (error) throw error;
      const preferences = await apiFetch('/api/platform/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timezone, locale }),
      });
      if (!preferences.ok) throw new Error('Your name was saved, but preferences could not be updated.');
      if (data.user) onUserUpdated(data.user);
      showToast('Profile and regional preferences saved.', 'success');
    } catch (error: any) {
      showToast(error?.message || 'Could not save profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const plan = overview?.subscription?.plan_type || overview?.account?.plan_type || 'Free';
  let joined = '—';
  if (user?.created_at) {
    try { joined = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(user.created_at)); }
    catch { joined = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(user.created_at)); }
  }

  return (
    <section className="page active profile-page">
      <div className="page-head">
        <span className="workspace-kicker">ACCOUNT</span>
        <h2>Your profile</h2>
        <p>Manage the identity and regional settings used across your GBP Master workspace.</p>
      </div>

      <div className="profile-layout">
        <aside className="card glass profile-summary">
          <div className="profile-avatar" aria-hidden="true">{initials}</div>
          <h3>{fullName || 'GBP Master user'}</h3>
          <p>{user?.email}</p>
          <span className="profile-plan">{String(plan).replace(/_/g, ' ')} plan</span>
          <div className="profile-metrics">
            <div><strong>{tokenBalance}</strong><span>credits</span></div>
            <div><strong>{locationCount}</strong><span>locations</span></div>
          </div>
          <small>Member since {joined}</small>
        </aside>

        <div className="profile-stack">
          <div className="card glass profile-form">
            <div className="profile-section-heading"><Icon name="settings" size={18}/><div><h3>Personal details</h3><p>Shown inside your workspace. Your sign-in email stays managed by Google.</p></div></div>
            <div className="profile-fields">
              <label><span>Full name</span><input type="text" value={fullName} onChange={event => setFullName(event.target.value)} autoComplete="name" /></label>
              <label><span>Email</span><input type="text" value={user?.email || ''} disabled /></label>
              <label><span>Timezone</span><input type="text" value={timezone} onChange={event => setTimezone(event.target.value)} placeholder="Asia/Kolkata" /></label>
              <label><span>Locale</span><input type="text" value={locale} onChange={event => setLocale(event.target.value)} placeholder="en-IN" /></label>
            </div>
            <button className="btn btn-green" disabled={saving} onClick={saveProfile}>{saving ? 'Saving…' : 'Save profile'}</button>
          </div>

          <div className="card glass profile-security">
            <div className="profile-section-heading"><Icon name="shield" size={18}/><div><h3>Account and privacy</h3><p>Authentication is protected by Supabase and your Google sign-in.</p></div></div>
            <div className="profile-row"><span><b>Google account</b><small>{user?.email}</small></span><span className="profile-status">Connected</span></div>
            <div className="profile-row"><span><b>Data and privacy</b><small>Read how account and business data is handled.</small></span><a href="/privacy">View privacy</a></div>
            <div className="profile-row"><span><b>Need account deletion?</b><small>Use support so connected Google resources and stored data can be removed safely.</small></span><a href="/support">Contact support</a></div>
            <button className="profile-signout" onClick={onSignOut}>Sign out of this device</button>
          </div>
        </div>
      </div>
    </section>
  );
}
