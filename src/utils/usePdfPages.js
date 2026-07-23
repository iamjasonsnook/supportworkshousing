import { useState, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Wire the pdf.js worker for Vite. Without this pdf.js falls back to a
// fake worker on the main thread (slow) or fails outright in production.
pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

/**
 * Load a PDF and render every page to a JPEG data URL.
 *
 * Rendering happens progressively: `pages` grows one entry at a time and
 * `loaded` tracks how many are ready, so a viewer can show a real progress
 * bar and start displaying the cover before the whole booklet is rasterized.
 *
 * @param {string} url    Path to the PDF (served from /public).
 * @param {object} opts
 * @param {number} opts.scale  Rasterization scale (higher = crisper, heavier).
 * @returns {{pages: Array<{dataUrl:string,width:number,height:number}>,
 *            status:'loading'|'ready'|'error', numPages:number, loaded:number}}
 */
export function usePdfPages(url, { scale = 1.5 } = {}) {
  const [pages, setPages] = useState([]);
  const [status, setStatus] = useState('loading');
  const [numPages, setNumPages] = useState(0);
  const [loaded, setLoaded] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setPages([]);
    setLoaded(0);
    setNumPages(0);

    (async () => {
      try {
        const pdf = await pdfjsLib.getDocument(url).promise;
        if (cancelled) return;
        setNumPages(pdf.numPages);

        const rendered = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          await page.render({ canvasContext: context, viewport }).promise;
          if (cancelled) return;

          rendered.push({
            dataUrl: canvas.toDataURL('image/jpeg', 0.85),
            width: canvas.width,
            height: canvas.height,
          });
          setPages([...rendered]);
          setLoaded(i);
        }
        if (!cancelled) setStatus('ready');
      } catch (err) {
        console.error('Failed to render impact report PDF:', err);
        if (!cancelled) setStatus('error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [url, scale]);

  return { pages, status, numPages, loaded };
}
