import { useState, useEffect } from 'react';
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
    return () => window.removeEventListener('popstate', handleLocationChange);
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
