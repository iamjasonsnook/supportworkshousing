import { ArrowLeft, Heart } from 'lucide-react';
import Footer from './Footer';
import { useDocumentMeta } from '../utils/useDocumentMeta';
import './ImpactReport.css';

/**
 * Branded page wrapper for the impact-report viewer: header, title + intro,
 * the viewer (children), a donation call-to-action, and the site footer.
 */
function ImpactReportLayout({ children }) {
  useDocumentMeta({
    title: 'Resilience in Action — 2025 Impact Report | SupportWorks Housing',
    description:
      'Read the SupportWorks Housing 2025 Impact Report, "Resilience in Action": 1,650 neighbors served and 96% still housed. Flip through our year of ending homelessness in Virginia through permanent supportive housing.',
    canonical: 'https://supportworkshousing.org/impact-report',
    ogTitle: 'Resilience in Action — SupportWorks Housing 2025 Impact Report',
  });

  return (
    <>
      <header className="irx-header">
        <div className="irx-header-inner">
          <a href="/" className="irx-logo" aria-label="SupportWorks Housing home">
            <img src={`${import.meta.env.BASE_URL}images/logo-ful.png`} alt="SupportWorks Housing" />
          </a>
          <div className="irx-header-actions">
            <a href="/#donate" className="irx-header-donate">Donate</a>
            <a href="/" className="irx-header-back">
              <ArrowLeft size={16} /> Back to Main Site
            </a>
          </div>
        </div>
      </header>

      <main className="irx-main">
        <section className="irx-intro">
          <span className="irx-eyebrow">2025 Impact Report</span>
          <h1 className="irx-title">Resilience in Action</h1>
          <p className="irx-lead">
            Every number in this report is a person who now has a front door to call their own. In 2025,
            SupportWorks Housing walked alongside <strong>1,650 neighbors</strong> on the path out of
            homelessness — and <strong>96%</strong> of those we housed are still housed today. Flip through
            the booklet below to see the year in full.
          </p>
        </section>

        <section className="irx-viewer-section">{children}</section>

        <section className="irx-cta">
          <div className="irx-cta-card container">
            <div className="irx-cta-icon"><Heart size={28} /></div>
            <h2 className="irx-cta-title">Consider a Donation Today</h2>
            <p className="irx-cta-text">
              Reports like this are only possible because of neighbors like you. Your gift helps
              turn another key, open another door, and keep someone housed for good.
            </p>
            <a
              href="/#donate"
              className="btn btn-primary irx-cta-btn"
              onClick={() => window.gtag?.('event', 'impact_report_donate_click', {
                event_category: 'engagement',
                event_label: 'cta',
              })}
            >
              <Heart size={18} /> Consider a Donation Today
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

export default ImpactReportLayout;
