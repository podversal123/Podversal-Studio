import Link from 'next/link';
import Logo from '@/components/Logo';
import MarketingFooter from '@/components/marketing/MarketingFooter';

export const metadata = { title: 'Terms & Conditions | Podversal Studio' };

export default function TermsPage() {
  return (
    <>
      <header className="border-b border-gray-100 dark:border-[#2a2a2a] bg-white dark:bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/"><Logo height={48} /></Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Terms &amp; Conditions</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-10">Last updated: June 2026</p>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-8 text-sm leading-7 text-gray-700 dark:text-gray-300">

          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using Podversal Studio's website and services, you agree to be bound by these Terms and Conditions. If you do not agree, please do not use our services.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">2. Services</h2>
            <p>Podversal Studio provides studio booking services including Podcast Studio, VFX Podcast, Monologue Shoot, News Shoot, Online Classes, and Product Shoots. All services are subject to availability.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">3. Bookings</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>A booking is confirmed only upon receipt of the advance payment</li>
              <li>The slot is reserved temporarily after booking creation but confirmed only after payment</li>
              <li>Podversal Studio reserves the right to refuse any booking at its discretion</li>
              <li>Clients must arrive on time; late arrivals will not result in session extensions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">4. Payments</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>All payments are processed securely through Razorpay</li>
              <li>Prices are listed in Indian Rupees (INR) and include applicable taxes</li>
              <li>An advance payment is required to confirm the booking</li>
              <li>Balance payments are due on or before the day of the session</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">5. User Responsibilities</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>You must provide accurate information during registration and booking</li>
              <li>You are responsible for keeping your account credentials secure</li>
              <li>You agree not to use the studio for any illegal, offensive, or harmful activities</li>
              <li>Any damage to studio equipment caused by the client will be charged accordingly</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">6. Intellectual Property</h2>
            <p>Content produced during studio sessions belongs to the client unless otherwise agreed in writing. Podversal Studio may request permission to share session footage for promotional purposes, which the client may decline.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">7. Limitation of Liability</h2>
            <p>Podversal Studio is not liable for any indirect, incidental, or consequential damages arising from the use of our services. Our maximum liability is limited to the amount paid for the specific booking.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">8. Governing Law</h2>
            <p>These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in Noida, Uttar Pradesh.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">9. Contact</h2>
            <p>For any questions about these terms, contact us at:<br />
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
