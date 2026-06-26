import Link from 'next/link';
import Logo from '@/components/Logo';
import MarketingFooter from '@/components/marketing/MarketingFooter';

export const metadata = { title: 'Cancellation & Refund Policy | Podversal Studio' };

export default function RefundPolicyPage() {
  return (
    <>
      <header className="border-b border-gray-100 dark:border-[#2a2a2a] bg-white dark:bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/"><Logo height={48} /></Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Cancellation &amp; Refund Policy</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-10">Last updated: June 2026</p>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-8 text-sm leading-7 text-gray-700 dark:text-gray-300">

          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">1. Cancellation by Client</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200 dark:border-[#2a2a2a] text-sm mt-3">
                <thead>
                  <tr className="bg-gray-50 dark:bg-[#1a1a1a]">
                    <th className="border border-gray-200 dark:border-[#2a2a2a] px-4 py-2 text-left font-semibold">Cancellation Notice</th>
                    <th className="border border-gray-200 dark:border-[#2a2a2a] px-4 py-2 text-left font-semibold">Refund</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-200 dark:border-[#2a2a2a] px-4 py-2">More than 72 hours before session</td>
                    <td className="border border-gray-200 dark:border-[#2a2a2a] px-4 py-2">100% refund of advance paid</td>
                  </tr>
                  <tr className="bg-gray-50 dark:bg-[#111111]">
                    <td className="border border-gray-200 dark:border-[#2a2a2a] px-4 py-2">24–72 hours before session</td>
                    <td className="border border-gray-200 dark:border-[#2a2a2a] px-4 py-2">50% refund of advance paid</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 dark:border-[#2a2a2a] px-4 py-2">Less than 24 hours before session</td>
                    <td className="border border-gray-200 dark:border-[#2a2a2a] px-4 py-2">No refund</td>
                  </tr>
                  <tr className="bg-gray-50 dark:bg-[#111111]">
                    <td className="border border-gray-200 dark:border-[#2a2a2a] px-4 py-2">No-show</td>
                    <td className="border border-gray-200 dark:border-[#2a2a2a] px-4 py-2">No refund</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">2. Cancellation by Podversal Studio</h2>
            <p>If Podversal Studio cancels a confirmed booking due to unforeseen circumstances (technical failure, force majeure, etc.), a <strong>full refund</strong> of the advance payment will be issued within 5–7 business days.</p>
            <p className="mt-2">We will make every reasonable effort to reschedule the session at a mutually convenient time before processing a refund.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">3. Rescheduling</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Rescheduling requests made more than 48 hours before the session are accommodated at no charge (subject to availability)</li>
              <li>Rescheduling within 48 hours of the session may incur a rescheduling fee</li>
              <li>A maximum of one reschedule per booking is permitted</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">4. Refund Process</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Approved refunds are processed to the original payment method</li>
              <li>Refunds typically appear within <strong>5–7 business days</strong> depending on your bank</li>
              <li>Razorpay processing fees (if any) are non-refundable</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">5. How to Request a Cancellation</h2>
            <p>To cancel a booking, contact us at least 24 hours before your session:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Email: <a href="mailto:podversalstudio@gmail.com" className="text-[#E5312A] hover:underline">podversalstudio@gmail.com</a></li>
              <li>WhatsApp: <a href="https://wa.me/917827882058" className="text-[#E5312A] hover:underline">+91 78278 82058</a></li>
            </ul>
            <p className="mt-2">Please include your booking reference number in all communications.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">6. Contact</h2>
            <p>For refund-related queries, contact:<br />
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
