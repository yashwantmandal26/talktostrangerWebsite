import Link from 'next/link';

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Talk to Strangers India';

export const metadata = {
  title: 'Disclaimer',
  description: 'Legal disclaimer for Talk to Strangers India – Intermediary status, user responsibility, and content liability.',
  robots: 'index, follow',
};

export default function DisclaimerPage() {
  const lastUpdated = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
  return (
    <main className="min-h-screen bg-dark-950 text-dark-50 py-12 px-4">
      <article className="max-w-3xl mx-auto space-y-8">
        <header className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Disclaimer</h1>
          <p className="text-dark-400">Last updated: {lastUpdated}</p>
        </header>

        <section className="prose prose-invert dark:prose-invert max-w-none space-y-6">
          <h2>1. Intermediary Status</h2>
          <p><strong>{APP_NAME}</strong> operates as an <em>intermediary</em> within the meaning of Section 2(w) of the Information Technology Act, 2000, and the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021. We provide a technical platform for anonymous real-time communication between users. We do not initiate, select, or modify the content transmitted by users.</p>

          <h2>2. No Editorial Control</h2>
          <p>We do not monitor, review, edit, or pre-screen chat messages. Conversations are ephemeral, peer-to-peer (relayed via our WebSocket server), and not stored. Any views expressed by strangers are solely theirs and do not reflect the views of {APP_NAME}.</p>

          <h2>3. User Responsibility</h2>
          <p>You are <strong>solely responsible</strong> for your conduct and any content you send. You agree not to use the service for any unlawful purpose, including but not limited to:</p>
          <ul>
            <li>Child sexual abuse material (CSAM) – punishable under POCSO Act, 2012, and IT Act, 2000.</li>
            <li>Harassment, stalking, doxxing, threats, or hate speech.</li>
            <li>Fraud, scams, phishing, or impersonation.</li>
            <li>Distribution of malware, viruses, or harmful code.</li>
            <li>Violation of any Indian law or regulation.</li>
          </ul>

          <h2>4. Reporting & Takedown</h2>
          <p>We provide an in-chat <strong>Report</strong> button. Reports trigger immediate chat termination and a 24-hour temporary block of the reported user (based on hashed IP). For formal legal takedown requests (court order, government directive), contact our Grievance Officer at <a href="mailto:grievance@talktostrangersindia.com" className="underline hover:text-primary-400">grievance@talktostrangersindia.com</a>. We will comply with valid legal orders as required by Indian law.</p>

          <h2>5. No Liability for User Content</h2>
          <p>Under Section 79 of the IT Act, 2000, {APP_NAME} shall not be liable for third-party content transmitted via the platform, provided we act expeditiously to remove or disable access upon receiving actual knowledge (via court order or government notification).</p>

          <h2>6. Age Restriction Enforcement</h2>
          <p>Access is restricted to users aged 18 and above. The age gate requires explicit acknowledgment before entering the matchmaking queue. We rely on user self-certification; we do not verify age via documents (to preserve anonymity). Parents/guardians are advised to use device-level parental controls.</p>

          <h2>7. Service Availability</h2>
          <p>The service runs on free-tier cloud infrastructure (Render/Fly.io + Vercel). We do not guarantee 99.9% uptime, uninterrupted connectivity, or immediate bug fixes. The service may be paused or discontinued at any time without notice.</p>

          <h2>8. No Warranty</h2>
          <p>The platform is provided <strong>"as is"</strong> without warranties of merchantability, fitness for a particular purpose, or non-infringement. Use at your own risk.</p>

          <h2>9. Jurisdiction</h2>
          <p>This Disclaimer and any dispute arising from the use of {APP_NAME} shall be governed by the laws of India, subject to the exclusive jurisdiction of courts in Mumbai, Maharashtra.</p>

          <h2>10. Contact</h2>
          <p>Grievance Officer: <a href="mailto:grievance@talktostrangersindia.com" className="underline hover:text-primary-400">grievance@talktostrangersindia.com</a></p>
        </section>

        <footer className="text-center text-sm text-dark-500 mt-8">
          <Link href="/" className="hover:text-primary-400 underline">← Back to {APP_NAME}</Link>
        </footer>
      </article>
    </main>
  );
}