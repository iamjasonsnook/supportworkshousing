import { useState } from 'react';
import { Heart, Lock } from 'lucide-react';
import './Donate.css';

const GIVEBUTTER_CAMPAIGN_URL = null; // Replace with: 'https://givebutter.com/your-campaign'

function Donate() {
  const [selectedAmount, setSelectedAmount] = useState(100);
  const [customAmount, setCustomAmount] = useState('');

  const amounts = [25, 50, 100, 250, 500];

  const givingOptions = [
    {
      label: 'Monthly Giving',
      subject: 'Inquiry about Monthly Giving',
      body: 'Hello,\n\nI am interested in learning more about monthly giving opportunities at SupportWorks Housing. Could you please provide me with more information about how I can become a recurring donor?\n\nThank you!'
    },
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

  const handleAmountClick = (amount) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleCustomChange = (e) => {
    setCustomAmount(e.target.value);
    setSelectedAmount(null);
  };

  const handleGivingOptionClick = (option) => {
    const mailtoUrl = `mailto:jsnook@supportworkshousing.org?subject=${encodeURIComponent(option.subject)}&body=${encodeURIComponent(option.body)}`;
    window.location.href = mailtoUrl;
  };

  const handleDonate = () => {
    if (GIVEBUTTER_CAMPAIGN_URL) {
      const amount = customAmount || selectedAmount;
      window.open(`${GIVEBUTTER_CAMPAIGN_URL}?amount=${amount}`, '_blank');
    } else {
      window.open('https://supportworkshousing.org/donate/', '_blank');
    }
  };

  const displayAmount = customAmount || selectedAmount;

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
            <div className="amount-section">
              <label className="amount-label">Select an amount:</label>
              <div className="amount-buttons">
                {amounts.map((amount) => (
                  <button
                    key={amount}
                    className={`amount-btn ${selectedAmount === amount ? 'selected' : ''}`}
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
                  value={customAmount}
                  onChange={handleCustomChange}
                  className="custom-input"
                />
              </div>
            </div>

            <button className="donate-btn" onClick={handleDonate}>
              Donate ${displayAmount}
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

export default Donate;
