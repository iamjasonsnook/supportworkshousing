import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import './CareersHeader.css';

function CareersHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="header">
      <div className="container header-container">
        <a href="/" className="logo">
          <img src={`${import.meta.env.BASE_URL}images/logo-ful.png`} alt="SupportWorks Housing" className="logo-img" />
        </a>

        <nav className={`careers-nav ${isMenuOpen ? 'nav-open' : ''}`}>
          <a href="/careers#why-us" className="nav-link" onClick={() => setIsMenuOpen(false)}>Why SupportWorks</a>
          <a href="/careers#benefits" className="nav-link" onClick={() => setIsMenuOpen(false)}>Benefits</a>
          <a href="/careers#open-positions" className="nav-link" onClick={() => setIsMenuOpen(false)}>Open Positions</a>
          <a href="/" className="btn-back">Back to Main Site</a>
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

export default CareersHeader;
