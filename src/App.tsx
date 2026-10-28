import { apiFetch } from './lib/api';
import React, { useEffect, lazy, Suspense } from 'react';
import { supabase } from './lib/supabase';
import './index.css';

const DashboardV2 = lazy(() => import('./DashboardV2'));
const Onboarding = lazy(() => import('./Onboarding'));
const Terms = lazy(() => import('./Terms'));
const Privacy = lazy(() => import('./Privacy'));
const Refund = lazy(() => import('./Refund'));
const HomePage = lazy(() => import('./design/HomePage'));
const WorkspacePreview = lazy(() => import('./design/WorkspacePreview'));
const SeoPage = lazy(() => import('./design/SeoPlanner'));
const SupportPage = lazy(() => import('./design/PublicPages').then(module => ({ default: module.SupportPage })));
const ConnectionGuide = lazy(() => import('./design/PublicPages').then(module => ({ default: module.ConnectionGuide })));
const AuthPage = lazy(() => import('./design/AuthPage'));
const NotFoundPage = lazy(() => import('./design/NotFoundPage'));
const MuscleDemoHome = lazy(() => import('./MuscleDemoHome').then(module => ({ default: module.MuscleDemoHome })));
const AdminDashboard = lazy(() => import('./AdminDashboard'));
const Brochure = lazy(() => import('./Brochure'));
const OAuthConsent = lazy(() => import('./OAuthConsent'));

function App() {
  const [currentPath, setCurrentPath] = React.useState(window.location.pathname);

  useEffect(() => {
    let disposed = false;
    const handleLocationChange = () => setCurrentPath(window.location.pathname);
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;
    window.history.pushState = function (...args) { originalPushState.apply(this, args); handleLocationChange(); };
    window.history.replaceState = function (...args) { originalReplaceState.apply(this, args); handleLocationChange(); };
    window.addEventListener('popstate', handleLocationChange);

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(async () => {
        if (disposed || !session?.user) return;
        const path = window.location.pathname;
        if (path === '/oauth/consent') {
          if (window.location.hash.includes('access_token')) window.history.replaceState(null, '', `${path}${window.location.search}`);
          setCurrentPath(path);
          return;
        }
        const isLocalPreview = ['localhost', '127.0.0.1'].includes(window.location.hostname);
        if (isLocalPreview && ['/', '/v2', '/landing', '/workspace', '/seo', '/plugin', '/signup'].includes(path)) return;

        let targetRoute = '/dashboard-v2';
        try {
          const { data: profile } = await supabase.from('user_profiles').select('onboarding_completed').eq('id', session.user.id).single();
          if (!profile || !profile.onboarding_completed) targetRoute = '/onboarding';
        } catch { /* Keep dashboard as the safe default. */ }

        if (window.location.hash.includes('access_token')) {
          window.history.replaceState(null, '', targetRoute); setCurrentPath(targetRoute);
        } else if (['/', '/dashboard', '/dashboard-v2', '/v2', '/landing', '/signup'].includes(path)) {
          window.history.replaceState(null, '', targetRoute); setCurrentPath(targetRoute);
        }
      }, 0);
    });

    return () => {
      disposed = true;
      window.removeEventListener('popstate', handleLocationChange);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const renderRoute = () => {
    if (currentPath === '/oauth/consent') return <OAuthConsent />;
    if (currentPath === '/signup') return <AuthPage />;
    if (['/', '/v2', '/landing'].includes(currentPath)) return <HomePage />;
    if (currentPath === '/workspace') return <WorkspacePreview />;
    if (currentPath === '/seo') return <SeoPage />;
    if (currentPath === '/dashboard' || currentPath === '/dashboard-v2') return <DashboardV2 />;
    if (currentPath === '/onboarding') return <Onboarding />;
    if (currentPath === '/admin') return <AdminDashboard />;
    if (currentPath === '/terms') return <Terms />;
    if (currentPath === '/privacy') return <Privacy />;
    if (currentPath === '/support') return <SupportPage />;
    if (currentPath === '/plugin') return <ConnectionGuide />;
    if (currentPath === '/refund') return <Refund />;
    if (currentPath === '/brochure') return <Brochure />;
    if (currentPath === '/demo') return <MuscleDemoHome />;
    if (currentPath === '/reset') return <div style={{ padding: 50 }}><h2>Resetting your account…</h2><button onClick={async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const response = await apiFetch('/api/user/reset-onboarding', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: session.user.id }) });
        if (!response.ok) { alert('Could not reset onboarding. Please retry.'); return; }
      }
      await supabase.auth.signOut({ scope: 'local' }); window.location.href = '/v2';
    }}>Reset account and log out</button></div>;
    return <NotFoundPage />;
  };

  return <div className="App"><Suspense fallback={<div role="status" style={{ padding: 32 }}>Loading…</div>}>{renderRoute()}</Suspense></div>;
}

export default App;
