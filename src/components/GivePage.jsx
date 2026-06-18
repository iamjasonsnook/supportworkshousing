import { TrendingUp, BookOpen, Landmark, Building2, Star, Gift } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';
import Donate from './Donate';
import './GivePage.css';

const ADMIN_EMAIL = 'jsnook@supportworkshousing.org';

const waysToGive = [
  {
    Icon: TrendingUp,
    title: 'Stocks & Securities',
    description:
      'Transferring appreciated securities is one of the most tax-efficient ways to give. Avoid capital gains taxes and receive a full charitable deduction for the fair market value of your gift on the date of transfer.',
    cta: 'Get Transfer Details',
    subject: 'Inquiry: Stock or Securities Gift',
    body: 'Hello,\n\nI am interested in donating appreciated stocks or securities to SupportWorks Housing. Could you please share information about the transfer process?\n\nThank you!',
  },
  {
    Icon: BookOpen,
    title: 'Planned Giving',
    description:
      'A bequest in your will or trust is a powerful way to extend your values beyond your lifetime. Including SupportWorks Housing in your estate plan ensures this work continues for the people who need it most — now and for generations to come.',
    cta: 'Start a Conversation',
    subject: 'Inquiry: Planned Giving',
    body: 'Hello,\n\nI am interested in including SupportWorks Housing in my estate plan. Could you please provide information about planned giving or legacy gift options?\n\nThank you!',
  },
  {
    Icon: Landmark,
    title: 'Endowment Gifts',
    description:
      'Establish a named endowment and create a permanent source of support for SupportWorks Housing. The principal of your gift is invested and preserved, while the earnings fund our work year after year — a legacy that truly never stops giving.',
    cta: 'Create an Endowment',
    subject: 'Inquiry: Endowment Gift',
    body: 'Hello,\n\nI am interested in establishing an endowment gift with SupportWorks Housing. Could you please share information about how a named endowment works and what it would take to get started?\n\nThank you!',
  },
  {
    Icon: Building2,
    title: 'Corporate Partnerships',
    description:
      'Align your company\'s values with real, measurable community impact. Whether it\'s an employee giving campaign, a sponsorship, or a volunteer day, we\'ll work with you to design a partnership that fits your organization and your goals.',
    cta: 'Partner With Us',
    subject: 'Inquiry: Corporate Partnership',
    body: 'Hello,\n\nI am interested in exploring a corporate partnership with SupportWorks Housing. Could you please share information about how my organization can get involved?\n\nThank you!',
  },
  {
    Icon: Star,
    title: 'Tribute & Memorial Gifts',
    description:
      'Honor someone who matters to you — or remember someone you\'ve lost — with a gift made in their name. We\'ll send a personal acknowledgment letter to the honoree or their family, letting them know your gift was made in their honor.',
    cta: 'Make a Tribute Gift',
    subject: 'Tribute or Memorial Gift',
    body: 'Hello,\n\nI would like to make a gift in honor or memory of someone special. Could you please share information about how to arrange a tribute or memorial gift to SupportWorks Housing?\n\nThank you!',
  },
  {
    Icon: Gift,
    title: 'Matching Gifts',
    description:
      'Many employers match their employees\' charitable contributions — sometimes two or three times over. A quick check with your HR department could turn your gift into two. We\'ll provide all the documentation your employer needs.',
    cta: 'Check Your Eligibility',
    subject: 'Inquiry: Employer Matching Gift',
    body: 'Hello,\n\nI would like to submit a matching gift request through my employer for a donation to SupportWorks Housing. Could you please provide the information my company will need?\n\nThank you!',
  },
];

function GivePage() {
  const handleMailto = (subject, body) => {
    window.location.href = `mailto:${ADMIN_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section className="give-hero">
          <div className="container give-hero-inner">
            <p className="give-hero-eyebrow">Make a Difference</p>
            <h1 className="give-hero-headline">Every Gift Moves<br />Someone Home</h1>
            <p className="give-hero-sub">
              SupportWorks Housing provides more than a roof. We walk alongside people experiencing
              homelessness with the services, stability, and community they need to rebuild their lives —
              and stay housed. Your generosity makes that possible.
            </p>
            <a href="#donate" className="give-hero-cta">Give Now</a>
          </div>
        </section>

        {/* Donation Widget */}
        <div className="give-widget-wrap">
          <Donate />
        </div>

        {/* Ways to Give */}
        <section className="give-ways section">
          <div className="container">
            <div className="give-ways-header">
              <h2>More Ways to Give</h2>
              <p>
                We make it easy to support our mission in whatever way works best for you.
                Reach out — we'll work with you to maximize your impact.
              </p>
            </div>

            <div className="give-ways-grid">
              {waysToGive.map(({ Icon, title, description, cta, href, subject, body }) => (
                <div key={title} className="give-way-card">
                  <div className="give-way-icon">
                    <Icon size={24} color="#9B1B5D" />
                  </div>
                  <h3 className="give-way-title">{title}</h3>
                  <p className="give-way-desc">{description}</p>
                  {href ? (
                    <a href={href} className="give-way-link">{cta}</a>
                  ) : (
                    <button className="give-way-link" onClick={() => handleMailto(subject, body)}>{cta}</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Questions strip */}
        <section className="give-questions">
          <div className="container give-questions-inner">
            <div>
              <h3>Have questions about giving?</h3>
              <p>
                Our team is here to help you find the giving approach that's right for you.
                All gifts to SupportWorks Housing are tax-deductible to the full extent allowed by law.
              </p>
            </div>
            <a
              href={`mailto:${ADMIN_EMAIL}?subject=Giving%20Question`}
              className="give-questions-btn"
            >
              Contact Us
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

export default GivePage;
