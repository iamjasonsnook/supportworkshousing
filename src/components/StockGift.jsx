import { useState } from 'react';
import { Copy, Check, CheckCircle } from 'lucide-react';
import './StockGift.css';

// SupportWorks Housing's receiving account at Merrill Lynch. These details
// only let shares come IN; publishing them is standard for nonprofits.
const TRANSFER_DETAILS = [
  { label: 'DTC number', value: '8862' },
  { label: 'Firm', value: 'Merrill Lynch, Pierce, Fenner & Smith Incorporated' },
  { label: 'Account name', value: 'SupportWorks Housing' },
  { label: 'Account number', value: '758-02792' },
];

// One button copies every detail, labelled, ready to paste to a broker.
const ALL_DETAILS = ['Stock transfer to SupportWorks Housing',
  ...TRANSFER_DETAILS.map(d => `${d.label}: ${d.value}`)].join('\n');

function CopyAll() {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(ALL_DETAILS);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard blocked: the details are still selectable */ }
  };
  return (
    <button type="button" className="stock-copy" onClick={copy}>
      {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
      <span>{copied ? 'Copied all details' : 'Copy all details'}</span>
      <span className="sr-only" role="status">{copied ? 'Transfer details copied' : ''}</span>
    </button>
  );
}

export default function StockGift() {
  const [form, setForm] = useState({ name: '', email: '', gift: '', transferDate: '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [submitError, setSubmitError] = useState('');

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: undefined })); };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'Enter a valid email';
    if (!form.gift.trim()) e.gift = 'Tell us the stock and number of shares';
    if (!form.transferDate) e.transferDate = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setStatus('sending');
    setSubmitError('');
    try {
      const res = await fetch('/api/send-donation-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'stock-pledge', ...form }),
      });
      if (!res.ok) throw new Error(res.status === 429 ? 'limit' : 'failed');
      setStatus('sent');
      if (window.gtag) window.gtag('event', 'stock_pledge_submitted');
    } catch (err) {
      setStatus('error');
      // Plain words for the donor; the technical cause stays in the server logs.
      setSubmitError(err.message === 'limit'
        ? 'We have received several submissions from you today'
        : 'We could not send your details just now');
    }
  };

  return (
    <div className="stock-gift">
      <p className="stock-intro">
        Giving appreciated stock can be a tax-smart way to give. Please consult your tax advisor.
      </p>

      <div className="stock-step">
        <h3><span className="stock-step-num">1</span> Ask your broker to transfer the shares</h3>
        <div className="stock-help-row">
          <p className="stock-help">Share these details with your broker or financial advisor:</p>
          <CopyAll />
        </div>
        <div className="stock-details">
          <dl>
            {TRANSFER_DETAILS.map(d => (
              <div className="stock-detail" key={d.label}>
                <dt>{d.label}</dt>
                <dd className="stock-detail-value">{d.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div className="stock-step">
        <h3><span className="stock-step-num">2</span> Tell us about your gift</h3>
        {status === 'sent' ? (
          <div className="stock-sent" role="status">
            <CheckCircle size={28} aria-hidden="true" />
            <div>
              <strong>Thank you, {form.name.trim().split(/\s+/)[0]}.</strong>
              <p>We have your details and will watch for the transfer. A copy of the transfer
                instructions is on its way to {form.email}.</p>
            </div>
          </div>
        ) : (
          <form className="stock-form" onSubmit={submit} noValidate>
            <p className="stock-help">Transfers often arrive without the donor&rsquo;s name, so this is how we
              match your gift and thank you for it.</p>
            <div className="stock-row">
              <label>Name<input value={form.name} onChange={e => set('name', e.target.value)}
                autoComplete="name" aria-invalid={!!errors.name} />
                {errors.name && <span className="stock-err">{errors.name}</span>}</label>
              <label>Email<input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                autoComplete="email" aria-invalid={!!errors.email} />
                {errors.email && <span className="stock-err">{errors.email}</span>}</label>
            </div>
            <div className="stock-row">
              <label className="stock-gift-field">What you&rsquo;re giving<input value={form.gift}
                placeholder="e.g. 50 shares of Apple (AAPL)" onChange={e => set('gift', e.target.value)}
                aria-invalid={!!errors.gift} />
                {errors.gift && <span className="stock-err">{errors.gift}</span>}</label>
              <label>Expected transfer date<input type="date" value={form.transferDate}
                onChange={e => set('transferDate', e.target.value)} aria-invalid={!!errors.transferDate} />
                {errors.transferDate && <span className="stock-err">{errors.transferDate}</span>}</label>
            </div>

            {status === 'error' && <p className="stock-err" role="alert">{submitError}. Please try again,
              or email <a href="mailto:jsnook@supportworkshousing.org">jsnook@supportworkshousing.org</a>.</p>}
            <button type="submit" className="donate-btn" disabled={status === 'sending'}>
              {status === 'sending' ? 'Sending…' : 'Send my gift details'}
            </button>
            <p className="stock-followup">We&rsquo;ll be in touch to confirm your gift and collect any other
              information we need.</p>
          </form>
        )}
      </div>
    </div>
  );
}
