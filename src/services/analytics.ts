import ReactGA from 'react-ga4';
import { ANALYTICS_CONFIG } from '../config/analytics';

interface AnalyticsConfig {
  trackingId: string;
  debug?: boolean;
  enabled?: boolean;
}

class AnalyticsService {
  private isInitialized = false;
  private config: AnalyticsConfig;

  constructor(config: AnalyticsConfig) {
    this.config = config;
  }

  initialize(): void {
    if (this.isInitialized || !this.config.enabled || !this.config.trackingId) {
      return;
    }

    try {
      ReactGA.initialize(this.config.trackingId, {
        gtagOptions: {
          debug_mode: this.config.debug,
          send_page_view: false // We'll handle this manually
        }
      });

      this.isInitialized = true;
      
      if (this.config.debug) {
        console.log('Google Analytics initialized with ID:', this.config.trackingId);
      }
    } catch (error) {
      console.error('Failed to initialize Google Analytics:', error);
    }
  }

  trackPageView(path: string, title?: string): void {
    if (!this.isInitialized || !this.config.enabled) return;

    try {
      ReactGA.send({
        hitType: 'pageview',
        page: path,
        title: title || document.title
      });

      if (this.config.debug) {
        console.log('Page view tracked:', path);
      }
    } catch (error) {
      console.error('Failed to track page view:', error);
    }
  }

  trackEvent(action: string, category: string, label?: string, value?: number): void {
    if (!this.isInitialized || !this.config.enabled) return;

    try {
      ReactGA.event({
        action,
        category,
        label,
        value
      });

      if (this.config.debug) {
        console.log('Event tracked:', { action, category, label, value });
      }
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }

  trackCustomEvent(eventName: string, parameters: Record<string, unknown>): void {
    if (!this.isInitialized || !this.config.enabled) return;

    try {
      ReactGA.gtag('event', eventName, parameters);

      if (this.config.debug) {
        console.log('Custom event tracked:', eventName, parameters);
      }
    } catch (error) {
      console.error('Failed to track custom event:', error);
    }
  }

  isReady(): boolean {
    return this.isInitialized && !!this.config.enabled;
  }
}

// Create and export singleton instance
const analytics = new AnalyticsService({
  trackingId: ANALYTICS_CONFIG.trackingId,
  debug: ANALYTICS_CONFIG.debug,
  enabled: ANALYTICS_CONFIG.enabled
});

export default analytics;