import { useState, useEffect } from 'react';
import { Calendar, Users, ChefHat, CheckCircle, ArrowLeft, ArrowRight, MapPin, Phone, Mail, User, Hash, ChevronRight, Utensils, Package, Heart, Truck } from 'lucide-react';
import emailjs from '@emailjs/browser';
import './GetInvolved.css';

// EmailJS Configuration
const EMAILJS_SERVICE_ID = 'service_EmailJSBrevo';
const EMAILJS_PUBLIC_KEY = '76TcHTUs1bvcN68kM';
const EMAILJS_CN_TEMPLATE = 'connection_night';
const EMAILJS_SD_TEMPLATE = 'supply_drive';

const API_BASE = import.meta.env.DEV ? 'http://localhost:3001' : '';

// Supply items organized by category
const supplyCategories = [
  {
    name: 'Cleaning Supplies',
    items: [
      'All-purpose cleaner',
      'Dish soap',
      'Laundry detergent',
      'Disinfecting wipes',
      'Trash bags',
      'Paper towels',
      'Sponges',
    ]
  },
  {
    name: 'Toiletries',
    items: [
      'Toilet paper',
      'Shampoo',
      'Conditioner',
      'Body wash/soap',
      'Toothpaste',
      'Toothbrushes',
      'Deodorant',
      'Feminine hygiene products',
    ]
  },
  {
    name: 'Linens',
    items: [
      'Bath towels',
      'Washcloths',
      'Twin sheets',
      'Pillows',
      'Blankets',
    ]
  },
  {
    name: 'Non-Perishable Food',
    items: [
      'Canned vegetables',
      'Canned soup',
      'Pasta',
      'Rice',
      'Peanut butter',
      'Cereal',
      'Canned tuna/chicken',
      'Cooking oil',
    ]
  }
];

function GetInvolved({
  locations = [{ id: 'clay-house', name: 'New Clay House', address: '707 N Harrison St, Richmond, VA 23220' }],
  timeSlotsByLocation = {}
}) {
  const [opportunityType, setOpportunityType] = useState(null); // null, 'connection-night', 'supply-drive'
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [datePage, setDatePage] = useState(0);
  const [bookedDates, setBookedDates] = useState([]);

  // Connection Night form data
  const [cnFormData, setCnFormData] = useState({
    locationId: '',
    timeSlotId: '',
    groupName: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    groupSize: '',
    foodPlan: '',
    activityPlan: '',
  });

  // Supply Drive form data
  const [sdFormData, setSdFormData] = useState({
    locationId: '',
    dropOffDate: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    selectedItems: [],
    otherItems: '',
  });

  const [errors, setErrors] = useState({});

  // Fetch booked dates on mount
  useEffect(() => {
    const fetchBookedDates = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/booked-dates`);
        if (response.ok) {
          const data = await response.json();
          setBookedDates(data.bookedDates || []);
        }
      } catch (err) {
        console.error('Failed to fetch booked dates:', err);
      }
    };
    fetchBookedDates();
  }, []);

  // Generate Friday drop-off dates for the next 2 months
  const generateFridayDates = () => {
    const dates = [];
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + 7); // Start 1 week out

    const endDate = new Date(today);
    endDate.setMonth(today.getMonth() + 2);

    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      if (currentDate.getDay() === 5) { // Friday
        const month = currentDate.toLocaleDateString('en-US', { month: 'long' });
        const day = currentDate.getDate();
        dates.push({
          id: `fri-${month.toLowerCase().slice(0, 3)}-${day}`,
          day: `Friday, ${month} ${day}`,
          time: '9:00 AM - 5:00 PM'
        });
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
  };

  const fridayDates = generateFridayDates();

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePhone = (phone) => phone.replace(/\D/g, '').length >= 10;

  // Connection Night validation
  const validateCNStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!cnFormData.locationId) newErrors.locationId = 'Please select a location';
      if (!cnFormData.timeSlotId) newErrors.timeSlotId = 'Please select a time slot';
    }

    if (step === 2) {
      if (!cnFormData.contactName.trim()) newErrors.contactName = 'Contact name is required';
      if (!cnFormData.contactEmail.trim()) {
        newErrors.contactEmail = 'Contact email is required';
      } else if (!validateEmail(cnFormData.contactEmail)) {
        newErrors.contactEmail = 'Please enter a valid email address';
      }
      if (!cnFormData.contactPhone.trim()) {
        newErrors.contactPhone = 'Contact phone is required';
      } else if (!validatePhone(cnFormData.contactPhone)) {
        newErrors.contactPhone = 'Please enter a valid phone number';
      }
      if (!cnFormData.groupSize) {
        newErrors.groupSize = 'Estimated group size is required';
      } else if (cnFormData.groupSize < 1 || cnFormData.groupSize > 50) {
        newErrors.groupSize = 'Group size must be between 1 and 50';
      }
      if (!cnFormData.groupName.trim()) {
        newErrors.groupName = 'Group/Organization name is required';
      }
    }

    if (step === 3) {
      if (!cnFormData.foodPlan) newErrors.foodPlan = 'Please select a food plan';
      if (!cnFormData.activityPlan) newErrors.activityPlan = 'Please select an activity';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Supply Drive validation
  const validateSDStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!sdFormData.locationId) newErrors.locationId = 'Please select a location';
      if (!sdFormData.dropOffDate) newErrors.dropOffDate = 'Please select a drop-off date';
    }

    if (step === 2) {
      if (!sdFormData.contactName.trim()) newErrors.contactName = 'Contact name is required';
      if (!sdFormData.contactEmail.trim()) {
        newErrors.contactEmail = 'Contact email is required';
      } else if (!validateEmail(sdFormData.contactEmail)) {
        newErrors.contactEmail = 'Please enter a valid email address';
      }
      if (!sdFormData.contactPhone.trim()) {
        newErrors.contactPhone = 'Contact phone is required';
      } else if (!validatePhone(sdFormData.contactPhone)) {
        newErrors.contactPhone = 'Please enter a valid phone number';
      }
    }

    if (step === 3) {
      if (sdFormData.selectedItems.length === 0 && !sdFormData.otherItems.trim()) {
        newErrors.selectedItems = 'Please select at least one item or describe what you\'ll bring';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    const isValid = opportunityType === 'connection-night'
      ? validateCNStep(currentStep)
      : validateSDStep(currentStep);

    if (isValid) {
      const maxSteps = opportunityType === 'connection-night' ? 4 : 4;
      setCurrentStep(prev => Math.min(prev + 1, maxSteps));
    }
  };

  const handleBack = () => {
    if (currentStep === 1) {
      setOpportunityType(null);
      setErrors({});
    } else {
      setCurrentStep(prev => prev - 1);
    }
  };

  const updateCNField = (field, value) => {
    setCnFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const updateSDField = (field, value) => {
    setSdFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const toggleSupplyItem = (item) => {
    setSdFormData(prev => ({
      ...prev,
      selectedItems: prev.selectedItems.includes(item)
        ? prev.selectedItems.filter(i => i !== item)
        : [...prev.selectedItems, item]
    }));
    if (errors.selectedItems) setErrors(prev => ({ ...prev, selectedItems: null }));
  };

  // Submit Connection Night
  const handleCNSubmit = async () => {
    if (!validateCNStep(4)) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const selectedLocation = locations.find(loc => loc.id === cnFormData.locationId);
    const locationSlots = timeSlotsByLocation[cnFormData.locationId] || [];
    const selectedTimeSlot = locationSlots.find(slot => slot.id === cnFormData.timeSlotId);

    const foodPlanText = cnFormData.foodPlan === 'bring' ? 'Bring food' : 'Cater/deliver food';
    const activityPlanMap = {
      'board-games': 'Board games',
      'bingo': 'Bingo',
      'trivia': 'Trivia',
      'crafts': 'Crafts',
      'other': 'Other'
    };
    const activityPlanText = activityPlanMap[cnFormData.activityPlan] || cnFormData.activityPlan;

    const templateParams = {
      group_name: cnFormData.groupName,
      contact_name: cnFormData.contactName,
      contact_email: cnFormData.contactEmail,
      contact_phone: cnFormData.contactPhone,
      group_size: cnFormData.groupSize,
      date_time: `${selectedTimeSlot?.day}, ${selectedTimeSlot?.time}`,
      location: selectedLocation?.name,
      address: selectedLocation?.address,
      food_plan: foodPlanText,
      activity: activityPlanText,
      reply_to: cnFormData.contactEmail,
    };

    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_CN_TEMPLATE,
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

  // Submit Supply Drive
  const handleSDSubmit = async () => {
    if (!validateSDStep(4)) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const selectedLocation = locations.find(loc => loc.id === sdFormData.locationId);
    const selectedDate = fridayDates.find(d => d.id === sdFormData.dropOffDate);

    // Format items as bullet list for email
    const itemsList = sdFormData.selectedItems.length > 0
      ? sdFormData.selectedItems.map(item => `• ${item}`).join('<br>')
      : 'None selected';

    const otherItemsText = sdFormData.otherItems
      ? `<br><em style="color: #666;">Other: ${sdFormData.otherItems}</em>`
      : '';

    const templateParams = {
      contact_name: sdFormData.contactName,
      contact_email: sdFormData.contactEmail,
      contact_phone: sdFormData.contactPhone,
      date_time: `${selectedDate?.day}, ${selectedDate?.time}`,
      location: selectedLocation?.name,
      address: selectedLocation?.address,
      items_list: itemsList,
      other_items: otherItemsText,
      reply_to: sdFormData.contactEmail,
    };

    try {
      // Submit to our API for admin tracking
      await fetch(`${API_BASE}/api/supply-drives`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location_id: sdFormData.locationId,
          location_name: selectedLocation?.name,
          location_address: selectedLocation?.address,
          drop_off_date: selectedDate?.day,
          drop_off_time: selectedDate?.time,
          contact_name: sdFormData.contactName,
          contact_email: sdFormData.contactEmail,
          contact_phone: sdFormData.contactPhone,
          selected_items: sdFormData.selectedItems,
          other_items: sdFormData.otherItems,
        })
      });

      // Send email via EmailJS
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_SD_TEMPLATE,
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
    setOpportunityType(null);
    setCurrentStep(1);
    setCnFormData({
      locationId: '',
      timeSlotId: '',
      groupName: '',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      groupSize: '',
      foodPlan: '',
      activityPlan: '',
    });
    setSdFormData({
      locationId: '',
      dropOffDate: '',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      selectedItems: [],
      otherItems: '',
    });
    setErrors({});
  };

  // Success screen
  if (isSubmitted) {
    return (
      <section id="get-involved" className="get-involved section">
        <div className="container">
          <div className="gi-header">
            <div className="gi-header-icon">
              <Heart size={32} color="#9B1B5D" />
            </div>
            <h2>Get Involved</h2>
            <p>Thank you for supporting our residents and mission.</p>
          </div>

          <div className="gi-wizard-container">
            <div className="gi-wizard-card">
              <div className="gi-step">
                <div className="gi-step-header">
                  <div className="gi-step-icon">
                    <CheckCircle size={24} color="#9B1B5D" />
                  </div>
                  <div>
                    <h3>Request Submitted!</h3>
                    <p>Thank you for your {opportunityType === 'connection-night' ? 'Connection Night' : 'Supply Drive'} submission</p>
                  </div>
                </div>

                <div className="gi-next-steps">
                  <h4>What happens next?</h4>
                  <ol>
                    <li>Check your email for a confirmation with your request details</li>
                    <li>Our team will review your submission</li>
                    <li>Once approved, you'll receive a confirmation email</li>
                    {opportunityType === 'connection-night' && (
                      <li>Three days before the event, you'll receive a reminder</li>
                    )}
                  </ol>
                </div>
              </div>

              <div className="gi-wizard-actions">
                <div style={{ flex: 1 }} />
                <button type="button" className="btn btn-primary" onClick={resetForm}>
                  Submit Another Request
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Opportunity selection screen
  if (!opportunityType) {
    return (
      <section id="get-involved" className="get-involved section">
        <div className="container">
          <div className="gi-header">
            <div className="gi-header-icon">
              <Heart size={32} color="#9B1B5D" />
            </div>
            <h2>Get Involved</h2>
            <p>
              Join us in making a difference. Whether you want to host a community event
              or donate essential supplies, every contribution helps our residents thrive.
            </p>
          </div>

          <div className="gi-opportunity-grid">
            <button
              className="gi-opportunity-card"
              onClick={() => { setOpportunityType('connection-night'); setCurrentStep(1); }}
            >
              <div className="gi-opportunity-icon">
                <Utensils size={40} />
              </div>
              <h3>Connection Nights</h3>
              <p>Host an evening of food, fun, and fellowship with our residents. Bring your group for dinner and activities.</p>
              <span className="gi-opportunity-cta">
                Schedule a Night <ChevronRight size={18} />
              </span>
            </button>

            <button
              className="gi-opportunity-card"
              onClick={() => { setOpportunityType('supply-drive'); setCurrentStep(1); }}
            >
              <div className="gi-opportunity-icon">
                <Package size={40} />
              </div>
              <h3>Supply Drives</h3>
              <p>Donate essential items like toiletries, cleaning supplies, linens, and non-perishable food for our residents.</p>
              <span className="gi-opportunity-cta">
                Schedule a Drop-Off <ChevronRight size={18} />
              </span>
            </button>
          </div>
        </div>
      </section>
    );
  }

  const selectedLocation = locations.find(loc => loc.id === (opportunityType === 'connection-night' ? cnFormData.locationId : sdFormData.locationId));
  const allTimeSlots = cnFormData.locationId ? timeSlotsByLocation[cnFormData.locationId] || [] : [];
  const availableTimeSlots = allTimeSlots.filter(slot => !bookedDates.includes(slot.day));
  const startIdx = datePage * 5;
  const visibleSlots = availableTimeSlots.slice(startIdx, startIdx + 5);
  const hasMoreDates = availableTimeSlots.length > startIdx + 5;

  // Supply drive dates
  const sdStartIdx = datePage * 5;
  const visibleFridays = fridayDates.slice(sdStartIdx, sdStartIdx + 5);
  const hasMoreFridays = fridayDates.length > sdStartIdx + 5;

  const totalSteps = 4;

  return (
    <section id="get-involved" className="get-involved section">
      <div className="container">
        <div className="gi-header">
          <div className="gi-header-icon">
            {opportunityType === 'connection-night' ? (
              <Utensils size={32} color="#9B1B5D" />
            ) : (
              <Package size={32} color="#9B1B5D" />
            )}
          </div>
          <h2>{opportunityType === 'connection-night' ? 'Host a Connection Night' : 'Schedule a Supply Drop-Off'}</h2>
          <p>
            {opportunityType === 'connection-night'
              ? 'Sign up your volunteer group to host an evening of community at one of our properties.'
              : 'Schedule a time to drop off donated supplies at one of our properties.'}
          </p>
        </div>

        <div className="gi-wizard-container">
          <div className="gi-progress">
            <div className="gi-progress-text">Step {currentStep} of {totalSteps}</div>
            <div className="gi-progress-bar">
              <div className="gi-progress-fill" style={{ width: `${(currentStep / totalSteps) * 100}%` }} />
            </div>
          </div>

          <div className="gi-wizard-card">
            {/* CONNECTION NIGHT STEPS */}
            {opportunityType === 'connection-night' && (
              <>
                {currentStep === 1 && (
                  <div className="gi-step">
                    <div className="gi-step-header">
                      <div className="gi-step-icon"><Calendar size={24} color="#9B1B5D" /></div>
                      <div>
                        <h3>Choose Location & Time</h3>
                        <p>Select where and when you'd like to host your Connection Night</p>
                      </div>
                    </div>

                    <div className="gi-form-group">
                      <label><MapPin size={18} /> Select Location</label>
                      <div className="gi-location-tiles">
                        {locations.map(location => (
                          <button
                            key={location.id}
                            type="button"
                            className={`gi-location-tile ${cnFormData.locationId === location.id ? 'selected' : ''}`}
                            onClick={() => { updateCNField('locationId', location.id); updateCNField('timeSlotId', ''); setDatePage(0); }}
                          >
                            <div className="gi-location-tile-icon"><MapPin size={24} color="#9B1B5D" /></div>
                            <div className="gi-location-tile-content">
                              <strong>{location.name}</strong>
                              <span>{location.address}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                      {errors.locationId && <span className="gi-error">{errors.locationId}</span>}
                    </div>

                    {cnFormData.locationId && (
                      <div className="gi-form-group">
                        <label><Calendar size={18} /> Available Time Slots</label>
                        <div className="gi-time-slots">
                          {visibleSlots.map(slot => (
                            <button
                              key={slot.id}
                              type="button"
                              className={`gi-time-slot ${cnFormData.timeSlotId === slot.id ? 'selected' : ''}`}
                              onClick={() => updateCNField('timeSlotId', slot.id)}
                            >
                              <strong>{slot.day}</strong>
                              <span>{slot.time}</span>
                            </button>
                          ))}
                          {hasMoreDates && (
                            <button type="button" className="gi-time-slot gi-more-dates" onClick={() => setDatePage(prev => prev + 1)}>
                              <strong>More Dates</strong>
                              <ChevronRight size={20} />
                            </button>
                          )}
                        </div>
                        {datePage > 0 && (
                          <button type="button" className="gi-back-dates" onClick={() => setDatePage(prev => prev - 1)}>
                            <ArrowLeft size={16} /> Back to earlier dates
                          </button>
                        )}
                        {errors.timeSlotId && <span className="gi-error">{errors.timeSlotId}</span>}
                      </div>
                    )}
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="gi-step">
                    <div className="gi-step-header">
                      <div className="gi-step-icon"><Users size={24} color="#9B1B5D" /></div>
                      <div>
                        <h3>Group Information</h3>
                        <p>Tell us about your volunteer group and primary contact</p>
                      </div>
                    </div>

                    <div className="gi-form-group">
                      <label htmlFor="cn-groupName"><Users size={18} /> Group/Organization Name</label>
                      <input
                        type="text"
                        id="cn-groupName"
                        placeholder="Enter your group or organization name"
                        value={cnFormData.groupName}
                        onChange={(e) => updateCNField('groupName', e.target.value)}
                        className={errors.groupName ? 'error' : ''}
                      />
                      {errors.groupName && <span className="gi-error">{errors.groupName}</span>}
                    </div>

                    <div className="gi-form-row">
                      <div className="gi-form-group">
                        <label htmlFor="cn-contactName"><User size={18} /> Primary Contact Name</label>
                        <input
                          type="text"
                          id="cn-contactName"
                          placeholder="Full name"
                          value={cnFormData.contactName}
                          onChange={(e) => updateCNField('contactName', e.target.value)}
                          className={errors.contactName ? 'error' : ''}
                        />
                        {errors.contactName && <span className="gi-error">{errors.contactName}</span>}
                      </div>

                      <div className="gi-form-group">
                        <label htmlFor="cn-groupSize"><Hash size={18} /> Estimated Group Size</label>
                        <input
                          type="number"
                          id="cn-groupSize"
                          placeholder="1-50"
                          min="1"
                          max="50"
                          value={cnFormData.groupSize}
                          onChange={(e) => updateCNField('groupSize', e.target.value)}
                          className={errors.groupSize ? 'error' : ''}
                        />
                        {errors.groupSize && <span className="gi-error">{errors.groupSize}</span>}
                      </div>
                    </div>

                    <div className="gi-form-row">
                      <div className="gi-form-group">
                        <label htmlFor="cn-contactEmail"><Mail size={18} /> Primary Contact Email</label>
                        <input
                          type="email"
                          id="cn-contactEmail"
                          placeholder="email@example.com"
                          value={cnFormData.contactEmail}
                          onChange={(e) => updateCNField('contactEmail', e.target.value)}
                          className={errors.contactEmail ? 'error' : ''}
                        />
                        {errors.contactEmail && <span className="gi-error">{errors.contactEmail}</span>}
                      </div>

                      <div className="gi-form-group">
                        <label htmlFor="cn-contactPhone"><Phone size={18} /> Primary Contact Phone</label>
                        <input
                          type="tel"
                          id="cn-contactPhone"
                          placeholder="(555) 123-4567"
                          value={cnFormData.contactPhone}
                          onChange={(e) => updateCNField('contactPhone', e.target.value)}
                          className={errors.contactPhone ? 'error' : ''}
                        />
                        {errors.contactPhone && <span className="gi-error">{errors.contactPhone}</span>}
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="gi-step">
                    <div className="gi-step-header">
                      <div className="gi-step-icon"><ChefHat size={24} color="#9B1B5D" /></div>
                      <div>
                        <h3>Meal & Activity Plan</h3>
                        <p>Share your plans for food and activities during the Connection Night</p>
                      </div>
                    </div>

                    <div className="gi-form-group">
                      <label>Food Plan</label>
                      <div className="gi-radio-group">
                        <label className="gi-radio">
                          <input type="radio" name="foodPlan" value="bring" checked={cnFormData.foodPlan === 'bring'} onChange={(e) => updateCNField('foodPlan', e.target.value)} />
                          <span>Bring food</span>
                        </label>
                        <label className="gi-radio">
                          <input type="radio" name="foodPlan" value="cater" checked={cnFormData.foodPlan === 'cater'} onChange={(e) => updateCNField('foodPlan', e.target.value)} />
                          <span>Cater/deliver food</span>
                        </label>
                      </div>
                      {errors.foodPlan && <span className="gi-error">{errors.foodPlan}</span>}
                    </div>

                    <div className="gi-form-group">
                      <label>Activity Plan</label>
                      <div className="gi-radio-group">
                        {['board-games', 'bingo', 'trivia', 'crafts', 'other'].map(activity => (
                          <label key={activity} className="gi-radio">
                            <input type="radio" name="activityPlan" value={activity} checked={cnFormData.activityPlan === activity} onChange={(e) => updateCNField('activityPlan', e.target.value)} />
                            <span>{activity === 'board-games' ? 'Board games' : activity.charAt(0).toUpperCase() + activity.slice(1)}</span>
                          </label>
                        ))}
                      </div>
                      {errors.activityPlan && <span className="gi-error">{errors.activityPlan}</span>}
                    </div>
                  </div>
                )}

                {currentStep === 4 && (
                  <div className="gi-step">
                    <div className="gi-step-header">
                      <div className="gi-step-icon"><CheckCircle size={24} color="#9B1B5D" /></div>
                      <div>
                        <h3>Review & Submit</h3>
                        <p>Please review your information before submitting</p>
                      </div>
                    </div>

                    <div className="gi-review-container">
                      <div className="gi-review-section">
                        <h4>Activity Information</h4>
                        <div className="gi-review-item"><strong>Location:</strong> <span>{selectedLocation?.name}</span></div>
                        <div className="gi-review-item"><strong>Address:</strong> <span>{selectedLocation?.address}</span></div>
                        <div className="gi-review-item">
                          <strong>Date & Time:</strong>
                          <span>{availableTimeSlots.find(slot => slot.id === cnFormData.timeSlotId)?.day}, {availableTimeSlots.find(slot => slot.id === cnFormData.timeSlotId)?.time}</span>
                        </div>
                        <div className="gi-review-item"><strong>Food Plan:</strong> <span>{cnFormData.foodPlan === 'bring' ? 'Bring food' : 'Cater/deliver food'}</span></div>
                        <div className="gi-review-item"><strong>Activity:</strong> <span>{cnFormData.activityPlan === 'board-games' ? 'Board games' : cnFormData.activityPlan?.charAt(0).toUpperCase() + cnFormData.activityPlan?.slice(1)}</span></div>
                      </div>

                      <div className="gi-review-section">
                        <h4>Group Information</h4>
                        <div className="gi-review-item"><strong>Group Name:</strong> <span>{cnFormData.groupName}</span></div>
                        <div className="gi-review-item"><strong>Contact:</strong> <span>{cnFormData.contactName}</span></div>
                        <div className="gi-review-item"><strong>Email:</strong> <span>{cnFormData.contactEmail}</span></div>
                        <div className="gi-review-item"><strong>Phone:</strong> <span>{cnFormData.contactPhone}</span></div>
                        <div className="gi-review-item"><strong>Group Size:</strong> <span>{cnFormData.groupSize} people</span></div>
                      </div>
                    </div>

                    {submitError && <div className="gi-submit-error">{submitError}</div>}
                  </div>
                )}
              </>
            )}

            {/* SUPPLY DRIVE STEPS */}
            {opportunityType === 'supply-drive' && (
              <>
                {currentStep === 1 && (
                  <div className="gi-step">
                    <div className="gi-step-header">
                      <div className="gi-step-icon"><Truck size={24} color="#9B1B5D" /></div>
                      <div>
                        <h3>Choose Drop-Off Location & Date</h3>
                        <p>Select where and when you'd like to drop off your donation</p>
                      </div>
                    </div>

                    <div className="gi-form-group">
                      <label><MapPin size={18} /> Select Location</label>
                      <div className="gi-location-tiles">
                        {locations.map(location => (
                          <button
                            key={location.id}
                            type="button"
                            className={`gi-location-tile ${sdFormData.locationId === location.id ? 'selected' : ''}`}
                            onClick={() => { updateSDField('locationId', location.id); updateSDField('dropOffDate', ''); setDatePage(0); }}
                          >
                            <div className="gi-location-tile-icon"><MapPin size={24} color="#9B1B5D" /></div>
                            <div className="gi-location-tile-content">
                              <strong>{location.name}</strong>
                              <span>{location.address}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                      {errors.locationId && <span className="gi-error">{errors.locationId}</span>}
                    </div>

                    {sdFormData.locationId && (
                      <div className="gi-form-group">
                        <label><Calendar size={18} /> Available Drop-Off Dates (Fridays)</label>
                        <div className="gi-time-slots">
                          {visibleFridays.map(date => (
                            <button
                              key={date.id}
                              type="button"
                              className={`gi-time-slot ${sdFormData.dropOffDate === date.id ? 'selected' : ''}`}
                              onClick={() => updateSDField('dropOffDate', date.id)}
                            >
                              <strong>{date.day}</strong>
                              <span>{date.time}</span>
                            </button>
                          ))}
                          {hasMoreFridays && (
                            <button type="button" className="gi-time-slot gi-more-dates" onClick={() => setDatePage(prev => prev + 1)}>
                              <strong>More Dates</strong>
                              <ChevronRight size={20} />
                            </button>
                          )}
                        </div>
                        {datePage > 0 && (
                          <button type="button" className="gi-back-dates" onClick={() => setDatePage(prev => prev - 1)}>
                            <ArrowLeft size={16} /> Back to earlier dates
                          </button>
                        )}
                        {errors.dropOffDate && <span className="gi-error">{errors.dropOffDate}</span>}
                      </div>
                    )}
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="gi-step">
                    <div className="gi-step-header">
                      <div className="gi-step-icon"><User size={24} color="#9B1B5D" /></div>
                      <div>
                        <h3>Your Information</h3>
                        <p>Tell us how to contact you about your donation</p>
                      </div>
                    </div>

                    <div className="gi-form-group">
                      <label htmlFor="sd-contactName"><User size={18} /> Your Name</label>
                      <input
                        type="text"
                        id="sd-contactName"
                        placeholder="Full name"
                        value={sdFormData.contactName}
                        onChange={(e) => updateSDField('contactName', e.target.value)}
                        className={errors.contactName ? 'error' : ''}
                      />
                      {errors.contactName && <span className="gi-error">{errors.contactName}</span>}
                    </div>

                    <div className="gi-form-row">
                      <div className="gi-form-group">
                        <label htmlFor="sd-contactEmail"><Mail size={18} /> Email</label>
                        <input
                          type="email"
                          id="sd-contactEmail"
                          placeholder="email@example.com"
                          value={sdFormData.contactEmail}
                          onChange={(e) => updateSDField('contactEmail', e.target.value)}
                          className={errors.contactEmail ? 'error' : ''}
                        />
                        {errors.contactEmail && <span className="gi-error">{errors.contactEmail}</span>}
                      </div>

                      <div className="gi-form-group">
                        <label htmlFor="sd-contactPhone"><Phone size={18} /> Phone</label>
                        <input
                          type="tel"
                          id="sd-contactPhone"
                          placeholder="(555) 123-4567"
                          value={sdFormData.contactPhone}
                          onChange={(e) => updateSDField('contactPhone', e.target.value)}
                          className={errors.contactPhone ? 'error' : ''}
                        />
                        {errors.contactPhone && <span className="gi-error">{errors.contactPhone}</span>}
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="gi-step">
                    <div className="gi-step-header">
                      <div className="gi-step-icon"><Package size={24} color="#9B1B5D" /></div>
                      <div>
                        <h3>Items to Donate</h3>
                        <p>Select the items you plan to bring (select all that apply)</p>
                      </div>
                    </div>

                    {supplyCategories.map(category => (
                      <div key={category.name} className="gi-supply-category">
                        <h4>{category.name}</h4>
                        <div className="gi-supply-items">
                          {category.items.map(item => (
                            <label key={item} className={`gi-supply-item ${sdFormData.selectedItems.includes(item) ? 'selected' : ''}`}>
                              <input
                                type="checkbox"
                                checked={sdFormData.selectedItems.includes(item)}
                                onChange={() => toggleSupplyItem(item)}
                              />
                              <span>{item}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}

                    <div className="gi-form-group">
                      <label htmlFor="sd-otherItems">Other Items (optional)</label>
                      <textarea
                        id="sd-otherItems"
                        placeholder="Describe any other items you'd like to donate..."
                        value={sdFormData.otherItems}
                        onChange={(e) => updateSDField('otherItems', e.target.value)}
                        rows={3}
                      />
                    </div>

                    {errors.selectedItems && <span className="gi-error">{errors.selectedItems}</span>}
                  </div>
                )}

                {currentStep === 4 && (
                  <div className="gi-step">
                    <div className="gi-step-header">
                      <div className="gi-step-icon"><CheckCircle size={24} color="#9B1B5D" /></div>
                      <div>
                        <h3>Review & Submit</h3>
                        <p>Please review your information before submitting</p>
                      </div>
                    </div>

                    <div className="gi-review-container">
                      <div className="gi-review-section">
                        <h4>Drop-Off Details</h4>
                        <div className="gi-review-item"><strong>Location:</strong> <span>{selectedLocation?.name}</span></div>
                        <div className="gi-review-item"><strong>Address:</strong> <span>{selectedLocation?.address}</span></div>
                        <div className="gi-review-item">
                          <strong>Date & Time:</strong>
                          <span>{fridayDates.find(d => d.id === sdFormData.dropOffDate)?.day}, {fridayDates.find(d => d.id === sdFormData.dropOffDate)?.time}</span>
                        </div>
                      </div>

                      <div className="gi-review-section">
                        <h4>Contact Information</h4>
                        <div className="gi-review-item"><strong>Name:</strong> <span>{sdFormData.contactName}</span></div>
                        <div className="gi-review-item"><strong>Email:</strong> <span>{sdFormData.contactEmail}</span></div>
                        <div className="gi-review-item"><strong>Phone:</strong> <span>{sdFormData.contactPhone}</span></div>
                      </div>

                      <div className="gi-review-section gi-review-full-width">
                        <h4>Items to Donate</h4>
                        {sdFormData.selectedItems.length > 0 && (
                          <div className="gi-review-items-list">
                            {sdFormData.selectedItems.map(item => (
                              <span key={item} className="gi-review-item-tag">{item}</span>
                            ))}
                          </div>
                        )}
                        {sdFormData.otherItems && (
                          <div className="gi-review-item"><strong>Other:</strong> <span>{sdFormData.otherItems}</span></div>
                        )}
                      </div>
                    </div>

                    {submitError && <div className="gi-submit-error">{submitError}</div>}
                  </div>
                )}
              </>
            )}

            <div className="gi-wizard-actions">
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
                  onClick={opportunityType === 'connection-night' ? handleCNSubmit : handleSDSubmit}
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

export default GetInvolved;
