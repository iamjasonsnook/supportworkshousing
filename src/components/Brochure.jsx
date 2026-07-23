import { useRef, useState } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import BrochureLayout from './BrochureLayout';
import PdfStatus from './PdfStatus';
import { useBrochurePanels } from '../utils/useBrochurePanels';

const BROCHURE_URL = `${import.meta.env.BASE_URL}capital-campaign-brochure.pdf`;

// Reading order: front cover → three inside panels → the two outside content panels.
const ORDER = [2, 3, 4, 5, 0, 1];
const LABELS = [
  'Front cover', 'The Project', 'Campaign Priorities',
  'Where We Are', 'The Challenge', 'Join Us',
];

/**
 * Capital-campaign brochure viewer: the six brochure panels become pages you
 * flip through in reading order with a page-curl animation.
 */
function Brochure() {
  const { panels, ready, status, loaded, numPages } = useBrochurePanels(BROCHURE_URL);
  const bookRef = useRef(null);
  const [page, setPage] = useState(0);

  const flip = (dir) => {
    const api = bookRef.current?.pageFlip?.();
    if (!api) return;
    dir === 'next' ? api.flipNext() : api.flipPrev();
  };

  const ar = panels.length ? panels[0].width / panels[0].height : 0.426;
  const pageHeight = 620;
  const pageWidth = Math.round(pageHeight * ar);
  const ordered = ORDER.map((i) => panels[i]);

  return (
    <BrochureLayout>
      <div className="brv2-stage">
        <PdfStatus status={status} loaded={loaded} numPages={numPages} noun="brochure" fallbackUrl={BROCHURE_URL} />

        {ready && (
          <>
            <div className="brv2-book-row">
              {page === 0 && (
                <div className="brv2-flip-hint" aria-hidden="true">
                  <span className="brv2-flip-hint-text">Flip the page to see more</span>
                </div>
              )}
              <button className="brx-arrow" onClick={() => flip('prev')} disabled={page <= 0} aria-label="Previous panel">
                <ChevronLeft size={26} />
              </button>

              <HTMLFlipBook
                ref={bookRef}
                width={pageWidth}
                height={pageHeight}
                size="stretch"
                minWidth={220}
                maxWidth={440}
                minHeight={440}
                maxHeight={960}
                showCover={true}
                maxShadowOpacity={0.4}
                mobileScrollSupport={true}
                className="brv2-book"
                onFlip={(e) => setPage(e.data)}
              >
                {ordered.map((p, i) => (
                  <div className="brv2-panel" key={i}>
                    <img src={p?.dataUrl} alt={`${LABELS[i]} panel`} draggable={false} />
                  </div>
                ))}
              </HTMLFlipBook>

              <button className="brx-arrow" onClick={() => flip('next')} disabled={page >= ORDER.length - 1} aria-label="Next panel">
                <ChevronRight size={26} />
              </button>
            </div>

            <div className="brv2-caption">
              <span className="brx-counter">{LABELS[page]} · {page + 1} of {ORDER.length}</span>
              <span className="brx-hint">Drag a corner or use the arrows to turn the panel</span>
            </div>
          </>
        )}
      </div>
    </BrochureLayout>
  );
}

export default Brochure;
