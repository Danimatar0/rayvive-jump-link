import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import analytics from '../services/analytics';

// Hook to initialize analytics (use once in App.tsx)
export const useAnalyticsInit = () => {
  useEffect(() => {
    // Check for user consent (if you have a consent mechanism)
    const hasConsent = localStorage.getItem('analytics-consent');
    
    if (hasConsent === 'granted' || hasConsent === null) {
      // Initialize if consent granted or no consent system
      analytics.initialize();
    }
  }, []);
};

// Hook to track page views automatically
export const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    if (analytics.isReady()) {
      // Track page view with pathname and search params
      const page = location.pathname + location.search;
      analytics.trackPageView(page);
    }
  }, [location]);
};

// Hook for manual event tracking
export const useAnalyticsEvent = () => {
  const trackEvent = (action: string, category: string, label?: string, value?: number) => {
    analytics.trackEvent(action, category, label, value);
  };

  const trackCustomEvent = (eventName: string, parameters: Record<string, unknown>) => {
    analytics.trackCustomEvent(eventName, parameters);
  };

  return {
    trackEvent,
    trackCustomEvent
  };
};