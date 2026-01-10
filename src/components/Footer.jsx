import { Facebook, Instagram, Twitter, Youtube, Linkedin } from 'lucide-react';
import './Footer.css';

function Footer() {
  const quickLinks = [
    { label: 'What We Do', href: '#what-we-do' },
    { label: 'Our Impact', href: '#impact' },
    { label: 'Stories', href: '#stories' },
    { label: 'Donate', href: '#donate' },
  ];

  const locations = [
    { city: 'Charlottesville', phone: '(434) 295-8773' },
    { city: 'Richmond', phone: '(804) 643-0052' },
    { city: 'South Hampton Roads', phone: '(757) 625-5350' },
  ];

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Youtube, href: '#', label: 'YouTube' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
  ];

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <a href="/" className="footer-logo">
              <img src="/images/logo-white.svg" alt="SupportWorks Housing" className="footer-logo-img" />
            </a>
            <p className="footer-tagline">
              Ending homelessness in Virginia through permanent housing and comprehensive support services.
            </p>
            <div className="footer-social">
              {socialLinks.map((link) => (
                <a key={link.label} href={link.href} className="social-link" aria-label={link.label}>
                  <link.icon size={20} />
                </a>
              ))}
            </div>
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
          <p>&copy; {new Date().getFullYear()} SupportWorks Housing. All rights reserved.</p>
          <div className="footer-legal">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
