import { useState, useMemo } from 'react';
import { Quote, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import './Stories.css';

function Stories() {
  const stories = [
    {
      name: 'Muhammad',
      location: 'The Crossings, Charlottesville',
      background: 'U.S. Army Veteran',
      quote: "Every day I have hope—that's the best part.",
      summary: 'After 8 years living in his car, Muhammad found stability at The Crossings. Now he\'s rebuilding his health and processing his trauma.',
      image: `${import.meta.env.BASE_URL}images/muhammad.jpg`,
      fullStory: `Muhammad's journey began as an Iraqi immigrant success story: U.S. Army employee, six-figure income, married with two children and a Virginia home. A deployment injury causing disability and PTSD unraveled this life. His marriage dissolved, and by January 2015, he was living in his car for eight years.

Muhammad slept in Walmart parking lots and on streets, relying on shelter services for basic needs. He drove for rideshare companies to earn money, often traveling to Richmond for airport pickups. His health deteriorated—he missed medical appointments, struggled with medication management, and gained weight from fast food dependence.

Bureaucratic obstacles compounded his housing search; street homelessness made him unreachable when offered a Crossings spot in May 2022. An eviction record blocked apartment applications despite obtaining a Housing Choice Voucher.

Through advocacy from caseworkers at the Jefferson Area Board for Aging and Albemarle County Office of Housing, he secured an apartment at the Crossings in January 2023. Now housed, he's rebuilding his health through home-cooked meals and processing his trauma.`,
    },
    {
      name: 'Joel Chambers',
      location: 'Gosnold, Virginia Beach',
      background: 'Resident since 2019',
      quote: "Grace is a gift.",
      summary: 'An MS diagnosis left Joel unable to walk. After losing everything, he found stability at Gosnold and now works full-time at Grace Bible Church.',
      image: `${import.meta.env.BASE_URL}images/joel.jpg`,
      fullStory: `Before homelessness, Joel worked at Apple, attended college for software development, and was married—living what he called a good life. In 2016, he woke unable to walk and received a multiple sclerosis diagnosis that doctors warned might never allow walking again.

Unable to work, Joel relied on disability benefits while self-medicating with alcohol. His marriage crumbled under the strain. Evicted on his birthday in March 2018, he moved between shelters and hotels. DJing at nightlife venues worsened his alcohol dependence, resulting in two DUIs and imprisonment. Upon release, he remained homeless.

The Virginia Beach Housing Resource Center connected him to temporary housing; Monica from Gosnold offered him an apartment in March 2019 during his final days there. Through Celebrate Recovery (a faith-based program) and stable housing, Joel's MS symptoms eased.

He obtained mobility aids, reconnected with his former employer, purchased a car, and was hired full-time as Guest Services Director at Grace Bible Church. He helps neighbors regularly and reports his parents express pride in his transformation.`,
    },
    {
      name: 'Curtis Moore',
      location: 'Studios at South Richmond',
      background: 'Resident for 4 years',
      quote: "I'm a person that worked real hard and worked all my life.",
      summary: 'Shot while saving five lives, Curtis became partially paralyzed. After 3 years homeless, he found community at Studios at South Richmond.',
      image: `${import.meta.env.BASE_URL}images/curtis.jpg`,
      fullStory: `Curtis worked hard his entire life and helped feed homeless individuals until becoming homeless himself. In 1991 Baltimore, he was shot in the neck while saving five people's lives, resulting in partial paralysis and Brown-Séquard Syndrome.

After a year of therapy to relearn walking, Curtis's slower lifestyle eventually led to homelessness. Family support proved impossible; his disability made typical housing unsuitable—bathrooms upstairs he couldn't access. He refused shelters for three years, living in his car because he "didn't want to take up space that was someone else's."

Social services connected him to SupportWorks Housing. He expressed gratitude: "I thank God for helping me meet and talk to the right people."

Nearly four years at Studios at South Richmond has transformed his life. He praised the accessible facilities and supportive community atmosphere. Now he travels again and has rekindled his grandmother's cooking legacy—cooking represents "freedom, hope and dignity" for someone who lived car-bound for years.`,
    },
    {
      name: 'Mark Finster',
      location: 'Hampton Roads',
      background: 'Resident since 2014',
      quote: "When will it be my time for something good?",
      summary: 'After 10 years on the streets, Mark found housing through SupportWorks. His caseworkers helped him survive cancer treatment.',
      image: `${import.meta.env.BASE_URL}images/mark.jpg`,
      fullStory: `Mark endured ten years on the streets, arrested hundreds of times for public intoxication and witnessing numerous friends die from street dangers. "Some nights I'd pray, 'Lord, when will it be my time for something good?'"

A decade of survival on streets exposed Mark to constant danger and instability. He faced repeated arrest and the traumatic loss of friends to street life hazards.

In 2014, SupportWorks engaged Mark after a church feeding program. He arrived at 5:30 AM for a 7:00 AM appointment—eager to secure housing. Through the Housing First scattered-site program, Mark lives in a community apartment with mobile caseworker support.

His caseworkers assisted with cancer treatment, insurance, transportation, and emotional support throughout his illness. He reflected: "I would have died on the streets, or I would have died of cancer."

Recently, a police officer who knew Mark during his unhoused years visited to express pride in his progress, affirming Mark's transformation through SupportWorks' intervention.`,
    },
  ];

  const stats = [
    { value: '1,000+', label: 'Lives transformed' },
    { value: '96%', label: 'Housing retention rate' },
    { value: '$8M+', label: 'Community cost savings' },
    { value: '24/7', label: 'Support availability' },
  ];

  const randomStart = useMemo(() => Math.floor(Math.random() * stories.length), []);
  const [currentIndex, setCurrentIndex] = useState(randomStart);
  const [isExpanded, setIsExpanded] = useState(false);

  const nextStory = () => {
    setCurrentIndex((prev) => (prev + 1) % stories.length);
    setIsExpanded(false);
  };

  const prevStory = () => {
    setCurrentIndex((prev) => (prev - 1 + stories.length) % stories.length);
    setIsExpanded(false);
  };

  const story = stories[currentIndex];

  return (
    <section id="stories" className="stories section">
      <div className="container">
        <div className="stories-header">
          <h2>Stories of Hope</h2>
          <p>Real people, real transformations</p>
        </div>

        <div className="testimonial-slider">
          <button className="slider-btn slider-btn-prev" onClick={prevStory} aria-label="Previous story">
            <ChevronLeft size={24} />
          </button>

          <div className="testimonial-card">
            <div className="testimonial-image">
              <img src={story.image} alt={story.name} />
            </div>
            <div className="testimonial-content">
              <div className="quote-icon">
                <Quote size={24} color="#9B1B5D" />
              </div>
              <blockquote>"{story.quote}"</blockquote>
              <div className="testimonial-author">
                <strong>{story.name}</strong>
                <span>{story.background} • {story.location}</span>
              </div>

              {!isExpanded ? (
                <p className="testimonial-summary">{story.summary}</p>
              ) : (
                <div className="testimonial-full-story">
                  {story.fullStory.split('\n\n').map((paragraph, idx) => (
                    <p key={idx}>{paragraph}</p>
                  ))}
                </div>
              )}

              <button
                className="expand-btn"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <>Read Less <ChevronUp size={18} /></>
                ) : (
                  <>Read Full Story <ChevronDown size={18} /></>
                )}
              </button>
            </div>
          </div>

          <button className="slider-btn slider-btn-next" onClick={nextStory} aria-label="Next story">
            <ChevronRight size={24} />
          </button>
        </div>

        <div className="slider-dots">
          {stories.map((_, index) => (
            <button
              key={index}
              className={`slider-dot ${index === currentIndex ? 'active' : ''}`}
              onClick={() => { setCurrentIndex(index); setIsExpanded(false); }}
              aria-label={`Go to story ${index + 1}`}
            />
          ))}
        </div>

        <div className="stories-stats">
          {stats.map((stat) => (
            <div key={stat.label} className="stories-stat">
              <span className="stories-stat-value">{stat.value}</span>
              <span className="stories-stat-label">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Stories;
