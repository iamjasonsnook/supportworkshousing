import './About.css';

function About() {
  const services = [
    'Serving older adults experiencing or at risk of homelessness',
    'Supporting veterans with housing and wraparound services',
    'Providing accessible housing for persons with disabilities',
  ];

  return (
    <section id="what-we-do" className="about section">
      <div className="container">
        <div className="about-row">
          <div className="about-content">
            <h2>Our Approach</h2>
            <p>
              SupportWorks Housing brings together Virginia's best support specialists and
              most experienced property developers to end homelessness—and saves our
              communities millions of dollars in the process.
            </p>
            <p>
              For thirty-seven years, we've combined professional property development and
              management with unmatched, integrated support services to deliver measurable
              results for older adults, veterans, and persons with disabilities across
              Charlottesville, Richmond, and South Hampton Roads.
            </p>
          </div>
          <div className="about-image">
            <img
              src="/images/building.jpg"
              alt="Gosnold apartments - SupportWorks Housing"
            />
          </div>
        </div>

        <div className="about-row about-row-reverse">
          <div className="about-image">
            <img
              src="/images/teammate.jpg"
              alt="SupportWorks Housing team member"
            />
          </div>
          <div className="about-content">
            <h2>Support That Works</h2>
            <p>
              Our integrated approach provides residents with everything they need to maintain
              stable housing: healthcare coordination, benefits assistance, employment
              support, life skills training, and ongoing case management.
            </p>
            <ul className="about-list">
              {services.map((service) => (
                <li key={service}>
                  <span className="bullet"></span>
                  {service}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

export default About;
