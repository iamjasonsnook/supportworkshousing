import { useState } from 'react';
import { Copy, Check, CheckCircle, Plus, Trash2 } from 'lucide-react';
import './StockGift.css';

// SupportWorks Housing's receiving account at Merrill Lynch. These details
// only let shares come IN; publishing them is standard for nonprofits.
const TRANSFER_DETAILS = [
  { label: 'DTC number', value: '8862' },
  { label: 'Firm', value: 'Merrill Lynch, Pierce, Fenner & Smith Incorporated' },
  { label: 'Account name', value: 'SupportWorks Housing' },
  { label: 'Account number', value: '758-02792' },
];

const MAX_STOCKS = 5;
const emptyStock = () => ({ name: '', shares: '' });

function CopyRow({ label, value }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* clipboard blocked: the value is still selectable */ }
  };
  return (
    <div className="stock-detail">
      <dt>{label}</dt>
      <dd>
        <span className="stock-detail-value">{value}</span>
        <button type="button" className="stock-copy" onClick={copy}
          aria-label={copied ? `${label} copied` : `Copy ${label}`}>
          {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </dd>
    </div>
  );
}

export default function StockGift() {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    stocks: [emptyStock()], approxValue: '', transferDate: '', brokerFirm: '', note: '',
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [submitError, setSubmitError] = useState('');

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: undefined })); };
  const setStock = (i, k, v) => {
    setForm(f => ({ ...f, stocks: f.stocks.map((s, j) => (j === i ? { ...s, [k]: v } : s)) }));
    setErrors(e => ({ ...e, stocks: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = 'Required';
    if (!form.lastName.trim()) e.lastName = 'Required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'Enter a valid email';
    if (!form.stocks.some(s => s.name.trim() && s.shares.trim())) e.stocks = 'Enter at least one stock and its number of shares';
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
        body: JSON.stringify({
          kind: 'stock-pledge',
          ...form,
          stocks: form.stocks.filter(s => s.name.trim() && s.shares.trim()),
        }),
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
        Giving appreciated stock can be a tax-smart way to support our mission.
        Please consult your tax advisor about your situation.
      </p>

      <div className="stock-step">
        <h3><span className="stock-step-num">1</span> Ask your broker to transfer the shares</h3>
        <p className="stock-help">Share these details with your broker or financial advisor:</p>
        <dl className="stock-details">
          {TRANSFER_DETAILS.map(d => <CopyRow key={d.label} {...d} />)}
        </dl>
      </div>

      <div className="stock-step">
        <h3><span className="stock-step-num">2</span> Tell us about your gift</h3>
        {status === 'sent' ? (
          <div className="stock-sent" role="status">
            <CheckCircle size={28} aria-hidden="true" />
            <div>
              <strong>Thank you, {form.firstName}.</strong>
              <p>We have your details and will watch for the transfer. A copy of the transfer
                instructions is on its way to {form.email}.</p>
            </div>
          </div>
        ) : (
          <form className="stock-form" onSubmit={submit} noValidate>
            <p className="stock-help">Transfers often arrive without the donor&rsquo;s name, so this is how we
              match your gift and thank you for it.</p>
            <div className="stock-row">
              <label>First name<input value={form.firstName} onChange={e => set('firstName', e.target.value)}
                autoComplete="given-name" aria-invalid={!!errors.firstName} />
                {errors.firstName && <span className="stock-err">{errors.firstName}</span>}</label>
              <label>Last name<input value={form.lastName} onChange={e => set('lastName', e.target.value)}
                autoComplete="family-name" aria-invalid={!!errors.lastName} />
                {errors.lastName && <span className="stock-err">{errors.lastName}</span>}</label>
            </div>
            <div className="stock-row">
              <label>Email<input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                autoComplete="email" aria-invalid={!!errors.email} />
                {errors.email && <span className="stock-err">{errors.email}</span>}</label>
              <label>Phone <span className="stock-opt">(optional)</span><input type="tel" value={form.phone}
                onChange={e => set('phone', e.target.value)} autoComplete="tel" /></label>
            </div>

            <fieldset className="stock-shares">
              <legend>Stock and number of shares</legend>
              {form.stocks.map((s, i) => (
                <div className="stock-row stock-share-row" key={i}>
                  <label>Stock name or ticker<input value={s.name} placeholder="e.g. Apple (AAPL)"
                    onChange={e => setStock(i, 'name', e.target.value)} /></label>
                  <label>Shares<input value={s.shares} inputMode="decimal" placeholder="e.g. 25"
                    onChange={e => setStock(i, 'shares', e.target.value)} /></label>
                  {form.stocks.length > 1 && (
                    <button type="button" className="stock-remove" aria-label={`Remove stock ${i + 1}`}
                      onClick={() => setForm(f => ({ ...f, stocks: f.stocks.filter((_, j) => j !== i) }))}>
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  )}
                </div>
              ))}
              {errors.stocks && <span className="stock-err">{errors.stocks}</span>}
              {form.stocks.length < MAX_STOCKS && (
                <button type="button" className="stock-add"
                  onClick={() => setForm(f => ({ ...f, stocks: [...f.stocks, emptyStock()] }))}>
                  <Plus size={15} aria-hidden="true" /> Add another stock
                </button>
              )}
            </fieldset>

            <div className="stock-row">
              <label>Approximate value <span className="stock-opt">(optional)</span>
                <span className="stock-money"><span aria-hidden="true">$</span>
                  <input value={form.approxValue} inputMode="decimal"
                    onChange={e => set('approxValue', e.target.value)} /></span></label>
              <label>Expected transfer date<input type="date" value={form.transferDate}
                onChange={e => set('transferDate', e.target.value)} aria-invalid={!!errors.transferDate} />
                {errors.transferDate && <span className="stock-err">{errors.transferDate}</span>}</label>
            </div>
            <label>Your brokerage firm <span className="stock-opt">(optional)</span>
              <input value={form.brokerFirm} placeholder="e.g. Fidelity, Schwab, Vanguard"
                onChange={e => set('brokerFirm', e.target.value)} /></label>
            <label>Note <span className="stock-opt">(optional, e.g. a tribute or designation)</span>
              <textarea rows={2} value={form.note} onChange={e => set('note', e.target.value)} /></label>

            {status === 'error' && <p className="stock-err" role="alert">{submitError}. Please try again,
              or email <a href="mailto:jsnook@supportworkshousing.org">jsnook@supportworkshousing.org</a>.</p>}
            <button type="submit" className="donate-btn" disabled={status === 'sending'}>
              {status === 'sending' ? 'Sending…' : 'Send my gift details'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
