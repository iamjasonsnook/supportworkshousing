import { useState } from 'react';
import { Calendar, Users, Mail, Phone, Send, CheckCircle } from 'lucide-react';
import { submitVolunteerRequest } from '../services/api';
import './ConnectionNights.css';

function ConnectionNights() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    preferredDate: '',
    groupSize: '',
    organization: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await submitVolunteerRequest(formData);
      setIsSubmitted(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        preferredDate: '',
        groupSize: '',
        organization: '',
        notes: ''
      });
    } catch (err) {
      setError(err.message || 'Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <section id="connection-nights" className="connection-nights section">
        <div className="container">
          <div className="success-message">
            <div className="success-icon">
              <CheckCircle size={64} color="#9B1B5D" />
            </div>
            <h2>Thank You!</h2>
            <p>
              Your volunteer request has been received. You should receive a confirmation
              email shortly. Someone from SupportWorks Housing will review your request
              and be in touch soon to confirm the details.
            </p>
            <button
              className="btn-secondary"
              onClick={() => setIsSubmitted(false)}
            >
              Submit Another Request
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="connection-nights" className="connection-nights section">
      <div className="container">
        <div className="connection-header">
          <div className="connection-icon">
            <Calendar size={32} color="#9B1B5D" />
          </div>
          <h2>Connection Nights</h2>
          <p>
            Join us for Connection Nights - a meaningful way to engage with our community.
            Bring your group for an evening of connection, service, and impact. Fill out
            the form below to request a Connection Night for your organization.
          </p>
        </div>

        <div className="connection-card">
          <form onSubmit={handleSubmit} className="connection-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">
                  <Users size={18} />
                  <span>Contact Name *</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your full name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="organization">
                  <Users size={18} />
                  <span>Organization</span>
                </label>
                <input
                  type="text"
                  id="organization"
                  name="organization"
                  value={formData.organization}
                  onChange={handleChange}
                  placeholder="Church, company, or group name"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email">
                  <Mail size={18} />
                  <span>Email Address *</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your.email@example.com"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">
                  <Phone size={18} />
                  <span>Phone Number *</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="(555) 123-4567"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="preferredDate">
                  <Calendar size={18} />
                  <span>Preferred Date *</span>
                </label>
                <input
                  type="date"
                  id="preferredDate"
                  name="preferredDate"
                  value={formData.preferredDate}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="groupSize">
                  <Users size={18} />
                  <span>Group Size *</span>
                </label>
                <input
                  type="number"
                  id="groupSize"
                  name="groupSize"
                  value={formData.groupSize}
                  onChange={handleChange}
                  placeholder="Expected number of volunteers"
                  min="1"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="notes">
                <span>Additional Notes</span>
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Any special requests, dietary restrictions, or additional information..."
                rows="4"
              />
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                'Submitting...'
              ) : (
                <>
                  <Send size={18} />
                  <span>Submit Request</span>
                </>
              )}
            </button>

            <p className="form-note">
              * Required fields. You'll receive a confirmation email once your request is submitted.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}

export default ConnectionNights;
