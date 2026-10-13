// The look and the motion of the invitation intro: curtain, letter, stage lights.
//
// WHY CSS AND NOT JS ANIMATION
// Every animation below is a CSS animation/transition that changes only `transform`
// and `opacity`. Browsers run those on the compositor (GPU) thread, so they keep
// moving smoothly even while the main thread is busy, e.g. React hydrating the big
// home page or fetching data behind the curtain. A JS-driven animation would stutter
// in exactly those moments.
//
// HOW IT IS DRIVEN
// CurtainHero only sets two attributes on its root element:
//   data-phase = pending | closed | opening | open
//   data-mode  = intro   (full curtain)  |  instant (letter shown straight away)
// and the rules below do the rest. Durations arrive as CSS variables (--fp-*).

// left %, size px, seconds to rise, start delay s, sideways drift px
// (a fixed list, not Math.random, so server and browser render identical HTML)
const MOTES: [number, number, number, number, number][] = [
  [8, 3, 15, 0, 26],
  [15, 2, 18, 3, -18],
  [22, 4, 13, 6, 20],
  [30, 2, 17, 1, -24],
  [38, 3, 19, 8, 16],
  [46, 2, 14, 4, -12],
  [54, 4, 16, 9, 22],
  [62, 2, 18, 2, -20],
  [70, 3, 14, 7, 18],
  [78, 2, 17, 5, -26],
  [85, 4, 15, 10, 14],
  [92, 3, 19, 3, -16],
];

// Soft, low-frequency folds. Fine hard-edged stripes would shimmer (alias) while the
// fabric is squeezed towards the wings, so every stop here blends smoothly.
const PLEATS = `
  linear-gradient(180deg, rgba(0,0,0,.42) 0%, rgba(0,0,0,0) 20%, rgba(0,0,0,0) 78%, rgba(0,0,0,.5) 100%),
  repeating-linear-gradient(90deg, rgba(0,0,0,.16) 0px, rgba(0,0,0,0) 70px, rgba(255,235,210,.05) 140px, rgba(0,0,0,.16) 230px),
  repeating-linear-gradient(90deg, #4a0a0d 0px, #741317 30px, #9c2126 58px, #741317 86px, #470a0c 116px)`;

export const FP_STYLES = `
/* ───────── keyframes (transform / opacity only) ───────── */
@keyframes fp-part { from { transform: scaleX(1) } to { transform: scaleX(.14) } }
@keyframes fp-letter-in { from { opacity: 0; transform: translateY(14px) scale(.93) } to { opacity: 1; transform: none } }
@keyframes fp-fade-in { from { opacity: 0 } to { opacity: 1 } }
@keyframes fp-float { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-6px) } }
@keyframes fp-sheen {
  0%   { transform: translateX(-130%); opacity: 0 }
  15%  { opacity: 1 }
  85%  { opacity: 1 }
  100% { transform: translateX(260%); opacity: 0 }
}
@keyframes fp-sway-l { from { transform: rotate(-22deg) } to { transform: rotate(-28deg) } }
@keyframes fp-sway-r { from { transform: rotate(22deg) } to { transform: rotate(28deg) } }
@keyframes fp-breathe { from { transform: translate(-50%,-50%) scale(1) } to { transform: translate(-50%,-50%) scale(1.03) } }
@keyframes fp-rise {
  0%   { transform: translate(0,0); opacity: 0 }
  12%  { opacity: .8 }
  85%  { opacity: .5 }
  100% { transform: translate(var(--fp-x), -108vh); opacity: 0 }
}
@keyframes fp-progress { from { transform: scaleX(0) } to { transform: scaleX(1) } }

/* ───────── the velvet curtain ───────── */
.fp-panel { position: absolute; top: 0; height: 100%; width: 51%; will-change: transform; backface-visibility: hidden; }
.fp-panel-l { left: 0;  transform-origin: left center; }
.fp-panel-r { right: 0; transform-origin: right center; }
.fp-fabric { position: absolute; inset: 0; background-image: ${PLEATS.replace(/\s+/g, " ")}; }
.fp-panel-l .fp-fabric { box-shadow: inset -28px 0 38px -18px rgba(0,0,0,.65); }
.fp-panel-r .fp-fabric { box-shadow: inset 28px 0 38px -18px rgba(0,0,0,.65); }

.fp-root[data-phase="opening"] .fp-panel { animation: fp-part var(--fp-open) cubic-bezier(.37,0,.63,1) both; }
.fp-root[data-phase="opening"] .fp-panel-r { animation-delay: .12s; }

/* "Podversal presents" + the line that fills while we wait */
.fp-closed { opacity: 0; transition: opacity .4s ease; }
.fp-root[data-phase="closed"] .fp-closed { opacity: 1; transition: opacity .9s ease .3s; }
.fp-progress { transform: scaleX(0); transform-origin: left; animation: fp-progress linear both; }

/* ───────── the invitation ───────── */
.fp-letter { opacity: 0; transform: translateY(14px) scale(.93); will-change: transform, opacity; }
.fp-root[data-mode="intro"][data-phase="opening"] .fp-letter,
.fp-root[data-mode="intro"][data-phase="open"] .fp-letter {
  animation: fp-letter-in var(--fp-letter-ms) cubic-bezier(.2,.7,.2,1) var(--fp-letter-delay) both;
}
.fp-root[data-mode="instant"][data-phase="open"] .fp-letter { opacity: 1; transform: none; animation: fp-fade-in .45s ease-out both; }

.fp-root[data-phase="open"] .fp-float { will-change: transform; animation: fp-float 7s ease-in-out infinite; }

.fp-sheen-bar { transform: translateX(-130%); opacity: 0; }
.fp-root[data-mode="intro"][data-phase="opening"] .fp-sheen-bar,
.fp-root[data-mode="intro"][data-phase="open"] .fp-sheen-bar { animation: fp-sheen 1.5s ease-in-out var(--fp-sheen-delay) both; }
.fp-root[data-mode="instant"][data-phase="open"] .fp-sheen-bar { animation: fp-sheen 1.5s ease-in-out .4s both; }

/* buttons arrive once the letter has landed */
.fp-cta { opacity: 0; transform: translateY(8px); pointer-events: none; }
.fp-root[data-phase="open"] .fp-cta { opacity: 1; transform: none; pointer-events: auto; transition: opacity .6s ease .15s, transform .6s ease .15s; }

/* ───────── the stage around it ───────── */
.fp-light { opacity: .25; }
.fp-root[data-phase="opening"] .fp-light, .fp-root[data-phase="open"] .fp-light { opacity: 1; transition: opacity 3s ease 1.2s; }
.fp-decor { opacity: 0; }
.fp-root[data-phase="opening"] .fp-decor, .fp-root[data-phase="open"] .fp-decor { opacity: 1; transition: opacity 3.2s ease 2s; }
.fp-root[data-mode="instant"][data-phase="open"] .fp-light,
.fp-root[data-mode="instant"][data-phase="open"] .fp-decor { transition-duration: .5s; transition-delay: 0s; }

/* soft spotlight beams: a small pre-rendered alpha texture, rotated */
.fp-beam {
  position: absolute; top: -12%; height: 135%; width: 52vw;
  transform-origin: 50% 0; will-change: transform;
  background: url(/founders/beam.png) no-repeat 0 0 / 100% 100%;
}
.fp-beam-l { left: -6%;  transform: rotate(-22deg); animation: fp-sway-l 10s ease-in-out infinite alternate; }
.fp-beam-r { right: -6%; transform: rotate(22deg);  animation: fp-sway-r 12s ease-in-out infinite alternate; }

.fp-arches {
  position: absolute; left: 50%; top: 52%; height: 128%; width: auto;
  transform: translate(-50%,-50%); will-change: transform;
  animation: fp-breathe 11s ease-in-out infinite alternate;
}

.fp-mote {
  position: absolute; bottom: -3%; border-radius: 9999px; opacity: 0;
  background: radial-gradient(circle, rgba(255,240,205,.95) 0 38%, rgba(255,236,190,0) 72%);
  animation: fp-rise var(--fp-d) linear infinite; animation-delay: var(--fp-delay);
}

@media (max-width: 640px) {
  .fp-beam { width: 95vw; }
  .fp-mote:nth-child(n+7) { display: none; }
}

/* visitors who ask their device for less motion get a calm, still page */
@media (prefers-reduced-motion: reduce) {
  .fp-beam, .fp-arches, .fp-float { animation: none !important; }
  .fp-mote, .fp-sheen { display: none; }
  .fp-progress { animation: none; transform: scaleX(1); }
  .fp-letter { animation: none !important; opacity: 1 !important; transform: none !important; }
  .fp-light, .fp-decor { transition: none !important; opacity: 1 !important; }
}
`;

// If scripts fail to run at all, show the letter instead of leaving a closed curtain
export const FP_NOSCRIPT = `<style>.fp-panel,.fp-closed{display:none!important}.fp-letter,.fp-cta,.fp-light,.fp-decor{opacity:1!important;transform:none!important;pointer-events:auto!important}</style>`;

export default function StageDecor() {
  return (
    <div aria-hidden className="fp-decor pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <span className="fp-beam fp-beam-l" />
      <span className="fp-beam fp-beam-r" />

      {/* The letter's arch, echoed outwards */}
      <svg className="fp-arches" viewBox="0 0 1000 1000" fill="none" preserveAspectRatio="xMidYMid meet">
        {[
          { r: 250, o: 0.16 },
          { r: 340, o: 0.1 },
          { r: 430, o: 0.06 },
        ].map(({ r, o }) => (
          <path
            key={r}
            d={`M ${500 - r} 980 V ${500} A ${r} ${r} 0 0 1 ${500 + r} ${500} V 980`}
            stroke={`rgba(250,245,220,${o})`}
            strokeWidth="2"
          />
        ))}
      </svg>

      {MOTES.map(([left, size, dur, delay, drift], i) => (
        <span
          key={i}
          className="fp-mote"
          style={
            {
              left: `${left}%`,
              width: size * 3,
              height: size * 3,
              "--fp-d": `${dur}s`,
              "--fp-delay": `${delay}s`,
              "--fp-x": `${drift}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
