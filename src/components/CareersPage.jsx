import { useEffect } from 'react';
import careersHeroImage from '/images/careers-hero.png';
import { Link } from 'react-router-dom';
import { MapPin, Clock, ArrowRight, Heart, Users, TrendingUp, Award, Smile } from 'lucide-react';
import CareersHeader from './CareersHeader';
import Footer from './Footer';
import './CareersPage.css';

const STANDARD_INTRO = `A career at SupportWorks Housing is a choice. We are here because we are driven to make a difference. We serve our most vulnerable neighbors by removing the barriers that have prevented them from maintaining stable housing, health, and wellness. We meet people where they are and treat them with dignity and respect. We support them through their unique challenges and traumas resulting from homelessness, substance abuse, and mental health issues. We give them support even when they don't know they need it. We don't give up.\n\nThis work can be hard, but the impact is real. If you are committed, caring and resilient and looking to make a difference, a career at SupportWorks is for you.`;

const SSS_RESPONSIBILITIES = [
  'Provide case management expertise including assessments, treatment planning, supportive counseling, linking to community resources, monitoring progress, collaboration with other providers, and care coordination',
  'Assist in outreach and engagement activities with clients, families, community providers, landlords, and medical personnel',
  'Advocate for clients in court, testify on behalf of clients and/or services, and collaborate with law enforcement, public defenders, DSS, and departments of corrections',
  'Maintain client contact and files, treatment plans, progress notes, and discharge summaries',
];

const SSS_QUALIFICATIONS = [
  "Bachelor's degree in human services preferred, and one+ year of experience in direct services with low-income, physically disabled, or behavioral health/developmental populations, and/or individuals with a history of homelessness and incarceration; OR a Bachelor's degree in another field and five+ years of case management experience",
  'Knowledge of homeless and offender populations and appropriate community resources, especially entitlement and housing resources',
  'SOAR certification and experience strongly preferred, plus CPR/First Aid certification',
  'Knowledge of mental illness, substance abuse disorders, community resources, medication management, and recovery concepts',
  'Excellent computer skills including Microsoft Office Word and Excel',
  'Prior experience in a grant-supported human services environment; knowledge of electronic health records/data management and Medicaid billing helpful',
  "Valid VA driver's license and reliable transportation; travel approximately 10% of the time",
];

export const jobListings = [
  {
    id: 'housing-navigator-chesapeake',
    title: 'Housing Navigator',
    location: 'Chesapeake, VA',
    type: 'Full-Time',
    department: 'Resident Services',
    salary: '$24.03 – $26.44/hour',
    posted: 'June 2026',
    applyUrl: 'https://supportworkshousing.isolvedhire.com/jobs/1807968.html',
    summary: 'Provide housing-focused services to individuals in Permanent Supportive Housing, from assessments and landlord engagement to placement and retention.',
    description: STANDARD_INTRO,
    responsibilities: [
      'Provide housing-focused services to individuals enrolled in Permanent Supportive Housing programs',
      'Conduct housing assessments, housing stabilization planning, landlord engagement, and housing placement',
      'Perform housing inspections and coordinate financial assistance and housing retention activities',
      'Assist participants with obtaining and maintaining safe, stable, and affordable housing',
      'Work with participants, Supportive Services Specialists, landlords, property managers, and community partners to address housing barriers and promote successful tenancy',
      'Ensure compliance with program and HUD requirements',
    ],
    qualifications: [
      "Bachelor's degree in social work, human services, psychology, counseling, or related field, and one+ year of experience providing services to individuals experiencing homelessness, poverty, behavioral health conditions, or disabilities; equivalent combinations of education and experience considered",
      'Experience working in Permanent Supportive Housing (PSH), Rapid Re-Housing (RRH), Housing Choice Voucher, or other housing assistance programs',
      'Experience with HMIS or other electronic documentation systems',
      'Knowledge of HUD regulations, Fair Housing requirements, landlord-tenant law, and housing quality standards',
      'Experience conducting HQS/NSPIRE inspections and housing compliance activities',
      'Knowledge of housing resources, affordable housing programs, and community-based service networks',
      "Valid VA driver's license and reliable transportation; ability to travel locally and occasionally statewide",
      'CPR and First Aid certification preferred',
    ],
  },
  {
    id: 'housing-outreach-coordinator-charlottesville',
    title: 'Housing Outreach Coordinator',
    location: 'Charlottesville, VA',
    type: 'Full-Time',
    department: 'Resident Services',
    salary: '$28.00 – $28.84/hour',
    posted: 'June 2026',
    applyUrl: 'https://supportworkshousing.isolvedhire.com/jobs/1801395.html',
    summary: 'Lead and oversee housing-focused outreach activities that connect individuals and families experiencing homelessness to housing and supportive services.',
    description: STANDARD_INTRO,
    responsibilities: [
      'Provide leadership and oversight of housing-focused outreach activities engaging individuals and families experiencing homelessness',
      'Facilitate connections to housing and supportive services',
      'Supervise outreach staff',
      'Coordinate with community partners and Continuum of Care (CoC) systems',
      'Monitor service quality and regulatory compliance',
      'Support efforts to promote housing stability and positive participant outcomes',
    ],
    qualifications: [
      "Bachelor's degree in social work, human services, psychology, counseling, or related field and three+ years of experience providing services to individuals experiencing homelessness, behavioral health conditions, or disabilities, including one year of leadership or supervisory experience; OR an equivalent combination of education and experience",
      'Experience with homelessness response systems, coordinated entry, and housing programs',
      'Experience providing staff supervision or program leadership',
      'Knowledge of trauma-informed care, motivational interviewing, housing stabilization, and recovery-oriented practices',
      'Knowledge of community resources, benefits systems, and mainstream service networks',
      'Experience with HMIS or other electronic documentation systems, plus solid computer and mobile technology skills',
      "Valid VA driver's license and reliable transportation; ability to travel locally and occasionally statewide",
      'CPR and First Aid certification preferred',
    ],
  },
  {
    id: 'housing-outreach-specialist-charlottesville',
    title: 'Housing Outreach Specialist',
    location: 'Charlottesville, VA',
    type: 'Full-Time',
    department: 'Resident Services',
    salary: '$24.03 – $26.44/hour',
    posted: 'June 2026',
    applyUrl: 'https://supportworkshousing.isolvedhire.com/jobs/1801381.html',
    summary: 'Bring trauma-informed, person-centered outreach to individuals and families experiencing homelessness, connecting them to housing resources and mainstream benefits.',
    description: STANDARD_INTRO,
    responsibilities: [
      'Provide housing-focused outreach and engagement services to individuals and families experiencing homelessness, alongside the Housing Outreach Coordinator and team',
      'Use trauma-informed, person-centered, and strengths-based practices to build trusting relationships and identify immediate needs',
      'Support safety and stabilization, and facilitate connections to housing resources and mainstream benefits',
      'Collaborate with Continuum of Care (CoC) partners, coordinated entry systems, healthcare providers, landlords, and community organizations to promote housing stability',
    ],
    qualifications: [
      "Bachelor's degree in social work, human services, psychology, counseling, or related field and one+ year of experience providing services to individuals experiencing homelessness, behavioral health conditions, or disabilities; OR an equivalent combination of education and experience",
      'Experience with homelessness response systems, coordinated entry, and housing programs',
      'Knowledge of trauma-informed care, motivational interviewing, and recovery-oriented practices',
      'Knowledge of community resources, benefits systems, and mainstream service networks',
      'Experience with HMIS or other electronic documentation systems, plus solid computer and mobile technology skills',
      "Valid VA driver's license and reliable transportation; ability to safely conduct field-based outreach in varying environments and weather conditions",
      'CPR and First Aid certification preferred',
    ],
  },
  {
    id: 'maintenance-apprentice-richmond',
    title: 'Maintenance Apprentice',
    location: 'Richmond, VA',
    type: 'Full-Time',
    department: 'Property Management',
    salary: '$16.00 – $18.00/hour',
    posted: 'July 2026',
    applyUrl: 'https://supportworkshousing.isolvedhire.com/jobs/1812155.html',
    summary: 'Keep our Richmond residential properties clean, safe, and well-maintained while learning the full range of property maintenance operations. Monday–Friday, 8:30 AM–5 PM. $2,000 hiring bonus available.',
    description: `At SupportWorks, your work has purpose. You'll help create safe, clean housing for individuals overcoming homelessness, substance use, and mental health challenges. What you do matters, every single day.\n\nMaintenance work here isn't just about fixing buildings — it's about supporting people. As a Maintenance Apprentice, you'll work side-by-side with experienced maintenance technicians and supervisors, gaining exposure to all aspects of property maintenance while building practical, in-demand skills.`,
    responsibilities: [
      'Assist experienced maintenance technicians',
      'Clean and maintain common areas and grounds',
      'Turn over units (cleaning, painting, minor repairs)',
      'Complete work orders and preventative maintenance',
      'Support inspections and identify maintenance needs',
      'Help ensure building safety systems are functioning properly',
    ],
    qualifications: [
      'High school diploma or equivalent',
      '1+ year of maintenance or grounds experience',
      "Valid VA driver's license and reliable transportation",
      'Positive attitude and willingness to learn',
    ],
  },
  {
    id: 'senior-supportive-services-specialist-virginia-beach',
    title: 'Senior Supportive Services Specialist – HRC',
    location: 'Virginia Beach, VA',
    type: 'Full-Time',
    department: 'Resident Services',
    salary: '$50,000 – $55,000/year',
    posted: 'June 2026',
    applyUrl: 'https://supportworkshousing.isolvedhire.com/jobs/1795352.html',
    summary: 'Work with the Team Lead to oversee supportive services and mentor staff serving low-income and disabled adults experiencing homelessness and repeated incarcerations.',
    description: STANDARD_INTRO,
    responsibilities: [
      'Work directly with the Team Lead to oversee supportive services for clients — low-income and disabled adults who may be experiencing homelessness and repeated incarcerations',
      'Provide guidance related to service delivery, documentation, regulatory compliance, and caseload management',
      'Provide case management expertise including assessments, treatment planning, supportive counseling, linking to community resources, monitoring progress, collaboration with other providers, and care coordination',
      'Mentor and train supportive services staff as needed',
      'Assist in outreach and engagement activities with clients, families, community providers, landlords, and medical personnel',
      'Advocate for clients in court, testify on behalf of clients and/or services, and collaborate with law enforcement, public defenders, DSS, and departments of corrections',
      'Maintain client contact and files, treatment plans, progress notes, and discharge summaries',
    ],
    qualifications: [
      "Bachelor's degree in human services and one+ year of experience in direct services with low-income, physically disabled, or behavioral health/developmental populations, and/or individuals with a history of homelessness and incarceration; OR a Bachelor's degree in another field and five+ years of case management experience",
      '1+ year of experience supervising a team, plus project management experience',
      'Knowledge of homeless and offender populations and appropriate community resources, especially entitlement and housing resources',
      'SOAR certification and experience strongly preferred, plus CPR/First Aid certification',
      'Knowledge of mental illness, substance abuse disorders, community resources, medication management, and recovery concepts',
      'Excellent computer skills including Microsoft Office Word and Excel',
      'Prior experience in a grant-supported human services environment; knowledge of electronic health records/data management and Medicaid billing helpful',
      "Valid VA driver's license and reliable transportation; travel approximately 10% of the time",
    ],
  },
  {
    id: 'supportive-services-specialist-charlottesville',
    title: 'Supportive Services Specialist',
    location: 'Charlottesville, VA',
    type: 'Full-Time',
    department: 'Resident Services',
    salary: '$24.03 – $26.44/hour',
    posted: 'June 2026',
    applyUrl: 'https://supportworkshousing.isolvedhire.com/jobs/1797727.html',
    summary: 'Serve low-income and disabled adults experiencing homelessness through case management, community outreach, and advocacy.',
    description: STANDARD_INTRO,
    responsibilities: SSS_RESPONSIBILITIES,
    qualifications: SSS_QUALIFICATIONS,
  },
  {
    id: 'supportive-services-specialist-chesapeake',
    title: 'Supportive Services Specialist – Herons Landing',
    location: 'Chesapeake, VA',
    type: 'Full-Time',
    department: 'Resident Services',
    salary: '$24.00 – $24.03/hour',
    posted: 'June 2026',
    applyUrl: 'https://supportworkshousing.isolvedhire.com/jobs/1799890.html',
    summary: 'Serve low-income and disabled adults experiencing homelessness through case management, community outreach, and advocacy at our Herons Landing property.',
    description: STANDARD_INTRO,
    responsibilities: SSS_RESPONSIBILITIES,
    qualifications: SSS_QUALIFICATIONS,
  },
  {
    id: 'supportive-services-specialist-vista-29',
    title: 'Supportive Services Specialist – Vista 29',
    location: 'Charlottesville, VA',
    type: 'Full-Time',
    department: 'Resident Services',
    salary: '$24.03 – $26.44/hour',
    posted: 'June 2026',
    applyUrl: 'https://supportworkshousing.isolvedhire.com/jobs/1799904.html',
    summary: 'Serve low-income and disabled adults experiencing homelessness through case management, community outreach, and advocacy at our new Vista 29 property.',
    description: STANDARD_INTRO,
    responsibilities: SSS_RESPONSIBILITIES,
    qualifications: SSS_QUALIFICATIONS,
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
                <a
                  href="#open-positions"
                  className="btn btn-primary"
                  onClick={() => window.gtag?.('event', 'careers_view_positions_click')}
                >
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
                    <div className="why-us-card-text">
                      <h3>{reason.title}</h3>
                      <p>{reason.body}</p>
                    </div>
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
                <a
                  href={`/careers/${job.id}`}
                  key={job.id}
                  className="job-card"
                  onClick={() => window.gtag?.('event', 'careers_job_click', {
                    job_id: job.id,
                    job_title: job.title,
                    transport_type: 'beacon',
                  })}
                >
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
