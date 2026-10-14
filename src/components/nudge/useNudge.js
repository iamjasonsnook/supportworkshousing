import { useEffect, useState, useCallback } from 'react';

// Shared behaviour for the donation nudge. Variants only decide how it looks.
//
//   - Desktop only (viewport >= 1024px).
//   - Fades in after DELAY_MS on the site, once per session; dismissing it
//     keeps it away for the rest of the session.
//   - 'card' when the full card fits in the right-hand gutter beside the
//     1200px content column, otherwise 'pill' (expandable on click).
//
// Review overrides (query string): ?nudgeMsg=<id> picks a message, ?nudgeDelay=0
// shows it at once, ?nudgeMode=card|pill forces a mode, ?nudgeReset=1
// clears the dismissal.
const DELAY_MS = 10000;
const CONTENT_MAX = 1200;
const EDGE = 24;
const DESKTOP_MIN = 1024;
const DISMISS_KEY = 'swh-nudge-dismissed';

const params = () => new URLSearchParams(window.location.search);

function readDismissed() {
  try { return sessionStorage.getItem(DISMISS_KEY) === '1'; } catch { return false; }
}

export function useNudge(cardWidth) {
  const q = params();
  if (q.get('nudgeReset') === '1') { try { sessionStorage.removeItem(DISMISS_KEY); } catch { /* ignore */ } }
  const delay = q.has('nudgeDelay') ? Number(q.get('nudgeDelay')) : DELAY_MS;
  const forcedMode = q.get('nudgeMode');

  const [vw, setVw] = useState(() => window.innerWidth);
  const [shown, setShown] = useState(false);
  const [dismissed, setDismissed] = useState(readDismissed);
  const [expanded, setExpanded] = useState(false);

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

  const gutter = (vw - CONTENT_MAX) / 2;
  const fits = gutter >= cardWidth + EDGE * 2;
  const mode = forcedMode === 'card' || forcedMode === 'pill' ? forcedMode : fits ? 'card' : 'pill';

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
    mode: mode === 'pill' && expanded ? 'card' : mode,
    collapsible: mode === 'pill',
    expand: () => setExpanded(true),
    collapse: () => setExpanded(false),
    dismiss,
    donate,
  };
}
