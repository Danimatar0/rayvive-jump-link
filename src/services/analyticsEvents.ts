import analytics from './analytics';

export const AnalyticsEvents = {
  // Navigation events
  navigationClick: (destination: string, source?: string) => {
    analytics.trackEvent('click', 'navigation', `${source || 'unknown'}_to_${destination}`);
  },

  // Search events
  searchPerformed: (searchTerm: string, resultsCount?: number) => {
    analytics.trackEvent('search', 'site_search', searchTerm, resultsCount);
  },

  // Form events
  formSubmitted: (formName: string, success: boolean = true) => {
    analytics.trackEvent(success ? 'submit' : 'submit_failed', 'form', formName);
  },

  // File downloads
  fileDownload: (fileName: string, fileType: string) => {
    analytics.trackEvent('download', 'file', fileName, undefined);
    analytics.trackCustomEvent('file_download', {
      file_name: fileName,
      file_type: fileType
    });
  },

  // User engagement
  buttonClick: (buttonName: string, location: string) => {
    analytics.trackEvent('click', 'button', `${buttonName}_${location}`);
  },

  // E-commerce (if applicable)
  productView: (productId: string, productName: string, category?: string) => {
    analytics.trackCustomEvent('view_item', {
      item_id: productId,
      item_name: productName,
      item_category: category || 'unknown',
      currency: 'USD'
    });
  },

  // Custom business events
  featureUsed: (featureName: string, context?: string) => {
    analytics.trackEvent('feature_use', 'engagement', featureName);
    if (context) {
      analytics.trackCustomEvent('feature_engagement', {
        feature_name: featureName,
        context
      });
    }
  }
};

export default AnalyticsEvents;