import Link from 'next/link';

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Talk to Strangers India';

export const metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for Talk to Strangers India – How we protect your anonymity and data.',
  robots: 'index, follow',
};

export default function PrivacyPage() {
  const lastUpdated = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
  return (
    <main className="min-h-screen bg-dark-950 text-dark-50 py-12 px-4">
      <article className="max-w-3xl mx-auto space-y-8">
        <header className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="text-dark-400">Last updated: {lastUpdated}</p>
        </header>

        <section className="prose prose-invert dark:prose-invert max-w-none space-y-6">
          <p><strong>{APP_NAME}</strong> is built on a privacy-by-design principle. This policy explains what data we process, why, and how long we keep it.</p>

          <h2>1. Data We Do NOT Collect</h2>
          <ul>
            <li>No names, emails, phone numbers, or social media accounts.</li>
            <li>No chat logs, message history, or conversation content.</li>
            <li>No device fingerprints, advertising IDs, or tracking cookies.</li>
            <li>No analytics, telemetry, or third-party trackers.</li>
          </ul>

          <h2>2. Data Processed Temporarily (In-Memory Only)</h2>
          <ul>
            <li><strong>Socket ID</strong> – ephemeral identifier for the WebSocket connection (destroyed on disconnect).</li>
            <li><strong>IP hash (SHA-256 with salt)</strong> – used <em>only</em> for 24-hour report blocklist; never stored persistently; purged automatically.</li>
            <li><strong>Message content</strong> – relayed in real-time to the matched partner only; not written to disk or database.</li>
          </ul>

          <h2>3. Purpose of Processing</h2>
          <ul>
            <li>Matchmaking (FIFO queue) and real-time message relay.</li>
            <li>Safety moderation: rate-limiting, profanity/contact filtering, report-based temporary blocking.</li>
            <li>Health checks and load monitoring (aggregate connection count only).</li>
          </ul>

          <h2>4. Legal Basis (Indian IT Act / DPDP Act Context)</h2>
          <p>Processing is based on <strong>legitimate interest</strong> (service operation, safety) and <strong>user consent</strong> (age-gate acceptance). No sensitive personal data is processed.</p>

          <h2>5. Data Retention</h2>
          <p>All in-memory data is destroyed <strong>immediately upon disconnect</strong>. IP-hash blocklist entries expire after <strong>24 hours</strong> automatically. No backups, no logs, no archives.</p>

          <h2>6. Third Parties & Subprocessors</h2>
          <p>None. The service runs on our own infrastructure (Render/Fly.io for WebSocket backend; Vercel for frontend). No third-party analytics, CDNs with tracking, or chat APIs.</p>

          <h2>7. Your Rights</h2>
          <p>Since we store no identifiable data, there is nothing to access, rectify, or delete. If you believe your IP hash is incorrectly blocklisted, wait 24 hours for automatic expiry or contact us.</p>

          <h2>8. Children's Privacy</h2>
          <p>{APP_NAME} is strictly <strong>18+</strong>. We do not knowingly allow minors. The age gate prevents access. If you suspect a minor is using the service, report them immediately.</p>

          <h2>9. Security</h2>
          <ul>
            <li>TLS (HTTPS/WSS) enforced in production.</li>
            <li>Helmet security headers, strict CORS, payload size limits.</li>
            <li>Input sanitization on client and server.</li>
            <li>No persistent database = reduced attack surface.</li>
          </ul>

          <h2>10. Grievance Officer (India)</h2>
          <p>As per the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021:</p>
          <p><strong>Grievance Officer:</strong> Talk to Strangers India Grievance Team<br />
          <strong>Email:</strong> <a href="mailto:grievance@talktostrangersindia.com" className="underline hover:text-primary-400">grievance@talktostrangersindia.com</a><br />
          <strong>Response time:</strong> Within 24 hours for acknowledgment, 15 days for resolution.</p>

          <h2>11. Changes</h2>
          <p>Updates will be posted here with a new "Last updated" date. Continued use constitutes acceptance.</p>
        </section>

        <footer className="text-center text-sm text-dark-500 mt-8">
          <Link href="/" className="hover:text-primary-400 underline">← Back to {APP_NAME}</Link>
        </footer>
      </article>
    </main>
  );
}