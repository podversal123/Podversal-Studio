"use client";

import { motion } from "framer-motion";

// The "stage" around the invitation: two spotlight beams from the top corners,
// the letter's own arch echoed in rings behind it, and dust drifting through the
// light. It fills the empty space beside the letter on tablets and desktops and
// adds depth on phones.
//
// Everything animates transform/opacity only (cheap on phones), the dust is a fixed
// list (no Math.random, so server and client render identically) and all motion is
// switched off for visitors who ask for reduced motion.

// left %, size px, seconds to rise, start delay s, sideways drift px
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
  [12, 2, 20, 11, 24],
  [88, 2, 16, 12, -22],
  [50, 3, 21, 6, 10],
  [34, 2, 15, 13, -14],
];

export const FP_STYLES = `
@keyframes fp-sway-l { from { transform: rotate(-22deg) } to { transform: rotate(-28deg) } }
@keyframes fp-sway-r { from { transform: rotate(22deg) } to { transform: rotate(28deg) } }
@keyframes fp-breathe { from { transform: translate(-50%,-50%) scale(1) } to { transform: translate(-50%,-50%) scale(1.03) } }
@keyframes fp-rise {
  0%   { transform: translate(0,0); opacity: 0 }
  12%  { opacity: .75 }
  85%  { opacity: .45 }
  100% { transform: translate(var(--fp-x), -108vh); opacity: 0 }
}
@keyframes fp-progress { from { transform: scaleX(0) } to { transform: scaleX(1) } }

.fp-beam {
  position: absolute; top: -12%; height: 135%; width: 52vw;
  transform-origin: 50% 0;
  background: linear-gradient(180deg, rgba(250,245,220,.22) 0%, rgba(250,245,220,.08) 45%, rgba(250,245,220,0) 88%);
  clip-path: polygon(43% 0, 57% 0, 100% 100%, 0 100%);
  -webkit-mask-image: linear-gradient(90deg, transparent 0%, #000 30%, #000 70%, transparent 100%);
          mask-image: linear-gradient(90deg, transparent 0%, #000 30%, #000 70%, transparent 100%);
}
.fp-beam-l { left: -6%;  animation: fp-sway-l 10s ease-in-out infinite alternate; transform: rotate(-22deg); }
.fp-beam-r { right: -6%; animation: fp-sway-r 12s ease-in-out infinite alternate; transform: rotate(22deg); }

.fp-arches {
  position: absolute; left: 50%; top: 52%; height: 128%; width: auto;
  transform: translate(-50%,-50%);
  animation: fp-breathe 11s ease-in-out infinite alternate;
}

.fp-mote {
  position: absolute; bottom: -3%; border-radius: 9999px; opacity: 0;
  background: rgba(255,240,205,.9);
  box-shadow: 0 0 9px 1px rgba(255,236,190,.65);
  animation: fp-rise var(--fp-d) linear infinite;
  animation-delay: var(--fp-delay);
}

.fp-progress { transform: scaleX(0); transform-origin: left; animation: fp-progress linear forwards; }

@media (max-width: 640px) {
  .fp-beam { width: 95vw; opacity: .75; }
  .fp-mote:nth-child(n+9) { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  .fp-beam, .fp-arches { animation: none; }
  .fp-mote { display: none; }
  .fp-progress { animation: none; transform: scaleX(1); }
  .fp-sheen { display: none; }
}
`;

export default function StageDecor({
  show,
  instant,
}: {
  show: boolean;
  instant: boolean;
}) {
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: show ? 1 : 0 }}
      transition={{ duration: instant ? 0.5 : 3.2, delay: instant ? 0 : 2 }}
    >
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
              width: size,
              height: size,
              "--fp-d": `${dur}s`,
              "--fp-delay": `${delay}s`,
              "--fp-x": `${drift}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </motion.div>
  );
}
