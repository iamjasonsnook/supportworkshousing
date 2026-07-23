import { useState, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

/**
 * Render the tri-fold brochure PDF at high resolution and slice each of its two
 * landscape pages into three equal portrait panels.
 *
 * Rendered directly from pdf.js at a high scale and sliced losslessly (PNG) so
 * the panel text stays crisp on high-DPI screens. (This deliberately does not
 * reuse usePdfPages, which JPEG-encodes pages before slicing would re-encode
 * them a second time, softening the text.)
 *
 * Panels are ordered:
 *   [0] outside-left   (The Challenge)
 *   [1] outside-middle (Join Us)
 *   [2] outside-right  (Front cover, "Opportunity Starts at Home")
 *   [3] inside-left    (The Project)
 *   [4] inside-middle  (Campaign Priorities)
 *   [5] inside-right   (Where We Are)
 */
export function useBrochurePanels(url, { scale = 4 } = {}) {
  const [panels, setPanels] = useState([]);
  const [status, setStatus] = useState('loading');
  const [numPages, setNumPages] = useState(0);
  const [loaded, setLoaded] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setPanels([]);
    setLoaded(0);
    setNumPages(0);

    (async () => {
      try {
        const pdf = await pdfjsLib.getDocument(url).promise;
        if (cancelled) return;
        setNumPages(pdf.numPages);

        const result = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          await page.render({ canvasContext: ctx, viewport }).promise;
          if (cancelled) return;

          const panelW = Math.floor(canvas.width / 3);
          for (let col = 0; col < 3; col++) {
            const pc = document.createElement('canvas');
            pc.width = panelW;
            pc.height = canvas.height;
            pc.getContext('2d').drawImage(
              canvas, col * panelW, 0, panelW, canvas.height,
              0, 0, panelW, canvas.height,
            );
            result.push({ dataUrl: pc.toDataURL('image/png'), width: panelW, height: canvas.height });
          }
          setLoaded(i);
        }
        if (!cancelled) {
          setPanels(result);
          setStatus('ready');
        }
      } catch (err) {
        console.error('Failed to render brochure PDF:', err);
        if (!cancelled) setStatus('error');
      }
    })();

    return () => { cancelled = true; };
  }, [url, scale]);

  return { panels, ready: status === 'ready', status, numPages, loaded };
}
