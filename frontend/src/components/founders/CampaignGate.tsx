"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CurtainHero from "./CurtainHero";
import { introPlayed, markIntroPlayed } from "./intro-state";
import { newsreader } from "./newsreader";

// Full-screen curtain + invitation shown every time the home page is opened
// (a fresh load, a refresh or a new tab) before the website itself. Moving around
// inside the site and coming back to the home page does not replay it.
// Visitors can enter the website at any time.
//
// Switch it off without touching code: set NEXT_PUBLIC_FOUNDERS_GATE=off in the
// Vercel environment variables and redeploy.

export default function CampaignGate() {
  const router = useRouter();
  // Server and first client render agree (the flag is false on a fresh load); it is
  // only true after an in-site navigation, where there is nothing to hydrate.
  const [open, setOpen] = useState(() => !introPlayed());

  useEffect(() => {
    // Search engines and speed-test bots should see the real site, not an interstitial.
    if (/bot|crawl|spider|lighthouse|pagespeed|headless/i.test(navigator.userAgent)) {
      setOpen(false);
    }
  }, []);

  // Freeze the page underneath while the gate is up
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (process.env.NEXT_PUBLIC_FOUNDERS_GATE === "off" || !open) return null;

  const dismiss = () => {
    markIntroPlayed();
    setOpen(false);
  };

  return (
    <div className={`pv-gate ${newsreader.variable}`}>
      <CurtainHero
        variant="gate"
        onEnterSite={dismiss}
        onBook={() => {
          dismiss();
          router.push("/founders#book");
        }}
      />
    </div>
  );
}
