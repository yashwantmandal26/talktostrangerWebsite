// Auto-generated robots.txt for Talk to Strangers India
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://talktostrangers-india.vercel.app';

export default function Robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/_next/', '/static/', '/*.json$'],
    },
    sitemap: `${APP_URL}/sitemap.xml`,
    host: APP_URL,
  };
}