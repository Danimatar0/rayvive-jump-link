interface AnalyticsEnvironment {
  trackingId: string;
  enabled: boolean;
  debug: boolean;
}

const getAnalyticsConfig = (): AnalyticsEnvironment => {
  const environment = import.meta.env.MODE;
  const trackingId = import.meta.env.VITE_GA_TRACKING_ID || '';

  switch (environment) {
    case 'production':
      return {
        trackingId,
        enabled: !!trackingId,
        debug: false
      };
    case 'development':
      return {
        trackingId,
        enabled: !!trackingId,
        debug: true
      };
    case 'test':
    default:
      return {
        trackingId: '',
        enabled: false,
        debug: false
      };
  }
};

export const ANALYTICS_CONFIG = getAnalyticsConfig();