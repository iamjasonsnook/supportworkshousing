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
  const [form, setForm] = useState({ name: '', email: '', approxValue: '', transferDate: '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [submitError, setSubmitError] = useState('');

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: undefined })); };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'Enter a valid email';
    const value = Number(form.approxValue.replace(/[$,\s]/g, ''));
    if (!(value >= 1)) e.approxValue = 'Enter the approximate value in dollars';
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

  const firstName = form.name.trim().split(/\s+/)[0];

  // The transfer details are shown only once the donor has told us about
  // the gift (and are emailed to them), so every transfer can be matched.
  if (status === 'sent') {
    return (
      <div className="stock-gift">
        <div className="stock-sent" role="status">
          <CheckCircle size={28} aria-hidden="true" />
          <div>
            <strong>Thank you, {firstName}.</strong>
            <p>We&rsquo;ve emailed the transfer instructions to {form.email}. Here they are too, to share
              with your broker or financial advisor.</p>
          </div>
        </div>
        <div className="stock-step">
          <div className="stock-help-row">
            <h3>Transfer instructions</h3>
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
        <p className="stock-followup">We&rsquo;ll be in touch to confirm your gift and collect any other
          information we need.</p>
      </div>
    );
  }

  return (
    <div className="stock-gift">
      <p className="stock-intro">
        Giving appreciated stock can be a tax-smart way to give. Please consult your tax advisor.
      </p>
      <form className="stock-form" onSubmit={submit} noValidate>
        <p className="stock-help">Tell us about your gift and we&rsquo;ll email you the transfer instructions
          for your broker.</p>
        <div className="stock-row">
          <label>Name<input value={form.name} onChange={e => set('name', e.target.value)}
            autoComplete="name" aria-invalid={!!errors.name} />
            {errors.name && <span className="stock-err">{errors.name}</span>}</label>
          <label>Email<input type="email" value={form.email} onChange={e => set('email', e.target.value)}
            autoComplete="email" aria-invalid={!!errors.email} />
            {errors.email && <span className="stock-err">{errors.email}</span>}</label>
        </div>
        <div className="stock-row">
          <label>Approximate value
            <span className="stock-money"><span aria-hidden="true">$</span>
              <input value={form.approxValue} inputMode="decimal" placeholder="e.g. 5,000"
                onChange={e => set('approxValue', e.target.value)} aria-invalid={!!errors.approxValue} /></span>
            {errors.approxValue && <span className="stock-err">{errors.approxValue}</span>}</label>
          <label>Expected transfer date<input type="date" value={form.transferDate}
            onChange={e => set('transferDate', e.target.value)} aria-invalid={!!errors.transferDate} />
            {errors.transferDate && <span className="stock-err">{errors.transferDate}</span>}</label>
        </div>

        {status === 'error' && <p className="stock-err" role="alert">{submitError}. Please try again,
          or email <a href="mailto:jsnook@supportworkshousing.org">jsnook@supportworkshousing.org</a>.</p>}
        <button type="submit" className="donate-btn" disabled={status === 'sending'}>
          {status === 'sending' ? 'Sending…' : 'Send my gift details'}
        </button>
        <p className="stock-followup">We&rsquo;ll email you the transfer instructions and be in touch to
          confirm your gift.</p>
      </form>
    </div>
  );
}
