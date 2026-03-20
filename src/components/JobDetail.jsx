import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Clock, Building2, DollarSign, ArrowLeft } from 'lucide-react';
import { jobListings } from './CareersPage';
import CareersHeader from './CareersHeader';
import Footer from './Footer';
import './JobDetail.css';

function JobDetail() {
  const { jobId } = useParams();
  const job = jobListings.find((j) => j.id === jobId);

  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => document.head.removeChild(meta);
  }, []);


  if (!job) {
    return (
      <>
        <CareersHeader />
        <main className="job-not-found">
          <div className="container">
            <h1>Position Not Found</h1>
            <p>This position may no longer be available.</p>
            <a href="/careers" className="btn btn-primary">View All Positions</a>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <CareersHeader />
      <main>
        {/* Breadcrumb / back */}
        <div className="job-breadcrumb">
          <div className="container">
            <a href="/careers" className="job-back-link">
              <ArrowLeft size={16} /> Back to Careers
            </a>
          </div>
        </div>

        {/* Job header */}
        <section className="job-hero">
          <div className="container">
            <div className="job-hero-inner">
              <div className="job-hero-content">
                <span className="job-hero-dept">{job.department}</span>
                <h1>{job.title}</h1>
                <div className="job-hero-meta">
                  <span className="job-hero-meta-item">
                    <MapPin size={16} /> {job.location}
                  </span>
                  <span className="job-hero-meta-item">
                    <Clock size={16} /> {job.type}
                  </span>
                  <span className="job-hero-meta-item">
                    <DollarSign size={16} /> {job.salary}
                  </span>
                </div>
              </div>
              <div className="job-hero-apply">
                <a href={job.applyUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary job-apply-btn">
                  Apply Now
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Job body */}
        <section className="job-body">
          <div className="container">
            <div className="job-body-layout">

              {/* Main content */}
              <div className="job-body-main">
                <div className="job-section">
                  <h2>About the Role</h2>
                  {job.description.split('\n\n').map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>

                <div className="job-section">
                  <h2>What You'll Do</h2>
                  <ul className="job-list">
                    {job.responsibilities.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>

                <div className="job-section">
                  <h2>What You'll Bring to SupportWorks</h2>
                  <ul className="job-list">
                    {job.qualifications.map((q, i) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ul>
                </div>

                <div className="job-section">
                  <h2>What We Offer</h2>
                  <p>
                    A comprehensive benefits package that includes medical, dental and vision plans
                    starting after one month of employment. Short term/long term disability and life
                    insurance at no cost, plus voluntary life insurance. An Employee Assistance Plan (EAP)
                    and a 403b retirement plan with a company match. A generous PTO plan including vacation,
                    sick and personal days, and 13 paid holidays!
                  </p>
                </div>
              </div>

              {/* Sidebar */}
              <aside className="job-sidebar">
                <div className="job-sidebar-card">
                  <h3>Position Details</h3>
                  <dl className="job-details-list">
                    <div>
                      <dt><Building2 size={15} /> Department</dt>
                      <dd>{job.department}</dd>
                    </div>
                    <div>
                      <dt><MapPin size={15} /> Location</dt>
                      <dd>{job.location}</dd>
                    </div>
                    <div>
                      <dt><Clock size={15} /> Type</dt>
                      <dd>{job.type}</dd>
                    </div>
                    <div>
                      <dt><DollarSign size={15} /> Compensation</dt>
                      <dd>{job.salary}</dd>
                    </div>
                  </dl>
                  <a href={job.applyUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary job-sidebar-apply">
                    Apply Now
                  </a>
                </div>

                <div className="job-sidebar-card job-sidebar-about">
                  <h3>About SupportWorks</h3>
                  <p>
                    Virginia's leading supportive housing organization since 1988. We house over
                    1,500 individuals annually across Richmond, Hampton Roads, and Charlottesville.
                  </p>
                  <a href="/careers#open-positions" className="job-all-link">
                    View all open positions →
                  </a>
                </div>
              </aside>

            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

export default JobDetail;
