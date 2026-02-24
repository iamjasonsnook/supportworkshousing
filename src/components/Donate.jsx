import { useState } from 'react';
import { Heart, Lock, ShieldCheck, ArrowLeft, ArrowRight, CheckCircle, User, CreditCard, Calendar } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from '@stripe/react-stripe-js';
import emailjs from '@emailjs/browser';
import { buildEmailHTML, tableRow } from '../utils/emailTemplate';
import './Donate.css';

// Stripe Configuration
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const ADMIN_EMAIL = 'jsnook@supportworkshousing.org';

const API_BASE = '';

// EmailJS Configuration
const EMAILJS_SERVICE_ID = 'service_EmailJSBrevo';
const EMAILJS_PUBLIC_KEY = '76TcHTUs1bvcN68kM';
const EMAILJS_TEMPLATE = 'universal';

// Stripe Elements styling to match existing inputs
const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#1A1A1A',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      '::placeholder': {
        color: '#6B7280',
      },
    },
    invalid: {
      color: '#dc2626',
    },
  },
};

// Format phone number as (xxx)xxx-xxxx
const formatPhone = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 10);
  if (digits.length === 0) return '';
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)})${digits.slice(3)}`;
  return `(${digits.slice(0, 3)})${digits.slice(3, 6)}-${digits.slice(6)}`;
};

function DonateForm() {
  const stripe = useStripe();
  const elements = useElements();

  const [currentStep, setCurrentStep] = useState(0); // 0 = amount, 1 = personal info, 2 = payment, 3 = review
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Stripe state
  const [clientSecret, setClientSecret] = useState(null);
  const [paymentIntentId, setPaymentIntentId] = useState(null);
  const [cardBrand, setCardBrand] = useState(null);
  const [confirmedPayment, setConfirmedPayment] = useState(null);
  const [cardComplete, setCardComplete] = useState({
    cardNumber: false,
    cardExpiry: false,
    cardCvc: false,
  });
  const [cardErrors, setCardErrors] = useState({
    cardNumber: null,
    cardExpiry: null,
    cardCvc: null,
  });

  const [formData, setFormData] = useState({
    // Donation details
    donationType: 'one-time',
    amount: 100,
    customAmount: '',
    startDate: '',
    // Personal info
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    // Card name (Stripe Elements handles number/expiry/cvc)
    cardName: '',
  });

  const [errors, setErrors] = useState({});

  const amounts = [25, 50, 100, 250, 500];

  const givingOptions = [
    {
      label: 'Stock Gifts',
      subject: 'Inquiry about Stock Gifts',
      body: 'Hello,\n\nI am interested in learning more about donating stock or securities to SupportWorks Housing. Could you please provide information about how to make a stock gift?\n\nThank you!'
    },
    {
      label: 'Corporate Partnerships',
      subject: 'Inquiry about Corporate Partnerships',
      body: 'Hello,\n\nI am interested in learning more about corporate partnership opportunities with SupportWorks Housing. Could you please provide information about how my organization can get involved?\n\nThank you!'
    },
    {
      label: 'Planned Giving',
      subject: 'Inquiry about Planned Giving',
      body: 'Hello,\n\nI am interested in learning more about planned giving options at SupportWorks Housing. Could you please provide information about legacy gifts and estate planning opportunities?\n\nThank you!'
    },
  ];

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePhone = (phone) => phone.replace(/\D/g, '').length >= 10;

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
      if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!validateEmail(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
      if (formData.phone && !validatePhone(formData.phone)) {
        newErrors.phone = 'Please enter a valid phone number';
      }
    }

    if (step === 2) {
      if (!formData.cardName.trim()) newErrors.cardName = 'Name on card is required';
      if (!cardComplete.cardNumber) newErrors.cardNumber = cardErrors.cardNumber || 'Card number is required';
      if (!cardComplete.cardExpiry) newErrors.cardExpiry = cardErrors.cardExpiry || 'Expiration date is required';
      if (!cardComplete.cardCvc) newErrors.cardCvc = cardErrors.cardCvc || 'CVC is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCardChange = (field) => (event) => {
    setCardComplete(prev => ({ ...prev, [field]: event.complete }));
    setCardErrors(prev => ({ ...prev, [field]: event.error ? event.error.message : null }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
    if (field === 'cardNumber' && event.brand) {
      setCardBrand(event.brand);
    }
  };

  const handleNext = async () => {
    if (currentStep === 0) {
      const donationAmount = formData.customAmount || formData.amount;
      window.gtag?.('event', 'begin_checkout', {
        currency: 'USD',
        value: Number(donationAmount),
        items: [{ item_name: `${formData.donationType} donation`, price: Number(donationAmount), quantity: 1 }],
      });
      setCurrentStep(1);
      return;
    }

    if (!validateStep(currentStep)) return;

    // Create PaymentIntent when moving from Step 1 to Step 2
    if (currentStep === 1) {
      // Skip PaymentIntent creation if Stripe isn't configured yet
      if (!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY) {
        console.warn('Stripe not configured — skipping PaymentIntent creation (preview mode)');
        setCurrentStep(2);
        return;
      }

      try {
        setIsSubmitting(true);
        setSubmitError(null);
        const donationAmount = formData.customAmount || formData.amount;
        const response = await fetch(`${API_BASE}/api/create-payment-intent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: donationAmount,
            donationType: formData.donationType,
            email: formData.email,
            name: `${formData.firstName} ${formData.lastName}`,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            zip: formData.zip,
          }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to initialize payment');

        setClientSecret(data.clientSecret);
        setPaymentIntentId(data.paymentIntentId);
        setCurrentStep(2);
      } catch (error) {
        console.error('PaymentIntent creation failed:', error);
        setSubmitError('Unable to initialize payment. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
    setErrors({});
    setSubmitError(null);
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleAmountClick = (amount) => {
    updateField('amount', amount);
    updateField('customAmount', '');
  };

  const handleCustomChange = (e) => {
    updateField('customAmount', e.target.value);
    updateField('amount', null);
  };

  const handleGivingOptionClick = (option) => {
    const mailtoUrl = `mailto:${ADMIN_EMAIL}?subject=${encodeURIComponent(option.subject)}&body=${encodeURIComponent(option.body)}`;
    window.location.href = mailtoUrl;
  };

  const handleSubmit = async () => {
    if (!stripe || !elements) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Confirm card payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardNumberElement),
            billing_details: {
              name: formData.cardName,
              email: formData.email,
              phone: formData.phone || undefined,
              address: formData.address ? {
                line1: formData.address,
                city: formData.city,
                state: formData.state,
                postal_code: formData.zip,
              } : undefined,
            },
          },
        }
      );

      if (stripeError) {
        setSubmitError(stripeError.message);
        setIsSubmitting(false);
        return;
      }

      if (paymentIntent.status !== 'succeeded') {
        setSubmitError('Payment was not completed. Please try again.');
        setIsSubmitting(false);
        return;
      }

      // Retrieve card details from the server
      let cardLast4 = '••••';
      let confirmedBrand = cardBrand;
      try {
        const cardResp = await fetch(`${API_BASE}/api/get-card-details`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentMethodId: paymentIntent.payment_method }),
        });
        const cardData = await cardResp.json();
        if (cardData.last4) cardLast4 = cardData.last4;
        if (cardData.brand) confirmedBrand = cardData.brand;
      } catch (e) {
        // Non-critical, fall back to what we have
      }

      setConfirmedPayment({
        id: paymentIntent.id,
        last4: cardLast4,
        brand: confirmedBrand,
      });

      // Payment succeeded — send email notification
      const donationAmount = formData.customAmount || formData.amount;
      const donationTypeText = formData.donationType === 'monthly' ? 'Monthly' : 'One-time';

      const brandDisplay = formatCardBrand(confirmedBrand);
      const contentHtml =
        tableRow('Amount', `<strong>$${donationAmount}</strong> (${donationTypeText})`) +
        tableRow('Card', `•••• •••• •••• ${cardLast4} (${brandDisplay})`) +
        tableRow('Donor', `<strong>${formData.firstName} ${formData.lastName}</strong><br><a href="mailto:${formData.email}" style="color: #9B1B5D;">${formData.email}</a>${formData.phone ? '<br>' + formData.phone : ''}`) +
        (formData.address ? tableRow('Address', `${formData.address}, ${formData.city}, ${formData.state} ${formData.zip}`) : '') +
        `<tr>
          <td colspan="2" style="padding: 16px 0 0; font-size: 12px; color: #6B7280; text-align: center;">
            🔒 Processed securely by Stripe • Transaction ID: ${paymentIntent.id}
          </td>
        </tr>`;

      const emailHtml = buildEmailHTML({
        title: 'Donation Received',
        intro: 'A new donation has been processed through Stripe on the SupportWorks Housing website.',
        contentHtml,
      });

      const templateParams = {
        email_subject: `Donation Received: $${donationAmount} from ${formData.firstName} ${formData.lastName}`,
        email_html: emailHtml,
        reply_to: formData.email,
      };

      // Fire EmailJS as fallback admin notification (non-blocking).
      // Primary admin + donor thank-you emails are sent by the Stripe webhook (api/stripe-webhook.js).
      emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE, templateParams, EMAILJS_PUBLIC_KEY)
        .catch(err => console.error('EmailJS fallback error (non-blocking):', err));

      // Bloomerang CRM recording is handled by the Stripe webhook (api/stripe-webhook.js)

      window.gtag?.('event', 'purchase', {
        currency: 'USD',
        value: Number(donationAmount),
        transaction_id: paymentIntent.id,
        items: [{ item_name: `${formData.donationType} donation`, price: Number(donationAmount), quantity: 1 }],
      });

      setIsSubmitted(true);
    } catch (error) {
      console.error('Payment error:', error);
      setSubmitError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setIsSubmitted(false);
    setCurrentStep(0);
    setClientSecret(null);
    setPaymentIntentId(null);
    setCardBrand(null);
    setConfirmedPayment(null);
    setCardComplete({ cardNumber: false, cardExpiry: false, cardCvc: false });
    setCardErrors({ cardNumber: null, cardExpiry: null, cardCvc: null });
    setFormData({
      donationType: 'one-time',
      amount: 100,
      customAmount: '',
      startDate: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      cardName: '',
    });
    setErrors({});
  };

  const displayAmount = formData.customAmount || formData.amount;
  const formatCardBrand = (brand) => {
    if (!brand || brand === 'unknown') return 'Card';
    return brand.charAt(0).toUpperCase() + brand.slice(1);
  };

  // Success screen
  if (isSubmitted) {
    return (
      <section id="donate" className="donate section">
        <div className="container">
          <div className="donate-header">
            <div className="donate-heart">
              <Heart size={32} color="#9B1B5D" fill="#9B1B5D" />
            </div>
            <h2>Thank You!</h2>
            <p>Your generosity makes a real difference.</p>
          </div>

          <div className="donate-container">
            <div className="donate-card">
              <div className="donate-success-details">
                <div className="donate-success-amount">${displayAmount}</div>
                <p className="donate-success-type">
                  {formData.donationType === 'monthly' ? 'Monthly donation' : 'One-time donation'}
                </p>
              </div>

              {confirmedPayment && (
                <div className="donate-review-section" style={{ marginBottom: 16 }}>
                  <div className="donate-review-item">
                    <strong>Card:</strong>
                    <span>•••• •••• •••• {confirmedPayment.last4} ({formatCardBrand(confirmedPayment.brand)})</span>
                  </div>
                </div>
              )}

              <div className="donate-next-steps">
                <h4>What happens next?</h4>
                <ol>
                  <li>You'll receive a confirmation email at {formData.email}</li>
                  <li>Your tax-deductible receipt will arrive within 24 hours</li>
                  <li>Your donation goes directly to supporting our residents</li>
                </ol>
              </div>

              {confirmedPayment && (
                <div className="donate-secure" style={{ marginTop: 16 }}>
                  <Lock size={14} />
                  <span>Transaction processed securely by Stripe • ID: {confirmedPayment.id}</span>
                </div>
              )}

              <button className="donate-btn" style={{ marginTop: 16 }} onClick={resetForm}>
                Make Another Donation
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Step 0: Amount selection (initial view)
  if (currentStep === 0) {
    return (
      <section id="donate" className="donate section">
        <div className="container">
          <div className="donate-header">
            <div className="donate-heart">
              <Heart size={32} color="#9B1B5D" fill="#9B1B5D" />
            </div>
            <h2>Make an Impact Today</h2>
            <p>
              Your donation directly supports Virginians in need. Every contribution helps
              provide stable housing and comprehensive support services.
            </p>
          </div>

          <div className="donate-container">
            <div className="donate-card">
              <div className="donation-type-section">
                <div className="donation-type-toggle">
                  <button
                    className={`donation-type-btn ${formData.donationType === 'one-time' ? 'active' : ''}`}
                    onClick={() => updateField('donationType', 'one-time')}
                  >
                    One-Time
                  </button>
                  <button
                    className={`donation-type-btn ${formData.donationType === 'monthly' ? 'active' : ''}`}
                    onClick={() => updateField('donationType', 'monthly')}
                  >
                    Monthly
                  </button>
                </div>
              </div>

              <div className="amount-section">
                <label className="amount-label">Select an amount:</label>
                <div className="amount-buttons">
                  {amounts.map((amount) => (
                    <button
                      key={amount}
                      className={`amount-btn ${formData.amount === amount && !formData.customAmount ? 'selected' : ''}`}
                      onClick={() => handleAmountClick(amount)}
                    >
                      ${amount}
                    </button>
                  ))}
                </div>
              </div>

              <div className="custom-amount">
                <label className="amount-label">Or enter a custom amount:</label>
                <div className="custom-input-wrapper">
                  <span className="currency">$</span>
                  <input
                    type="number"
                    placeholder="Enter amount"
                    value={formData.customAmount}
                    onChange={handleCustomChange}
                    className="custom-input"
                  />
                </div>
              </div>

              {formData.donationType === 'monthly' && (
                <div className="start-date-section">
                  <label className="amount-label">
                    <Calendar size={16} />
                    Starting on:
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => updateField('startDate', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="start-date-input"
                  />
                </div>
              )}

              <button className="donate-btn" onClick={handleNext}>
                Continue with ${displayAmount}{formData.donationType === 'monthly' ? '/month' : ''}
              </button>

              <div className="donate-secure">
                <Lock size={14} />
                <span>Donations are securely processed using Stripe • Tax-deductible</span>
              </div>
            </div>
          </div>

          <div className="giving-options">
            <p>More ways to support our mission:</p>
            <div className="giving-buttons">
              {givingOptions.map((option) => (
                <button
                  key={option.label}
                  className="giving-btn"
                  onClick={() => handleGivingOptionClick(option)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Steps 1-3: Wizard flow
  const totalSteps = 3;

  return (
    <section id="donate" className="donate section">
      <div className="container">
        <div className="donate-header">
          <div className="donate-heart">
            <Heart size={32} color="#9B1B5D" fill="#9B1B5D" />
          </div>
          <h2>Complete Your Donation</h2>
          <p>
            ${displayAmount}{formData.donationType === 'monthly' ? '/month' : ''} to SupportWorks Housing
          </p>
        </div>

        <div className="donate-container">
          <div className="donate-progress">
            <div className="donate-progress-text">Step {currentStep} of {totalSteps}</div>
            <div className="donate-progress-bar">
              <div className="donate-progress-fill" style={{ width: `${(currentStep / totalSteps) * 100}%` }} />
            </div>
          </div>

          <div className="donate-card">
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <div className="donate-step">
                <div className="donate-step-header">
                  <div className="donate-step-icon">
                    <User size={24} color="#9B1B5D" />
                  </div>
                  <div>
                    <h3>Personal Information</h3>
                    <p>Tell us a bit about yourself</p>
                  </div>
                </div>

                <div className="donate-form-row">
                  <div className="donate-form-group">
                    <label htmlFor="firstName">First Name *</label>
                    <input
                      type="text"
                      id="firstName"
                      placeholder="First name"
                      value={formData.firstName}
                      onChange={(e) => updateField('firstName', e.target.value)}
                      className={errors.firstName ? 'error' : ''}
                    />
                    {errors.firstName && <span className="donate-error">{errors.firstName}</span>}
                  </div>

                  <div className="donate-form-group">
                    <label htmlFor="lastName">Last Name *</label>
                    <input
                      type="text"
                      id="lastName"
                      placeholder="Last name"
                      value={formData.lastName}
                      onChange={(e) => updateField('lastName', e.target.value)}
                      className={errors.lastName ? 'error' : ''}
                    />
                    {errors.lastName && <span className="donate-error">{errors.lastName}</span>}
                  </div>
                </div>

                <div className="donate-form-row">
                  <div className="donate-form-group">
                    <label htmlFor="email">Email *</label>
                    <input
                      type="email"
                      id="email"
                      placeholder="email@example.com"
                      value={formData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      className={errors.email ? 'error' : ''}
                    />
                    {errors.email && <span className="donate-error">{errors.email}</span>}
                  </div>

                  <div className="donate-form-group">
                    <label htmlFor="phone">Phone</label>
                    <input
                      type="tel"
                      id="phone"
                      placeholder="(555)123-4567"
                      value={formData.phone}
                      onChange={(e) => updateField('phone', formatPhone(e.target.value))}
                      className={errors.phone ? 'error' : ''}
                    />
                    {errors.phone && <span className="donate-error">{errors.phone}</span>}
                  </div>
                </div>

                <div className="donate-form-group">
                  <label htmlFor="address">Address (for tax receipt)</label>
                  <input
                    type="text"
                    id="address"
                    placeholder="Street address"
                    value={formData.address}
                    onChange={(e) => updateField('address', e.target.value)}
                  />
                </div>

                <div className="donate-form-row three-col">
                  <div className="donate-form-group">
                    <label htmlFor="city">City</label>
                    <input
                      type="text"
                      id="city"
                      placeholder="City"
                      value={formData.city}
                      onChange={(e) => updateField('city', e.target.value)}
                    />
                  </div>

                  <div className="donate-form-group">
                    <label htmlFor="state">State</label>
                    <input
                      type="text"
                      id="state"
                      placeholder="VA"
                      value={formData.state}
                      onChange={(e) => updateField('state', e.target.value)}
                      maxLength={2}
                    />
                  </div>

                  <div className="donate-form-group">
                    <label htmlFor="zip">ZIP</label>
                    <input
                      type="text"
                      id="zip"
                      placeholder="12345"
                      value={formData.zip}
                      onChange={(e) => updateField('zip', e.target.value)}
                      maxLength={5}
                    />
                  </div>
                </div>

                {submitError && <div className="donate-submit-error">{submitError}</div>}
              </div>
            )}

            {/* Step 2: Payment Information — kept mounted on Step 3 so Stripe Elements stay in DOM */}
            {(currentStep === 2 || currentStep === 3) && (
              <div className="donate-step" style={currentStep === 3 ? { display: 'none' } : undefined}>
                <div className="donate-step-header">
                  <div className="donate-step-icon">
                    <CreditCard size={24} color="#9B1B5D" />
                  </div>
                  <div>
                    <h3>Payment Information</h3>
                    <p>Enter your payment details</p>
                  </div>
                </div>

                <div className="donate-secure-badge">
                  <ShieldCheck size={20} />
                  <div className="donate-secure-text">
                    <span className="donate-secure-title">Secure payment powered by Stripe</span>
                    <span className="donate-secure-detail">Your payment details are encrypted and never stored on our servers</span>
                  </div>
                </div>

                <div className="donate-form-group">
                  <label htmlFor="cardName">Name on Card *</label>
                  <input
                    type="text"
                    id="cardName"
                    placeholder="Name as it appears on card"
                    value={formData.cardName}
                    onChange={(e) => updateField('cardName', e.target.value)}
                    className={errors.cardName ? 'error' : ''}
                  />
                  {errors.cardName && <span className="donate-error">{errors.cardName}</span>}
                </div>

                <div className="donate-form-row card-row">
                  {import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ? (
                    <>
                      <div className="donate-form-group card-number">
                        <label>Card Number *</label>
                        <div className={`stripe-element-wrapper ${errors.cardNumber ? 'error' : ''}`}>
                          <CardNumberElement options={{ ...CARD_ELEMENT_OPTIONS, showIcon: true, disableLink: true }} onChange={handleCardChange('cardNumber')} />
                        </div>
                        {errors.cardNumber && <span className="donate-error">{errors.cardNumber}</span>}
                      </div>

                      <div className="donate-form-group card-expiry">
                        <label>Expiration *</label>
                        <div className={`stripe-element-wrapper ${errors.cardExpiry ? 'error' : ''}`}>
                          <CardExpiryElement options={CARD_ELEMENT_OPTIONS} onChange={handleCardChange('cardExpiry')} />
                        </div>
                        {errors.cardExpiry && <span className="donate-error">{errors.cardExpiry}</span>}
                      </div>

                      <div className="donate-form-group card-cvc">
                        <label>CVC *</label>
                        <div className={`stripe-element-wrapper stripe-cvc-wrapper ${errors.cardCvc ? 'error' : ''}`}>
                          <CardCvcElement options={CARD_ELEMENT_OPTIONS} onChange={handleCardChange('cardCvc')} />
                          <svg className="cvc-icon" width="24" height="18" viewBox="0 0 24 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="0.5" y="0.5" width="23" height="17" rx="2.5" stroke="#6B7280" />
                            <rect y="3" width="24" height="4" fill="#6B7280" />
                            <rect x="3" y="10" width="14" height="3" rx="1" fill="#E5E7EB" />
                            <rect x="14" y="10" width="6" height="3" rx="1" fill="#9B1B5D" />
                          </svg>
                        </div>
                        {errors.cardCvc && <span className="donate-error">{errors.cardCvc}</span>}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="donate-form-group card-number">
                        <label>Card Number *</label>
                        <input type="text" placeholder="1234 5678 9012 3456" disabled />
                      </div>

                      <div className="donate-form-group card-expiry">
                        <label>Expiration *</label>
                        <input type="text" placeholder="MM / YY" disabled />
                      </div>

                      <div className="donate-form-group card-cvc">
                        <label>CVC *</label>
                        <input type="text" placeholder="CVC" disabled />
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Review & Submit */}
            {currentStep === 3 && (
              <div className="donate-step">
                <div className="donate-step-header">
                  <div className="donate-step-icon">
                    <CheckCircle size={24} color="#9B1B5D" />
                  </div>
                  <div>
                    <h3>Review & Submit</h3>
                    <p>Please review your donation before submitting</p>
                  </div>
                </div>

                <div className="donate-review-container">
                  <div className="donate-review-section">
                    <h4>Donation & Payment</h4>
                    <div className="donate-review-item">
                      <strong>Amount:</strong>
                      <span>${displayAmount}{formData.donationType === 'monthly' ? '/month' : ' (one-time)'}</span>
                    </div>
                    {formData.donationType === 'monthly' && formData.startDate && (
                      <div className="donate-review-item">
                        <strong>Starting:</strong>
                        <span>{new Date(formData.startDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    )}
                    <div className="donate-review-item">
                      <strong>Card:</strong>
                      <span>{formData.cardName} ({formatCardBrand(cardBrand)})</span>
                    </div>
                  </div>

                  <div className="donate-review-section">
                    <h4>Your Information</h4>
                    <div className="donate-review-item"><strong>Name:</strong> <span>{formData.firstName} {formData.lastName}</span></div>
                    <div className="donate-review-item"><strong>Email:</strong> <span>{formData.email}</span></div>
                    {formData.phone && <div className="donate-review-item"><strong>Phone:</strong> <span>{formData.phone}</span></div>}
                    {formData.address && (
                      <div className="donate-review-item">
                        <strong>Address:</strong>
                        <span>{formData.address}, {formData.city}, {formData.state} {formData.zip}</span>
                      </div>
                    )}
                  </div>
                </div>

                {submitError && <div className="donate-submit-error">{submitError}</div>}
              </div>
            )}

            <div className="donate-wizard-actions">
              <button type="button" className="btn btn-outline" onClick={handleBack} disabled={isSubmitting}>
                <ArrowLeft size={18} />
                Back
              </button>
              <div style={{ flex: 1 }} />
              {currentStep < totalSteps ? (
                <button type="button" className="btn btn-primary" onClick={handleNext} disabled={isSubmitting}>
                  {isSubmitting ? 'Loading...' : 'Next'}
                  {!isSubmitting && <ArrowRight size={18} />}
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !stripe}
                >
                  {isSubmitting ? 'Processing...' : `Donate $${displayAmount}`}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Donate() {
  return (
    <Elements stripe={stripePromise}>
      <DonateForm />
    </Elements>
  );
}

export default Donate;
