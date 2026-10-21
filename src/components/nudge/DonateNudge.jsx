import { useState, useEffect } from 'react';
import { X, Quote, ArrowRight, ChevronDown } from 'lucide-react';
import { useNudge } from './useNudge';
import { MESSAGES } from './messages';
import './DonateNudge.css';

const LAST_KEY = 'swh-nudge-last';

// A fresh message on every page load, never the one shown last time, so a
// refresh always shows a different one. ?nudgeMsg=<id> shows a specific one.
function pickMessage() {
  const forced = new URLSearchParams(window.location.search).get('nudgeMsg');
  const byId = id => MESSAGES.find(m => m.id === id);
  if (forced && byId(forced)) return byId(forced);
  let last = null;
  try { last = localStorage.getItem(LAST_KEY); } catch { /* storage unavailable */ }
  const pool = MESSAGES.filter(m => m.id !== last);
  return pool[Math.floor(Math.random() * pool.length)];
}

// The pill, the nudge's starting state: its text opens the card, its chip is
// the primary action and goes straight to the donate form, and a small close
// button dismisses it for the session. Sibling buttons, never nested.
function Pill({ m, expand, donate, dismiss }) {
  const ask = m.type === 'story' ? 'Give today' : 'Help today';
  return (
    <div className="nudge-pill">
      <button type="button" className="nudge-pill-open" onClick={expand} aria-expanded="false" title="Read more"
        aria-label={`${m.type === 'story' ? m.pillQuote : `${m.stat}${m.suffix} ${m.pill}`}. Show more`}>
        {m.type === 'story' ? (
          <>
            <Quote size={14} aria-hidden="true" className="nudge-pill-icon" />
            <span className="nudge-pill-quote">&ldquo;{m.pillQuote}&rdquo;</span>
          </>
        ) : (
          <>
            <span className="nudge-pill-stat">{m.stat}{m.suffix}</span>
            <span className="nudge-pill-text">{m.pill}</span>
          </>
        )}
      </button>
      <button type="button" className="nudge-pill-ask" onClick={donate}>{ask}</button>
      <button type="button" className="nudge-pill-close" onClick={dismiss}
        aria-label="Dismiss" title="Dismiss"><X size={14} aria-hidden="true" /></button>
    </div>
  );
}

function StoryCard({ m, donate }) {
  return (
    <>
      <figure className="nudge-figure">
        <Quote size={22} aria-hidden="true" className="nudge-mark" />
        <blockquote className="nudge-quote">{m.quote}</blockquote>
        <figcaption className="nudge-cite">
          <span className="nudge-name">{m.name}</span>
          <span className="nudge-meta">{m.meta}</span>
        </figcaption>
      </figure>
      <div className="nudge-ask">
        <p className="nudge-copy">{m.copy}</p>
        <button type="button" className="nudge-cta" onClick={donate}>Donate today</button>
      </div>
    </>
  );
}

function StatCard({ m, donate }) {
  return (
    <div className="nudge-stat-body">
      <p className="nudge-eyebrow">{m.eyebrow}</p>
      <p className="nudge-stat">{m.stat}{m.suffix && <span>{m.suffix}</span>}</p>
      <p className="nudge-lede">{m.lede}</p>
      <div className="nudge-rule" aria-hidden="true" />
      <p className="nudge-copy">{m.copy}</p>
      <button type="button" className="nudge-cta" onClick={donate}>
        Donate today <ArrowRight size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

// Fixed to the lower right, fading in after the delay. A card where it fits
// in the gutter beside the content, a pill that expands to the card where it
// does not. Non-modal, so a labelled region rather than a dialog.
export default function DonateNudge() {
  const [m] = useState(pickMessage);
  // Recorded once it is on screen, not while picking: React may run the
  // picker more than once, and only the message actually shown counts.
  useEffect(() => {
    try { localStorage.setItem(LAST_KEY, m.id); } catch { /* storage unavailable */ }
  }, [m.id]);
  const s = useNudge();
  if (!s.active) return null;
  return (
    <aside className={`swh-nudge ${s.visible ? 'is-visible' : ''}`} aria-label="Support our mission"
      aria-hidden={!s.visible} data-message={m.id}>
      {s.mode === 'pill' ? <Pill m={m} expand={s.expand} donate={s.donate} dismiss={s.dismiss} /> : (
        <div className={`nudge-card nudge-card--${m.type}`} role="region" aria-label="Support our mission">
          <button type="button" className="nudge-close" onClick={s.collapse}
            aria-label="Minimise" title="Minimise"><ChevronDown size={18} aria-hidden="true" /></button>
          {m.type === 'story' ? <StoryCard m={m} donate={s.donate} /> : <StatCard m={m} donate={s.donate} />}
        </div>
      )}
    </aside>
  );
}
