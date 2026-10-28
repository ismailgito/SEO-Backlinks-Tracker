const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/+$/, '');

export default function sitemap() {
  return [{ url: `${SITE_URL}/`, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 }];
}
