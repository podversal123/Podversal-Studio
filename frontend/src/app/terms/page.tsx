import Link from 'next/link';
import Logo from '@/components/Logo';
import MarketingFooter from '@/components/marketing/MarketingFooter';

export const metadata = { title: 'Terms & Conditions | Podversal Studio' };

export default function TermsPage() {
  return (
    <>
      <header className="border-b border-gray-100 dark:border-[#2a2a2a] bg-white dark:bg-[#0a0a0a]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/"><Logo height={48} /></Link>
        </div>
      </header>

      <main className="bg-[#0a0a0a] min-h-screen">
        <div className="max-w-3xl mx-auto px-6 py-20">
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-12">Terms and Conditions</h1>

          <div className="space-y-6 text-[15px] leading-relaxed text-gray-300">
            <p><strong className="text-white">Studio Access and Bookings</strong> Podversal Studio offers bookable studio sessions including Podcast, VFX, Monologue, News Shoot, Online Classes, and Product Shoots. A booking is confirmed only after advance payment is received. Slots are held temporarily and released if payment is not completed.</p>

            <p><strong className="text-white">Payments</strong> All payments are processed securely through Razorpay in Indian Rupees (INR). An advance is required to confirm your session. The remaining balance is due on or before the day of the session.</p>

            <p><strong className="text-white">Client Responsibilities</strong> Clients must arrive on time — late arrivals will not result in session extensions. You are responsible for any damage caused to studio equipment during your session. The studio must be kept clean and respectful at all times. Outside food or drink, except water, is permitted.</p>

            <p><strong className="text-white">Cancellation and Rescheduling</strong> Cancellations made more than 72 hours before the session are eligible for a full refund. Cancellations within 24–72 hours incur a 50% charge. No refund is issued for cancellations within 24 hours or no-shows. Rescheduling requests must be made at least 48 hours in advance and are subject to availability.</p>

            <p><strong className="text-white">Content and Intellectual Property</strong> Content produced during sessions belongs to the client. Podversal Studio may request permission to share session footage for promotional use, which the client may decline at any time.</p>

            <p><strong className="text-white">Governing Law</strong> These terms are governed by the laws of India. Any disputes are subject to the exclusive jurisdiction of courts in Noida, Uttar Pradesh.</p>

            <p><strong className="text-white">Contact</strong> For questions, reach us at <a href="mailto:podversalstudio@gmail.com" className="text-[#E5312A] hover:underline">podversalstudio@gmail.com</a> or WhatsApp <a href="https://wa.me/917827882058" className="text-[#E5312A] hover:underline">+91 78278 82058</a>.</p>
          </div>
        </div>
      </main>

      <MarketingFooter />
    </>
  );
}
