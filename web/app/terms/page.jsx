import Link from 'next/link';

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Talk to Strangers India';

export const metadata = {
  title: 'Terms of Use',
  description: 'Terms of Use for Talk to Strangers India – Free Indian Anonymous Stranger Chat.',
  robots: 'index, follow',
};

export default function TermsPage() {
  const lastUpdated = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
  return (
    <main className="min-h-screen bg-dark-950 text-dark-50 py-12 px-4">
      <article className="max-w-3xl mx-auto space-y-8">
        <header className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Terms of Use</h1>
          <p className="text-dark-400">Last updated: {lastUpdated}</p>
        </header>

        <section className="prose prose-invert dark:prose-invert max-w-none space-y-6">
          <p>Welcome to <strong>{APP_NAME}</strong>. By accessing or using our service, you agree to be bound by these Terms of Use. If you disagree with any part, you may not use the service.</p>

          <h2>1. Eligibility</h2>
          <p>You must be at least <strong>18 years old</strong> to use {APP_NAME}. By using the service, you represent and warrant that you meet this age requirement.</p>

          <h2>2. Anonymous Usage</h2>
          <p>{APP_NAME} is an anonymous 1-on-1 text chat platform. No registration, email, phone number, or social login is required. You are solely responsible for your conduct and any content you transmit.</p>

          <h2>3. Prohibited Conduct</h2>
          <ul>
            <li>Sharing or requesting personal contact information (phone numbers, social media handles, links).</li>
            <li>Harassment, hate speech, threats, or abuse toward other users.</li>
            <li>Child sexual abuse material (CSAM), sexual exploitation of minors, or any illegal content under the Indian IT Act, 2000, and POCSO Act, 2012.</li>
            <li>Spam, advertising, bots, or automated scripts.</li>
            <li>Impersonation or deception.</li>
            <li>Attempting to reverse-engineer, hack, or disrupt the service.</li>
          </ul>

          <h2>4. Moderation & Safety</h2>
          <p>We employ automated filters (profanity, contact-info blocking, rate limits) and a user-reporting system. Reported users are temporarily blocked (24 hours). We reserve the right to terminate access for violations.</p>

          <h2>5. Privacy & Data</h2>
          <p>We do <strong>not</strong> store chat logs, messages, or personally identifiable information. IP addresses are hashed solely for temporary moderation blocklists and discarded after 24 hours. See our <Link href="/privacy" className="underline hover:text-primary-400">Privacy Policy</Link> for details.</p>

          <h2>6. Disclaimer of Warranties</h2>
          <p>The service is provided <strong>"as is"</strong> and <strong>"as available"</strong> without warranties of any kind. We do not guarantee uninterrupted, error-free, or secure access.</p>

          <h2>7. Limitation of Liability</h2>
          <p>To the maximum extent permitted by law, {APP_NAME} and its operators shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the service.</p>

          <h2>8. Governing Law</h2>
          <p>These Terms are governed by the laws of the Republic of India. Disputes shall be subject to the exclusive jurisdiction of courts in Mumbai, Maharashtra.</p>

          <h2>9. Changes</h2>
          <p>We may update these Terms at any time. Continued use after changes constitutes acceptance.</p>

          <h2>10. Contact</h2>
          <p>For questions about these Terms, contact: <a href="mailto:grievance@talktostrangersindia.com" className="underline hover:text-primary-400">grievance@talktostrangersindia.com</a></p>
        </section>

        <footer className="text-center text-sm text-dark-500 mt-8">
          <Link href="/" className="hover:text-primary-400 underline">← Back to {APP_NAME}</Link>
        </footer>
      </article>
    </main>
  );
}