// Configuration for the "AI Terminal" feature — a terminal-style chat
// widget that answers visitor questions about Antor.
//
// This no longer calls Gemini directly from the browser. Instead it
// calls our own Cloudflare Worker, which holds the real Gemini API
// key server-side (as a Cloudflare secret) and forwards the request.
// This means no API key of any kind ships in this frontend bundle.
export const WORKER_ENDPOINT = 'https://portfolio-ai.antornslm.workers.dev/';
