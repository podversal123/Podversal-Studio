"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import InviteLetter from "./InviteLetter";
import { introPlayed, markIntroPlayed } from "./intro-state";
import StageDecor, { FP_NOSCRIPT, FP_STYLES } from "./StageDecor";

type Phase = "pending" | "closed" | "opening" | "open";
type Mode = "intro" | "instant";

// Timeline (all in one place so the pace is easy to change):
//   closed curtain, "Podversal presents" ........ AUTO_OPEN_MS (a tap skips the wait)
//   curtain parts ............................... OPEN_MS seconds
//   letter fades up behind it ................... LETTER_DELAY + LETTER_MS seconds into the opening
//   one sweep of light across the card .......... SHEEN_DELAY seconds into the opening
// The motion itself lives in CSS (see StageDecor.tsx) so it stays smooth even while
// the page is busy; this component only moves between phases.
const AUTO_OPEN_MS = 3200;
const OPEN_MS = 3.6;
const LETTER_DELAY = 1.1;
const LETTER_MS = 2.2;
const SHEEN_DELAY = 3.2;

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
  // "pending" on both server and first client render, so the HTML always matches
  const [phase, setPhase] = useState<Phase>("pending");
  const [mode, setMode] = useState<Mode>("intro");

  // Decide once on the client: a freshly opened link gets the full curtain. If the
  // curtain already played during this page load (e.g. the home-page gate), or the
  // visitor prefers reduced motion, show the letter straight away.
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || introPlayed()) {
      setMode("instant");
      setPhase("open");
    } else {
      setPhase("closed");
    }
  }, []);

  const open = useCallback(() => {
    setPhase((p) => (p === "closed" ? "opening" : p));
  }, []);

  // Auto-open so the page never waits on a tap (a tap just makes it sooner).
  useEffect(() => {
    if (phase !== "closed") return;
    const t = setTimeout(open, AUTO_OPEN_MS);
    return () => clearTimeout(t);
  }, [phase, open]);

  const finish = useCallback(() => {
    setPhase("open");
    markIntroPlayed();
  }, []);

  // Safety net: the curtain can never get stuck. Normally the end of the CSS
  // animation calls finish(); if that event were ever missed, this timer does it.
  useEffect(() => {
    if (phase !== "opening") return;
    const t = setTimeout(finish, OPEN_MS * 1000 + 900);
    return () => clearTimeout(t);
  }, [phase, finish]);

  const replay = () => {
    setMode("intro");
    setPhase("pending");
    requestAnimationFrame(() => setPhase("closed"));
  };

  const curtainsUp = phase === "closed" || phase === "pending";
  const scrollToForm = () =>
    document.getElementById("book")?.scrollIntoView({ behavior: "smooth" });

  return (
    <section
      className={`fp-root ${
        isGate
          ? "fixed inset-0 z-[100] isolate flex w-full flex-col items-center overflow-y-auto overflow-x-hidden bg-[#1f0406] px-4 pb-10 pt-8"
          : "relative isolate flex min-h-[100svh] w-full flex-col items-center justify-center overflow-hidden bg-[#1f0406] px-4 pb-10 pt-8"
      }`}
      data-phase={phase}
      data-mode={mode}
      aria-label="Invitation"
      style={
        {
          fontFamily: "var(--font-newsreader), Georgia, serif",
          "--fp-open": `${OPEN_MS}s`,
          "--fp-letter-ms": `${LETTER_MS}s`,
          "--fp-letter-delay": `${LETTER_DELAY}s`,
          "--fp-sheen-delay": `${SHEEN_DELAY}s`,
        } as React.CSSProperties
      }
    >
      <style dangerouslySetInnerHTML={{ __html: FP_STYLES }} />
      <noscript dangerouslySetInnerHTML={{ __html: FP_NOSCRIPT }} />

      {/* Stage light */}
      <div
        aria-hidden
        className="fp-light pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 38%, rgba(250,245,220,.2), rgba(250,245,220,0) 70%), radial-gradient(ellipse 120% 90% at 50% 120%, rgba(137,23,26,.55), rgba(0,0,0,0) 60%)",
        }}
      />

      <StageDecor />

      {/* The invitation */}
      <div
        className={`fp-letter relative z-10 ${isGate ? "mt-auto" : ""}`}
        style={{ width: "min(92vw, 640px, calc((100svh - 170px) * 0.7727))" }}
      >
        <div className="fp-float relative shadow-[0_28px_60px_-18px_rgba(0,0,0,.7)]">
          <InviteLetter className="block h-auto w-full" />
          {/* A single sweep of light across the card once it has landed */}
          <div aria-hidden className="fp-sheen pointer-events-none absolute inset-0 overflow-hidden">
            <div
              className="fp-sheen-bar absolute inset-y-0 w-[55%]"
              style={{
                background:
                  "linear-gradient(105deg, rgba(255,250,235,0) 0%, rgba(255,250,235,.32) 50%, rgba(255,250,235,0) 100%)",
              }}
            />
          </div>
        </div>
      </div>

      {/* Call to action appears once the letter has landed */}
      <div
        className={`fp-cta relative z-10 mt-6 flex flex-col items-center gap-3 sm:flex-row sm:gap-5 ${isGate ? "mb-auto" : ""}`}
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
      </div>

      {phase === "open" && !isGate && (
        <button
          type="button"
          onClick={replay}
          className="fp-replay absolute bottom-3 right-3 z-20 rounded-full px-3 py-2 text-xs text-[#faf5dc]/50 hover:text-[#faf5dc] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#faf5dc]"
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
          <div className="fp-panel fp-panel-l">
            <div className="fp-fabric" />
          </div>
          <div
            className="fp-panel fp-panel-r"
            onAnimationEnd={(e) => {
              // the right panel starts last, so its end means the curtain is fully open
              if (e.target === e.currentTarget && e.animationName === "fp-part") finish();
            }}
          >
            <div className="fp-fabric" />
          </div>

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
          <div className="fp-closed absolute inset-0 flex flex-col items-center justify-center gap-6 px-6 text-center">
            <p className="text-[clamp(1.6rem,6vw,2.6rem)] italic leading-tight text-[#faf5dc] [text-shadow:0_2px_18px_rgba(0,0,0,.55)]">
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
          </div>
        </div>
      )}
    </section>
  );
}
