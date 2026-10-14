import { useState } from 'react';
import { X, Quote, ArrowRight } from 'lucide-react';
import { useNudge } from './useNudge';
import { MESSAGES } from './messages';
import './DonateNudge.css';

const CARD_WIDTH = 290;
const MSG_KEY = 'swh-nudge-message';

// One message per visit: chosen at random the first time, then kept for the
// rest of the session so it does not change from page to page.
// ?nudgeMsg=<id> shows a specific one (for review).
function pickMessage() {
  const forced = new URLSearchParams(window.location.search).get('nudgeMsg');
  const byId = id => MESSAGES.find(m => m.id === id);
  if (forced && byId(forced)) return byId(forced);
  try {
    const kept = byId(sessionStorage.getItem(MSG_KEY));
    if (kept) return kept;
  } catch { /* storage unavailable */ }
  const m = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
  try { sessionStorage.setItem(MSG_KEY, m.id); } catch { /* storage unavailable */ }
  return m;
}

// The pill: its text opens the card; its chip is the primary action and
// goes straight to the donate form. Two sibling buttons, never nested.
function Pill({ m, expand, donate }) {
  const ask = m.type === 'story' ? 'Give today' : 'Help today';
  return (
    <div className="nudge-pill">
      <button type="button" className="nudge-pill-open" onClick={expand} aria-expanded="false"
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
  const s = useNudge(CARD_WIDTH);
  if (!s.active) return null;
  const closeLabel = s.collapsible ? 'Minimise' : 'Dismiss';
  return (
    <aside className={`swh-nudge ${s.visible ? 'is-visible' : ''}`} aria-label="Support our mission"
      aria-hidden={!s.visible} data-message={m.id}>
      {s.mode === 'pill' ? <Pill m={m} expand={s.expand} donate={s.donate} /> : (
        <div className={`nudge-card nudge-card--${m.type}`} role="region" aria-label="Support our mission">
          <button type="button" className="nudge-close" onClick={s.collapsible ? s.collapse : s.dismiss}
            aria-label={closeLabel} title={closeLabel}><X size={16} aria-hidden="true" /></button>
          {m.type === 'story' ? <StoryCard m={m} donate={s.donate} /> : <StatCard m={m} donate={s.donate} />}
        </div>
      )}
    </aside>
  );
}
