'use client';

import dynamic from 'next/dynamic';

const Chat = dynamic(() => import('./components/Chat'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-dark-950">
      <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

export default function Home() {
  return <Chat />;
}