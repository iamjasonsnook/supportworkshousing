import { useState } from 'react';
import { Heart, Lock, ArrowLeft, ArrowRight, CheckCircle, User, Mail, Phone, CreditCard, Calendar, Building } from 'lucide-react';
import emailjs from '@emailjs/browser';
import { buildEmailHTML, tableRow } from '../utils/emailTemplate';
import './Donate.css';

// EmailJS Configuration
const EMAILJS_SERVICE_ID = 'service_EmailJSBrevo';
const EMAILJS_PUBLIC_KEY = '76TcHTUs1bvcN68kM';
const EMAILJS_TEMPLATE = 'universal';

// Format phone number as (xxx)xxx-xxxx
const formatPhone = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 10);
  if (digits.length === 0) return '';
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)})${digits.slice(3)}`;
  return `(${digits.slice(0, 3)})${digits.slice(3, 6)}-${digits.slice(6)}`;
};

function Donate() {
  const [currentStep, setCurrentStep] = useState(0); // 0 = amount selection, 1 = personal info, 2 = payment, 3 = review
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const [formData, setFormData] = useState({
    // Donation details
    donationType: 'one-time', // 'one-time' or 'monthly'
    amount: 100,
    customAmount: '',
    // Personal info
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    // Payment info (stubbed)
    cardNumber: '',
    cardExpiry: '',
    cardCvc: '',
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
      if (!formData.cardNumber.trim()) newErrors.cardNumber = 'Card number is required';
      if (!formData.cardExpiry.trim()) newErrors.cardExpiry = 'Expiration date is required';
      if (!formData.cardCvc.trim()) newErrors.cardCvc = 'CVC is required';
      if (!formData.cardName.trim()) newErrors.cardName = 'Name on card is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 0 || validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
    setErrors({});
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
    const mailtoUrl = `mailto:jsnook@supportworkshousing.org?subject=${encodeURIComponent(option.subject)}&body=${encodeURIComponent(option.body)}`;
    window.location.href = mailtoUrl;
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const donationAmount = formData.customAmount || formData.amount;
    const donationTypeText = formData.donationType === 'monthly' ? 'Monthly' : 'One-time';

    // Build full email HTML
    const contentHtml =
      tableRow('Amount', `<strong>$${donationAmount}</strong> (${donationTypeText})`) +
      tableRow('Card', `•••• •••• •••• ${formData.cardNumber.slice(-4)}`) +
      tableRow('Donor', `<strong>${formData.firstName} ${formData.lastName}</strong><br><a href="mailto:${formData.email}" style="color: #9B1B5D;">${formData.email}</a>${formData.phone ? '<br>' + formData.phone : ''}`) +
      (formData.address ? tableRow('Address', `${formData.address}, ${formData.city}, ${formData.state} ${formData.zip}`, true) : '') +
      `<tr>
        <td colspan="2" style="padding: 12px 0; font-size: 12px; color: #92400e; background-color: #fef3c7; text-align: center; border-radius: 4px;">
          <strong>Note:</strong> This is a demo submission. No actual payment was processed.
        </td>
      </tr>`;

    const emailHtml = buildEmailHTML({
      title: 'Donation Received',
      intro: 'A new donation has been submitted through the SupportWorks Housing website. This is a notification for internal records.',
      contentHtml,
    });

    const templateParams = {
      email_subject: `Donation Received: $${donationAmount} from ${formData.firstName} ${formData.lastName}`,
      email_html: emailHtml,
      reply_to: formData.email,
    };

    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE,
        templateParams,
        EMAILJS_PUBLIC_KEY
      );
      setIsSubmitted(true);
    } catch (error) {
      console.error('EmailJS error:', error);
      setSubmitError(error.text || 'An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setIsSubmitted(false);
    setCurrentStep(0);
    setFormData({
      donationType: 'one-time',
      amount: 100,
      customAmount: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      cardNumber: '',
      cardExpiry: '',
      cardCvc: '',
      cardName: '',
    });
    setErrors({});
  };

  const displayAmount = formData.customAmount || formData.amount;

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

              <div className="donate-next-steps">
                <h4>What happens next?</h4>
                <ol>
                  <li>You'll receive a confirmation email at {formData.email}</li>
                  <li>Your tax-deductible receipt will arrive within 24 hours</li>
                  <li>Your donation goes directly to supporting our residents</li>
                </ol>
              </div>

              <button className="donate-btn" onClick={resetForm}>
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

              <button className="donate-btn" onClick={handleNext}>
                Continue with ${displayAmount}{formData.donationType === 'monthly' ? '/month' : ''}
              </button>

              <div className="donate-secure">
                <Lock size={14} />
                <span>Secure payment processing • Tax-deductible donation</span>
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
              </div>
            )}

            {/* Step 2: Payment Information */}
            {currentStep === 2 && (
              <div className="donate-step">
                <div className="donate-step-header">
                  <div className="donate-step-icon">
                    <CreditCard size={24} color="#9B1B5D" />
                  </div>
                  <div>
                    <h3>Payment Information</h3>
                    <p>Enter your payment details</p>
                  </div>
                </div>

                <div className="donate-stub-notice">
                  <Lock size={16} />
                  <span>This is a demo. No actual payment will be processed.</span>
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
                  <div className="donate-form-group card-number">
                    <label htmlFor="cardNumber">Card Number *</label>
                    <input
                      type="text"
                      id="cardNumber"
                      placeholder="1234 5678 9012 3456"
                      value={formData.cardNumber}
                      onChange={(e) => updateField('cardNumber', e.target.value.replace(/\D/g, '').slice(0, 16))}
                      className={errors.cardNumber ? 'error' : ''}
                    />
                    {errors.cardNumber && <span className="donate-error">{errors.cardNumber}</span>}
                  </div>

                  <div className="donate-form-group card-expiry">
                    <label htmlFor="cardExpiry">Expiration *</label>
                    <input
                      type="text"
                      id="cardExpiry"
                      placeholder="MM/YY"
                      value={formData.cardExpiry}
                      onChange={(e) => {
                        let val = e.target.value.replace(/\D/g, '').slice(0, 4);
                        if (val.length > 2) val = val.slice(0, 2) + '/' + val.slice(2);
                        updateField('cardExpiry', val);
                      }}
                      className={errors.cardExpiry ? 'error' : ''}
                    />
                    {errors.cardExpiry && <span className="donate-error">{errors.cardExpiry}</span>}
                  </div>

                  <div className="donate-form-group card-cvc">
                    <label htmlFor="cardCvc">CVC *</label>
                    <input
                      type="text"
                      id="cardCvc"
                      placeholder="123"
                      value={formData.cardCvc}
                      onChange={(e) => updateField('cardCvc', e.target.value.replace(/\D/g, '').slice(0, 4))}
                      className={errors.cardCvc ? 'error' : ''}
                    />
                    {errors.cardCvc && <span className="donate-error">{errors.cardCvc}</span>}
                  </div>
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
                    <div className="donate-review-item">
                      <strong>Card:</strong>
                      <span>•••• •••• •••• {formData.cardNumber.slice(-4)}</span>
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
                <button type="button" className="btn btn-primary" onClick={handleNext}>
                  Next
                  <ArrowRight size={18} />
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
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

export default Donate;
