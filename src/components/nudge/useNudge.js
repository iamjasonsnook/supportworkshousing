import { useEffect, useState, useCallback } from 'react';

// Shared behaviour for the donation nudge.
//
//   - Desktop only (viewport >= 1024px).
//   - Fades in after DELAY_MS on the site.
//   - Starts minimised, as a pill; the pill expands to the full card, and the
//     card minimises back to the pill. The primary action is in both.
//   - Dismissing it (the pill's close button) keeps it away for the rest of
//     the session.
//
// Review overrides (query string): ?nudgeMsg=<id> picks a message,
// ?nudgeDelay=0 shows it at once, ?nudgeMode=card opens it expanded,
// ?nudgeReset=1 clears the dismissal.
const DELAY_MS = 10000;
const DESKTOP_MIN = 1024;
const DISMISS_KEY = 'swh-nudge-dismissed';

const params = () => new URLSearchParams(window.location.search);

// ?nudgeReset=1 clears an earlier dismissal once, when the page loads; doing
// it on every render would undo a dismissal made on that same page.
function readDismissed() {
  try {
    if (params().get('nudgeReset') === '1') sessionStorage.removeItem(DISMISS_KEY);
    return sessionStorage.getItem(DISMISS_KEY) === '1';
  } catch { return false; }
}

export function useNudge() {
  const q = params();
  const delay = q.has('nudgeDelay') ? Number(q.get('nudgeDelay')) : DELAY_MS;

  const [vw, setVw] = useState(() => window.innerWidth);
  const [shown, setShown] = useState(false);
  const [dismissed, setDismissed] = useState(readDismissed);
  const [expanded, setExpanded] = useState(() => q.get('nudgeMode') === 'card');

  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (dismissed) return undefined;
    const t = setTimeout(() => setShown(true), delay);
    return () => clearTimeout(t);
  }, [delay, dismissed]);

  const dismiss = useCallback(() => {
    setDismissed(true);
    try { sessionStorage.setItem(DISMISS_KEY, '1'); } catch { /* private mode */ }
  }, []);

  const donate = useCallback(() => {
    const target = document.getElementById('donate');
    if (target) target.scrollIntoView({ behavior: 'smooth' });
    else window.location.assign('/#donate');
    setExpanded(false);
  }, []);

  return {
    active: vw >= DESKTOP_MIN && !dismissed,
    visible: shown,
    mode: expanded ? 'card' : 'pill',
    expand: () => setExpanded(true),
    collapse: () => setExpanded(false),
    dismiss,
    donate,
  };
}
