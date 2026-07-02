import Navbar from '@/components/marketing/Navbar';
import MarketingFooter from '@/components/marketing/MarketingFooter';

export const metadata = { title: 'Privacy Policy | Podversal Studio' };

export default function PrivacyPolicyPage() {
  return (
    <>
      <Navbar />

      <main className="bg-white dark:bg-[#0a0a0a] min-h-screen pt-[80px]">
        <div className="max-w-3xl mx-auto px-6 py-10 sm:py-14 lg:py-20">
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white mb-6 sm:mb-8 lg:mb-12">Privacy Policy</h1>

          <div className="space-y-6 text-[15px] leading-relaxed text-gray-600 dark:text-gray-300">
            <p><strong className="text-gray-900 dark:text-white">Information We Collect</strong> We collect your name, email address, and phone number when you register. Booking details and payment records are stored to manage your sessions. If you upload a profile photo, it is stored securely on Cloudinary. We do not store card or UPI details. Payments are handled entirely by Razorpay.</p>

            <p><strong className="text-gray-900 dark:text-white">How We Use It</strong> Your information is used to process bookings, send confirmations and reminders, generate invoices, and respond to support queries. We do not use your data for advertising or sell it to third parties.</p>

            <p><strong className="text-gray-900 dark:text-white">Third-Party Services</strong> We use Razorpay for payments, Brevo for transactional emails, and Cloudinary for image storage. Each of these services has its own privacy policy governing how your data is handled on their platforms.</p>

            <p><strong className="text-gray-900 dark:text-white">Data Security</strong> All data is transmitted over HTTPS. Passwords are hashed and never stored in plain text. Access to your data is restricted to authorised studio staff only.</p>

            <p><strong className="text-gray-900 dark:text-white">Your Rights</strong> You may request access to, correction of, or deletion of your personal data at any time by contacting us at <a href="mailto:podversalstudio@gmail.com" className="text-[#E5312A] hover:underline">podversalstudio@gmail.com</a>.</p>

            <p><strong className="text-gray-900 dark:text-white">Contact</strong> For privacy-related questions, reach us at <a href="mailto:podversalstudio@gmail.com" className="text-[#E5312A] hover:underline">podversalstudio@gmail.com</a> or WhatsApp <a href="https://wa.me/917827882058" className="text-[#E5312A] hover:underline">+91 78278 82058</a>.</p>
          </div>
        </div>
      </main>

      <MarketingFooter />
    </>
  );
}
