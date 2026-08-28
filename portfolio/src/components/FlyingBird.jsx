import { useEffect, useRef, useState, useCallback, memo } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import BirdFlapperGame from './BirdFlapperGame.jsx';

// How long the bird stays at the nest, checking on it, before flying off again.
const CHECK_DURATION_MS = 10000;

// Bird's own render box. Kept modest so it stays a light, ambient
// detail rather than competing with the actual portfolio content.
const BIRD_SIZE = 64;

// Nest position, fixed near the bottom-right corner of the viewport.
const NEST_MARGIN = 24;
const NEST_SIZE = 60;

/**
 * Picks a random point for the bird to wander to, keeping a margin
 * from the viewport edges and staying out of the very top strip
 * (navbar) and the very bottom strip (nest's own corner).
 */
function randomPoint() {
  const margin = BIRD_SIZE;
  const topGuard = 96; // keep clear of the fixed navbar
  const bottomGuard = 140; // keep clear of the nest area
  const maxX = Math.max(window.innerWidth - margin, margin);
  const usableHeight = Math.max(window.innerHeight - topGuard - bottomGuard, 80);
  return {
    x: margin + Math.random() * (maxX - margin),
    y: topGuard + Math.random() * usableHeight,
  };
}

// Wing-flap keyframes defined once at module scope (not re-created on
// every render) and injected a single time via a top-level <style>
// tag, which keeps re-renders cheap and avoids any layout thrash.
const BIRD_STYLE_TAG_ID = 'flying-bird-styles';
const BIRD_STYLES = `
@keyframes bird-flap {
  0%, 100% { transform: rotate(0deg); }
  50% { transform: rotate(-35deg); }
}
@keyframes nest-wiggle {
  0%, 100% { transform: rotate(0deg) translateX(0); }
  20% { transform: rotate(-6deg) translateX(-2px); }
  40% { transform: rotate(5deg) translateX(2px); }
  60% { transform: rotate(-4deg) translateX(-1px); }
  80% { transform: rotate(3deg) translateX(1px); }
}
.fb-wing {
  transform-origin: 33px 34px;
  animation: bird-flap 0.42s ease-in-out infinite;
  will-change: transform;
}
.fb-wing-back {
  animation-delay: 0.06s;
  opacity: 0.9;
}
.fb-nest-wiggle {
  animation: nest-wiggle 0.5s ease-in-out 2;
  transform-origin: 50% 85%;
}
.fb-falling {
  animation: bird-fall-spin 0.6s linear infinite;
}
@keyframes bird-fall-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;

/**
 * Cute cartoon bird: big round body, oversized head and eyes, tiny
 * flapping wings, small feet. Drawn facing right; the wrapper flips
 * it horizontally when heading left.
 */
const BirdSvg = memo(function BirdSvg({ resting, blink }) {
  return (
    <svg width={BIRD_SIZE} height={BIRD_SIZE} viewBox="0 0 100 100">
      {/* Soft drop shadow for a bit of depth */}
      <ellipse cx="52" cy="86" rx="18" ry="4" fill="#000" opacity="0.08" />

      {/* Tail feathers */}
      <path d="M28 58 L8 50 L11 60 L6 70 L28 64 Z" fill="#2b4bd6" />

      {/* Back wing */}
      {!resting && (
        <path
          className="fb-wing fb-wing-back"
          d="M40 55 C28 52, 18 42, 14 26 C28 32, 38 40, 46 54 Z"
          fill="#3355e0"
        />
      )}

      {/* Round body */}
      <circle cx="50" cy="58" r="30" fill="#5b7cfa" />
      {/* Belly */}
      <ellipse cx="54" cy="68" rx="17" ry="14" fill="#dbe4ff" />

      {/* Big round head */}
      <circle cx="62" cy="34" r="24" fill="#5b7cfa" />
      {/* Head shading crescent for roundness */}
      <path d="M62 10 A24 24 0 0 1 86 34 A24 24 0 0 1 78 51 A20 20 0 0 0 62 10 Z" fill="#4a6bf0" opacity="0.6" />

      {/* Front wing, on top */}
      <path
        className={resting ? '' : 'fb-wing'}
        d="M42 54 C30 48, 20 36, 16 18 C32 24, 44 34, 52 52 Z"
        fill="#2b4bd6"
      />

      {/* Feet, only visible while resting at the nest */}
      {resting && (
        <>
          <path d="M46 86 L44 94 M46 86 L48 94 M46 86 L42 92" stroke="#f2994a" strokeWidth="2.4" strokeLinecap="round" fill="none" />
          <path d="M60 86 L58 94 M60 86 L62 94 M60 86 L64 92" stroke="#f2994a" strokeWidth="2.4" strokeLinecap="round" fill="none" />
        </>
      )}

      {/* Cheek blush */}
      <ellipse cx="52" cy="42" rx="4.5" ry="3" fill="#ff9d9d" opacity="0.7" />

      {/* Big eye white */}
      <circle cx="70" cy="28" r="10.5" fill="#ffffff" />
      {/* Pupil, blinks by scaling down vertically */}
      <circle
        cx="72.5"
        cy="28"
        r="6"
        fill="#182449"
        style={{
          transform: blink ? 'scaleY(0.1)' : 'scaleY(1)',
          transformOrigin: '72.5px 28px',
          transition: 'transform 0.08s ease',
        }}
      />
      <circle cx="70.5" cy="25.5" r="1.8" fill="#ffffff" />

      {/* Small eyebrow-ish highlight for expressiveness */}
      <path d="M63 18 Q70 14, 78 18" stroke="#3a52c4" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.5" />

      {/* Beak */}
      <path d="M81 30 L94 34 L81 39 Z" fill="#ffb020" />
      <path d="M81 34 L94 34" stroke="#e69100" strokeWidth="0.6" opacity="0.5" />
    </svg>
  );
});

/**
 * Nest SVG: woven twig base sitting in the corner. Wiggles briefly
 * when clicked, as if something just moved inside it.
 */
const NestSvg = memo(function NestSvg({ wiggle }) {
  return (
    <svg
      width={NEST_SIZE}
      height={NEST_SIZE}
      viewBox="0 0 100 100"
      className={wiggle ? 'fb-nest-wiggle' : ''}
    >
      {/* Shadow */}
      <ellipse cx="50" cy="88" rx="34" ry="6" fill="#000" opacity="0.1" />
      {/* Outer woven ring */}
      <ellipse cx="50" cy="66" rx="38" ry="20" fill="#8a5a2b" />
      <ellipse cx="50" cy="62" rx="36" ry="18" fill="#a9713b" />
      {/* Twig texture strokes */}
      <path d="M18 62 Q50 76 82 62" stroke="#7a4c22" strokeWidth="2.5" fill="none" opacity="0.6" />
      <path d="M20 56 Q50 68 80 56" stroke="#7a4c22" strokeWidth="2.5" fill="none" opacity="0.5" />
      <path d="M24 50 Q50 60 76 50" stroke="#7a4c22" strokeWidth="2.5" fill="none" opacity="0.4" />
      {/* Inner hollow */}
      <ellipse cx="50" cy="56" rx="24" ry="11" fill="#5b3a1c" />
      <ellipse cx="50" cy="54" rx="22" ry="9.5" fill="#3f2712" />
    </svg>
  );
});

/**
 * FlyingBird renders a small cartoon bird that wanders the screen
 * with gentle random flight, plus a fixed nest in the corner. Clicking
 * the nest makes it wiggle, as if something moved inside; the bird
 * notices, darts over quickly, checks on it for a few seconds, then
 * settles and flies off to wander again.
 *
 * Positioned via a fixed overlay so it flies over the whole page
 * regardless of scroll, and sits below the navbar's stacking order.
 */
function FlyingBird() {
  const controls = useAnimation();
  const [facingLeft, setFacingLeft] = useState(false);
  const [nestWiggle, setNestWiggle] = useState(false);
  const [checking, setChecking] = useState(false);
  const [resting, setResting] = useState(false);
  const [blink, setBlink] = useState(false);
  const [falling, setFalling] = useState(false);
  const [gameOpen, setGameOpen] = useState(false);

  const disturbedRef = useRef(false);
  const checkingRef = useRef(false);
  const cancelledRef = useRef(false);
  const pausedRef = useRef(false);
  const checkTimeoutRef = useRef(null);
  const blinkIntervalRef = useRef(null);
  const wiggleTimeoutRef = useRef(null);
  const fallTimeoutRef = useRef(null);

  useEffect(() => {
    checkingRef.current = checking;
  }, [checking]);

  // Occasional blink while resting at the nest, purely cosmetic.
  useEffect(() => {
    if (!resting) return undefined;
    blinkIntervalRef.current = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 120);
    }, 2200 + Math.random() * 1200);
    return () => clearInterval(blinkIntervalRef.current);
  }, [resting]);

  const nestPosition = useCallback(() => {
    return {
      x: window.innerWidth - NEST_MARGIN - NEST_SIZE / 2,
      y: window.innerHeight - NEST_MARGIN - NEST_SIZE / 2 - 6,
    };
  }, []);

  // Fly toward a point, flipping the sprite to face travel direction.
  // `fast` shortens the duration for the "hurrying over" dart to the nest.
  const flyTo = useCallback(
    async (point, currentPos, fast = false) => {
      const dx = point.x - currentPos.x;
      const distance = Math.hypot(dx, point.y - currentPos.y);
      const speedDivisor = fast ? 340 : 130;
      const minDur = fast ? 0.5 : 1.4;
      const maxDur = fast ? 1.6 : 4.5;
      const duration = Math.min(Math.max(distance / speedDivisor, minDur), maxDur);

      if (dx < -4) setFacingLeft(true);
      else if (dx > 4) setFacingLeft(false);

      await controls.start({
        x: point.x - BIRD_SIZE / 2,
        y: point.y - BIRD_SIZE / 2,
        rotate: [0, dx < 0 ? -3 : 3, 0],
        transition: { duration, ease: 'easeInOut' },
      });
    },
    [controls]
  );

  // Main wander/check loop. Runs once on mount; reads disturbedRef
  // each cycle so a nest click can redirect the very next leg.
  useEffect(() => {
    cancelledRef.current = false;

    let currentPos = randomPoint();
    controls.set({ x: currentPos.x - BIRD_SIZE / 2, y: currentPos.y - BIRD_SIZE / 2 });

    async function loop() {
      while (!cancelledRef.current) {
        if (pausedRef.current) {
          await new Promise((r) => setTimeout(r, 200));
          continue;
        }
        if (disturbedRef.current && !checkingRef.current) {
          const target = nestPosition();
          await flyTo(target, currentPos, true); // hurry over
          currentPos = target;
          if (cancelledRef.current) return;

          setFacingLeft(false);
          setResting(true);
          setChecking(true);

          await new Promise((resolve) => {
            checkTimeoutRef.current = setTimeout(resolve, CHECK_DURATION_MS);
          });

          if (cancelledRef.current) return;

          setResting(false);
          setChecking(false);
          disturbedRef.current = false;

          const liftoff = {
            x: target.x + (Math.random() > 0.5 ? 70 : -70),
            y: target.y - 90,
          };
          await flyTo(liftoff, currentPos);
          currentPos = liftoff;
        } else {
          const next = randomPoint();
          await flyTo(next, currentPos);
          currentPos = next;
          await new Promise((r) => setTimeout(r, 500 + Math.random() * 1000));
        }
      }
    }

    loop();

    return () => {
      cancelledRef.current = true;
      clearTimeout(checkTimeoutRef.current);
      clearTimeout(wiggleTimeoutRef.current);
      clearTimeout(fallTimeoutRef.current);
      clearInterval(blinkIntervalRef.current);
    };
    // Intentionally run once: the loop reads live state via refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controls, flyTo, nestPosition]);

  const handleNestClick = () => {
    if (disturbedRef.current || checkingRef.current || pausedRef.current) return;
    disturbedRef.current = true;
    setNestWiggle(true);
    clearTimeout(wiggleTimeoutRef.current);
    wiggleTimeoutRef.current = setTimeout(() => setNestWiggle(false), 900);
  };

  // Clicking the bird itself: pause the wander loop, drop the bird
  // down the screen for a comedic 3 seconds, then open the game.
  const handleBirdClick = () => {
    if (pausedRef.current || gameOpen) return;
    pausedRef.current = true;
    setFalling(true);
    controls.stop();

    const dropDistance = window.innerHeight * 0.4;

    controls.start({
      y: `+=${dropDistance}`,
      rotate: 360 * 3,
      transition: { duration: 3, ease: [0.55, 0, 1, 0.45] }, // accelerating fall
    });

    fallTimeoutRef.current = setTimeout(() => {
      setFalling(false);
      setGameOpen(true);
    }, 3000);
  };

  const handleCloseGame = () => {
    setGameOpen(false);
    // Resume wandering from a fresh random point once the game closes.
    const restartPos = randomPoint();
    controls.set({ x: restartPos.x - BIRD_SIZE / 2, y: restartPos.y - BIRD_SIZE / 2, rotate: 0 });
    pausedRef.current = false;
  };

  return (
    <>
      {/* Inject wing/nest keyframes once, not per render. */}
      <style id={BIRD_STYLE_TAG_ID}>{BIRD_STYLES}</style>

      {/* The bird itself: fixed overlay, animated by Framer Motion. */}
      <motion.div
        animate={controls}
        initial={false}
        className="fixed top-0 left-0 z-40 select-none cursor-pointer"
        style={{ width: BIRD_SIZE, height: BIRD_SIZE, pointerEvents: falling || gameOpen ? 'none' : 'auto' }}
        onClick={handleBirdClick}
        role="button"
        tabIndex={0}
        aria-label="Click the bird to play Bird Flapper"
        title="Click me to play a game!"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') handleBirdClick();
        }}
      >
        <div
          className={falling ? 'fb-falling' : ''}
          style={{
            transform: falling ? undefined : facingLeft ? 'scaleX(-1)' : 'scaleX(1)',
            transition: 'transform 0.15s ease',
          }}
        >
          <BirdSvg resting={resting} blink={blink} />
        </div>
      </motion.div>

      {/* Nest, fixed in the corner. Click to make it stir. */}
      <button
        type="button"
        onClick={handleNestClick}
        aria-label={checking ? 'The bird is checking on the nest' : 'Click the nest'}
        title={checking ? 'Checking the nest...' : 'Something moved in the nest?'}
        className="fixed z-30 flex items-center justify-center bg-transparent border-none cursor-pointer hover:scale-105 active:scale-95 transition-transform duration-150"
        style={{
          right: NEST_MARGIN - 6,
          bottom: NEST_MARGIN - 10,
          width: NEST_SIZE,
          height: NEST_SIZE,
        }}
      >
        <NestSvg wiggle={nestWiggle} />
      </button>

      {/* Bird Flapper mini-game, opens once the fall animation finishes. */}
      <AnimatePresence>
        {gameOpen && <BirdFlapperGame onClose={handleCloseGame} />}
      </AnimatePresence>
    </>
  );
}

export default memo(FlyingBird);
