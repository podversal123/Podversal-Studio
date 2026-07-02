'use client';

import Navbar from '@/components/marketing/Navbar';
import MarketingFooter from '@/components/marketing/MarketingFooter';
import { useFadeIn, anim } from '@/lib/use-fade-in';

const MISSION_VISION = [
  {
    title: 'Our Mission',
    body: 'To empower businesses and creators with innovative content, cutting-edge technology, and result-driven marketing solutions that accelerate growth in the digital era.',
  },
  {
    title: 'Our Vision',
    body: 'To become India\'s most trusted integrated content creation and digital transformation company, enabling brands to tell impactful stories, build meaningful connections, and achieve sustainable growth through creativity, technology, and innovation.',
  },
];

export default function AboutPage() {
  const heroAnim  = useFadeIn(0.05);
  const storyAnim = useFadeIn();
  const valAnim   = useFadeIn();

  return (
    <div className="min-h-screen bg-white dark:bg-[#111111]">
      <Navbar />

      {/* ── Hero ── */}
      <section className="pt-[80px] bg-white dark:bg-[#111111]">
        <div className="site-wrap pt-6 sm:pt-9 lg:pt-12 pb-4">
          <div ref={heroAnim.ref} style={anim(heroAnim.visible)}>
            <h1 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white leading-tight">
              We Are Podversal Studio
            </h1>
          </div>
        </div>
      </section>

      {/* ── Story ── */}
      <section className="pt-6 sm:pt-8 lg:pt-10 pb-10 sm:pb-14 lg:pb-20 bg-white dark:bg-[#111111]">
        <div className="site-wrap">
          <div ref={storyAnim.ref} className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

            <div style={anim(storyAnim.visible)}>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                Built for creators<br />who mean business
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-5">
                Podversal Studio is a next-generation content creation and digital solutions company based in Greater Noida West, founded by Nitish Sahay and co-founded by Sandeep Verma, with Puneet as a partner. Built with a vision to empower businesses, creators, startups, and organizations, Podversal combines world-class content production with technology and digital marketing under one roof.
              </p>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-5">
                Our state-of-the-art studio is designed for professional content creation, featuring a premium 3-camera podcast setup that delivers broadcast-quality audio and video, along with an advanced VFX Chroma Studio for virtual productions, news shows, interviews, online courses, corporate videos, product shoots, advertisements, and creative photography.
              </p>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-5">
                At Podversal, we believe that creating great content is only the beginning. That's why we provide comprehensive digital solutions that help businesses establish, grow, and scale their online presence. Our technology services include website development, mobile application development, custom ERP design and development, and business software solutions tailored to your organization's needs.
              </p>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-5">
                Our digital marketing division helps brands reach the right audience through digital marketing, content creation, AI-powered marketing strategies, social media management, branding, performance marketing, and creative campaigns that drive measurable results.
              </p>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                Whether you're a business looking to build a powerful digital presence, a startup launching a new product, a creator starting a podcast, or an enterprise seeking end-to-end digital transformation, Podversal offers everything you need, from strategy and production to technology and marketing.
              </p>
              <p className="font-black text-gray-900 dark:text-white text-lg leading-snug">
                One Vision. One Partner. Complete Digital Solutions.
              </p>
            </div>

            <div className="relative" style={anim(storyAnim.visible, 0.15)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/studio/s1.jpg"
                alt="Inside Podversal Studio"
                className="w-full aspect-[4/3] object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                <p className="text-white font-semibold text-sm">NX One, Tower 4, Greater Noida West, UP</p>
                <p className="text-white/70 text-xs mt-0.5">Open 6 AM to 2 AM · 7 days a week</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Values ── */}
      <section className="pt-6 sm:pt-8 lg:pt-10 pb-10 sm:pb-14 lg:pb-20 bg-[#f8f8f8] dark:bg-[#0e0e0e]">
        <div className="site-wrap">
          <div ref={valAnim.ref}>
            <div className="mb-6 sm:mb-8 lg:mb-12" style={anim(valAnim.visible)}>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">Mission &amp; Vision</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {MISSION_VISION.map((v, i) => (
                <div
                  key={v.title}
                  className="bg-white dark:bg-[#161616] p-8"
                  style={anim(valAnim.visible, 0.1 + i * 0.1)}
                >
                  <div className="w-8 h-1 bg-[#E5312A] mb-6" />
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-3">{v.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{v.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
