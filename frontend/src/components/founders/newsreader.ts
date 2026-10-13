import { Newsreader } from "next/font/google";

// Same typeface family as the printed invitation. Shared by the /founders page and
// the home-page gate. It is preloaded because the letter is the first thing visitors
// see; without it the card would first appear in a fallback font and then change.
export const newsreader = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  display: "swap",
  adjustFontFallback: false,
  variable: "--font-newsreader",
});
