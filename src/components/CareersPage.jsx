import { useEffect } from 'react';
import careersHeroImage from '/images/careers-hero.png';
import { Link } from 'react-router-dom';
import { MapPin, Clock, ArrowRight, Heart, Users, TrendingUp, Award, Smile } from 'lucide-react';
import CareersHeader from './CareersHeader';
import Footer from './Footer';
import './CareersPage.css';

export const jobListings = [
  {
    id: 'supportive-services-specialist-housing-first',
    title: 'Supportive Services Specialist – Housing First',
    location: 'Chesapeake, VA',
    type: 'Full-Time',
    department: 'Resident Services',
    salary: '$23.07 – $24.03/hour',
    posted: 'March 2026',
    applyUrl: 'https://supportworkshousing.isolvedhire.com/jobs/1715567.html',
    summary: 'Serve low-income and disabled adults experiencing homelessness through Housing First case management, community outreach, and advocacy.',
    description: `A career at SupportWorks Housing is a choice. We are here because we are driven to make a difference. We serve our most vulnerable neighbors by removing the barriers that have prevented them from maintaining stable housing, health, and wellness. We meet people where they are and treat them with dignity and respect. We don't give up.\n\nThis work can be hard, but the impact is real. If you are committed, caring and resilient and looking to make a difference, a career at SupportWorks is for you.`,
    responsibilities: [
      'Provide case management including assessments, treatment planning, supportive counseling, linking to community resources, monitoring progress, collaboration with other providers, and care coordination',
      'Assist in outreach and engagement activities with clients, families, community providers, landlords, and medical personnel',
      'Advocate for clients in legal proceedings and collaborate with law enforcement, public defenders, DSS, and departments of corrections',
      'Maintain client contact and files, treatment plans, progress notes, and discharge summaries',
      'Travel approximately 10% of the time',
    ],
    qualifications: [
      "Bachelor's degree in human services and one+ year of experience in direct services with low-income or disabled adults; OR a Bachelor's degree in another field and five+ years case management experience",
      'Knowledge of homeless and offender populations and appropriate community resources',
      'SOAR certification and CPR/First Aid Certification strongly preferred',
      'Knowledge of mental illness, substance abuse disorders, community resources, and recovery concepts',
      'Excellent computer skills including Microsoft Office Word and Excel',
      'Valid VA Driver\'s license and reliable transportation',
    ],
  },
  {
    id: 'supportive-services-specialist-psh',
    title: 'Supportive Services Specialist – PSH',
    location: 'Chesapeake, VA',
    type: 'Full-Time',
    department: 'Resident Services',
    salary: '$23.00 – $24.03/hour',
    posted: 'March 2026',
    applyUrl: 'https://supportworkshousing.isolvedhire.com/jobs/1713949.html',
    summary: 'Deliver Permanent Supportive Housing case management services to vulnerable adults, connecting clients to resources and advocating across community systems.',
    description: `A career at SupportWorks Housing is a choice. We are here because we are driven to make a difference. We serve our most vulnerable neighbors by removing the barriers that have prevented them from maintaining stable housing, health, and wellness. We meet people where they are and treat them with dignity and respect. We don't give up.\n\nThis work can be hard, but the impact is real. If you are committed, caring and resilient and looking to make a difference, a career at SupportWorks is for you.`,
    responsibilities: [
      'Deliver case management services including assessments, treatment planning, and supportive counseling',
      'Connect clients to community resources and coordinate care with other providers',
      'Conduct outreach and engagement with clients, families, landlords, and medical personnel',
      'Advocate for clients in legal settings and collaborate with law enforcement and DSS',
      'Maintain client files, treatment plans, progress notes, and discharge documentation',
      'Travel approximately 10% of the time',
    ],
    qualifications: [
      "Bachelor's degree in human services and one+ year of experience in direct services with vulnerable populations; OR a Bachelor's degree with five+ years case management experience",
      'Valid Virginia driver\'s license and reliable transportation',
      'SOAR certification and CPR/First Aid Certification preferred',
      'Knowledge of mental illness, substance abuse, and community resources',
      'Proficiency with Microsoft Office',
    ],
  },
  {
    id: 'desk-clerk-virginia-beach',
    title: 'Desk Clerk – Full Time 1st Shift',
    location: 'Virginia Beach, VA',
    type: 'Full-Time',
    department: 'Property Management',
    salary: '$14.70 – $14.75/hour',
    posted: 'March 2026',
    applyUrl: 'https://supportworkshousing.isolvedhire.com/jobs/1728200.html',
    summary: 'Serve as the welcoming front-line presence at our Virginia Beach property — supporting residents, handling administrative tasks, and maintaining a safe community environment. Tuesday–Saturday, 9 AM–6 PM.',
    description: `A career at SupportWorks Housing is a choice. We are here because we are driven to make a difference. We serve our most vulnerable neighbors by removing the barriers that have prevented them from maintaining stable housing, health, and wellness. We meet people where they are and treat them with dignity and respect. We don't give up.\n\nThis is a Tuesday–Saturday, 9:00 AM–6:00 PM position based at our Virginia Beach property.`,
    responsibilities: [
      'Conduct walk-through and quarterly inspections of common areas, units, and grounds',
      'Handle phone reception, call routing, and message management',
      'Monitor guest registrations and resident activities',
      'Process rent collection and prepare bank deposits',
      'Manage maintenance work orders and respond to emergency complaints',
      'Execute resident move-ins and process applications',
      'Prepare vacancy and delinquency reports',
      'Attend staff meetings and required trainings',
    ],
    qualifications: [
      'High school diploma or equivalent',
      'Proficiency with Microsoft Word and Excel',
      'Knowledge of federal/state housing regulations preferred',
      'Experience with property management software (OneSite or NextGen) preferred',
    ],
  },
  {
    id: 'maintenance-apprentice-richmond-1',
    title: 'Maintenance Apprentice',
    location: 'Richmond, VA',
    type: 'Full-Time',
    department: 'Property Management',
    salary: '$16 – $18/hour',
    posted: 'March 2026',
    applyUrl: 'https://supportworkshousing.isolvedhire.com/jobs/1722739.html',
    summary: 'Keep our Richmond residential properties clean, safe, and well-maintained while learning the full range of property maintenance operations. Monday–Friday, 1st Shift.',
    description: `A career at SupportWorks Housing is a choice. We are here because we are driven to make a difference. Our properties are home to hundreds of Virginians working to rebuild their lives — and our maintenance team makes sure those homes are safe, clean, and dignified places to live.\n\nThis is a Monday–Friday, 1st Shift role. You'll work alongside fully qualified maintenance technicians and supervisors, gaining hands-on exposure to the full range of maintenance operations.`,
    responsibilities: [
      'Floor maintenance including sweeping, mopping, waxing, buffing, and sealing',
      'Building and common area cleaning',
      'Grounds upkeep and debris removal',
      'Apartment turnovers including cleaning, painting, and repairs',
      'Work order completion and preventive maintenance (filter changes, smoke detector checks, vent cleaning, lighting, leak inspections)',
      'Facility inspections and violation reporting',
      'Building systems monitoring and safety compliance',
      'Tenant complaint documentation',
    ],
    qualifications: [
      'High school diploma or equivalent',
      'Minimum one year of building and grounds maintenance experience',
      'Valid Virginia driver\'s license with clean driving record and reliable transportation',
      'A positive, can-do attitude and willingness to learn new skills',
    ],
  },
  {
    id: 'maintenance-apprentice-richmond-2',
    title: 'Maintenance Apprentice',
    location: 'Richmond, VA',
    type: 'Full-Time',
    department: 'Property Management',
    salary: '$16 – $18/hour',
    posted: 'March 2026',
    applyUrl: 'https://supportworkshousing.isolvedhire.com/jobs/1718755.html',
    summary: 'Keep our Richmond residential properties clean, safe, and well-maintained while learning the full range of property maintenance operations. Monday–Friday, 1st Shift. $5,000 new hire bonus available.',
    description: `A career at SupportWorks Housing is a choice. We are here because we are driven to make a difference. Our properties are home to hundreds of Virginians working to rebuild their lives — and our maintenance team makes sure those homes are safe, clean, and dignified places to live.\n\nThis is a Monday–Friday, 1st Shift role. A $5,000 new hire bonus is available for this position.`,
    responsibilities: [
      'Floor maintenance including sweeping, mopping, waxing, buffing, and sealing',
      'Building and common area cleaning',
      'Grounds upkeep and debris removal',
      'Apartment turnovers including cleaning, painting, and repairs',
      'Work order completion and preventive maintenance (filter changes, smoke detector checks, vent cleaning, lighting, leak inspections)',
      'Facility inspections and violation reporting',
      'Building systems monitoring and safety compliance',
      'Tenant complaint documentation',
    ],
    qualifications: [
      'High school diploma or equivalent',
      'Minimum one year of building and grounds maintenance experience',
      'Valid Virginia driver\'s license with clean driving record and reliable transportation',
      'A positive, can-do attitude and willingness to learn new skills',
    ],
  },
];

const whyUsReasons = [
  {
    icon: Heart,
    title: 'Mission That Matters',
    body: 'Every role at SupportWorks directly contributes to ending homelessness in Virginia. You\'ll see the impact of your work in real people\'s lives — not in quarterly reports.',
  },
  {
    icon: Users,
    title: 'A Team That Has Your Back',
    body: 'We\'re a close-knit, mission-driven team that supports each other the same way we support our residents — with honesty, care, and a shared commitment to doing right.',
  },
  {
    icon: TrendingUp,
    title: 'Room to Grow',
    body: 'We invest in our people. From SOAR certification support for case managers to leadership pathways, we want you to build a career here — not just hold a job.',
  },
  {
    icon: Clock,
    title: 'Balance Built In',
    body: 'Meaningful work shouldn\'t come at the cost of your wellbeing. We have leadership that genuinely respects boundaries — because a rested team takes better care of the people we serve.',
  },
  {
    icon: Smile,
    title: 'Culture of Dignity',
    body: 'We meet people where they are — residents and staff alike. Our team culture reflects the values we bring to our work every day: dignity, respect, and perseverance.',
  },
  {
    icon: Award,
    title: 'Real Benefits',
    body: 'Medical, dental, and vision after one month. Employer-paid disability and life insurance. A 403b with company match, EAP, and 13 paid holidays.',
  },
];

const benefits = [
  { label: 'Medical, Dental & Vision', detail: 'Coverage begins after just one month of employment' },
  { label: 'Disability Insurance', detail: 'Short-term and long-term disability at no cost to you' },
  { label: 'Life Insurance', detail: 'Employer-paid basic life insurance, plus voluntary life insurance options' },
  { label: '403b Retirement Plan', detail: 'Retirement savings plan with a company match' },
  { label: 'Employee Assistance Program', detail: 'Confidential support for mental health, financial wellness, and more' },
  { label: 'Generous PTO', detail: 'Vacation, sick, and personal days — plus 13 paid holidays per year' },
];

function CareersPage() {
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => document.head.removeChild(meta);
  }, []);

  return (
    <>
      <CareersHeader />
      <main id="careers">

        {/* Hero */}
        <section className="careers-hero" style={{ backgroundImage: `url(${careersHeroImage})` }}>
          <div className="careers-hero-overlay" />
          <div className="container careers-hero-container">
            <div className="careers-hero-content">
              <span className="careers-eyebrow">Join Our Team</span>
              <h1>Do Work That<br /><span className="careers-hero-accent">Changes Lives</span></h1>
              <p className="careers-hero-body">
                A career at SupportWorks Housing is a choice. We are here because we are driven
                to make a difference. We serve our most vulnerable neighbors by removing the barriers
                that have prevented them from maintaining stable housing, health, and wellness.
                We meet people where they are. We treat them with dignity and respect. We don't give up.
              </p>
              <div className="careers-hero-actions">
                <a href="#open-positions" className="btn btn-primary">
                  View Open Positions <ArrowRight size={18} />
                </a>
                <a href="#why-us" className="btn btn-outline">Why SupportWorks?</a>
              </div>
            </div>
          </div>
        </section>

        {/* Stat bar — below hero, matching main site pattern */}
        <div className="careers-hero-stat-bar">
          <div className="container careers-stat-inner">
            <div className="careers-stat">
              <span className="careers-stat-value">1,600+</span>
              <span className="careers-stat-label">People housed each year</span>
            </div>
            <div className="careers-stat-divider" />
            <div className="careers-stat">
              <span className="careers-stat-value">600+</span>
              <span className="careers-stat-label">Units of supportive housing</span>
            </div>
            <div className="careers-stat-divider" />
            <div className="careers-stat">
              <span className="careers-stat-value">35+</span>
              <span className="careers-stat-label">Years ending homelessness</span>
            </div>
            <div className="careers-stat-divider" />
            <div className="careers-stat">
              <span className="careers-stat-value">14</span>
              <span className="careers-stat-label">Managed properties across Virginia</span>
            </div>
          </div>
        </div>

        {/* Why SupportWorks */}
        <section className="section" id="why-us">
          <div className="container">
            <div className="section-header">
              <h2>Why SupportWorks?</h2>
              <p className="section-subhead">
                This work can be hard, but the impact is real. Here's what makes SupportWorks
                a place where committed, caring people stay and grow.
              </p>
            </div>
            <div className="why-us-grid">
              {whyUsReasons.map((reason) => {
                const Icon = reason.icon;
                return (
                  <div key={reason.title} className="why-us-card">
                    <div className="why-us-icon">
                      <Icon size={24} />
                    </div>
                    <h3>{reason.title}</h3>
                    <p>{reason.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Quote / Mission Banner */}
        <section className="careers-mission-banner">
          <div className="container">
            <blockquote className="careers-quote">
              "If you are committed, caring and resilient and looking to make a difference,
              a career at SupportWorks is for you."
            </blockquote>
            <p className="careers-quote-attr">— SupportWorks Housing</p>
          </div>
        </section>

        {/* Benefits */}
        <section className="section" id="benefits">
          <div className="container">
            <div className="section-header">
              <h2>Benefits &amp; Perks</h2>
              <p className="section-subhead">
                We take care of our team so our team can take care of the community.
              </p>
            </div>
            <div className="benefits-grid">
              {benefits.map((b) => (
                <div key={b.label} className="benefit-card">
                  <div className="benefit-dot" />
                  <div>
                    <h4>{b.label}</h4>
                    <p>{b.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Open Positions */}
        <section className="section careers-jobs-section" id="open-positions">
          <div className="container">
            <div className="section-header">
              <h2>Open Positions</h2>
              <p className="section-subhead">
                We're currently hiring across Virginia. Find a role that fits your skills and passion.
              </p>
            </div>
            <div className="jobs-list">
              {jobListings.map((job) => (
                <a href={`/careers/${job.id}`} key={job.id} className="job-card">
                  <div className="job-card-main">
                    <div className="job-card-info">
                      <h3 className="job-title">{job.title}</h3>
                      <div className="job-meta">
                        <span className="job-meta-item">
                          <MapPin size={15} /> {job.location}
                        </span>
                        <span className="job-meta-item">
                          <Clock size={15} /> {job.type}
                        </span>
                        <span className="job-department">{job.department}</span>
                      </div>
                      <p className="job-summary">{job.summary}</p>
                    </div>
                    <div className="job-card-cta">
                      <span className="job-salary">{job.salary}</span>
                      <span className="job-view-link">
                        View Details <ArrowRight size={16} />
                      </span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="careers-cta-banner">
          <div className="container">
            <h2>Don't see the right fit?</h2>
            <p>We're always looking for passionate people. Reach out and introduce yourself.</p>
            <a href="mailto:hr@supportworkshousing.org" className="btn btn-white">
              Contact Us
            </a>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}

export default CareersPage;
