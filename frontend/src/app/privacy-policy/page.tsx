import Link from 'next/link';
import Logo from '@/components/Logo';
import MarketingFooter from '@/components/marketing/MarketingFooter';

export const metadata = { title: 'Privacy Policy | Podversal Studio' };

export default function PrivacyPolicyPage() {
  return (
    <>
      <header className="border-b border-gray-100 dark:border-[#2a2a2a] bg-white dark:bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/"><Logo height={48} /></Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-10">Last updated: June 2026</p>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-8 text-sm leading-7 text-gray-700 dark:text-gray-300">

          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">1. Information We Collect</h2>
            <p>When you use Podversal Studio, we collect the following information:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Name, email address, and phone number provided during registration</li>
              <li>Booking details including session type, date, and time preferences</li>
              <li>Payment information processed securely through Razorpay (we do not store card details)</li>
              <li>Profile photo if uploaded by you</li>
              <li>Communications sent through our contact form</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>To process and manage your studio bookings</li>
              <li>To send booking confirmations, reminders, and invoices via email</li>
              <li>To process payments and issue refunds where applicable</li>
              <li>To respond to your queries and support requests</li>
              <li>To improve our services and website experience</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">3. Data Sharing</h2>
            <p>We do not sell or rent your personal data. We share your information only with:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Razorpay</strong> — for payment processing</li>
              <li><strong>Brevo</strong> — for transactional email delivery</li>
              <li><strong>Cloudinary</strong> — for image storage</li>
              <li>Law enforcement or government authorities when required by law</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">4. Data Security</h2>
            <p>We implement industry-standard security measures including HTTPS encryption, secure database storage, and limited access controls. Passwords are hashed and never stored in plain text.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">5. Cookies</h2>
            <p>We use essential cookies for authentication and session management. No third-party tracking cookies are used.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">6. Your Rights</h2>
            <p>You have the right to access, correct, or delete your personal data. To exercise these rights, email us at <a href="mailto:podversalstudio@gmail.com" className="text-[#E5312A] hover:underline">podversalstudio@gmail.com</a>.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">7. Contact</h2>
            <p>For privacy-related questions, contact us at:<br />
            <strong>Podversal Studio</strong><br />
            Email: <a href="mailto:podversalstudio@gmail.com" className="text-[#E5312A] hover:underline">podversalstudio@gmail.com</a><br />
            Phone: +91 78278 82058</p>
          </section>

        </div>
      </main>

      <MarketingFooter />
    </>
  );
}
