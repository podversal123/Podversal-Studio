"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CurtainHero from "./CurtainHero";
import { newsreader } from "./newsreader";

// Full-screen curtain + invitation shown ONCE per browser session before the
// home page. Visitors can enter the website at any time.
//
// Switch it off without touching code: set NEXT_PUBLIC_FOUNDERS_GATE=off in the
// Vercel environment variables and redeploy.

const GATE_KEY = "pv_home_gate_seen";

// Runs before first paint so returning visitors never see the curtain flash.
const NO_FLASH = `try{if(sessionStorage.getItem("${GATE_KEY}")==="1"){document.documentElement.setAttribute("data-pv-gate","seen")}}catch(e){}`;
const NO_FLASH_CSS = `html[data-pv-gate="seen"] .pv-gate{display:none!important}`;

export default function CampaignGate() {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  useEffect(() => {
    // Search engines and speed-test bots should see the real site, not an interstitial.
    if (/bot|crawl|spider|lighthouse|pagespeed|headless/i.test(navigator.userAgent)) {
      setOpen(false);
      return;
    }
    try {
      if (sessionStorage.getItem(GATE_KEY) === "1") setOpen(false);
    } catch {
      /* storage blocked: show the gate */
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
    try {
      sessionStorage.setItem(GATE_KEY, "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  return (
    <div className={`pv-gate ${newsreader.variable}`}>
      <style dangerouslySetInnerHTML={{ __html: NO_FLASH_CSS }} />
      <script dangerouslySetInnerHTML={{ __html: NO_FLASH }} />
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
