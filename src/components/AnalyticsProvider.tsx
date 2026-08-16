import React from 'react';
import { useAnalyticsInit, usePageTracking } from '../hooks/useAnalytics';
import { usePixelPageView } from '../hooks/usePixelPageView';

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({ children }) => {
  useAnalyticsInit();
  usePageTracking();
  usePixelPageView();
  
  return <>{children}</>;
};

export default AnalyticsProvider;