import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader, AlertCircle } from 'lucide-react';
import { updateRequestStatus, getRequestById } from '../services/api';
import './ConfirmationPage.css';

function ConfirmationPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading'); // loading, success, error, invalid
  const [message, setMessage] = useState('');
  const [request, setRequest] = useState(null);

  const requestId = searchParams.get('id');
  const action = searchParams.get('action');

  useEffect(() => {
    handleConfirmation();
  }, [requestId, action]);

  const handleConfirmation = async () => {
    // Validate parameters
    if (!requestId || !action) {
      setStatus('invalid');
      setMessage('Invalid confirmation link. Missing required parameters.');
      return;
    }

    if (!['approve', 'deny'].includes(action)) {
      setStatus('invalid');
      setMessage('Invalid action specified. Action must be "approve" or "deny".');
      return;
    }

    try {
      // First, get the request details
      const requestData = await getRequestById(requestId);
      setRequest(requestData);

      // Check if already processed
      if (requestData.status !== 'pending') {
        setStatus('error');
        setMessage(
          `This request has already been ${requestData.status}. ` +
          `You cannot change the status once it has been processed.`
        );
        return;
      }

      // Update the status
      const newStatus = action === 'approve' ? 'approved' : 'denied';
      await updateRequestStatus(requestId, newStatus);

      setStatus('success');
      setMessage(
        action === 'approve'
          ? 'Request approved successfully! The volunteer will receive a confirmation email.'
          : 'Request denied. The volunteer will be notified.'
      );
    } catch (error) {
      console.error('Confirmation error:', error);
      setStatus('error');
      setMessage(error.message || 'Failed to process the request. Please try again or contact support.');
    }
  };

  const renderIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader className="icon-spin" size={64} color="#666" />;
      case 'success':
        return <CheckCircle size={64} color="#22c55e" />;
      case 'error':
        return <XCircle size={64} color="#ef4444" />;
      case 'invalid':
        return <AlertCircle size={64} color="#f59e0b" />;
      default:
        return null;
    }
  };

  const renderTitle = () => {
    switch (status) {
      case 'loading':
        return 'Processing Request...';
      case 'success':
        return action === 'approve' ? 'Request Approved!' : 'Request Denied';
      case 'error':
        return 'Error Processing Request';
      case 'invalid':
        return 'Invalid Link';
      default:
        return '';
    }
  };

  return (
    <div className="confirmation-page">
      <div className="confirmation-container">
        <div className="confirmation-icon">
          {renderIcon()}
        </div>

        <h1 className={`confirmation-title ${status}`}>
          {renderTitle()}
        </h1>

        <p className="confirmation-message">
          {message}
        </p>

        {request && status === 'success' && (
          <div className="request-details">
            <h3>Request Details</h3>
            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">Volunteer:</span>
                <span className="detail-value">{request.name}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Email:</span>
                <span className="detail-value">{request.email}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Phone:</span>
                <span className="detail-value">{request.phone}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Preferred Date:</span>
                <span className="detail-value">
                  {new Date(request.preferred_date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Group Size:</span>
                <span className="detail-value">{request.group_size} people</span>
              </div>
              {request.organization && (
                <div className="detail-item">
                  <span className="detail-label">Organization:</span>
                  <span className="detail-value">{request.organization}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {request && status === 'error' && (
          <div className="request-details error">
            <h3>Request Information</h3>
            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">Volunteer:</span>
                <span className="detail-value">{request.name}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Current Status:</span>
                <span className="detail-value status-badge">{request.status}</span>
              </div>
            </div>
          </div>
        )}

        <div className="confirmation-actions">
          <Link to="/" className="btn-primary">
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ConfirmationPage;
