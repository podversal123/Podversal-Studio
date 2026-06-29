import Link from 'next/link';
import Logo from '@/components/Logo';
import MarketingFooter from '@/components/marketing/MarketingFooter';

export const metadata = { title: 'Privacy Policy | Podversal Studio' };

export default function PrivacyPolicyPage() {
  return (
    <>
      <header className="border-b border-gray-100 dark:border-[#2a2a2a] bg-white dark:bg-[#0a0a0a]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/"><Logo height={48} /></Link>
        </div>
      </header>

      <main className="bg-[#0a0a0a] min-h-screen">
        <div className="max-w-3xl mx-auto px-6 py-20">
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-12">Privacy Policy</h1>

          <div className="space-y-6 text-[15px] leading-relaxed text-gray-300">
            <p><strong className="text-white">Information We Collect</strong> We collect your name, email address, and phone number when you register. Booking details and payment records are stored to manage your sessions. If you upload a profile photo, it is stored securely on Cloudinary. We do not store card or UPI details — payments are handled entirely by Razorpay.</p>

            <p><strong className="text-white">How We Use It</strong> Your information is used to process bookings, send confirmations and reminders, generate invoices, and respond to support queries. We do not use your data for advertising or sell it to third parties.</p>

            <p><strong className="text-white">Third-Party Services</strong> We use Razorpay for payments, Brevo for transactional emails, and Cloudinary for image storage. Each of these services has its own privacy policy governing how your data is handled on their platforms.</p>

            <p><strong className="text-white">Data Security</strong> All data is transmitted over HTTPS. Passwords are hashed and never stored in plain text. Access to your data is restricted to authorised studio staff only.</p>

            <p><strong className="text-white">Your Rights</strong> You may request access to, correction of, or deletion of your personal data at any time by contacting us at <a href="mailto:podversalstudio@gmail.com" className="text-[#E5312A] hover:underline">podversalstudio@gmail.com</a>.</p>

            <p><strong className="text-white">Contact</strong> For privacy-related questions, reach us at <a href="mailto:podversalstudio@gmail.com" className="text-[#E5312A] hover:underline">podversalstudio@gmail.com</a> or WhatsApp <a href="https://wa.me/917827882058" className="text-[#E5312A] hover:underline">+91 78278 82058</a>.</p>
          </div>
        </div>
      </main>

      <MarketingFooter />
    </>
  );
}
