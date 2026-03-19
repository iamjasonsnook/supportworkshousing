import { Link } from 'react-router-dom';
import { MapPin, Clock, ArrowRight, Heart, Users, Shield, TrendingUp, Award, Smile } from 'lucide-react';
import CareersHeader from './CareersHeader';
import Footer from './Footer';
import './CareersPage.css';

export const jobListings = [
  {
    id: 'supportive-services-specialist-chesapeake',
    title: 'Supportive Services Specialist',
    location: 'Chesapeake, VA',
    type: 'Full-Time',
    department: 'Resident Services',
    salary: '$23.07 – $24.03/hour',
    posted: 'March 2026',
    summary: 'Serve low-income and disabled adults experiencing homelessness and repeated incarcerations through Housing First case management, community outreach, and advocacy.',
    description: `A career at SupportWorks Housing is a choice. We are here because we are driven to make a difference. We serve our most vulnerable neighbors by removing the barriers that have prevented them from maintaining stable housing, health, and wellness. We meet people where they are and treat them with dignity and respect. We support them through their unique challenges and traumas resulting from homelessness, substance abuse, and mental health issues. We give them support even when they don't know they need it. We don't give up.\n\nThis work can be hard, but the impact is real. If you are committed, caring and resilient and looking to make a difference, a career at SupportWorks is for you.\n\nIn this role, you'll work with the Team Lead to serve clients: low income and disabled adults who may be experiencing homelessness and repeated incarcerations, providing case management expertise and advocacy across community systems.`,
    responsibilities: [
      'Provide case management including assessments, treatment planning, supportive counseling, linking to community resources, monitoring progress, collaboration with other providers, and care coordination',
      'Assist in outreach and engagement activities with clients, families, community providers, landlords, and medical personnel',
      'Advocate for clients in court, testify on behalf of the client and/or services, and collaborate with law enforcement, public defenders, DSS, and departments of corrections',
      'Maintain client contact and files, treatment plans, progress notes, and discharge summaries',
    ],
    qualifications: [
      "Bachelor's degree in human services preferred, and one+ year of experience in direct services with adults with low-income, physical disabilities, behavioral health and developmental disorders, and/or history of homelessness and incarcerations; OR a Bachelor's degree in another field and five+ years case management experience",
      'Knowledge of homeless and offender populations and appropriate community resources, especially entitlement and housing resources',
      'SOAR certification and CPR/First Aid Certification strongly preferred',
      'Knowledge of mental illness, substance abuse disorders, community resources, medication management, and recovery concepts',
      'Excellent computer skills including Microsoft Office Word and Excel',
      'Prior experience in a human services environment supported by grants; knowledge of electronic health records/data management and Medicaid billing helpful',
      'Valid VA Driver\'s license and reliable transportation — you\'ll travel approximately 10% of the time',
    ],
  },
  {
    id: 'supportive-services-specialist-richmond',
    title: 'Supportive Services Specialist',
    location: 'Richmond, VA',
    type: 'Full-Time',
    department: 'Resident Services',
    salary: '$16 – $18/hour',
    posted: 'March 2026',
    summary: 'Support residents in our Richmond properties through Housing First case management, helping clients maintain stable housing, health, and wellness.',
    description: `A career at SupportWorks Housing is a choice. We are here because we are driven to make a difference. We serve our most vulnerable neighbors by removing the barriers that have prevented them from maintaining stable housing, health, and wellness. We meet people where they are and treat them with dignity and respect. We support them through their unique challenges and traumas resulting from homelessness, substance abuse, and mental health issues. We give them support even when they don't know they need it. We don't give up.\n\nThis work can be hard, but the impact is real. If you are committed, caring and resilient and looking to make a difference, a career at SupportWorks is for you.\n\nIn this role, you'll work directly with residents in our Richmond housing sites, delivering case management and services that help people move from crisis to stability.`,
    responsibilities: [
      'Provide case management including assessments, treatment planning, supportive counseling, linking to community resources, monitoring progress, collaboration with other providers, and care coordination',
      'Assist in outreach and engagement activities with clients, families, community providers, landlords, and medical personnel',
      'Advocate for clients and collaborate with community partners including law enforcement, DSS, and healthcare providers',
      'Maintain client contact and files, treatment plans, progress notes, and discharge summaries',
    ],
    qualifications: [
      "Bachelor's degree in human services preferred, and one+ year of experience in direct services with adults with low-income, physical disabilities, behavioral health and developmental disorders, and/or history of homelessness and incarcerations; OR a Bachelor's degree in another field and five+ years case management experience",
      'Knowledge of homeless populations and appropriate community resources, especially entitlement and housing resources',
      'Knowledge of mental illness, substance abuse disorders, community resources, medication management, and recovery concepts',
      'Excellent computer skills including Microsoft Office Word and Excel',
      'Valid VA Driver\'s license and reliable transportation',
    ],
  },
  {
    id: 'maintenance-apprentice',
    title: 'Maintenance Apprentice',
    location: 'Virginia (Multiple Sites)',
    type: 'Full-Time',
    department: 'Property Management',
    salary: 'Competitive',
    posted: 'March 2026',
    summary: 'Learn the full range of property maintenance operations while keeping our residential sites clean, safe, and well-maintained for residents.',
    description: `A career at SupportWorks Housing is a choice. We are here because we are driven to make a difference. Our properties are home to hundreds of Virginians working to rebuild their lives — and our maintenance team makes sure those homes are safe, clean, and dignified places to live.\n\nThis is a Monday–Friday 1st Shift role. You'll work alongside fully qualified maintenance technicians and supervisors, gaining hands-on exposure to the full range of maintenance operations across our residential properties.`,
    responsibilities: [
      'Sweep, mop, wax, buff, and seal all floors and stairways',
      'Clean buildings including staff offices and common areas',
      'Maintain grounds by cleaning up debris on sidewalks and removing litter',
      'Turnover units and apartments including cleaning, painting, and repairs',
      'Complete work orders, minor maintenance repairs, and preventive maintenance tasks (filter changes, smoke detector checks, vent cleaning, lighting checks, leak checks, etc.)',
      'Assist with inspections, reporting all violations, discrepancies, and damage',
      'Ensure all building systems are operating properly, including emergency doors, signs, lights, and secured areas',
      'Ensure compliance with standard safety programs and procedures',
      'Report all tenant complaints and/or work requests to the Property Manager',
    ],
    qualifications: [
      'High school diploma or educational equivalent',
      'Minimum one (1) year of experience in building and grounds maintenance',
      'Valid VA Driver\'s License, clean driving record, and dependable transportation',
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
    icon: Shield,
    title: 'Stability You Can Count On',
    body: 'SupportWorks has served Virginia communities since 1988. We\'re a stable, well-established nonprofit with a track record of longevity and fiscal responsibility.',
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
  return (
    <>
      <CareersHeader />
      <main id="careers">

        {/* Hero */}
        <section className="careers-hero">
          <div className="container">
            <div className="careers-hero-content">
              <span className="careers-eyebrow">Join Our Team</span>
              <h1>Do Work That <span className="careers-hero-accent">Changes Lives</span></h1>
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
            <div className="careers-hero-stat-bar">
              <div className="careers-stat">
                <span className="careers-stat-value">1,500+</span>
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
                <span className="careers-stat-value">3</span>
                <span className="careers-stat-label">Virginia communities served</span>
              </div>
            </div>
          </div>
        </section>

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
                <Link to={`/careers/${job.id}`} key={job.id} className="job-card">
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
                </Link>
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
