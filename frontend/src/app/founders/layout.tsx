import type { Metadata } from "next";
import { newsreader } from "@/components/founders/newsreader";

const TITLE = "Book your founder podcast slot";
const DESCRIPTION =
  "You're invited to Inside the Founder's Mind, a complimentary one-hour podcast session at Podversal Studio, Greater Noida West. Pick a date and time.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  // Campaign page: reachable by invitation link, not for search results.
  robots: { index: false, follow: false },
  alternates: { canonical: "/founders" },
  openGraph: {
    type: "website",
    title: "Inside the Founder's Mind: you're invited",
    description: DESCRIPTION,
    url: "/founders",
    images: [
      {
        url: "/founders/og.png",
        width: 1200,
        height: 630,
        alt: "Inside the Founder's Mind podcast by Podversal. We invite you.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Inside the Founder's Mind: you're invited",
    description: DESCRIPTION,
    images: ["/founders/og.png"],
  },
};

export default function FoundersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={`${newsreader.variable} bg-[#1f0406]`}>{children}</div>;
}
