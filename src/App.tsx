import React, { useEffect } from 'react';
import { supabase } from './lib/supabase';
import Home from './Home';
import DashboardV2 from './DashboardV2';
import Onboarding from './Onboarding';
import Terms from './Terms';
import Privacy from './Privacy';
import Refund from './Refund';
import { MuscleDemoHome } from './MuscleDemoHome';
import AdminDashboard from './AdminDashboard';
import LandingV2 from './LandingV2';
import './index.css';

function App() {
  const [currentPath, setCurrentPath] = React.useState(window.location.pathname)

  useEffect(() => {
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
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || session?.user) {
        
        // Default route
        let targetRoute = '/dashboard-v2';

        // Check if onboarding is completed
        try {
          const { data: profile } = await supabase.table('user_profiles').select('onboarding_completed').eq('id', session.user.id).single();
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
            const path = window.location.pathname;
            if (path === '/' || path === '/dashboard' || path === '/v2' || path === '/landing') {
                window.history.replaceState(null, '', targetRoute);
                setCurrentPath(targetRoute);
            }
        }
      }
    });

    return () => {
      window.removeEventListener('popstate', handleLocationChange)
      window.history.pushState = originalPushState
      window.history.replaceState = originalReplaceState
      authListener.subscription.unsubscribe();
    }
  }, [])

  // Simple router based on current path
  const renderRoute = () => {
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
                await supabase.table('user_profiles').delete().eq('id', session.user.id);
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

    if (currentPath === '/refund') {
      return <Refund />;
    }

    if (currentPath === '/demo') {
      return <MuscleDemoHome />;
    }

    // Default to V2 Landing Page
    return <LandingV2 />
  }

  return (
    <div className="App">
      {renderRoute()}
    </div>
  );
}

export default App;
