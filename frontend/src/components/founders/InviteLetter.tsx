import { ILLUSTRATION_MARKUP } from "./illustration-markup";
import {
  ARCH_PATH,
  ILLUSTRATION,
  LETTER_CREAM,
  LETTER_H,
  LETTER_MAROON,
  LETTER_W,
  SQUIGGLE_PATH,
} from "./letter-geometry";

// The approved invitation, rebuilt as live vector artwork (not an image) so it
// stays razor-sharp from a 320px phone to a 4K screen. Coordinates come
// straight from the PDF (612 x 792 pt).

const CX = 305.99; // arch centre x
const CY = 314.0; // arch centre y (where the semicircle starts)
const TEXT_R = 184; // baseline radius of the curved headline

const serif = { fontFamily: "var(--font-newsreader), Georgia, serif" };
const sans = { fontFamily: "Helvetica, Arial, sans-serif" };

export default function InviteLetter({ className }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${LETTER_W} ${LETTER_H}`}
      className={className}
      role="img"
      aria-label="Invitation: Inside the Founder's Mind podcast by Podversal. We invite you. The show gets live this Diwali."
    >
      <defs>
        <path
          id="founders-arc"
          d={`M ${CX - TEXT_R} ${CY} A ${TEXT_R} ${TEXT_R} 0 0 1 ${CX + TEXT_R} ${CY}`}
        />
      </defs>

      <rect width={LETTER_W} height={LETTER_H} fill={LETTER_MAROON} />
      <path d={ARCH_PATH} fill={LETTER_CREAM} />

      <text
        fontSize="33.8"
        fontWeight="700"
        fill={LETTER_MAROON}
        style={serif}
        aria-hidden="true"
      >
        <textPath href="#founders-arc" startOffset="50%" textAnchor="middle">
          Inside the Founder’s mind
        </textPath>
      </text>

      <text
        x={CX}
        y="229"
        textAnchor="middle"
        fontSize="25"
        fontWeight="700"
        fill={LETTER_MAROON}
        style={sans}
      >
        Podcast
      </text>
      <path
        d={SQUIGGLE_PATH}
        fill="none"
        stroke={LETTER_MAROON}
        strokeWidth="2"
        strokeLinecap="round"
      />

      <text
        x={CX}
        y="287"
        textAnchor="middle"
        fontSize="35"
        fontWeight="700"
        fill={LETTER_MAROON}
        style={serif}
      >
        By Podversal
      </text>

      <g
        transform={`translate(${ILLUSTRATION.x} ${ILLUSTRATION.y})`}
        dangerouslySetInnerHTML={{ __html: ILLUSTRATION_MARKUP }}
      />

      <text
        x={CX}
        y="574"
        textAnchor="middle"
        fontSize="35"
        fontWeight="700"
        fill={LETTER_MAROON}
        style={serif}
      >
        We invite you
      </text>
      <text
        x={CX}
        y="625"
        textAnchor="middle"
        fontSize="25"
        fontStyle="italic"
        fill={LETTER_MAROON}
        style={serif}
      >
        The Show Gets Live on this Diwali
      </text>

      <text
        x="27.5"
        y="43"
        fontSize="15"
        fontStyle="italic"
        fill={LETTER_CREAM}
        style={sans}
      >
        JOIN US IN OUR
      </text>
      <text
        x={CX}
        y="707"
        textAnchor="middle"
        fontSize="15"
        fontStyle="italic"
        fill={LETTER_CREAM}
        style={sans}
      >
        BROUGHT TO YOU BY : PODVERSAL
      </text>
    </svg>
  );
}
