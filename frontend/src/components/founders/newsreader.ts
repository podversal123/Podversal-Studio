import { Newsreader } from "next/font/google";

// Same typeface family as the printed invitation. Shared by the /founders page
// and the home-page gate. `preload: false` keeps it off the home page's critical
// path (it loads as soon as the letter text renders, well before the curtain opens).
export const newsreader = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  display: "swap",
  adjustFontFallback: false,
  preload: false,
  variable: "--font-newsreader",
});
