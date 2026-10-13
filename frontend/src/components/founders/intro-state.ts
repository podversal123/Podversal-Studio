// Has the curtain already played during THIS page load?
//
// Deliberately in memory, not in sessionStorage: opening the link again (a fresh
// load, a refresh, a new tab) always starts with the curtain, which is what a
// salesperson needs when showing it to one client after another on the same phone.
// Moving around inside the site (home -> /founders) keeps the flag, so nobody sees
// the curtain twice in a row.
let played = false;

export const introPlayed = () => played;
export const markIntroPlayed = () => {
  played = true;
};
