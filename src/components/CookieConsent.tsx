import React, { useState, useEffect } from 'react';
import analytics from '../services/analytics';

const CookieConsent: React.FC = () => {
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    const hasConsent = localStorage.getItem('analytics-consent');
    if (hasConsent === null) {
      setShowConsent(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('analytics-consent', 'granted');
    analytics.initialize();
    setShowConsent(false);
  };

  const handleDecline = () => {
    localStorage.setItem('analytics-consent', 'denied');
    setShowConsent(false);
  };

  if (!showConsent) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: '#333',
      color: 'white',
      padding: '1rem',
      zIndex: 1000,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div>
        <p>We use cookies to improve your experience. Do you accept our use of analytics cookies?</p>
      </div>
      <div>
        <button 
          onClick={handleDecline}
          style={{ marginRight: '1rem', padding: '0.5rem 1rem' }}
        >
          Decline
        </button>
        <button 
          onClick={handleAccept}
          style={{ padding: '0.5rem 1rem', backgroundColor: '#007bff', color: 'white', border: 'none' }}
        >
          Accept
        </button>
      </div>
    </div>
  );
};

export default CookieConsent;