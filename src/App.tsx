import React, { useEffect } from 'react';
import { supabase } from './lib/supabase';
import Home from './Home';
import Dashboard from './Dashboard';
import Terms from './Terms';
import Privacy from './Privacy';
import Refund from './Refund';
import { MuscleDemoHome } from './MuscleDemoHome';
import AdminDashboard from './AdminDashboard';
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
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || session?.user) {
        // Clear the hash from the URL to prevent ugly links, then go to dashboard
        if (window.location.hash.includes('access_token')) {
            window.history.replaceState(null, '', '/dashboard');
            setCurrentPath('/dashboard');
        } else {
            // Only redirect to dashboard if they are on the home page. 
            // Allow them to stay on /admin or other sub-pages.
            if (window.location.pathname === '/') {
                window.history.replaceState(null, '', '/dashboard');
                setCurrentPath('/dashboard');
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
    if (currentPath === '/dashboard') {
      return <Dashboard />;
    }
    
    if (currentPath === '/admin') {
      return <AdminDashboard />;
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

    // Default to Home
    return <Home />
  }

  return (
    <div className="App">
      {renderRoute()}
    </div>
  )
}

export default App;
