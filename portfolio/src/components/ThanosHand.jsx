import { useRef, useState } from 'react';
import './ThanosSnap.css';

// Image + sound assets. Paths are built off import.meta.env.BASE_URL
// rather than a hardcoded leading "/" — this project deploys to a
// GitHub Pages sub-path (see vite.config.js's base: './'), so a bare
// "/sounds/..." would resolve to the domain root and 404 in production.
const ASSET_BASE = import.meta.env.BASE_URL;
const IDLE_IMG = `${ASSET_BASE}thanos/thanos_idle.png`;
const POWER_IMG = `${ASSET_BASE}thanos/thanos_power.png`;
const SNAP_IMG = `${ASSET_BASE}thanos/thanos_snap.png`;

const SOUND_BASE = `${ASSET_BASE}sounds/`;
const DUST_SOUND_COUNT = 4;

// How long the scroll-to-target takes before the dust animation on
// that section starts, and how long the dust animation itself runs.
// Kept in one place since the sequencer times its steps off these.
const SCROLL_SETTLE_MS = 650;
const STEP_GAP_MS = 220; // brief pause between one section finishing and the next scroll starting

// How long the gauntlet holds its "snap" pose for a section's fade —
// covers the whole batch of parts in that section fading together,
// so the pose and the one section-wide sound both line up with the
// single moment all of that section's content disappears/returns.
const SECTION_PULSE_MS = 500;

// After the scroll settles, wait this long before playing the sound —
// so scrolling-in and the sound feel like two distinct beats, not one
// instant blur. Then wait this long again, after the sound starts,
// before the content actually starts fading — so you hear the sound
// first and see the fade begin just after it, not at the same instant.
const PRE_SOUND_GAP_MS = 250;
const SOUND_TO_FADE_GAP_MS = 200;

// All parts in a section still fade together as one batch (one sound,
// one pose flash) — but each part gets its own small random delay in
// this range before it starts, so the batch doesn't pop in a single
// perfectly-synced instant. It should still read as "together", just
// with a little natural, uneven texture to it.
const PART_OFFSET_MIN_MS = 50;
const PART_OFFSET_MAX_MS = 500;

function randomPartOffset() {
  return PART_OFFSET_MIN_MS + Math.random() * (PART_OFFSET_MAX_MS - PART_OFFSET_MIN_MS);
}

function playSound(fileName, volume = 0.6) {
  try {
    const audio = new Audio(SOUND_BASE + fileName);
    audio.volume = volume;
    audio.play().catch(() => {});
  } catch {
    // Sound file missing or blocked — fail silently, visual effect
    // still runs on its own.
  }
}

function playRandomDustSound() {
  const n = Math.floor(Math.random() * DUST_SOUND_COUNT) + 1;
  playSound(`thanos_dust_${n}.mp3`, 0.5);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Fisher-Yates shuffle, used to pick a fresh random order each time the
// snap (or its reverse) runs.
function shuffled(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function scrollToEl(el) {
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * One individually snap-able section. Wraps its children in a plain div
 * registered with the given id, purely so ThanosHand can scroll to it
 * during the sequence. The dust effect itself no longer happens on
 * this whole node — it happens per-part, on the ThanosPart-wrapped
 * content nested inside (see partsRef), so section/card boxes never
 * disappear, only what's inside them.
 */
export function ThanosTarget({ id, register, children }) {
  return (
    <div ref={(el) => register(id, el)} className="thanos-target">
      {children}
    </div>
  );
}

/**
 * The Infinity Gauntlet button, fixed to the bottom-left of the
 * viewport (mirroring the bird's nest on the bottom-right). Each click
 * runs a full sequence: scroll to a random not-yet-snapped section,
 * dust it away, repeat for every remaining section in a new random
 * order each time, then scroll back to the top. Clicking again reverses
 * the same way — random order, one section restored at a time.
 *
 * `targetsRef` is a ref to a Map<id, HTMLElement> populated by
 * ThanosTarget registrations in App.jsx, used only to scroll to each
 * section in turn. `partsRef` is a ref to a
 * Map<sectionId, Map<partId, apiRef>> populated by every ThanosPart
 * nested inside that section — this is what actually gets hidden:
 * every part in a section fades together as one batch, paired with a
 * single dust sound and a single snap-pose flash on the gauntlet.
 * Each section runs as three distinct beats in order: scroll settles,
 * then a brief pause, then the sound plays, then another brief pause,
 * then the content fades — rather than scroll/sound/fade all landing
 * on the same instant.
 */
function ThanosHand({ snapped, onToggle, targetsRef, partsRef, sectionIds }) {
  const [busy, setBusy] = useState(false);
  const [pulsing, setPulsing] = useState(false);
  const runIdRef = useRef(0);

  const runSequence = async (snapping) => {
    const myRunId = ++runIdRef.current;
    setBusy(true);

    const order = shuffled(sectionIds);
    playSound(snapping ? 'thanos_snap_sound.mp3' : 'thanos_reverse_sound.mp3');

    for (const id of order) {
      // Bail out if a newer run started (shouldn't happen since the
      // button is disabled while busy, but guards against fast double
      // triggers from keyboard/assistive tech).
      if (runIdRef.current !== myRunId) return;

      const el = targetsRef.current.get(id);
      if (el) {
        scrollToEl(el);
        await wait(SCROLL_SETTLE_MS);
      }

      const sectionParts = partsRef?.current.get(id);
      const apiRefs = sectionParts ? Array.from(sectionParts.values()) : [];

      if (apiRefs.length) {
        // Three distinct beats, in order: scroll has already settled
        // above, then a brief pause, then the sound plays, then
        // another brief pause, then the content starts fading — so
        // scroll, sound, and hide read as separate steps rather than
        // all landing on the same instant.
        await wait(PRE_SOUND_GAP_MS);

        setPulsing(true);
        if (snapping) playRandomDustSound();

        await wait(SOUND_TO_FADE_GAP_MS);

        // All parts fade together as this one batch (one sound, one
        // pose flash already triggered above), but each part gets its
        // own small random 50-500ms offset so they don't all pop at
        // the exact same instant — still reads as "together", just
        // with natural, slightly uneven timing.

        const runs = apiRefs.map((apiRef) =>
          wait(randomPartOffset()).then(() => {
            const api = apiRef.current;
            if (!api) return undefined;
            return snapping ? api.disintegrate() : api.reassemble();
          })
        );
        await Promise.all([...runs, wait(SECTION_PULSE_MS)]);

        setPulsing(false);
      }

      await wait(STEP_GAP_MS);
    }

    scrollToTop();
    await wait(SCROLL_SETTLE_MS);

    if (runIdRef.current === myRunId) {
      onToggle(snapping);
      setBusy(false);
    }
  };

  const triggerSnap = () => {
    if (busy) return;
    runSequence(!snapped);
  };

  const imgSrc = pulsing ? SNAP_IMG : busy ? POWER_IMG : IDLE_IMG;

  return (
    <button
      type="button"
      onClick={triggerSnap}
      disabled={busy}
      aria-label={snapped ? 'Snap the website back into existence' : 'Snap half the website away'}
      title={snapped ? 'আবার ফিরিয়ে আনুন' : 'স্ন্যাপ করুন'}
      className={`thanos-gauntlet-btn fixed z-30 ${pulsing ? 'thanos-gauntlet-pulse' : ''}`}
      style={{ left: 18, bottom: 14, width: 60, height: 60 }}
    >
      <img src={imgSrc} alt="" draggable={false} />
    </button>
  );
}

export default ThanosHand;
