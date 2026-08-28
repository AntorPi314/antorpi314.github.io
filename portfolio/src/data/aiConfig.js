// Configuration for the "AI Terminal" feature — a terminal-style chat
// widget that answers visitor questions about Antor using the Gemini API.
//
// ⚠️ SECURITY NOTE:
// This is a static site (GitHub Pages), so there is no backend to hide
// this key behind. Anything shipped in the frontend JS bundle can be
// read by anyone who opens DevTools -> Sources, or just views the
// deployed .js file directly. That means this API key is effectively
// PUBLIC once this site is deployed.
//
// To limit the damage if it's copied/abused:
//   1. In Google AI Studio (https://aistudio.google.com/apikey), set an
//      "Application restriction" of type "Websites" on this key, and
//      only allow your domain (e.g. antorpi314.github.io/*). This stops
//      the key from being usable from other sites even if it's copied.
//   2. Set a daily/monthly quota or budget alert on the key so a leak
//      can't run up unexpected usage.
//   3. Rotate (regenerate) this key any time you suspect abuse — just
//      replace the value below and redeploy.
export const GEMINI_API_KEY = 'AQ.Ab8RN6JjBqIaBo-1uoEnNdZNeoNOvSxi233fx67jlgGfjbnqrw';

// Model id to call. Uses the standard v1beta generateContent endpoint.
export const GEMINI_MODEL = 'gemini-3.5-flash-lite';

export const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
