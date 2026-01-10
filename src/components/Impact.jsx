import { Home, Users, TrendingUp, CheckCircle } from 'lucide-react';
import './Impact.css';

function Impact() {
  const cards = [
    {
      icon: Home,
      title: 'Permanent Housing Solutions',
      description: 'Professional property development and management creating stable, affordable homes for those who need them most.',
    },
    {
      icon: Users,
      title: 'Integrated Support Services',
      description: 'Unmatched support specialists providing comprehensive care, from healthcare to job training.',
    },
    {
      icon: TrendingUp,
      title: 'Proven Success Rate',
      description: 'Year over year, 96% or more of our residents and program participants do not return to homelessness.',
    },
    {
      icon: CheckCircle,
      title: 'Cost-Effective Solutions',
      description: 'Saves communities millions of dollars by reducing emergency services and healthcare costs.',
    },
  ];

  return (
    <section id="impact" className="impact section">
      <div className="container">
        <div className="impact-header">
          <h2>Our Impact</h2>
          <p className="impact-subtitle">
            Support works. Our proven approach transforms lives and saves communities millions
            while ending homelessness.
          </p>
        </div>
        <div className="impact-grid">
          {cards.map((card) => (
            <div key={card.title} className="impact-card">
              <div className="impact-icon">
                <card.icon size={24} color="#9B1B5D" />
              </div>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Impact;
