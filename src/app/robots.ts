import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard', '/settings', '/profile', '/itineraries', '/messages'],
    },
    sitemap: 'https://nxtvibes.vercel.app/sitemap.xml',
  };
}
