import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import './Header.css';

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { label: 'What We Do', href: '#what-we-do' },
    { label: 'Our Impact', href: '#impact' },
    { label: 'Stories', href: '#stories' },
    { label: 'Get Involved', href: '#donate' },
  ];

  return (
    <header className="header">
      <div className="container header-container">
        <a href="/" className="logo">
          <img src="/images/logo-ful.png" alt="SupportWorks Housing" className="logo-img" />
        </a>

        <nav className={`nav ${isMenuOpen ? 'nav-open' : ''}`}>
          <ul className="nav-list">
            {navLinks.map((link) => (
              <li key={link.label}>
                <a href={link.href} className="nav-link" onClick={() => setIsMenuOpen(false)}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <a href="#donate" className="btn-donate" onClick={() => setIsMenuOpen(false)}>
            Donate Now
          </a>
        </nav>

        <button
          className="menu-toggle"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
    </header>
  );
}

export default Header;
