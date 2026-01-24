import { useState } from 'react';
import { Calendar, Users, ChefHat, CheckCircle, ArrowLeft, ArrowRight, MapPin, Phone, Mail, User, Hash } from 'lucide-react';
import './ConnectionNights.css';

function ConnectionNights({
  apiBaseUrl = '/api',
  locations = [{ id: 'clay-house', name: 'New Clay House', address: '707 N Harrison St, Richmond, VA 23220' }],
  timeSlotsByLocation = {
    'clay-house': [
      { id: 'tue-6pm', day: 'Tuesday', time: '6:00 PM - 8:00 PM' },
      { id: 'thu-6pm', day: 'Thursday', time: '6:00 PM - 8:00 PM' },
      { id: 'sat-5pm', day: 'Saturday', time: '5:00 PM - 7:00 PM' },
    ]
  },
  missionAdvancementEmail = 'advancement@supportworkshousing.org',
  propertyManagersByLocation = {
    'clay-house': 'manager@supportworkshousing.org'
  }
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    // Step 1
    locationId: '',
    timeSlotId: '',

    // Step 2
    isIndividual: false,
    groupName: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    groupSize: '',

    // Step 3
    foodPlan: '',
    activityPlan: '',

    // Step 4
    agreeToRequest: false,
    agreeToGuidelines: false,
  });

  // Validation errors
  const [errors, setErrors] = useState({});

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePhone = (phone) => {
    // Allow various phone formats
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10;
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.locationId) newErrors.locationId = 'Please select a location';
      if (!formData.timeSlotId) newErrors.timeSlotId = 'Please select a time slot';
    }

    if (step === 2) {
      if (!formData.contactName.trim()) newErrors.contactName = 'Contact name is required';
      if (!formData.contactEmail.trim()) {
        newErrors.contactEmail = 'Contact email is required';
      } else if (!validateEmail(formData.contactEmail)) {
        newErrors.contactEmail = 'Please enter a valid email address';
      }
      if (!formData.contactPhone.trim()) {
        newErrors.contactPhone = 'Contact phone is required';
      } else if (!validatePhone(formData.contactPhone)) {
        newErrors.contactPhone = 'Please enter a valid phone number';
      }
      if (!formData.groupSize) {
        newErrors.groupSize = 'Estimated group size is required';
      } else if (formData.groupSize < 1 || formData.groupSize > 50) {
        newErrors.groupSize = 'Group size must be between 1 and 50';
      }
      if (!formData.isIndividual && !formData.groupName.trim()) {
        newErrors.groupName = 'Group/Organization name is required';
      }
    }

    if (step === 3) {
      if (!formData.foodPlan) newErrors.foodPlan = 'Please select a food plan';
      if (!formData.activityPlan) newErrors.activityPlan = 'Please select an activity';
    }

    if (step === 4) {
      if (!formData.agreeToRequest) newErrors.agreeToRequest = 'You must acknowledge this is a request';
      if (!formData.agreeToGuidelines) newErrors.agreeToGuidelines = 'You must agree to follow guidelines';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const selectedLocation = locations.find(loc => loc.id === formData.locationId);
    const selectedTimeSlot = timeSlotsByLocation[formData.locationId]?.find(
      slot => slot.id === formData.timeSlotId
    );

    const payload = {
      location: {
        id: formData.locationId,
        name: selectedLocation?.name,
        address: selectedLocation?.address,
      },
      timeSlot: {
        id: formData.timeSlotId,
        day: selectedTimeSlot?.day,
        time: selectedTimeSlot?.time,
      },
      group: {
        isIndividual: formData.isIndividual,
        name: formData.isIndividual ? 'Individual' : formData.groupName,
        size: parseInt(formData.groupSize),
      },
      contact: {
        name: formData.contactName,
        email: formData.contactEmail,
        phone: formData.contactPhone,
      },
      event: {
        foodPlan: formData.foodPlan,
        activityPlan: formData.activityPlan,
      },
      recipients: {
        missionAdvancement: missionAdvancementEmail,
        propertyManager: propertyManagersByLocation[formData.locationId],
      },
      submittedAt: new Date().toISOString(),
    };

    try {
      const response = await fetch(`${apiBaseUrl}/connection-nights`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to submit request. Please try again.');
      }

      setIsSubmitted(true);
    } catch (error) {
      setSubmitError(error.message || 'An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <section id="connection-nights" className="connection-nights section">
        <div className="container">
          <div className="cn-success">
            <div className="cn-success-icon">
              <CheckCircle size={48} color="#9B1B5D" />
            </div>
            <h2>Request Submitted Successfully!</h2>
            <p>Thank you for volunteering to host a Connection Night. We've received your request and will review it shortly.</p>

            <div className="cn-success-card">
              <h3>What happens next?</h3>
              <ol>
                <li>You'll receive a confirmation email with your request details</li>
                <li>Our Mission Advancement team will review your request</li>
                <li>Once approved, you and the property manager will receive confirmation</li>
                <li>Three days before the event, everyone will receive a reminder</li>
              </ol>
            </div>

            <div className="cn-success-summary">
              <h3>Your Request Summary</h3>
              <div className="cn-summary-grid">
                <div className="cn-summary-item">
                  <strong>Location:</strong>
                  <span>{locations.find(loc => loc.id === formData.locationId)?.name}</span>
                </div>
                <div className="cn-summary-item">
                  <strong>Time Slot:</strong>
                  <span>
                    {timeSlotsByLocation[formData.locationId]?.find(slot => slot.id === formData.timeSlotId)?.day}{' '}
                    {timeSlotsByLocation[formData.locationId]?.find(slot => slot.id === formData.timeSlotId)?.time}
                  </span>
                </div>
                <div className="cn-summary-item">
                  <strong>Contact:</strong>
                  <span>{formData.contactName} ({formData.contactEmail})</span>
                </div>
                <div className="cn-summary-item">
                  <strong>Group Size:</strong>
                  <span>{formData.groupSize} people</span>
                </div>
              </div>
            </div>

            <button
              className="btn btn-primary"
              onClick={() => {
                setIsSubmitted(false);
                setCurrentStep(1);
                setFormData({
                  locationId: '',
                  timeSlotId: '',
                  isIndividual: false,
                  groupName: '',
                  contactName: '',
                  contactEmail: '',
                  contactPhone: '',
                  groupSize: '',
                  foodPlan: '',
                  activityPlan: '',
                  agreeToRequest: false,
                  agreeToGuidelines: false,
                });
              }}
            >
              Submit Another Request
            </button>
          </div>
        </div>
      </section>
    );
  }

  const selectedLocation = locations.find(loc => loc.id === formData.locationId);
  const availableTimeSlots = formData.locationId ? timeSlotsByLocation[formData.locationId] || [] : [];

  return (
    <section id="connection-nights" className="connection-nights section">
      <div className="container">
        <div className="cn-header">
          <h2>Host a Connection Night</h2>
          <p>
            Help create meaningful connections through shared meals and activities.
            Sign up your volunteer group to host an evening of community at one of our properties.
          </p>
        </div>

        <div className="cn-wizard-container">
          <div className="cn-progress">
            <div className="cn-progress-text">
              Step {currentStep} of 4
            </div>
            <div className="cn-progress-bar">
              <div
                className="cn-progress-fill"
                style={{ width: `${(currentStep / 4) * 100}%` }}
              />
            </div>
          </div>

          <div className="cn-wizard-card">
            {currentStep === 1 && (
              <div className="cn-step">
                <div className="cn-step-header">
                  <div className="cn-step-icon">
                    <Calendar size={24} color="#9B1B5D" />
                  </div>
                  <div>
                    <h3>Choose Location & Time</h3>
                    <p>Select where and when you'd like to host your Connection Night</p>
                  </div>
                </div>

                <div className="cn-form-group">
                  <label htmlFor="location">
                    <MapPin size={18} />
                    Location
                  </label>
                  <select
                    id="location"
                    value={formData.locationId}
                    onChange={(e) => {
                      updateField('locationId', e.target.value);
                      updateField('timeSlotId', ''); // Reset time slot when location changes
                    }}
                    className={errors.locationId ? 'error' : ''}
                  >
                    <option value="">Select a location...</option>
                    {locations.map(location => (
                      <option key={location.id} value={location.id}>
                        {location.name} - {location.address}
                      </option>
                    ))}
                  </select>
                  {errors.locationId && <span className="cn-error">{errors.locationId}</span>}
                </div>

                {formData.locationId && (
                  <div className="cn-form-group">
                    <label htmlFor="timeSlot">
                      <Calendar size={18} />
                      Available Time Slots
                    </label>
                    <div className="cn-time-slots">
                      {availableTimeSlots.map(slot => (
                        <button
                          key={slot.id}
                          type="button"
                          className={`cn-time-slot ${formData.timeSlotId === slot.id ? 'selected' : ''}`}
                          onClick={() => updateField('timeSlotId', slot.id)}
                        >
                          <strong>{slot.day}</strong>
                          <span>{slot.time}</span>
                        </button>
                      ))}
                    </div>
                    {errors.timeSlotId && <span className="cn-error">{errors.timeSlotId}</span>}
                  </div>
                )}
              </div>
            )}

            {currentStep === 2 && (
              <div className="cn-step">
                <div className="cn-step-header">
                  <div className="cn-step-icon">
                    <Users size={24} color="#9B1B5D" />
                  </div>
                  <div>
                    <h3>Group Information</h3>
                    <p>Tell us about your volunteer group and primary contact</p>
                  </div>
                </div>

                <div className="cn-form-group">
                  <label>Are you volunteering as an individual or group?</label>
                  <div className="cn-radio-group">
                    <label className="cn-radio">
                      <input
                        type="radio"
                        name="volunteerType"
                        checked={!formData.isIndividual}
                        onChange={() => updateField('isIndividual', false)}
                      />
                      <span>Group/Organization</span>
                    </label>
                    <label className="cn-radio">
                      <input
                        type="radio"
                        name="volunteerType"
                        checked={formData.isIndividual}
                        onChange={() => updateField('isIndividual', true)}
                      />
                      <span>Individual</span>
                    </label>
                  </div>
                </div>

                {!formData.isIndividual && (
                  <div className="cn-form-group">
                    <label htmlFor="groupName">
                      <Users size={18} />
                      Group/Organization Name
                    </label>
                    <input
                      type="text"
                      id="groupName"
                      placeholder="Enter your group or organization name"
                      value={formData.groupName}
                      onChange={(e) => updateField('groupName', e.target.value)}
                      className={errors.groupName ? 'error' : ''}
                    />
                    {errors.groupName && <span className="cn-error">{errors.groupName}</span>}
                  </div>
                )}

                <div className="cn-form-row">
                  <div className="cn-form-group">
                    <label htmlFor="contactName">
                      <User size={18} />
                      Primary Contact Name
                    </label>
                    <input
                      type="text"
                      id="contactName"
                      placeholder="Full name"
                      value={formData.contactName}
                      onChange={(e) => updateField('contactName', e.target.value)}
                      className={errors.contactName ? 'error' : ''}
                    />
                    {errors.contactName && <span className="cn-error">{errors.contactName}</span>}
                  </div>

                  <div className="cn-form-group">
                    <label htmlFor="groupSize">
                      <Hash size={18} />
                      Estimated Group Size
                    </label>
                    <input
                      type="number"
                      id="groupSize"
                      placeholder="1-50"
                      min="1"
                      max="50"
                      value={formData.groupSize}
                      onChange={(e) => updateField('groupSize', e.target.value)}
                      className={errors.groupSize ? 'error' : ''}
                    />
                    {errors.groupSize && <span className="cn-error">{errors.groupSize}</span>}
                  </div>
                </div>

                <div className="cn-form-row">
                  <div className="cn-form-group">
                    <label htmlFor="contactEmail">
                      <Mail size={18} />
                      Primary Contact Email
                    </label>
                    <input
                      type="email"
                      id="contactEmail"
                      placeholder="email@example.com"
                      value={formData.contactEmail}
                      onChange={(e) => updateField('contactEmail', e.target.value)}
                      className={errors.contactEmail ? 'error' : ''}
                    />
                    {errors.contactEmail && <span className="cn-error">{errors.contactEmail}</span>}
                  </div>

                  <div className="cn-form-group">
                    <label htmlFor="contactPhone">
                      <Phone size={18} />
                      Primary Contact Phone
                    </label>
                    <input
                      type="tel"
                      id="contactPhone"
                      placeholder="(555) 123-4567"
                      value={formData.contactPhone}
                      onChange={(e) => updateField('contactPhone', e.target.value)}
                      className={errors.contactPhone ? 'error' : ''}
                    />
                    {errors.contactPhone && <span className="cn-error">{errors.contactPhone}</span>}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="cn-step">
                <div className="cn-step-header">
                  <div className="cn-step-icon">
                    <ChefHat size={24} color="#9B1B5D" />
                  </div>
                  <div>
                    <h3>Meal & Activity Plan</h3>
                    <p>Share your plans for food and activities during the Connection Night</p>
                  </div>
                </div>

                <div className="cn-form-group">
                  <label>Food Plan</label>
                  <div className="cn-radio-group">
                    <label className="cn-radio">
                      <input
                        type="radio"
                        name="foodPlan"
                        value="bring"
                        checked={formData.foodPlan === 'bring'}
                        onChange={(e) => updateField('foodPlan', e.target.value)}
                      />
                      <span>Bring food</span>
                    </label>
                    <label className="cn-radio">
                      <input
                        type="radio"
                        name="foodPlan"
                        value="cater"
                        checked={formData.foodPlan === 'cater'}
                        onChange={(e) => updateField('foodPlan', e.target.value)}
                      />
                      <span>Cater/deliver food</span>
                    </label>
                    <label className="cn-radio">
                      <input
                        type="radio"
                        name="foodPlan"
                        value="guidance"
                        checked={formData.foodPlan === 'guidance'}
                        onChange={(e) => updateField('foodPlan', e.target.value)}
                      />
                      <span>Request guidance</span>
                    </label>
                  </div>
                  {errors.foodPlan && <span className="cn-error">{errors.foodPlan}</span>}
                </div>

                <div className="cn-form-group">
                  <label>Activity Plan</label>
                  <div className="cn-radio-group">
                    <label className="cn-radio">
                      <input
                        type="radio"
                        name="activityPlan"
                        value="board-games"
                        checked={formData.activityPlan === 'board-games'}
                        onChange={(e) => updateField('activityPlan', e.target.value)}
                      />
                      <span>Board games</span>
                    </label>
                    <label className="cn-radio">
                      <input
                        type="radio"
                        name="activityPlan"
                        value="bingo"
                        checked={formData.activityPlan === 'bingo'}
                        onChange={(e) => updateField('activityPlan', e.target.value)}
                      />
                      <span>Bingo</span>
                    </label>
                    <label className="cn-radio">
                      <input
                        type="radio"
                        name="activityPlan"
                        value="trivia"
                        checked={formData.activityPlan === 'trivia'}
                        onChange={(e) => updateField('activityPlan', e.target.value)}
                      />
                      <span>Trivia</span>
                    </label>
                    <label className="cn-radio">
                      <input
                        type="radio"
                        name="activityPlan"
                        value="crafts"
                        checked={formData.activityPlan === 'crafts'}
                        onChange={(e) => updateField('activityPlan', e.target.value)}
                      />
                      <span>Crafts</span>
                    </label>
                    <label className="cn-radio">
                      <input
                        type="radio"
                        name="activityPlan"
                        value="other"
                        checked={formData.activityPlan === 'other'}
                        onChange={(e) => updateField('activityPlan', e.target.value)}
                      />
                      <span>Other</span>
                    </label>
                  </div>
                  {errors.activityPlan && <span className="cn-error">{errors.activityPlan}</span>}
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="cn-step">
                <div className="cn-step-header">
                  <div className="cn-step-icon">
                    <CheckCircle size={24} color="#9B1B5D" />
                  </div>
                  <div>
                    <h3>Review & Submit</h3>
                    <p>Please review your information before submitting</p>
                  </div>
                </div>

                <div className="cn-review-container">
                  <div className="cn-review-section">
                    <h4>Location & Time</h4>
                    <div className="cn-review-item">
                      <strong>Location:</strong>
                      <span>{selectedLocation?.name}</span>
                    </div>
                    <div className="cn-review-item">
                      <strong>Address:</strong>
                      <span>{selectedLocation?.address}</span>
                    </div>
                    <div className="cn-review-item">
                      <strong>Time Slot:</strong>
                      <span>
                        {availableTimeSlots.find(slot => slot.id === formData.timeSlotId)?.day}{' '}
                        {availableTimeSlots.find(slot => slot.id === formData.timeSlotId)?.time}
                      </span>
                    </div>
                  </div>

                  <div className="cn-review-section">
                    <h4>Group Information</h4>
                    <div className="cn-review-item">
                      <strong>Type:</strong>
                      <span>{formData.isIndividual ? 'Individual' : 'Group/Organization'}</span>
                    </div>
                    {!formData.isIndividual && (
                      <div className="cn-review-item">
                        <strong>Group Name:</strong>
                        <span>{formData.groupName}</span>
                      </div>
                    )}
                    <div className="cn-review-item">
                      <strong>Contact:</strong>
                      <span>{formData.contactName}</span>
                    </div>
                    <div className="cn-review-item">
                      <strong>Email:</strong>
                      <span>{formData.contactEmail}</span>
                    </div>
                    <div className="cn-review-item">
                      <strong>Phone:</strong>
                      <span>{formData.contactPhone}</span>
                    </div>
                    <div className="cn-review-item">
                      <strong>Group Size:</strong>
                      <span>{formData.groupSize} people</span>
                    </div>
                  </div>

                  <div className="cn-review-section">
                    <h4>Meal & Activity Plan</h4>
                    <div className="cn-review-item">
                      <strong>Food Plan:</strong>
                      <span>
                        {formData.foodPlan === 'bring' && 'Bring food'}
                        {formData.foodPlan === 'cater' && 'Cater/deliver food'}
                        {formData.foodPlan === 'guidance' && 'Request guidance'}
                      </span>
                    </div>
                    <div className="cn-review-item">
                      <strong>Activity:</strong>
                      <span>
                        {formData.activityPlan === 'board-games' && 'Board games'}
                        {formData.activityPlan === 'bingo' && 'Bingo'}
                        {formData.activityPlan === 'trivia' && 'Trivia'}
                        {formData.activityPlan === 'crafts' && 'Crafts'}
                        {formData.activityPlan === 'other' && 'Other'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="cn-form-group">
                  <label className={`cn-checkbox ${errors.agreeToRequest ? 'error' : ''}`}>
                    <input
                      type="checkbox"
                      checked={formData.agreeToRequest}
                      onChange={(e) => updateField('agreeToRequest', e.target.checked)}
                    />
                    <span>
                      I understand this is a request and is not confirmed until SupportWorks approves.
                    </span>
                  </label>
                  {errors.agreeToRequest && <span className="cn-error">{errors.agreeToRequest}</span>}
                </div>

                <div className="cn-form-group">
                  <label className={`cn-checkbox ${errors.agreeToGuidelines ? 'error' : ''}`}>
                    <input
                      type="checkbox"
                      checked={formData.agreeToGuidelines}
                      onChange={(e) => updateField('agreeToGuidelines', e.target.checked)}
                    />
                    <span>
                      I agree to follow onsite guidelines provided by SupportWorks.
                    </span>
                  </label>
                  {errors.agreeToGuidelines && <span className="cn-error">{errors.agreeToGuidelines}</span>}
                </div>

                {submitError && (
                  <div className="cn-submit-error">
                    {submitError}
                  </div>
                )}
              </div>
            )}

            <div className="cn-wizard-actions">
              {currentStep > 1 && (
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleBack}
                  disabled={isSubmitting}
                >
                  <ArrowLeft size={18} />
                  Back
                </button>
              )}
              <div style={{ flex: 1 }} />
              {currentStep < 4 ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleNext}
                >
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
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ConnectionNights;
