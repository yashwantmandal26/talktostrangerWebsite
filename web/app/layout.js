import './globals.css';
import Script from 'next/script';

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Talk to Strangers India';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://talktostrangers-india.vercel.app';

export const metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: `${APP_NAME} – Free Indian Anonymous Stranger Chat | Omegle Alternative`,
    template: `%s | ${APP_NAME}`,
  },
  description: 'Talk to Indian strangers anonymously for free. Instant 1-on-1 text chat, multiplayer in-chat games (Tic-Tac-Toe, Desi Quiz), and funny icebreakers. No signup, no phone number, 100% safe & private.',
  keywords: [
    'talk to strangers india',
    'talk to strangers',
    'indian stranger chat',
    'omegle alternative india',
    'free stranger chat india',
    'anonymous chat india',
    'random chat india',
    'talk to random people india',
    'desi chat online',
    'free text chat with strangers',
    'indian anonymous chat room',
    'stranger chat with games',
    'safe chat app india',
  ],
  authors: [{ name: APP_NAME, url: APP_URL }],
  creator: APP_NAME,
  publisher: APP_NAME,
  category: 'Communication',
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: '/',
    siteName: APP_NAME,
    title: `${APP_NAME} – Free Indian Anonymous Stranger Chat`,
    description: 'Instant anonymous 1-on-1 text chat with random Indian strangers. Multiplayer mini-games, desi icebreakers, zero registration. Start chatting now!',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: `${APP_NAME} - Free Indian Stranger Chat Platform`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${APP_NAME} – Free Indian Anonymous Stranger Chat`,
    description: 'Instant 1-on-1 text chat with Indian strangers. Play multiplayer games & desi icebreakers without sign-up.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: '/',
  },
  other: {
    'theme-color': '#090d16',
    'geo.region': 'IN',
    'geo.placename': 'India',
    'content-language': 'en-IN, hi-IN',
  },
  verification: {
    google: 'SE7XZ_6unEMGlKUa0Tz6x2XvaNAI7JRIDlH_Vxw5f3E',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en-IN" className="dark">
      <head>
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'} crossOrigin="anonymous" />
        <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'} />
        
        {/* WebApplication Schema */}
        <Script
          type="application/ld+json"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: APP_NAME,
              url: APP_URL,
              description: 'Free anonymous 1-on-1 text chat platform with random Indian strangers. Includes multiplayer in-chat games, interest matching, and desi icebreakers.',
              applicationCategory: 'CommunicationApplication',
              operatingSystem: 'All (Web, iOS, Android, Desktop)',
              inLanguage: ['en-IN', 'hi-IN'],
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'INR',
                availability: 'https://schema.org/InStock',
              },
              featureList: [
                'Anonymous 1-on-1 text chat with Indian strangers',
                'Multiplayer in-chat mini games (Zero Kaata, Stone Paper Scissors, Desi Trivia Duel)',
                'Desi icebreaker prompt generator',
                'Topic and interest-based matchmaking',
                'Strict safety moderation (phone number and social link filters)',
                'Zero registration and no phone numbers required',
                'Full Indian IT Act 2000 & IT Rules 2021 compliance',
              ],
            }),
          }}
        />

        {/* FAQPage Schema */}
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
                  name: 'What is Talk to Strangers India?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Talk to Strangers India is a free, mobile-first anonymous 1-on-1 text chat platform designed for Indian users to meet and talk to random strangers safely, share desi icebreakers, and play real-time multiplayer games without registration.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'Is Talk to Strangers India completely free?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes, Talk to Strangers India is 100% free forever. There are no subscriptions, no premium coins, no hidden paywalls, and no credit card required.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'Do I need to sign up, provide a phone number, or download an app?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'No. You do not need to register, provide an email address, or enter a phone number. The website works directly in any browser on mobile and desktop.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'How does Talk to Strangers India protect user privacy and safety?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'We do not store chat logs or personal records. Conversations are ephemeral and end permanently when you disconnect. Automated server-side filters block phone numbers, social media handles, and profanity. A 1-click report button enforces a 24-hour IP ban on violators.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'What multiplayer games can I play in the chat?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'You can play Zero Kaata (Tic-Tac-Toe), Stone-Paper-Scissors with simultaneous reveal, and Desi Quiz Duel featuring 5 timed Bollywood, Cricket, and Indian pop-culture trivia questions.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'How does interest matching work?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'You can select preset interest chips such as Cricket & IPL, Bollywood & OTT, Gaming & BGMI, Tech & AI, or add custom tags like UPSC or College to get matched with like-minded Indian strangers.',
                  },
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