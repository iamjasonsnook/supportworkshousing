import { useEffect } from 'react';

/**
 * Set per-route document metadata (title, description, canonical, Open Graph /
 * Twitter) for a SPA route, and restore the previous values on unmount so
 * other routes keep the site-wide defaults from index.html.
 *
 * All targeted tags already exist statically in index.html, so this only
 * updates their values, so it never leaves orphaned tags behind.
 *
 * @param {{title?:string, description?:string, canonical?:string,
 *          ogTitle?:string, ogDescription?:string}} meta
 */
export function useDocumentMeta(meta) {
  const { title, description, canonical, ogTitle, ogDescription } = meta;

  useEffect(() => {
    const restores = [];

    if (title) {
      const prev = document.title;
      document.title = title;
      restores.push(() => { document.title = prev; });
    }

    const applyAttr = (selector, attr, value) => {
      if (value == null) return;
      const el = document.head.querySelector(selector);
      if (!el) return;
      const prev = el.getAttribute(attr);
      el.setAttribute(attr, value);
      restores.push(() => {
        if (prev == null) el.removeAttribute(attr);
        else el.setAttribute(attr, prev);
      });
    };

    const social = ogTitle ?? title;
    const socialDesc = ogDescription ?? description;

    applyAttr('meta[name="description"]', 'content', description);
    applyAttr('link[rel="canonical"]', 'href', canonical);
    applyAttr('meta[property="og:title"]', 'content', social);
    applyAttr('meta[property="og:description"]', 'content', socialDesc);
    applyAttr('meta[property="og:url"]', 'content', canonical);
    applyAttr('meta[name="twitter:title"]', 'content', social);
    applyAttr('meta[name="twitter:description"]', 'content', socialDesc);

    return () => { restores.reverse().forEach((fn) => fn()); };
  }, [title, description, canonical, ogTitle, ogDescription]);
}
