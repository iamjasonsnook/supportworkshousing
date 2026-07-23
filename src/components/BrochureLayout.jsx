import { useEffect } from 'react';
import { ArrowLeft, Heart } from 'lucide-react';
import Footer from './Footer';
import { useDocumentMeta } from '../utils/useDocumentMeta';
import { useTimeOnPage } from '../utils/useTimeOnPage';
import './Brochure.css';

/**
 * Branded wrapper for the capital-campaign brochure viewer: header, title +
 * intro, the viewer (children), a give call-to-action, and the site footer.
 */
function BrochureLayout({ children }) {
  useDocumentMeta({
    title: 'Opportunity Starts at Home: Capital Campaign | SupportWorks Housing',
    description:
      'Explore the SupportWorks Housing capital campaign: a regional solution to homelessness, funded regionally, bringing 60 new permanent supportive homes to Greater Richmond at Gateway Park.',
  });

  // Keep this page out of search results for now (not yet public-facing).
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => document.head.removeChild(meta);
  }, []);

  // Track active time on the page (views are tracked globally in App.jsx).
  useTimeOnPage('SWHCapitalCampaign');

  return (
    <>
      <header className="brx-header">
        <div className="brx-header-inner">
          <a href="/" className="brx-logo" aria-label="SupportWorks Housing home">
            <img src={`${import.meta.env.BASE_URL}images/logo-ful.png`} alt="SupportWorks Housing" />
          </a>
          <div className="brx-header-actions">
            <a href="/#donate" className="brx-header-donate">Donate</a>
            <a href="/" className="brx-header-back">
              <ArrowLeft size={16} /> Back to Main Site
            </a>
          </div>
        </div>
      </header>

      <main className="brx-main">
        <section className="brx-intro">
          <span className="brx-eyebrow">A Capital Campaign</span>
          <h1 className="brx-title">Opportunity Starts at Home</h1>
          <p className="brx-lead">
            Greater Richmond is coming together to end homelessness, one permanent home at a time.
            Gateway Park is a <strong>regional solution to homelessness, funded regionally</strong>:{' '}
            <strong>60 new permanent supportive homes</strong> built through a partnership of local
            governments, philanthropy, and community leaders.
          </p>
        </section>

        <section className="brx-viewer-section">{children}</section>

        <section className="brx-cta">
          <div className="brx-cta-card">
            <div className="brx-cta-icon"><Heart size={28} /></div>
            <h2 className="brx-cta-title">Help Us Finish What We've Started</h2>
            <p className="brx-cta-text">
              Make homelessness history, sixty neighbors at a time. Your gift brings Gateway Park to life.
            </p>
            <a
              href="/#donate"
              className="btn btn-primary brx-cta-btn"
              onClick={() => window.gtag?.('event', 'brochure_donate_click', {
                event_category: 'engagement',
                event_label: 'cta',
              })}
            >
              <Heart size={18} /> Support the Campaign
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

export default BrochureLayout;
