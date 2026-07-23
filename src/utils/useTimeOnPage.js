import { useEffect } from 'react';

/**
 * Track how long a visitor actively spends on a page and report it to GA4 as a
 * `time_on_page` event (value = seconds). Only foreground time is counted:
 * time while the tab is hidden is excluded. The event is sent once, when the
 * visitor leaves the page (client-side navigation away, tab close, or refresh).
 *
 * Page views themselves are already tracked globally by usePageViews in App.jsx.
 *
 * @param {string} label  GA4 event_label identifying the page.
 */
export function useTimeOnPage(label) {
  useEffect(() => {
    let activeSince = performance.now();
    let total = 0;
    let sent = false;

    const accumulate = () => {
      total += performance.now() - activeSince;
      activeSince = performance.now();
    };

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') accumulate();
      else activeSince = performance.now();
    };

    const send = () => {
      if (sent) return;
      accumulate();
      const seconds = Math.round(total / 1000);
      sent = true;
      if (seconds > 0) {
        window.gtag?.('event', 'time_on_page', {
          event_category: 'engagement',
          event_label: label,
          value: seconds,
        });
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', send);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', send);
      send(); // client-side navigation away
    };
  }, [label]);
}
