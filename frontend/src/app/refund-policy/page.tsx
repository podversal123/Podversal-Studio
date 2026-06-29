import Link from 'next/link';
import Logo from '@/components/Logo';
import MarketingFooter from '@/components/marketing/MarketingFooter';

export const metadata = { title: 'Cancellation & Refund Policy | Podversal Studio' };

export default function RefundPolicyPage() {
  return (
    <>
      <header className="border-b border-gray-100 dark:border-[#2a2a2a] bg-white dark:bg-[#0a0a0a]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/"><Logo height={48} /></Link>
        </div>
      </header>

      <main className="bg-[#0a0a0a] min-h-screen">
        <div className="max-w-3xl mx-auto px-6 py-20">
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-12">Cancellation &amp; Refund Policy</h1>

          <div className="space-y-6 text-[15px] leading-relaxed text-gray-300">
            <p><strong className="text-white">Cancellation by Client</strong> Cancellations made more than 72 hours before the session are eligible for a full refund of the advance paid. Cancellations made between 24 and 72 hours before the session will receive a 50% refund. Cancellations within 24 hours of the session or no-shows are not eligible for any refund.</p>

            <p><strong className="text-white">Rescheduling</strong> Rescheduling requests must be made at least 48 hours before the session and are subject to availability. One free reschedule is permitted per booking. Rescheduling within 48 hours may incur an additional charge.</p>

            <p><strong className="text-white">Cancellation by Podversal Studio</strong> If we cancel a confirmed booking due to unforeseen circumstances, a full refund of the advance will be issued within 5–7 business days. We will make every effort to offer an alternative slot before processing a refund.</p>

            <p><strong className="text-white">Refund Process</strong> Approved refunds are credited to the original payment method within 5–7 business days. Razorpay transaction charges, if any, are non-refundable.</p>

            <p><strong className="text-white">How to Cancel</strong> To cancel or reschedule, contact us before your session at <a href="mailto:podversalstudio@gmail.com" className="text-[#E5312A] hover:underline">podversalstudio@gmail.com</a> or WhatsApp <a href="https://wa.me/917827882058" className="text-[#E5312A] hover:underline">+91 78278 82058</a>. Please include your booking reference number.</p>
          </div>
        </div>
      </main>

      <MarketingFooter />
    </>
  );
}
