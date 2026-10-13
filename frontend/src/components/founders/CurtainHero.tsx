"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import InviteLetter from "./InviteLetter";
import { introPlayed, markIntroPlayed } from "./intro-state";
import StageDecor, { FP_STYLES } from "./StageDecor";

type Phase = "pending" | "closed" | "opening" | "open";

// Timeline (all in one place so the pace is easy to change):
//   closed curtain, "Podversal presents" ........ AUTO_OPEN_MS (a tap skips the wait)
//   curtain parts ............................... OPEN_MS seconds
//   letter fades up behind it ................... LETTER_DELAY + LETTER_MS seconds into the opening
//   one sweep of light across the card .......... SHEEN_DELAY seconds into the opening
const AUTO_OPEN_MS = 3200;
const OPEN_MS = 4.4;
const LETTER_DELAY = 1.4;
const LETTER_MS = 2.6;
const SHEEN_DELAY = 3.7;

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

  // Decide once on the client: a freshly opened link gets the full curtain; if the
  // curtain already played during this page load (e.g. the home-page gate), or the
  // visitor prefers reduced motion, show the letter straight away.
  useEffect(() => {
    setPhase(reduceMotion || introPlayed() ? "open" : "closed");
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
    markIntroPlayed();
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
      <style dangerouslySetInnerHTML={{ __html: FP_STYLES }} />

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
        transition={{ duration: instant ? 0.4 : 3, delay: instant ? 0 : 1.2 }}
      />

      <StageDecor show={revealed} instant={instant} />

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
            : { duration: LETTER_MS, delay: LETTER_DELAY, ease: [0.2, 0.7, 0.2, 1] }
        }
      >
        <motion.div
          animate={phase === "open" && !reduceMotion ? { y: [0, -6, 0] } : { y: 0 }}
          transition={
            phase === "open" && !reduceMotion
              ? { duration: 7, ease: "easeInOut", repeat: Infinity }
              : { duration: 0.3 }
          }
          className="relative"
        >
          <InviteLetter className="block h-auto w-full drop-shadow-[0_24px_50px_rgba(0,0,0,.55)]" />
          {/* A single sweep of light across the card once it has landed */}
          {/* Always rendered (so server and browser HTML are identical); hidden for
              reduced-motion visitors with CSS, see .fp-sheen in StageDecor. */}
          <div aria-hidden className="fp-sheen pointer-events-none absolute inset-0 overflow-hidden">
            <motion.div
              className="absolute inset-y-0 w-[55%]"
              style={{
                background:
                  "linear-gradient(105deg, rgba(255,250,235,0) 0%, rgba(255,250,235,.32) 50%, rgba(255,250,235,0) 100%)",
              }}
              initial={{ x: "-130%", opacity: 0 }}
              animate={revealed ? { x: "260%", opacity: [0, 1, 1, 0] } : { x: "-130%", opacity: 0 }}
              transition={{ duration: 1.5, ease: "easeInOut", delay: instant ? 0.4 : SHEEN_DELAY }}
            />
          </div>
        </motion.div>
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
              initial={{ scaleX: 1, skewX: 0 }}
              animate={
                phase === "opening"
                  ? { scaleX: 0.14, skewX: [0, side === "left" ? -1.8 : 1.8, 0] }
                  : { scaleX: 1, skewX: 0 }
              }
              transition={{
                scaleX: {
                  duration: OPEN_MS,
                  ease: [0.7, 0, 0.18, 1],
                  delay: side === "right" ? 0.12 : 0,
                },
                skewX: {
                  duration: OPEN_MS,
                  times: [0, 0.4, 1],
                  ease: "easeInOut",
                  delay: side === "right" ? 0.12 : 0,
                },
              }}
              onAnimationComplete={side === "right" ? () => phase === "opening" && finish() : undefined}
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
            <div className="flex w-[min(62vw,260px)] flex-col items-center gap-3">
              <span aria-hidden className="relative block h-px w-full overflow-hidden bg-[#faf5dc]/25">
                {phase === "closed" && (
                  <span
                    className="fp-progress absolute inset-0 bg-[#faf5dc]"
                    style={{ animationDuration: `${AUTO_OPEN_MS}ms` }}
                  />
                )}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  open();
                }}
                disabled={phase !== "closed"}
                className="min-h-[44px] px-3 text-[18px] italic text-[#faf5dc]/90 underline decoration-[#faf5dc]/40 underline-offset-[6px] transition-colors hover:text-[#faf5dc] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#faf5dc]"
              >
                Tap to open now
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </section>
  );
}
