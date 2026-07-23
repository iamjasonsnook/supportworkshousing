import { useRef, useState } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ImpactReportLayout from './ImpactReportLayout';
import PdfStatus from './PdfStatus';
import { usePdfPages } from '../utils/usePdfPages';

const REPORT_URL = `${import.meta.env.BASE_URL}impact-report-2025.pdf`;

/**
 * Impact Report viewer: a realistic two-page booklet with a page-curl flip
 * and drag support (react-pageflip), rendered from the report PDF.
 */
function ImpactReport() {
  const { pages, status, numPages, loaded } = usePdfPages(REPORT_URL, { scale: 1.5 });
  const bookRef = useRef(null);
  const [page, setPage] = useState(0);

  const flip = (dir) => {
    const api = bookRef.current?.pageFlip?.();
    if (!api) return;
    dir === 'next' ? api.flipNext() : api.flipPrev();
  };

  // Size the spread from the first page's aspect ratio.
  const ar = pages.length ? pages[0].width / pages[0].height : 0.773;
  const pageHeight = 580;
  const pageWidth = Math.round(pageHeight * ar);

  return (
    <ImpactReportLayout>
      <div className="v1-stage">
        <PdfStatus status={status} loaded={loaded} numPages={numPages} />

        {status === 'ready' && page === 0 && (
          <div className="v1-flip-hint" aria-hidden="true">
            <span className="v1-flip-hint-text">Flip the page to see more</span>
          </div>
        )}

        {status === 'ready' && (
          <>
            <button
              className="v1-arrow v1-arrow-left"
              onClick={() => flip('prev')}
              disabled={page <= 0}
              aria-label="Previous page"
            >
              <ChevronLeft size={28} />
            </button>

            <HTMLFlipBook
              ref={bookRef}
              width={pageWidth}
              height={pageHeight}
              size="stretch"
              minWidth={300}
              maxWidth={620}
              minHeight={380}
              maxHeight={900}
              showCover={true}
              maxShadowOpacity={0.4}
              mobileScrollSupport={true}
              className="v1-book"
              onFlip={(e) => setPage(e.data)}
            >
              {pages.map((p, i) => (
                <div className="v1-page" key={i}>
                  <img src={p.dataUrl} alt={`Impact report page ${i + 1}`} draggable={false} />
                </div>
              ))}
            </HTMLFlipBook>

            <button
              className="v1-arrow v1-arrow-right"
              onClick={() => flip('next')}
              disabled={page >= numPages - 1}
              aria-label="Next page"
            >
              <ChevronRight size={28} />
            </button>
          </>
        )}
      </div>

      {status === 'ready' && (
        <div className="v1-caption">
          <span className="v1-counter">Page {Math.min(page + 1, numPages)}–{Math.min(page + 2, numPages)} of {numPages}</span>
          <span className="v1-hint">Drag a corner or use the arrows to turn the page</span>
        </div>
      )}
    </ImpactReportLayout>
  );
}

export default ImpactReport;
