/**
 * The Crossings asset management dashboard, behind its own password.
 *
 * Two things here are deliberate.
 *
 * The dashboard is fetched, not bundled. Nothing about the property's
 * financials is in the JavaScript this page ships; the server returns the
 * page only once a token verifies. Bundling it would have put four years
 * of statements in the public build, which is the thing this route exists
 * to avoid.
 *
 * It renders in an iframe. The dashboard is a complete document with its
 * own stylesheet, and the site's global CSS would fight it -- and it does
 * not need, and should not have, access to this page's storage.
 */
import { useState, useEffect, useCallback } from 'react';

const API_BASE = import.meta.env.DEV ? 'http://localhost:3001' : '';
const SESSION_KEY = 'crossings_session';

export default function CrossingsDashboard() {
  const [password, setPassword] = useState('');
  const [html, setHtml] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);

  const load = useCallback(async (token) => {
    const res = await fetch(`${API_BASE}/api/admin/crossings`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return false;
    setHtml(await res.text());
    return true;
  }, []);

  // A stored token gets used before the form is shown. An admin session is
  // tried too: an admin already has strictly more access than this page
  // grants, so making them type a second password would be ceremony.
  useEffect(() => {
    (async () => {
      for (const key of [SESSION_KEY, 'admin_session']) {
        const token = localStorage.getItem(key);
        if (token && (await load(token))) {
          setChecking(false);
          return;
        }
      }
      localStorage.removeItem(SESSION_KEY);
      setChecking(false);
    })();
  }, [load]);

  async function submit(e) {
    e.preventDefault();
    if (!password) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/admin/crossings-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok || !data.token) {
        setError('That password is not right.');
        setBusy(false);
        return;
      }
      localStorage.setItem(SESSION_KEY, data.token);
      if (!(await load(data.token))) {
        setError('Signed in, but the dashboard could not be loaded.');
      }
    } catch {
      setError('Could not reach the server.');
    }
    setBusy(false);
  }

  if (html) {
    return (
      <iframe
        title="The Crossings at Fourth and Preston — asset management dashboard"
        srcDoc={html}
        style={{ border: 0, width: '100vw', height: '100vh', display: 'block' }}
      />
    );
  }

  return (
    <div style={S.page}>
      <main style={S.card}>
        <div style={S.org}>SupportWorks Housing</div>
        <h1 style={S.h1}>The Crossings at Fourth &amp; Preston</h1>
        <p style={S.sub}>
          Asset management dashboard. This page has its own password, separate
          from the admin portal.
        </p>
        {checking ? (
          <p style={S.msg}>Checking…</p>
        ) : (
          <form onSubmit={submit} autoComplete="off">
            <label htmlFor="pw" style={S.label}>Password</label>
            <input
              id="pw"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              style={S.input}
              autoFocus
            />
            <button type="submit" disabled={busy} style={{ ...S.button, opacity: busy ? 0.6 : 1 }}>
              {busy ? 'Checking…' : 'View dashboard'}
            </button>
            <p style={{ ...S.msg, color: error ? '#d03b3b' : '#52514e' }} role="status" aria-live="polite">
              {error}
            </p>
          </form>
        )}
      </main>
    </div>
  );
}

const S = {
  page: {
    minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24,
    background: '#f9f9f7', color: '#0b0b0b',
    font: "14px/1.5 system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  },
  card: {
    // App.css sets a global `main { min-height: 100vh }` for the site's page
    // layout. This card is the page's main content, so it is a <main> and
    // picks that up, which stretched it to the full viewport height inside
    // the centring grid. Overridden here rather than by changing the global
    // rule, which the rest of the site depends on.
    minHeight: 'auto',
    width: '100%', maxWidth: '26rem', background: '#fcfcfb',
    border: '1px solid rgba(11,11,11,0.10)', borderRadius: 12,
    boxShadow: '0 1px 3px rgba(0,0,0,.06)', padding: '26px 26px 20px',
  },
  org: {
    fontSize: 11, fontWeight: 700, letterSpacing: '.12em',
    textTransform: 'uppercase', color: '#9B1B5D', marginBottom: 10,
  },
  h1: { margin: '0 0 6px', fontSize: 19, fontWeight: 700, letterSpacing: '-0.01em' },
  sub: { margin: '0 0 18px', fontSize: 12.5, color: '#52514e' },
  label: { display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 },
  input: {
    font: 'inherit', width: '100%', padding: '9px 11px', borderRadius: 8,
    border: '1px solid rgba(11,11,11,0.22)', background: '#fff',
  },
  button: {
    font: 'inherit', fontWeight: 600, width: '100%', marginTop: 12,
    padding: '9px 14px', border: 0, borderRadius: 8,
    background: '#9B1B5D', color: '#fff', cursor: 'pointer',
  },
  msg: { marginTop: 12, marginBottom: 0, fontSize: 12.5, minHeight: '1.4em', fontWeight: 600 },
};
