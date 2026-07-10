import './ImpactReportBanner.css';

const REPORT_URL = '/impact-report-2025.pdf';

function ImpactReportBanner() {
  return (
    <div className="ir-banner" role="banner">
      <div className="ir-banner-inner">
        <span className="ir-banner-label">New</span>
        <span className="ir-banner-text">Our Impact Report is ready — 1,650 people served, 96%+ housed and staying housed.</span>
        <a
          href={REPORT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="ir-banner-link"
          onClick={() => window.gtag?.('event', 'impact_report_open', {
            event_category: 'engagement',
            event_label: 'banner',
          })}
        >
          <span className="ir-banner-link-full">See the full story</span>
          <span className="ir-banner-link-short">Check out our impact report today!</span>
        </a>
      </div>
    </div>
  );
}

export default ImpactReportBanner;
