import { useState, useEffect } from 'react';
import Home from './Home';
import Dashboard from './Dashboard';
import Terms from './Terms';
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

  return <Home />;
}

export default App;
