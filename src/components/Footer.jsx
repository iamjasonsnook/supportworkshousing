import { useState } from 'react';
import './Footer.css';

function Footer() {
  const [showPrivacy, setShowPrivacy] = useState(false);
  const quickLinks = [
    { label: 'What We Do', href: '#what-we-do' },
    { label: 'Our Impact', href: '#impact' },
    { label: 'Stories', href: '#stories' },
    { label: 'Donate', href: '#donate' },
  ];

  const locations = [
    { city: 'Charlottesville', phone: '(434) 227-4251' },
    { city: 'Richmond', phone: '(804) 788-6825' },
    { city: 'South Hampton Roads', phone: '(757) 275-8544' },
    { city: 'Fax', phone: '(804) 788-6827' },
  ];

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <a href="/" className="footer-logo">
              <img src={`${import.meta.env.BASE_URL}images/logo-white.svg`} alt="SupportWorks Housing" className="footer-logo-img" />
            </a>
            <p className="footer-tagline">
              Ending homelessness in Virginia through permanent housing and comprehensive support services.
            </p>
          </div>

          <div className="footer-links">
            <h4>Quick Links</h4>
            <ul>
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-contact">
            <h4>Contact Us</h4>
            <ul>
              {locations.map((location) => (
                <li key={location.city}>
                  <strong>{location.city}</strong>
                  <span>{location.phone}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>
            &copy; {new Date().getFullYear()} SupportWorks Housing. All rights reserved.
            <span className="footer-bottom-divider">|</span>
            <button className="footer-legal-link" onClick={() => setShowPrivacy(true)}>
              HMIS Privacy Notice
            </button>
          </p>
        </div>
      </div>

      {showPrivacy && (
        <div className="hmis-modal-overlay" onClick={() => setShowPrivacy(false)}>
          <div className="hmis-modal" onClick={e => e.stopPropagation()}>
            <button className="hmis-modal-close" onClick={() => setShowPrivacy(false)} aria-label="Close">&#x2715;</button>
            <h2>HMIS Client Privacy Statement</h2>

            <h3>South Hampton Roads</h3>
            <p>We collect personal information directly from you for the reasons that are discussed in our Notice of Privacy Practices. We may be required to collect some personal information by law or by organizations that give us money to operate this program.</p>
            <p>Other personal information that we collect is important to run our programs, to improve services for homeless persons, and to better understand the needs of homeless persons. We only collect information that we consider to be appropriate.</p>
            <p>The collection and use of all personal information is guided by strict standards of confidentiality. A copy of our Notice of Privacy Practices is available to all Clients upon request.</p>

            <h3>Richmond</h3>
            <p>We collect personal information directly from you for reasons that are discussed in our privacy statement. We may be required to collect some personal information by law or by organizations that give us money to operate this program.</p>
            <p>Other personal information that we collect is important to run our programs, to improve services for people experiencing homelessness, and to better understand the needs of homeless persons.</p>
            <p>We only collect information that we consider to be appropriate. A privacy notice is available by request.</p>
          </div>
        </div>
      )}
    </footer>
  );
}

export default Footer;
