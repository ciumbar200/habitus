import { useEffect } from "react";

/**
 * Título, meta description y canonical para páginas públicas indexables.
 *
 * Nota SEO: Google lee el `<title>` y `<meta description>` mutados por JS, así
 * que estos sí aportan valor de indexación. El canonical también lo recoge.
 * Para vistas previas sociales (OG/Twitter) los scrapers NO ejecutan JS: esos
 * tags deben estar pre-renderizados en index.html (la fuente real).
 */
export function usePageMeta(title: string, description?: string, canonicalPath?: string) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title;

    // description
    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const prevContent = meta?.getAttribute("content") ?? null;
    if (description) {
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("name", "description");
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", description);
    }

    // canonical
    const href = canonicalPath ? `${window.location.origin}${canonicalPath}` : null;
    let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const prevCanonical = link?.getAttribute("href") ?? null;
    if (href) {
      if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", "canonical");
        document.head.appendChild(link);
      }
      link.setAttribute("href", href);
    }

    return () => {
      document.title = prevTitle;
      if (description && meta) {
        if (prevContent) meta.setAttribute("content", prevContent);
        else meta.remove();
      }
      if (href && link) {
        if (prevCanonical) link.setAttribute("href", prevCanonical);
        else link.remove();
      }
    };
  }, [title, description, canonicalPath]);
}
