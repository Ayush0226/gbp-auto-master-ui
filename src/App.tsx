import { apiFetch } from './lib/api';
import React, { useEffect, lazy, Suspense } from 'react';
import { supabase } from './lib/supabase';
const DashboardV2 = lazy(() => import('./DashboardV2'));
const Onboarding = lazy(() => import('./Onboarding'));
const Terms = lazy(() => import('./Terms'));
const Privacy = lazy(() => import('./Privacy'));
const Support = lazy(() => import('./Support'));
const PluginGuide = lazy(() => import('./PluginGuide'));
const Refund = lazy(() => import('./Refund'));
const MuscleDemoHome = lazy(() => import('./MuscleDemoHome').then(module => ({ default: module.MuscleDemoHome })));
const AdminDashboard = lazy(() => import('./AdminDashboard'));
const LandingV2 = lazy(() => import('./LandingV2'));
const Brochure = lazy(() => import('./Brochure'));
const OAuthConsent = lazy(() => import('./OAuthConsent'));
import './index.css';

function App() {
  const [currentPath, setCurrentPath] = React.useState(window.location.pathname)

  useEffect(() => {
    let disposed = false;
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname)
    }

    // Intercept pushState and replaceState to trigger re-renders
    const originalPushState = window.history.pushState
    const originalReplaceState = window.history.replaceState

    window.history.pushState = function (...args) {
      originalPushState.apply(this, args)
      handleLocationChange()
    }

    window.history.replaceState = function (...args) {
      originalReplaceState.apply(this, args)
      handleLocationChange()
    }

    window.addEventListener('popstate', handleLocationChange)

    // Listen for Supabase OAuth redirects globally
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(async () => {
      if (disposed) return;
      if (session?.user) {
        const path = window.location.pathname;
        if (path === '/oauth/consent') {
          if (window.location.hash.includes('access_token')) {
            window.history.replaceState(null, '', `${path}${window.location.search}`);
          }
          setCurrentPath(path);
          return;
        }
        
        // Default route
        let targetRoute = '/dashboard-v2';

        // Check if onboarding is completed
        try {
          const { data: profile } = await supabase.from('user_profiles').select('onboarding_completed').eq('id', session.user.id).single();
          if (!profile || !profile.onboarding_completed) {
            targetRoute = '/onboarding';
          }
        } catch (e) {
          // Ignore error, fallback to dashboard
        }

        // Clear the hash from the URL to prevent ugly links
        if (window.location.hash.includes('access_token')) {
            window.history.replaceState(null, '', targetRoute);
            setCurrentPath(targetRoute);
        } else {
            // Only redirect if they are on the home page, old dashboard, or landing page. 
            if (path === '/' || path === '/dashboard' || path === '/v2' || path === '/landing') {
                window.history.replaceState(null, '', targetRoute);
                setCurrentPath(targetRoute);
            }
        }
      }
      }, 0);
    });

    return () => {
      disposed = true;
      window.removeEventListener('popstate', handleLocationChange)
      window.history.pushState = originalPushState
      window.history.replaceState = originalReplaceState
      authListener.subscription.unsubscribe();
    }
  }, [])

  // Simple router based on current path
  const renderRoute = () => {
    if (currentPath === '/oauth/consent') {
      return <OAuthConsent />;
    }

    if (currentPath === '/' || currentPath === '/v2' || currentPath === '/landing') {
      return <LandingV2 />;
    }

    if (currentPath === '/dashboard' || currentPath === '/dashboard-v2') {
      return <DashboardV2 />;
    }

    if (currentPath === '/onboarding') {
      return <Onboarding />;
    }
    
    if (currentPath === '/admin') {
      return <AdminDashboard />;
    }

    if (currentPath === '/reset') {
      return (
        <div style={{ padding: '50px', color: 'white' }}>
          <h2>Resetting your account...</h2>
          <button onClick={async () => {
             const { data: { session } } = await supabase.auth.getSession();
             if (session?.user) {
                const response = await apiFetch('/api/user/reset-onboarding', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: session.user.id }) });
                if (!response.ok) { alert('Could not reset onboarding. Please retry.'); return; }
             }
             await supabase.auth.signOut();
             localStorage.clear();
             alert('Account reset & logged out! Click OK to go to the landing page and sign in again.');
             window.location.href = '/v2';
          }} style={{ padding: '10px 20px', background: 'red', color: 'white', marginTop: '20px' }}>
             Click here to Hard Reset Account & Log Out
          </button>
        </div>
      );
    }
    
    if (currentPath === '/terms') {
      return <Terms />;
    }

    if (currentPath === '/privacy') {
      return <Privacy />;
    }

    if (currentPath === '/support') {
      return <Support />;
    }

    if (currentPath === '/plugin') {
      return <PluginGuide />;
    }

    if (currentPath === '/refund') {
      return <Refund />;
    }

    if (currentPath === '/brochure') {
      return <Brochure />;
    }

    if (currentPath === '/demo') {
      return <MuscleDemoHome />;
    }

    // Default to V2 Landing Page
    return <LandingV2 />
  }

  return (
    <div className="App">
      <Suspense fallback={<div role="status" style={{ padding: 32 }}>Loading…</div>}>{renderRoute()}</Suspense>
    </div>
  );
}

export default App;
