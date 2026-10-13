"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import InviteLetter from "./InviteLetter";

type Phase = "pending" | "closed" | "opening" | "open";

const SEEN_KEY = "pv_founders_intro_seen";
const AUTO_OPEN_MS = 2600;
const OPEN_MS = 2.6;

// Velvet pleats: two repeating gradients with different periods so the folds
// never look machine-regular. Compressing the panel (scaleX) bunches them up
// like real fabric gathering at the wings.
const PLEATS = [
  "linear-gradient(180deg, rgba(0,0,0,.42) 0%, rgba(0,0,0,0) 20%, rgba(0,0,0,0) 78%, rgba(0,0,0,.5) 100%)",
  "repeating-linear-gradient(90deg, rgba(0,0,0,.2) 0 13px, rgba(255,235,210,.07) 13px 33px, rgba(0,0,0,0) 33px 127px)",
  "repeating-linear-gradient(90deg, #4a0a0d 0px, #741317 21px, #9c2126 41px, #741317 60px, #470a0c 82px)",
].join(",");

interface CurtainHeroProps {
  // "page": the section at the top of /founders.
  // "gate": a full-screen overlay shown before the home page.
  variant?: "page" | "gate";
  onBook?: () => void; // gate only: "Book your slot"
  onEnterSite?: () => void; // gate only: "Enter website"
}

export default function CurtainHero({
  variant = "page",
  onBook,
  onEnterSite,
}: CurtainHeroProps) {
  const isGate = variant === "gate";
  const reduceMotion = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("pending");

  // Decide once on the client: first visit this session gets the full curtain,
  // returning visitors (or reduced-motion users) see the letter straight away.
  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(SEEN_KEY) === "1";
    } catch {
      /* storage blocked: just play the intro */
    }
    setPhase(reduceMotion || seen ? "open" : "closed");
  }, [reduceMotion]);

  const open = useCallback(() => {
    setPhase((p) => (p === "closed" ? "opening" : p));
  }, []);

  // Auto-open so the page never waits on a tap (a tap just makes it sooner).
  useEffect(() => {
    if (phase !== "closed") return;
    const t = setTimeout(open, AUTO_OPEN_MS);
    return () => clearTimeout(t);
  }, [phase, open]);

  const finish = () => {
    setPhase("open");
    try {
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  const replay = () => {
    setPhase("pending");
    requestAnimationFrame(() => setPhase("closed"));
  };

  const curtainsUp = phase === "closed" || phase === "pending";
  const revealed = phase === "opening" || phase === "open";
  const instant = phase === "open";

  const scrollToForm = () =>
    document.getElementById("book")?.scrollIntoView({ behavior: "smooth" });

  return (
    <section
      className={
        isGate
          ? "fixed inset-0 z-[100] isolate flex w-full flex-col items-center overflow-y-auto overflow-x-hidden bg-[#1f0406] px-4 pb-10 pt-8"
          : "relative isolate flex min-h-[100svh] w-full flex-col items-center justify-center overflow-hidden bg-[#1f0406] px-4 pb-10 pt-8"
      }
      aria-label="Invitation"
      style={{ fontFamily: "var(--font-newsreader), Georgia, serif" }}
    >
      {/* Stage light */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 38%, rgba(250,245,220,.2), rgba(250,245,220,0) 70%), radial-gradient(ellipse 120% 90% at 50% 120%, rgba(137,23,26,.55), rgba(0,0,0,0) 60%)",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: revealed ? 1 : 0.25 }}
        transition={{ duration: instant ? 0.4 : 2, delay: instant ? 0 : 0.8 }}
      />

      {/* The invitation */}
      <motion.div
        className={`relative z-10 ${isGate ? "mt-auto" : ""}`}
        style={{
          width: "min(92vw, 640px, calc((100svh - 170px) * 0.7727))",
        }}
        initial={{ opacity: 0, scale: 0.93, y: 14 }}
        animate={
          revealed
            ? { opacity: 1, scale: 1, y: 0 }
            : { opacity: 0, scale: 0.93, y: 14 }
        }
        transition={
          instant
            ? { duration: 0.45, ease: "easeOut" }
            : { duration: 1.7, delay: 0.7, ease: [0.2, 0.7, 0.2, 1] }
        }
      >
        <InviteLetter className="block h-auto w-full drop-shadow-[0_24px_50px_rgba(0,0,0,.55)]" />
      </motion.div>

      {/* Call to action appears once the letter has landed */}
      <motion.div
        className={`relative z-10 mt-6 flex flex-col items-center gap-3 sm:flex-row sm:gap-5 ${isGate ? "mb-auto" : ""}`}
        initial={{ opacity: 0, y: 8 }}
        animate={phase === "open" ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
        transition={{ duration: 0.6, delay: reduceMotion ? 0 : 0.15 }}
        style={{ pointerEvents: phase === "open" ? "auto" : "none" }}
        aria-hidden={phase !== "open"}
      >
        <button
          type="button"
          onClick={isGate ? onBook : scrollToForm}
          className="min-h-[56px] bg-[#faf5dc] px-10 text-[20px] font-semibold text-[#89171a] shadow-[inset_0_0_0_4px_#faf5dc,inset_0_0_0_5px_rgba(137,23,26,.55),0_14px_30px_-10px_rgba(0,0,0,.6)] transition-colors duration-200 hover:bg-white hover:shadow-[inset_0_0_0_4px_#ffffff,inset_0_0_0_5px_rgba(137,23,26,.75),0_14px_30px_-10px_rgba(0,0,0,.6)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#faf5dc]"
          tabIndex={phase === "open" ? 0 : -1}
        >
          Book your slot
        </button>
        {isGate ? (
          <button
            type="button"
            onClick={onEnterSite}
            className="min-h-[48px] px-2 py-3 text-[18px] italic text-[#faf5dc]/85 underline decoration-[#faf5dc]/40 underline-offset-[6px] hover:text-[#faf5dc] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#faf5dc]"
            tabIndex={phase === "open" ? 0 : -1}
          >
            Enter the Podversal website
          </button>
        ) : (
          <Link
            href="/"
            className="min-h-[48px] px-2 py-3 text-[18px] italic text-[#faf5dc]/85 underline decoration-[#faf5dc]/40 underline-offset-[6px] hover:text-[#faf5dc] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#faf5dc]"
            tabIndex={phase === "open" ? 0 : -1}
          >
            Visit the Podversal website
          </Link>
        )}
      </motion.div>

      {phase === "open" && !reduceMotion && !isGate && (
        <button
          type="button"
          onClick={replay}
          className="absolute bottom-3 right-3 z-20 rounded-full px-3 py-2 text-xs text-[#faf5dc]/50 hover:text-[#faf5dc] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#faf5dc]"
        >
          Replay intro
        </button>
      )}

      {/* Curtains */}
      {(curtainsUp || phase === "opening") && (
        <div
          className="absolute inset-0 z-30"
          onClick={open}
          aria-hidden={phase === "opening"}
        >
          {(["left", "right"] as const).map((side) => (
            <motion.div
              key={side}
              className="absolute top-0 h-full w-[51%]"
              style={{
                [side]: 0,
                transformOrigin: side === "left" ? "left center" : "right center",
                backgroundImage: PLEATS,
                boxShadow:
                  side === "left"
                    ? "inset -28px 0 38px -18px rgba(0,0,0,.65)"
                    : "inset 28px 0 38px -18px rgba(0,0,0,.65)",
              }}
              initial={{ scaleX: 1 }}
              animate={{ scaleX: phase === "opening" ? 0.14 : 1 }}
              transition={{ duration: OPEN_MS, ease: [0.7, 0, 0.18, 1] }}
              onAnimationComplete={side === "left" ? () => phase === "opening" && finish() : undefined}
            />
          ))}

          {/* Pelmet across the top, with a scalloped lower edge */}
          <div aria-hidden className="absolute inset-x-0 top-0 h-[6.5svh] min-h-[40px]">
            <div
              className="h-full w-full"
              style={{
                backgroundImage:
                  "linear-gradient(180deg, rgba(0,0,0,.4), rgba(0,0,0,0) 75%), repeating-linear-gradient(90deg, #5d0f13 0 46px, #7d1519 46px 92px)",
              }}
            />
            <div
              className="absolute inset-x-0 top-full h-[23px] drop-shadow-[0_8px_10px_rgba(0,0,0,.55)]"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 23px 0, #6e1317 0, #6e1317 20.5px, rgba(250,245,220,.55) 20.5px, rgba(250,245,220,.55) 22.5px, transparent 23px)",
                backgroundSize: "46px 100%",
                backgroundRepeat: "repeat-x",
              }}
            />
          </div>

          {/* Closed-curtain message */}
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: phase === "closed" ? 1 : 0 }}
            transition={{ duration: phase === "closed" ? 0.9 : 0.4, delay: phase === "closed" ? 0.3 : 0 }}
          >
            <p
              className="text-[clamp(1.6rem,6vw,2.6rem)] italic leading-tight text-[#faf5dc] [text-shadow:0_2px_18px_rgba(0,0,0,.55)]"
              style={{ fontFamily: "var(--font-newsreader), Georgia, serif" }}
            >
              Podversal presents
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                open();
              }}
              disabled={phase !== "closed"}
              className="min-h-[52px] border border-[#faf5dc]/60 px-9 text-[19px] italic text-[#faf5dc] shadow-[inset_0_0_0_3px_rgba(0,0,0,0),inset_0_0_0_4px_rgba(250,245,220,.25)] backdrop-blur-[1px] transition-colors hover:bg-[#faf5dc]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#faf5dc]"
            >
              Open the curtain
            </button>
          </motion.div>
        </div>
      )}
    </section>
  );
}
