import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Get the first SUPER_ADMIN as author
  const admin = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN" } });
  if (!admin) {
    console.error("No SUPER_ADMIN found. Create an admin user first.");
    process.exit(1);
  }
  console.log(`Using author: ${admin.name} (${admin.email})`);

  const blogs = [
    {
      title: "5 Ways Video Podcasts Can Grow Your Personal Brand",
      slug: "5-ways-video-podcasts-can-grow-your-personal-brand",
      category: "Personal Branding",
      tags: [
        "video podcast",
        "personal brand",
        "content creation",
        "creator economy",
      ],
      coverImage:
        "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=1200&auto=format&fit=crop&q=80",
      excerpt:
        "In 2026, people don't just buy products  they buy into the people behind them. Here are five powerful ways a professionally produced video podcast can elevate your personal brand and build lasting audience trust.",
      content: `<h2>Your Personal Brand Is Your Greatest Asset</h2>
<p>Whether you're an entrepreneur, coach, consultant, creator, educator, executive, or freelancer, your personal brand influences how people perceive your expertise and credibility. In 2026, people don't just buy products or services  they buy into the people behind them.</p>
<p>While social media posts and short videos can capture attention, video podcasts offer something deeper: the opportunity to build lasting relationships through meaningful conversations. A professionally produced video podcast allows your audience to see your personality, hear your ideas, and connect with your story.</p>

<h2>1. Build Trust Through Authentic Conversations</h2>
<p>Trust is the foundation of every successful personal brand. A video podcast lets your audience experience the real you  your voice, expressions, knowledge, and communication style. Unlike highly edited promotional videos, podcasts encourage natural conversations that feel genuine and relatable.</p>
<p>Whether you're sharing industry insights, discussing lessons from your career, or interviewing inspiring guests, each episode strengthens your credibility. Over time, your audience begins to see you as a trusted voice rather than just another online personality. Authenticity creates familiarity, and familiarity builds trust.</p>

<h2>2. Showcase Your Expertise in Depth</h2>
<p>Short-form content is excellent for grabbing attention, but it often lacks the depth needed to establish authority. Video podcasts allow you to explain complex topics, answer common questions, discuss industry trends, and share practical experiences in detail.</p>
<p>A financial advisor can simplify investment concepts. A fitness coach can discuss sustainable health habits. A business leader can share entrepreneurial lessons. By consistently providing valuable insights, you position yourself as a subject matter expert in your field.</p>

<h2>3. Expand Your Reach Across Multiple Platforms</h2>
<p>One of the greatest advantages of a video podcast is its versatility. A single recording session can be transformed into a variety of content formats  full-length YouTube videos, Instagram Reels, LinkedIn clips, YouTube Shorts, blog articles, email newsletters, and audio podcasts for Spotify and Apple Podcasts.</p>
<p>Instead of creating separate content for every platform, you build an efficient content ecosystem from one conversation.</p>

<h2>4. Connect With Influential People in Your Industry</h2>
<p>Inviting guests to your podcast is one of the most effective networking strategies available. Every conversation opens the door to meaningful relationships with leaders, innovators, and experts in your field. Most people who would never respond to a cold email or LinkedIn message will happily accept a podcast invitation.</p>

<h2>5. Create a Legacy Content Library</h2>
<p>Unlike social media posts that disappear within hours, podcast episodes remain searchable and discoverable for years. Every episode you publish becomes a permanent asset  continuously attracting new listeners, establishing your credibility, and generating leads long after the recording session ends.</p>
<p>Your video podcast library becomes the most comprehensive showcase of your expertise available anywhere online.</p>`,
    },
    {
      title:
        "Audio vs. Video: Why Visual Podcasts on YouTube Outperform Audio-Only in 2026",
      slug: "audio-vs-video-why-visual-podcasts-outperform-audio-only-2026",
      category: "Podcasting",
      tags: [
        "youtube",
        "video podcast",
        "audio podcast",
        "content strategy",
        "2026",
      ],
      coverImage:
        "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1200&auto=format&fit=crop&q=80",
      excerpt:
        "YouTube has officially overtaken traditional audio directories to become the number one platform for podcast consumption globally. If you are still relying solely on audio, your show is invisible to a massive chunk of the market.",
      content: `<h2>The Shift is Already Here</h2>
<p>For over a decade, podcasting followed a predictable rule: plug in a microphone, export an MP3 file, upload it to an RSS feed, and you're done. But as we move through 2026, the data shows a massive shift in how audiences consume content.</p>
<p>YouTube has officially overtaken traditional audio directories to become the number one platform for podcast consumption globally. Industry reports show that over 53% of regular listeners now actively prefer watchable podcasts. If you are still relying solely on audio, your show is effectively invisible to a massive chunk of the market.</p>

<h2>1. YouTube is the New Discovery Layer</h2>
<p>The single biggest flaw of traditional audio podcast platforms is discovery. Apple Podcasts and Spotify's audio tabs rely heavily on manual charts or highly specific keyword searches. If someone doesn't know your exact show name or topic, finding you is incredibly difficult.</p>
<p>YouTube operates differently. It is the world's second-largest search engine, powered by one of the most sophisticated recommendation algorithms on earth. When you optimize a video podcast title and description for search intent, your episode can surface directly in front of someone actively looking for your expertise.</p>

<h2>2. One Recording Session, Dozens of Micro-Content Assets</h2>
<p>The modern creator economy relies heavily on short-form vertical video. Trying to promote an audio podcast on Instagram Reels or YouTube Shorts using a static waveform graphic just doesn't work anymore. Audiences scroll right past them.</p>
<p>When you record a high-definition video podcast, your full-length episode doubles as a content factory. A single one-hour recording session can easily yield an entire month's worth of organic marketing assets  short clips that feel authentic because they come from real studio conversations.</p>

<h2>3. Higher Engagement and Human Connection</h2>
<p>Podcasting has always been celebrated for creating a strong parasocial connection  the feeling that the listener truly knows the host. Video compounds this effect dramatically. Seeing a host's physical gestures, facial expressions, and authentic reactions creates a far deeper sense of intimacy than audio alone.</p>

<h2>4. Monetisation Advantages</h2>
<p>YouTube's Partner Programme allows creators to monetise directly through ad revenue. A video podcast with a consistent viewership can generate income directly from the platform  a revenue stream that simply does not exist for audio-only shows. Combined with sponsorships, the financial case for going visual is overwhelming.</p>

<h2>The Verdict</h2>
<p>Visual podcasts are not a trend  they are the new standard. The question is no longer whether to go visual, but when. The creators and businesses who make this shift now will own significant search and recommendation real estate by the time the rest of the market catches up.</p>`,
    },
    {
      title:
        "How to Structure an Interview Podcast That Keeps Listeners Hooked Past 10 Minutes",
      slug: "how-to-structure-interview-podcast-keeps-listeners-hooked",
      category: "Podcasting",
      tags: [
        "interview podcast",
        "podcast structure",
        "audience retention",
        "content strategy",
      ],
      coverImage:
        "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=1200&auto=format&fit=crop&q=80",
      excerpt:
        "The interview show is one of the most popular podcast formats  and the easiest to get wrong. Here is an intentional, high-engagement structure that retains viewers from the first second to the final frame.",
      content: `<h2>The 10-Minute Problem</h2>
<p>The "interview show" is one of the most popular formats in podcasting, but it is also the easiest to get wrong. We've all tuned into an episode only to hit "skip" around the eight-minute mark. Usually, it's because the show follows a predictable, lazy structure: a five-minute reading of the guest's resume, followed by chronological questions, leading into generic advice.</p>
<p>In 2026, audience attention spans are shorter than ever. If you want listeners to stay hooked past that critical 10-minute drop-off zone, you need an intentional, high-engagement structure.</p>

<h2>Zone 1: The Cold Open & High-Stakes Hook (0:00 – 2:00)</h2>
<p><strong>The Mistake:</strong> Starting with a 45-second generic music intro, followed by, "Hey guys, welcome back to the channel, today I am joined by..." By the time you introduce the guest, the listener is already gone.</p>
<p><strong>The Fix:</strong> Start with a Cold Open. Take the most dramatic, surprising, or high-value 20-second soundbite from later in the interview and place it at the very beginning. Example: "We lost 40 Lakhs in forty-eight hours, and I genuinely thought our company was finished." Then cut to a brief, high-energy 60-second intro explaining why this guest matters right now.</p>

<h2>Zone 2: The Context Leap (2:00 – 10:00)</h2>
<p><strong>The Mistake:</strong> Spending the first ten minutes asking the guest to tell their entire life story from childhood.</p>
<p><strong>The Fix:</strong> Skip the resume. Your listeners can read their LinkedIn profile. Instead, dive straight into a highly specific, recent turning point or a polarising topic. Instead of "Tell us about how you got started," ask "In your latest article, you stated that traditional SEO is completely dead by mid-2026. That's a massive claim. Why?"</p>

<h2>Zone 3: The Deep-Dive & Counter-Intuitive Truths (10:00 – 40:00)</h2>
<p>This is where the battle for retention is won. Follow three interview rules: Never accept a generic answer  peel back the layer. Use signposting every 10 minutes to keep the audience oriented. And plant a "Future Hook" mid-episode: "Coming up, we are going to get into the part of this story that nobody talks about publicly."</p>

<h2>Zone 4: The Actionable Landing (40:00 – End)</h2>
<p>Close with the "One Thing" question: "If someone listening today could only implement one thing from this conversation, what would you tell them to do first?" Then give a clear, memorable call to action  one place to go, one thing to do. Never list five resources; pick one.</p>

<h2>Production Matters as Much as Structure</h2>
<p>Even a perfectly structured interview can lose an audience if the sound quality is poor or the visuals are distracting. Recording in a professionally treated studio environment ensures that every word lands cleanly  giving your structure the best possible chance of working.</p>`,
    },
    {
      title:
        "One Long-Form Recording, 20 Reels: The Art of Content Repurposing",
      slug: "one-long-form-recording-20-reels-content-repurposing",
      category: "Content Strategy",
      tags: [
        "content repurposing",
        "reels",
        "short form video",
        "creator economy",
        "social media",
      ],
      coverImage:
        "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=1200&auto=format&fit=crop&q=80",
      excerpt:
        "The most successful creators don't create more content  they maximise what they already have. A single 60-minute studio recording can be transformed into a month's worth of high-impact vertical videos.",
      content: `<h2>Stop Playing Content Creation on Hard Mode</h2>
<p>If you are spending hours scripting, shooting, and editing individual 60-second Reels every single week, you are playing the content game on hard mode. The most successful creators and businesses don't create more content; they maximise what they already have.</p>
<p>By using a top-of-funnel content repurposing strategy, a single 60-minute studio recording can easily be transformed into a month's worth of high-impact vertical videos.</p>

<h2>The Content Pyramid: How 1 Becomes 20</h2>
<p>Instead of staring at a blank screen trying to come up with daily ideas, think of your long-form podcast or interview as a "content engine." When you sit down for a one-hour, unstructured, high-value conversation in a professional studio, you naturally hit multiple peaks of high-energy insights.</p>
<ul>
<li><strong>5x "Hot Take" or Hook Reels:</strong> Extract controversial opinions or surprising industry facts to drive comments and shares.</li>
<li><strong>5x Step-by-Step Educational Reels:</strong> Isolate parts where you broke down a specific checklist or framework.</li>
<li><strong>5x Q&A or Dialogue Reels:</strong> Clip raw, high-chemistry back-and-forth moments with your guest.</li>
<li><strong>5x Storytelling Reels:</strong> Mine personal anecdotes, client case studies, or failures shared during the conversation.</li>
</ul>

<h2>The Step-by-Step Workflow</h2>
<p><strong>1. Structure Your Recording for the Cut:</strong> During your long-form session, keep short-form in mind. When making a major point, pause, clearly state the core problem, and deliver a concise 45-second answer. These intentional segments make editing seamless.</p>
<p><strong>2. Time-Stamp While It's Fresh:</strong> While recording or immediately after the session, write down the rough timestamps of moments that felt high-energy or highly insightful.</p>
<p><strong>3. Crop, Caption, and Style:</strong> Convert horizontal 16:9 studio footage into vertical 9:16. Use bold, animated subtitles  most users watch short-form content with the sound off. Punch in on key words or cut between camera angles to create energy.</p>

<h2>Why Studio Production is Non-Negotiable</h2>
<p>When you zoom into a standard wide-angle video shot in a home office or a noisy co-working space, the image quality degrades visibly. Professional studio lighting, acoustic treatment, and multi-camera setups ensure every clip you extract looks intentional and broadcast-quality  not like an afterthought.</p>
<p>The entire repurposing strategy only works if the source material is good enough to clip. That starts with the right studio environment.</p>`,
    },
    {
      title: "Why Every Business Needs a Podcast in 2026",
      slug: "why-every-business-needs-a-podcast-in-2026",
      category: "Business",
      tags: [
        "business podcast",
        "content marketing",
        "brand authority",
        "lead generation",
        "2026",
      ],
      coverImage:
        "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=1200&auto=format&fit=crop&q=80",
      excerpt:
        "In 2026, a podcast is no longer just a marketing experiment  it's a powerful business asset that builds credibility, strengthens customer relationships, and generates high-quality leads.",
      content: `<h2>The Future of Business Communication Is Here</h2>
<p>In today's digital-first world, customers are no longer impressed by constant advertisements. They want authentic conversations, expert insights, and brands they can trust. This shift has made podcasts one of the fastest-growing content formats for businesses worldwide.</p>
<p>In 2026, a podcast is no longer just a marketing experiment  it's a powerful business asset that helps companies build credibility, strengthen customer relationships, and generate high-quality leads.</p>

<h2>Build Trust Before You Sell</h2>
<p>People buy from businesses they trust. A podcast allows potential customers to hear your voice, understand your thought process, and connect with the people behind the brand. Every episode demonstrates your expertise, values, and experience in a natural, conversational way.</p>
<p>Over time, listeners begin to view your business as a reliable source of knowledge rather than just another company selling products or services. Trust is built one conversation at a time.</p>

<h2>Establish Yourself as an Industry Authority</h2>
<p>Every business has valuable knowledge to share. A law firm can discuss legal awareness. A healthcare provider can educate patients. A technology company can explain emerging innovations. A real estate agency can share market trends. By consistently publishing valuable conversations and insights, your business becomes recognised as an authority within its industry.</p>
<p>Authority creates influence, and influence creates opportunities.</p>

<h2>Generate High-Quality Leads Organically</h2>
<p>Traditional advertising interrupts people. Podcasts attract people who are already interested in your expertise. Listeners who voluntarily spend time consuming your content are far more likely to become qualified leads because they already understand your business and trust your knowledge.</p>
<p>This often leads to better conversion rates, higher customer retention, stronger client relationships, and reduced customer acquisition costs.</p>

<h2>Strengthen Your Brand Identity</h2>
<p>Every podcast episode reinforces your brand personality. Your audience gets to know your mission, your values, your expertise, your company culture, and your vision for the future. Unlike a website or a brochure, a podcast gives your brand a human voice  and in 2026, human connection is the most valuable currency in marketing.</p>

<h2>Start Before Your Competitors Do</h2>
<p>The businesses that launch their podcast today will own their niche's audio and video real estate before their competitors even begin planning. In a market where attention is the scarcest resource, starting now is the single biggest competitive advantage available to you.</p>
<p>Your audience is already listening to podcasts. The only question is whether they are listening to yours.</p>`,
    },
  ];

  let created = 0;
  for (const blog of blogs) {
    const existing = await prisma.blog.findUnique({
      where: { slug: blog.slug },
    });
    if (existing) {
      console.log(`Skipping (already exists): ${blog.title}`);
      continue;
    }
    await prisma.blog.create({
      data: {
        ...blog,
        authorId: admin.id,
        isPublished: true,
        publishedAt: new Date(),
      },
    });
    console.log(`Created: ${blog.title}`);
    created++;
  }
  console.log(`\nDone  ${created} blog(s) created.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
