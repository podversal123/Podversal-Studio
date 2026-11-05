"use client";

import { useCallback, useEffect, useState } from "react";
import CurtainHero from "./CurtainHero";
import { introPlayed, markIntroPlayed } from "./intro-state";
import { newsreader } from "./newsreader";

// Full-screen curtain intro shown every time the home page is opened (a fresh load,
// a refresh or a new tab). When it finishes the website appears by itself; moving
// around inside the site and coming back to the home page does not replay it.
//
// Switch it off without touching code: set NEXT_PUBLIC_FOUNDERS_GATE=off in the
// Vercel environment variables and redeploy.

export default function CampaignGate() {
  // Server and first client render agree (the flag is false on a fresh load); it is
  // only true after an in-site navigation, where there is nothing to hydrate.
  const [open, setOpen] = useState(() => !introPlayed());

  const done = useCallback(() => {
    markIntroPlayed();
    setOpen(false);
  }, []);

  useEffect(() => {
    // Search engines and speed-test bots should see the real site, not an interstitial.
    if (/bot|crawl|spider|lighthouse|pagespeed|headless/i.test(navigator.userAgent)) {
      setOpen(false);
    }
  }, []);

  // Freeze the page underneath while the intro is up
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (process.env.NEXT_PUBLIC_FOUNDERS_GATE === "off" || !open) return null;

  return (
    <div className={newsreader.variable}>
      <CurtainHero onDone={done} />
    </div>
  );
}
