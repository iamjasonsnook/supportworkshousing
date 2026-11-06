// Cloudflare Turnstile bot check for the public donate and stock pledge forms.
// Shows nothing until VITE_TURNSTILE_SITE_KEY is set at build time; with
// appearance "interaction-only" most people never see it, and Cloudflare
// asks for a click only when it is unsure. Each token works once: remount the
// component (change its key) to get a fresh one after a request.
import { useEffect, useRef } from 'react';

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;
export const turnstileEnabled = !!SITE_KEY;

let loading;
function loadScript() {
  if (window.turnstile) return Promise.resolve();
  loading ||= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    s.async = true;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
  return loading;
}

export default function Turnstile({ onToken }) {
  const box = useRef(null);
  useEffect(() => {
    if (!SITE_KEY) return undefined;
    let id;
    let gone = false;
    loadScript().then(() => {
      if (gone || !box.current) return;
      id = window.turnstile.render(box.current, {
        sitekey: SITE_KEY,
        appearance: 'interaction-only',
        callback: token => onToken(token),
        'expired-callback': () => onToken(''),
        'error-callback': () => onToken(''),
      });
    }).catch(() => onToken(''));
    return () => { gone = true; if (id !== undefined) window.turnstile?.remove(id); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  if (!SITE_KEY) return null;
  return <div ref={box} style={{ marginTop: 12 }} />;
}
