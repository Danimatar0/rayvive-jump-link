interface AnalyticsEnvironment {
  trackingId: string;
  enabled: boolean;
  debug: boolean;
}

const getAnalyticsConfig = (): AnalyticsEnvironment => {
  const environment = process.env.NODE_ENV;
  
  switch (environment) {
    case 'production':
      return {
        trackingId: 'G-DBK0PKM3SH', // Your actual tracking ID
        enabled: true,
        debug: false
      };
    case 'development':
      return {
        trackingId: 'G-DBK0PKM3SH', // Same ID for testing
        enabled: true,
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