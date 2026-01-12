import { useState } from 'react';
import { Heart, Home, Users, Gift, Lock } from 'lucide-react';
import './Donate.css';

// =============================================================================
// GIVEBUTTER INTEGRATION PLACEHOLDER
// =============================================================================
// To connect this form to Givebutter:
//
// Option 1: Direct Link (simplest)
//   - Create a campaign at givebutter.com
//   - Replace GIVEBUTTER_CAMPAIGN_URL below with your campaign URL
//   - Example: https://givebutter.com/supportworkshousing
//
// Option 2: Givebutter Embed Widget
//   - Add this script to index.html: <script src="https://givebutter.com/js/widget.js"></script>
//   - Replace the donate-card div with: <givebutter-widget id="YOUR_CAMPAIGN_ID"></givebutter-widget>
//
// Option 3: Givebutter Popup
//   - Add script to index.html (same as above)
//   - Add to button: data-givebutter-checkout="YOUR_CAMPAIGN_ID"
// =============================================================================

const GIVEBUTTER_CAMPAIGN_URL = null; // Replace with: 'https://givebutter.com/your-campaign'

function Donate() {
  const [selectedAmount, setSelectedAmount] = useState(100);
  const [customAmount, setCustomAmount] = useState('');

  const amounts = [25, 50, 100, 250, 500];

  const impactItems = [
    { icon: Home, amount: '$50', description: 'Provides welcome home essentials for a new resident' },
    { icon: Users, amount: '$100', description: 'Funds a month of case management support services' },
    { icon: Gift, amount: '$250', description: 'Supplies job training resources and interview preparation' },
  ];

  const givingOptions = ['Monthly Giving', 'Corporate Partnerships', 'Planned Giving'];

  const handleAmountClick = (amount) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleCustomChange = (e) => {
    setCustomAmount(e.target.value);
    setSelectedAmount(null);
  };

  const handleDonate = () => {
    if (GIVEBUTTER_CAMPAIGN_URL) {
      // Append amount to Givebutter URL if supported
      const amount = customAmount || selectedAmount;
      window.open(`${GIVEBUTTER_CAMPAIGN_URL}?amount=${amount}`, '_blank');
    } else {
      // Fallback to existing donation page until Givebutter is configured
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

        <div className="impact-section">
          <h3>Your Impact</h3>
          <div className="impact-items">
            {impactItems.map((item) => (
              <div key={item.amount} className="impact-item">
                <div className="impact-item-icon">
                  <item.icon size={20} color="#9B1B5D" />
                </div>
                <span className="impact-amount">{item.amount}</span>
                <p>{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="giving-options">
          <p>Want to explore other ways to support our mission?</p>
          <div className="giving-buttons">
            {givingOptions.map((option) => (
              <button key={option} className="giving-btn">
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Donate;
