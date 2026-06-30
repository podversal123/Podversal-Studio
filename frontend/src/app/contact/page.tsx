'use client';

import { useState, useRef, useEffect } from 'react';
import Navbar from '@/components/marketing/Navbar';
import MarketingFooter from '@/components/marketing/MarketingFooter';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

// Animation triggers on mount / page refresh — not scroll
function useLoadAnim(delay = 0) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return ready;
}

const slide = (ready: boolean, delay = 0): React.CSSProperties => ({
  opacity:    ready ? 1 : 0,
  transform:  ready ? 'translateY(0)' : 'translateY(28px)',
  transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
});

function ContactForm() {
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setSubmitting(true);
    try {
      await api.post('/notifications/contact', {
        name:    fd.get('name'),
        phone:   fd.get('phone'),
        email:   fd.get('email'),
        message: fd.get('message'),
      });
      toast.success("Message sent! We'll get back to you within a few hours.");
      formRef.current?.reset();
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form ref={formRef} className="flex flex-col h-full gap-4" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Name</label>
          <input name="name" type="text" placeholder="Full Name" className="input-field" required />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Phone</label>
          <input name="phone" type="tel" placeholder="98xxxxxxxx" className="input-field" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Email</label>
        <input name="email" type="email" placeholder="E-mail" className="input-field" required />
      </div>
      {/* Message grows to fill remaining space */}
      <div className="flex flex-col flex-1 min-h-0">
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Message</label>
        <textarea name="message" placeholder="Your message" className="input-field resize-none flex-1 min-h-[80px]" required />
      </div>
      <button type="submit" disabled={submitting} className="btn-primary">
        {submitting ? 'Sending…' : 'Send Message'}
      </button>
    </form>
  );
}

export default function ContactPage() {
  const ready = useLoadAnim(60);

  return (
    <div className="min-h-screen bg-white dark:bg-[#111111]">
      <Navbar />

      <section className="pt-[80px] bg-white dark:bg-[#111111]">
        <div className="site-wrap py-8 lg:py-10">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">

            {/* ── Left: heading + contact info + map ── */}
            <div style={slide(ready, 0)}>
              <h1 className="text-3xl font-black text-gray-900 dark:text-white leading-tight mb-6">
                Get in Touch
              </h1>

              {/* Info boxes — 2×2 grid */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-[#f8f8f8] dark:bg-[#161616] p-4">
                  <div className="w-8 h-8 bg-[#E5312A]/10 flex items-center justify-center mb-3">
                    <Phone size={14} className="text-[#E5312A]" />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">Phone</p>
                  <a href="tel:+917827882058" className="text-sm font-semibold text-gray-900 dark:text-white hover:text-[#E5312A] transition-colors">
                    +91 78278 82058
                  </a>
                </div>

                <div className="bg-[#f8f8f8] dark:bg-[#161616] p-4">
                  <div className="w-8 h-8 bg-[#E5312A]/10 flex items-center justify-center mb-3">
                    <Mail size={14} className="text-[#E5312A]" />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">Email</p>
                  <a href="mailto:Podversalstudio@gmail.com" className="text-sm font-semibold text-gray-900 dark:text-white hover:text-[#E5312A] transition-colors break-all">
                    Podversalstudio@gmail.com
                  </a>
                </div>

                <div className="bg-[#f8f8f8] dark:bg-[#161616] p-4">
                  <div className="w-8 h-8 bg-[#E5312A]/10 flex items-center justify-center mb-3">
                    <MapPin size={14} className="text-[#E5312A]" />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">Address</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white leading-snug">
                    B 812, 814, Tower 4, NX One,<br />Greater Noida West, UP
                  </p>
                </div>

                <div className="bg-[#E5312A] p-4">
                  <div className="w-8 h-8 bg-white/15 flex items-center justify-center mb-3">
                    <Clock size={14} className="text-white" />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">Studio Hours</p>
                  <p className="text-sm font-bold text-white">6:00 AM – 2:00 AM</p>
                  <p className="text-white/60 text-xs mt-0.5">Open 7 days a week</p>
                </div>
              </div>

              {/* Map */}
              <div className="w-full h-48 overflow-hidden border border-gray-100 dark:border-[#2a2a2a]">
                <iframe
                  title="Podversal Studio Location"
                  src="https://maps.google.com/maps?q=NX+One+Tower+4+Greater+Noida+West+Uttar+Pradesh&output=embed&z=15"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>

            {/* ── Right: form starts below heading, button aligns with map bottom ── */}
            <div className="flex flex-col" style={slide(ready, 0.15)}>
              {/* Spacer matches heading height so form fields start at boxes level */}
              <div className="h-[72px] flex-shrink-0" />
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
