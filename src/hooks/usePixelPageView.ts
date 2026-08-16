import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPixelEvent } from '../lib/metaPixel';

/**
 * Re-fires a Meta Pixel PageView on client-side route changes.
 *
 * The base pixel in index.html only fires once, when the HTML loads, so
 * React Router navigations were invisible to Meta. The first render is
 * skipped here to avoid double-counting that initial load.
 */
export const usePixelPageView = () => {
  const location = useLocation();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    trackPixelEvent('PageView');
  }, [location.pathname]);
};
