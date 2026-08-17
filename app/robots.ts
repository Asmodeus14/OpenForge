import type { MetadataRoute } from 'next';

/**
 * Crawler rules.
 *
 * `/design` is the internal design-system reference — useful to the people
 * building this, meaningless to anyone arriving from a search result. The
 * API route has nothing to index.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/design', '/api/'],
    },
  };
}
