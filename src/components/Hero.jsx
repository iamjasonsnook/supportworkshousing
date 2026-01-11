import { ArrowRight } from 'lucide-react';
import './Hero.css';
import heroImage from '/images/hero-new.png';

function Hero() {
  const stats = [
    { value: '96%+', label: 'Do not return to homelessness' },
    { value: '37', label: 'Years of service' },
    { value: '3', label: 'Virginia regions served' },
  ];

  return (
    <section className="hero" style={{ backgroundImage: `url(${heroImage})` }}>
      <div className="hero-overlay"></div>
      <div className="container hero-container">
        <div className="hero-content">
          <h1>
            Homelessness is <span className="text-primary">solvable.</span>
          </h1>
          <p className="hero-description">
            For 37 years, SupportWorks Housing has combined professional property
            development with unmatched support services to deliver measurable
            results for older adults, veterans, and persons with disabilities across
            Virginia.
          </p>
          <div className="hero-buttons">
            <a href="#donate" className="btn btn-primary">
              Make an Impact Today
              <ArrowRight size={20} />
            </a>
            <a href="#what-we-do" className="btn btn-outline">
              Learn Our Approach
            </a>
          </div>
          <div className="hero-stats">
            {stats.map((stat) => (
              <div key={stat.label} className="stat">
                <span className="stat-value">{stat.value}</span>
                <span className="stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
