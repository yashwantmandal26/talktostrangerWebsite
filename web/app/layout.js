import './globals.css';
import Script from 'next/script';

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Talk to Strangers India';

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    default: `${APP_NAME} – Free Indian Stranger Chat | Anonymous 1-on-1 Text Chat`,
    template: `%s | ${APP_NAME}`,
  },
  description: 'Free anonymous 1-on-1 text chat with random Indian strangers. No registration, no phone numbers, no logs. Your safe Omegle alternative for India.',
  keywords: ['talk to strangers india', 'indian stranger chat', 'anonymous chat india', 'omegle alternative india', 'free text chat india', 'desi stranger chat'],
  authors: [{ name: 'Talk to Strangers India' }],
  creator: 'Talk to Strangers India',
  publisher: 'Talk to Strangers India',
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 } },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: '/',
    siteName: APP_NAME,
    title: `${APP_NAME} – Free Indian Stranger Chat`,
    description: 'Anonymous 1-on-1 text chat with random Indian strangers. No signup, no phone numbers. Start chatting instantly.',
    images: [
      { url: '/og-image.png', width: 1200, height: 630, alt: APP_NAME },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${APP_NAME} – Free Indian Stranger Chat`,
    description: 'Anonymous 1-on-1 text chat with random Indian strangers. No signup required.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: '/',
  },
  other: {
    'theme-color': '#0f172a',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en-IN" className="dark">
      <head>
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'} crossOrigin="anonymous" />
        <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'} />
        <Script
          type="application/ld+json"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: APP_NAME,
              url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
              description: 'Free anonymous 1-on-1 text chat with random Indian strangers. No registration, no phone numbers.',
              applicationCategory: 'CommunicationApplication',
              operatingSystem: 'Web',
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR', availability: 'https://schema.org/InStock' },
              featureList: [
                'Anonymous 1-on-1 text chat',
                'Multiplayer in-chat games (Zero Kaata, Stone Paper Scissors, Desi Trivia)',
                'Desi icebreaker prompts',
                'Topic & interest matching',
                'No registration required',
                'Indian user matching',
                'Real-time messaging',
                'Safety moderation',
                'Mobile-friendly',
              ],
            }),
          }}
        />
        <Script
          type="application/ld+json"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: [
                {
                  '@type': 'Question',
                  name: 'Is Talk to Strangers India 100% free?',
                  acceptedAnswer: { '@type': 'Answer', text: 'Yes, Talk to Strangers India is completely free. No hidden charges, no premium tiers, no subscriptions.' },
                },
                {
                  '@type': 'Question',
                  name: 'Do I need to register or provide phone numbers?',
                  acceptedAnswer: { '@type': 'Answer', text: 'No. Talk to Strangers India requires no registration, no email, no phone number, and no social login. You chat 100% anonymously.' },
                },
                {
                  '@type': 'Question',
                  name: 'How is my privacy protected during anonymous chat?',
                  acceptedAnswer: { '@type': 'Answer', text: 'We do not store chat logs, IP addresses are hashed for temporary moderation only, and no personal data is collected. Conversations are ephemeral and not persisted.' },
                },
              ],
            }),
          }}
        />
      </head>
      <body className="min-h-screen bg-dark-950 text-dark-50 antialiased">
        {children}
      </body>
    </html>
  );
}