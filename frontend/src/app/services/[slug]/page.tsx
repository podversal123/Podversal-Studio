import { notFound } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/marketing/Navbar';
import MarketingFooter from '@/components/marketing/MarketingFooter';
import { Mic, Video, MonitorPlay, Newspaper, Laptop, Camera } from 'lucide-react';

const SERVICES: Record<string, {
  title: string;
  icon: React.ElementType;
  image: string;
  paragraphs: string[];
  duration: string;
  rate: string;
}> = {
  'podcast-studio': {
    title: 'Podcast Studio',
    icon: Mic,
    image: '/studio/s3.jpg',
    paragraphs: [

      'Podcast Studio at Podversal is a dedicated audio recording space built from the ground up for spoken-word content. The room is fully treated with professional acoustic panels on every wall and the ceiling, eliminating room noise and echo so every word you record sounds clean, warm, and broadcast-ready — right from the source.',
      'We provide Sennheiser Profile condenser microphones for each participant, routed through a Focusrite Scarlett multi-channel audio interface. Whether you are recording solo or hosting a panel of up to four guests, every voice gets its own dedicated channel with live headphone monitoring so you can hear the session in real time exactly as it is being captured.',
      'After your session, you receive both the raw multi-track WAV files and a professionally mixed and mastered MP3 — ready to upload directly to Spotify, YouTube, or any podcast platform. Our studio crew is available on request if you need someone to manage levels, handle edits, or assist during the session.',
      'Every session includes multi-channel recording for up to 4 guests, full acoustic treatment for zero room noise, live headphone monitoring, and delivery of both raw WAV and mixed MP3 files. Studio crew assistance is available on request at no additional charge.',
    ],
    duration: 'Minimum 1 hour',
    rate: '₹12,500 / hour',
  },
  'vfx-podcast': {
    title: 'VFX Podcast',
    icon: Video,
    image: '/studio/s2.jpg',
    paragraphs: [
      'VFX Podcast takes your audio show and transforms it into a full visual production. Instead of a plain background, your episode is recorded against a large LED backdrop panel displaying fully custom motion graphics, brand themes, or cinematic scenes — giving your content a polished, high-production look that stands out instantly on YouTube and social media.',
      'We use Sony Alpha ZV-E10 cameras in a multi-angle 4K setup so your footage covers every angle of the conversation. Live motion graphics are composited onto the LED feed during recording, meaning what you see on the panel is exactly what appears in the final video. After the session, all footage is professionally colour graded to match your brand palette.',
      'You receive the full-length colour-graded video along with platform-optimised cuts for YouTube Shorts, Instagram Reels, and other vertical formats — so one session generates content for multiple channels. Sennheiser microphones are used throughout to ensure your audio is equally broadcast-quality.',
      'This service includes a fully custom LED backdrop, live motion graphics overlay, multi-camera 4K production, professional colour grading, and both horizontal and vertical social media cuts — delivered after every session.',
    ],
    duration: 'Minimum 2 hours',
    rate: '₹20,000 / hour',
  },
  'monologue-shoot': {
    title: 'Monologue Shoot',
    icon: MonitorPlay,
    image: '/studio/s1.jpg',
    paragraphs: [
      'Monologue Shoot is designed for anyone who needs to deliver a confident, polished on-camera performance — solo. Whether you are a corporate speaker recording an executive message, an educator filming course content, or a content creator building a YouTube presence, this setup ensures you always look and sound like a professional.',
      'We use a Digitek professional teleprompter mounted in front of the primary camera lens, controlled via tablet remote. This means you can read your entire script while maintaining direct eye contact with the camera — removing the need for multiple retakes and significantly reducing session time. The teleprompter speed is adjustable in real time so you speak at your natural pace.',
      'Three-point lighting is set up by our studio team before every session to eliminate shadows, flatter your face on camera, and match broadcast colour standards. Sony Alpha cameras capture the performance from multiple angles in 4K, and all footage is colour graded and delivered after the session. Same-day export is available on request.',
      'Every session includes a professional teleprompter with tablet remote, three-point broadcast lighting, multi-angle Sony Alpha 4K camera coverage, colour-graded footage delivery, and same-day export on request.',
    ],
    duration: 'Minimum 1 hour',
    rate: '₹15,000 / hour',
  },
  'news-shoot': {
    title: 'News Shoot',
    icon: Newspaper,
    image: '/studio/s4.jpg',
    paragraphs: [
      'News Shoot provides a complete broadcast-standard studio setup for news segments, press statements, corporate announcements, and media packages — on demand, by the hour. The setup replicates what you see in professional news studios, without requiring you to invest in infrastructure of your own.',
      'The studio is equipped with a large professional green screen enabling live compositing during recording. Your anchor desk and set dressing are arranged by our team before your session begins. Sony Alpha cameras deliver broadcast-quality 4K footage from the front, with clean, consistent framing across every take.',
      'We handle lower third graphics and title card creation as part of the session. Final video is exported in broadcast-compatible formats including H.264 and ProRes, suitable for direct broadcast, streaming platforms, and news distribution networks. Ideal for independent news channels, PR agencies, and corporate communications teams.',
      'Included in every session: green screen with live compositing, anchor desk setup, Sony Alpha broadcast cameras, lower third graphics and title cards, and export in broadcast and streaming formats.',
    ],
    duration: 'Minimum 2 hours',
    rate: '₹22,500 / hour',
  },
  'become-a-podcaster': {
    title: 'Become a Podcaster',
    icon: Laptop,
    image: '/studio/s6.jpg',
    paragraphs: [
      'Become a Podcaster at Podversal Studio is built for educators, coaches, and trainers who want their course content to look and sound like a proper production — not a phone recording or a home webcam setup. The studio environment is acoustically isolated, meaning every module you record is free of background noise, reverb, and interruptions.',
      'Our teleprompter system lets you deliver your course material naturally and confidently without cutting away to notes. For slide-based or screen-sharing content, we provide screen capture integration that syncs your slides with the on-camera video so learners see both simultaneously. Consistent multi-point lighting ensures your face, backdrop, and content look identical across every module — no jarring quality drops between sessions.',
      'Multiple backdrop options are available — white, black, and colour panels — so you can match your course branding. Sessions can run for multiple hours with the same consistent lighting and audio quality throughout, making batch recording of entire course modules in a single day entirely practical.',
      'Every session includes an acoustically isolated recording environment, professional teleprompter, screen capture integration for slide-based delivery, consistent multi-point lighting, and a choice of white, black, or coloured backdrops.',
    ],
    duration: 'Minimum 1 hour',
    rate: '₹25,000 / hour',
  },
  'product-shoots': {
    title: 'Product Shoots',
    icon: Camera,
    image: '/studio/s5.jpg',
    paragraphs: [
      'Product Shoots at Podversal Studio is a dedicated setup for e-commerce brands, product launches, and advertising campaigns that need clean, consistent, high-resolution visuals. The lighting environment is fully controlled — no windows, no ambient variation — so every image and video frame looks precise, professional, and on-brand.',
      'We use softbox lighting combined with professional reflectors to create even, flattering light across your product from every angle. Colour temperature is calibrated and locked for the entire session, ensuring that images 1 and 200 look identical in tone and balance. Multiple backdrop options are available including seamless white, deep black, and coloured panels so you can capture the full range of your product line in a single booking.',
      'Sony Alpha cameras deliver high-resolution files suitable for large format printing, website banners, and digital ads. Same-day turnaround is available on request for urgent campaign deadlines. Whether you are listing new SKUs on Amazon, launching a brand campaign on Instagram, or producing a product video for your website, this setup handles all of it.',
      'Every booking includes softbox and reflector lighting, precise colour-temperature control, multiple backdrop options in white, black, and colour, high-resolution image delivery, and same-day turnaround on request.',
    ],
    duration: 'Minimum 2 hours',
    rate: '₹17,500 / hour',
  },
};

export function generateStaticParams() {
  return Object.keys(SERVICES).map(slug => ({ slug }));
}

export default function ServicePage({ params }: { params: { slug: string } }) {
  const service = SERVICES[params.slug];
  if (!service) notFound();

  return (
    <div className="min-h-screen bg-white dark:bg-[#111111]">
      <Navbar />

      {/* ── Hero — image only + title ── */}
      <section className="relative pt-[80px] overflow-hidden bg-black min-h-[480px] flex items-end">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={service.image}
          alt={service.title}
          className="absolute inset-0 w-full h-full object-cover object-center"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/20" />
        <div className="relative z-10 site-wrap pb-14">
          <h1
            className="font-black text-white leading-tight"
            style={{ fontSize: 'clamp(36px, 5.5vw, 80px)' }}
          >
            {service.title}
          </h1>
        </div>
      </section>

      {/* ── Content ── */}
      <section className="py-16 bg-white dark:bg-[#111111]">
        <div className="site-wrap">
          <div className="grid lg:grid-cols-3 gap-12">

            {/* Main */}
            <div className="lg:col-span-2">
              <div className="space-y-5">
                {service.paragraphs.map((p, i) => (
                  <p key={i} className="text-gray-600 dark:text-gray-300 text-base leading-relaxed">{p}</p>
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <div>
              <div className="bg-[#f8f8f8] dark:bg-[#161616] p-6 sticky top-[100px]">
                <div className="mb-5 pb-5 border-b border-gray-200 dark:border-[#2a2a2a]">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">Rate</p>
                  <p className="text-2xl font-black text-gray-900 dark:text-white">{service.rate}</p>
                </div>
                <div className="mb-6 pb-5 border-b border-gray-200 dark:border-[#2a2a2a]">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">Duration</p>
                  <p className="text-sm text-gray-700 dark:text-gray-200">{service.duration}</p>
                </div>
                <Link
                  href="/register"
                  className="block w-full text-center bg-[#E5312A] hover:bg-[#c9261f] text-white font-bold py-3.5 text-sm tracking-wide transition-colors mb-3"
                >
                  Book this Service
                </Link>
                <Link
                  href="/contact"
                  className="block w-full text-center border border-gray-200 dark:border-[#333] hover:border-[#E5312A] text-gray-700 dark:text-gray-200 hover:text-[#E5312A] font-semibold py-3.5 text-sm transition-colors"
                >
                  Ask a Question
                </Link>
                <p className="text-xs text-gray-400 dark:text-gray-600 text-center mt-4">
                  18% GST applicable · Invoice sent by email
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Other services ── */}
      <section className="py-12 bg-[#f8f8f8] dark:bg-[#0e0e0e]">
        <div className="site-wrap">
          <div className="flex flex-wrap gap-3">
            {Object.entries(SERVICES)
              .filter(([slug]) => slug !== params.slug)
              .map(([slug, s]) => {
                const SIcon = s.icon;
                return (
                  <Link
                    key={slug}
                    href={`/services/${slug}`}
                    className="flex items-center gap-2 bg-white dark:bg-[#161616] border border-gray-200 dark:border-[#2a2a2a] hover:border-[#E5312A] px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-[#E5312A] transition-colors"
                  >
                    <SIcon size={13} className="text-[#E5312A]" />
                    {s.title}
                  </Link>
                );
              })}
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
