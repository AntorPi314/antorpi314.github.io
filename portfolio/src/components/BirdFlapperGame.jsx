import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

// Ported from WDibble/react-games (src/pages/BirdFlapper.tsx), adapted
// from a full standalone page into a modal component, and restyled
// with a round blue bird to match this portfolio's ambient bird
// character. Game constants, physics, and scoring logic are kept the
// same as the original.
const GRAVITY = 0.15;
const JUMP_VELOCITY = -4;
const GAP_SIZE = 180;
const PIPE_WIDTH = 52;
const BIRD_SIZE = 32;
const BIRD_X = 80;
const GAME_SPEED = 2;
const CLOUD_SPEED = 0.5;
const HILL_SPEED = 1;

// Frame size for the game's "phone" viewport inside the modal.
const FRAME_WIDTH = 320;
const FRAME_HEIGHT = 560;

const INITIAL_CLOUDS = [
  { x: 100, y: 50 },
  { x: 220, y: 80 },
  { x: 280, y: 30 },
];

const INITIAL_HILLS = [
  { x: 0, height: 90 },
  { x: 220, height: 60 },
  { x: 440, height: 75 },
];

function initialPipes() {
  return [{ x: FRAME_WIDTH, topHeight: 130, scored: false }];
}

/**
 * Bird Flapper mini-game modal. Click/tap the play area or press
 * Space to flap; the bird falls under gravity and the player must
 * navigate the gaps between scrolling pipes. Closeable via the X
 * button, the Escape key, or clicking the dark backdrop.
 */
function BirdFlapperGame({ onClose }) {
  const [birdY, setBirdY] = useState(FRAME_HEIGHT / 2 - BIRD_SIZE / 2);
  const [velocity, setVelocity] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [pipes, setPipes] = useState(initialPipes);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
  const [clouds, setClouds] = useState(INITIAL_CLOUDS);
  const [hills, setHills] = useState(INITIAL_HILLS);
  const [best, setBest] = useState(0);

  const gameLoopRef = useRef(null);
  const gameOverRef = useRef(false);
  const birdYRef = useRef(birdY);
  const velocityRef = useRef(velocity);
  const pipesRef = useRef(pipes);

  useEffect(() => {
    gameOverRef.current = gameOver;
  }, [gameOver]);
  useEffect(() => {
    birdYRef.current = birdY;
  }, [birdY]);
  useEffect(() => {
    velocityRef.current = velocity;
  }, [velocity]);
  useEffect(() => {
    pipesRef.current = pipes;
  }, [pipes]);

  useEffect(() => {
    const stored = Number(window.localStorage?.getItem?.('bird-flapper-best')) || 0;
    setBest(stored);
  }, []);

  const flap = useCallback(() => {
    if (!gameOverRef.current) {
      setStarted(true);
      setVelocity(JUMP_VELOCITY);
      setRotation(-20);
    }
  }, []);

  const resetGame = useCallback(() => {
    setBirdY(FRAME_HEIGHT / 2 - BIRD_SIZE / 2);
    setVelocity(0);
    setRotation(0);
    setPipes(initialPipes());
    setScore(0);
    setGameOver(false);
    setStarted(false);
    setClouds(INITIAL_CLOUDS);
    setHills(INITIAL_HILLS);
  }, []);

  // Keyboard: Space to flap, Escape to close the modal.
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        flap();
      } else if (e.code === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [flap, onClose]);

  const checkCollision = useCallback(() => {
    const birdBottom = birdYRef.current + BIRD_SIZE;

    if (birdBottom > FRAME_HEIGHT || birdYRef.current < 0) {
      setGameOver(true);
      return;
    }

    for (let i = 0; i < pipesRef.current.length; i += 1) {
      const p = pipesRef.current[i];
      const pipeLeft = p.x;
      const pipeRight = p.x + PIPE_WIDTH;
      const topPipeBottom = p.topHeight;
      const bottomPipeTop = p.topHeight + GAP_SIZE;

      if (
        pipeLeft < BIRD_X + BIRD_SIZE &&
        pipeRight > BIRD_X &&
        (birdYRef.current < topPipeBottom || birdBottom > bottomPipeTop)
      ) {
        setGameOver(true);
        return;
      }
    }
  }, []);

  // Main game loop, only advances once the player has flapped at
  // least once (so the bird waits, hovering, on the start screen).
  useEffect(() => {
    function gameLoop() {
      if (gameOverRef.current) return;

      if (started) {
        setBirdY((y) => y + velocityRef.current);
        setVelocity((v) => v + GRAVITY);
        setRotation((r) => Math.min(r + 2, 45));

        setClouds((prev) =>
          prev.map((cloud) => ({
            ...cloud,
            x: cloud.x - CLOUD_SPEED < -100 ? FRAME_WIDTH + 40 : cloud.x - CLOUD_SPEED,
          }))
        );

        setHills((prev) =>
          prev.map((hill) => ({
            ...hill,
            x: hill.x - HILL_SPEED < -260 ? FRAME_WIDTH + 40 : hill.x - HILL_SPEED,
          }))
        );

        setPipes((prev) => {
          let scoreIncremented = false;
          const newPipes = prev
            .map((pipe) => {
              const nextX = pipe.x - GAME_SPEED;
              if (!pipe.scored && nextX + PIPE_WIDTH < BIRD_X) {
                if (!scoreIncremented) {
                  setScore((s) => s + 0.5);
                  scoreIncremented = true;
                }
                return { ...pipe, x: nextX, scored: true };
              }
              return { ...pipe, x: nextX };
            })
            .filter((p) => p.x + PIPE_WIDTH > -100);

          if (newPipes.length && newPipes[newPipes.length - 1].x < FRAME_WIDTH - 100) {
            newPipes.push({
              x: FRAME_WIDTH + 60,
              topHeight: 70 + Math.floor(Math.random() * 140),
              scored: false,
            });
          }

          return newPipes;
        });

        checkCollision();
      }

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }

    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [started, checkCollision]);

  // Persist best score whenever the game ends.
  useEffect(() => {
    if (!gameOver) return;
    const finalScore = Math.floor(score);
    setBest((prevBest) => {
      const newBest = Math.max(prevBest, finalScore);
      try {
        window.localStorage?.setItem?.('bird-flapper-best', String(newBest));
      } catch (e) {
        // localStorage may be unavailable; ignore silently.
      }
      return newBest;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameOver]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 22, stiffness: 260 }}
        className="relative"
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close game"
          title="Close game (Esc)"
          className="absolute -top-3 -right-3 z-20 flex items-center justify-center w-9 h-9 rounded-full bg-surface dark:bg-surface-dark border border-border dark:border-border-dark shadow-md text-textPrimary dark:text-textPrimary-dark hover:text-red-500 hover:border-red-300 transition-colors duration-150"
        >
          <X size={18} />
        </button>

        {/* Phone-style frame containing the game, click/tap anywhere to flap */}
        <div
          onClick={flap}
          className="relative overflow-hidden rounded-[28px] border-[10px] border-neutral-900 shadow-2xl cursor-pointer select-none"
          style={{
            width: FRAME_WIDTH,
            height: FRAME_HEIGHT,
            background: 'linear-gradient(to bottom, #64B5F6, #90CAF9, #BBDEFB)',
          }}
        >
          {/* Parallax clouds */}
          {clouds.map((cloud, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${cloud.x}px`,
                top: `${cloud.y}px`,
                width: '56px',
                height: '28px',
                background: '#fff',
                borderRadius: '16px',
                opacity: 0.9,
                boxShadow: '0 3px 6px rgba(0,0,0,0.1)',
                zIndex: 1,
              }}
            />
          ))}

          {/* Parallax hills */}
          {hills.map((hill, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${hill.x}px`,
                bottom: 0,
                width: '220px',
                height: `${hill.height}px`,
                background: '#4CAF50',
                borderRadius: '50% 50% 0 0',
                zIndex: 2,
              }}
            />
          ))}

          {/* Score display */}
          <div
            style={{
              position: 'absolute',
              top: 12,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 10,
            }}
            className="flex flex-col items-center"
          >
            <div
              className="text-3xl font-bold text-white"
              style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
            >
              {Math.floor(score)}
            </div>
            <div className="text-xs font-medium text-white/80" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
              Best: {best}
            </div>
          </div>

          {/* Bird, round and blue to match the portfolio's bird character */}
          {!gameOver && (
            <div
              style={{
                position: 'absolute',
                left: `${BIRD_X}px`,
                top: `${birdY}px`,
                width: `${BIRD_SIZE}px`,
                height: `${BIRD_SIZE}px`,
                transform: `rotate(${rotation}deg)`,
                transition: 'transform 0.1s',
                zIndex: 5,
              }}
            >
              <svg width={BIRD_SIZE} height={BIRD_SIZE} viewBox="0 0 100 100">
                <path d="M28 58 L8 50 L11 60 L6 70 L28 64 Z" fill="#2b4bd6" />
                <circle cx="50" cy="58" r="30" fill="#5b7cfa" />
                <ellipse cx="54" cy="68" rx="17" ry="14" fill="#dbe4ff" />
                <circle cx="62" cy="34" r="24" fill="#5b7cfa" />
                <path
                  d="M42 54 C30 48, 20 36, 16 18 C32 24, 44 34, 52 52 Z"
                  fill="#2b4bd6"
                />
                <circle cx="70" cy="28" r="10.5" fill="#ffffff" />
                <circle cx="72.5" cy="28" r="6" fill="#182449" />
                <circle cx="70.5" cy="25.5" r="1.8" fill="#ffffff" />
                <path d="M81 30 L94 34 L81 39 Z" fill="#ffb020" />
              </svg>
            </div>
          )}

          {/* Pipes */}
          {pipes.map((p, i) => (
            <div key={i} style={{ position: 'absolute', zIndex: 4 }}>
              <div
                style={{
                  position: 'absolute',
                  left: `${p.x}px`,
                  top: 0,
                  width: `${PIPE_WIDTH}px`,
                  height: `${p.topHeight}px`,
                  background: '#43A047',
                  boxShadow: '2px 0 4px rgba(0,0,0,0.2)',
                  borderRadius: '0 0 4px 4px',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    bottom: -16,
                    left: -8,
                    width: `${PIPE_WIDTH + 16}px`,
                    height: '16px',
                    background: '#2E7D32',
                    borderRadius: '4px',
                  }}
                />
              </div>
              <div
                style={{
                  position: 'absolute',
                  left: `${p.x}px`,
                  top: `${p.topHeight + GAP_SIZE}px`,
                  width: `${PIPE_WIDTH}px`,
                  height: `${FRAME_HEIGHT}px`,
                  background: '#43A047',
                  boxShadow: '2px 0 4px rgba(0,0,0,0.2)',
                  borderRadius: '4px 4px 0 0',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: -16,
                    left: -8,
                    width: `${PIPE_WIDTH + 16}px`,
                    height: '16px',
                    background: '#2E7D32',
                    borderRadius: '4px',
                  }}
                />
              </div>
            </div>
          ))}

          {/* Start prompt, shown until the first flap */}
          {!started && !gameOver && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                zIndex: 8,
                background: 'rgba(0,0,0,0.15)',
              }}
            >
              <p className="text-white text-lg font-semibold" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.4)' }}>
                Tap or press Space
              </p>
              <p className="text-white/80 text-sm" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>
                to fly through the pipes
              </p>
            </div>
          )}

          {/* Game over card */}
          {gameOver && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'rgba(255,255,255,0.95)',
                padding: '24px',
                borderRadius: '16px',
                textAlign: 'center',
                boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                zIndex: 20,
                minWidth: 200,
              }}
            >
              <div className="text-lg font-semibold text-neutral-800 mb-1">Game Over</div>
              <div className="text-2xl font-bold text-neutral-900 mb-4">Score: {Math.floor(score)}</div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  resetGame();
                }}
                className="bg-accent hover:bg-accent-hover text-white font-semibold py-2 px-6 rounded-full transition-colors duration-200"
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-white/80 mt-3">
          Space or tap to flap • Esc to close
        </p>
      </motion.div>
    </motion.div>
  );
}

export default BirdFlapperGame;
