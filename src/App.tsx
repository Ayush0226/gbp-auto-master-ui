import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import Home from './Home';
import Dashboard from './Dashboard';
import Terms from './Terms';
import Privacy from './Privacy';
import Refund from './Refund';
import './index.css';

function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handleLocationChange);

    // Listen for Supabase OAuth redirects globally
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || session?.user) {
        // Clear the hash from the URL to prevent ugly links, then go to dashboard
        if (window.location.hash.includes('access_token')) {
            window.history.replaceState(null, '', '/dashboard');
            setCurrentPath('/dashboard');
        } else {
            setCurrentPath('/dashboard');
        }
      }
    });

    return () => {
        window.removeEventListener('popstate', handleLocationChange);
        authListener.subscription.unsubscribe();
    };
  }, []);

  if (currentPath === '/dashboard') {
    return <Dashboard />;
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

  return <Home />;
}

export default App;
