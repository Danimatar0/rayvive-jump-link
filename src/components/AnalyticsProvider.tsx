import React from 'react';
import { useAnalyticsInit, usePageTracking } from '../hooks/useAnalytics';

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({ children }) => {
  useAnalyticsInit();
  usePageTracking();
  
  return <>{children}</>;
};

export default AnalyticsProvider;