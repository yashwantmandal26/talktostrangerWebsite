// Auto-generated sitemap.xml for Talk to Strangers India
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export default function sitemap() {
  const routes = [
    '',
    '/terms',
    '/privacy',
    '/disclaimer',
  ];

  return routes.map((route) => ({
    url: `${APP_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'daily' : 'monthly',
    priority: route === '' ? 1 : 0.7,
  }));
}