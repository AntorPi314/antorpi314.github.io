import { useEffect, useRef, useState, useCallback } from 'react';

// Wraps arbitrary content and, on command, dissolves it into a burst
// of tiny sand-colored grains that drift away like Thanos-snap dust,
// then can reassemble back into place.
//
// How it captures content: rather than manually re-drawing text/DOM
// onto a canvas (fragile — fonts, wrapping, kerning all drift from
// the real render), it serializes the wrapped node into an SVG
// <foreignObject>, rasterizes that SVG as an <img>, and draws that
// image onto a canvas. This is a pixel-perfect snapshot of exactly
// what was on screen, which is then pixel-sampled into grains.
//
// Usage:
//   const apiRef = useRef(null);
//   <SandDisintegrate apiRef={apiRef}>{content}</SandDisintegrate>
//   await apiRef.current.disintegrate()  // dust away
//   await apiRef.current.reassemble()    // reform back into place

const GRAIN = 3; // sample every Nth device pixel — coarse grain reads as "sand", not smoke
const SAND_COLORS = ['#e8d4a0', '#d9b877', '#c9a05f', '#f0e0b8', '#b8925a'];
// Kept short since this now animates many small per-card/per-item
// parts in a staggered sequence (see ThanosHand's PART_STAGGER_MS)
// rather than one big section-wide dissolve - a longer duration here
// would make the whole gauntlet sequence drag.
const DURATION = 550;

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}
function easeInCubic(t) {
  return t * t * t;
}

// Properties that matter visually and are safe/cheap to copy inline.
// (Not using the full CSSStyleDeclaration list — that includes
// hundreds of longhands and blows up serialized SVG size for no
// visible gain. This set covers everything Tailwind utility classes
// in this project actually vary: text, box, and effect styling.)
const STYLE_PROPS = [
  'color', 'background-color', 'background-image', 'background-size',
  'background-position', 'background-repeat', 'background-clip',
  'font-family', 'font-size', 'font-weight', 'font-style', 'line-height',
  'letter-spacing', 'text-align', 'text-decoration', 'text-transform',
  'white-space', 'word-break', 'word-spacing',
  'display', 'flex-direction', 'flex-wrap', 'flex-grow', 'flex-shrink',
  'flex-basis', 'align-items', 'justify-content', 'justify-items',
  'gap', 'row-gap', 'column-gap',
  'grid-template-columns', 'grid-template-rows', 'grid-column', 'grid-row',
  'position', 'top', 'left', 'right', 'bottom', 'z-index',
  'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
  'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'border-width', 'border-style', 'border-color',
  'border-top-left-radius', 'border-top-right-radius',
  'border-bottom-left-radius', 'border-bottom-right-radius',
  'box-shadow', 'opacity', 'overflow', 'object-fit', 'object-position',
  'fill', 'stroke', 'stroke-width', 'vertical-align', 'transform',
  '-webkit-text-fill-color', '-webkit-background-clip',
];

// Recursively bakes computed styles from the live `source` tree onto
// the corresponding `target` clone tree as inline `style` attributes.
// This is required because the clone gets serialized into a
// standalone SVG blob and rendered as an <img> in an isolated
// document with no access to the page's stylesheet (Tailwind classes
// resolve to nothing there) — without this, captured text silently
// falls back to browser-default serif/black styling, as seen when a
// snapped section reassembles looking unstyled.
function inlineComputedStyles(source, target) {
  const computed = window.getComputedStyle(source);
  let css = '';
  for (const prop of STYLE_PROPS) {
    const value = computed.getPropertyValue(prop);
    if (value) css += `${prop}:${value};`;
  }
  target.setAttribute('style', css);

  const sourceChildren = source.children;
  const targetChildren = target.children;
  for (let i = 0; i < sourceChildren.length; i++) {
    inlineComputedStyles(sourceChildren[i], targetChildren[i]);
  }
}

async function captureNodeToImage(node, width, height) {
  const clone = node.cloneNode(true);
  clone.removeAttribute('id');
  clone.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
  inlineComputedStyles(node, clone);

  const svgNs = 'http://www.w3.org/2000/svg';
  const foreignObject = document.createElementNS(svgNs, 'foreignObject');
  foreignObject.setAttribute('width', '100%');
  foreignObject.setAttribute('height', '100%');
  foreignObject.appendChild(clone);

  const svg = document.createElementNS(svgNs, 'svg');
  svg.setAttribute('xmlns', svgNs);
  svg.setAttribute('width', String(width));
  svg.setAttribute('height', String(height));
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.appendChild(foreignObject);

  const svgString = new XMLSerializer().serializeToString(svg);
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  try {
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = url;
    });
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function samplePoints(ctx, width, height) {
  const { data } = ctx.getImageData(0, 0, width, height);
  const points = [];
  for (let y = 0; y < height; y += GRAIN) {
    for (let x = 0; x < width; x += GRAIN) {
      const i = (y * width + x) * 4;
      const alpha = data[i + 3];
      if (alpha > 40) {
        points.push({ x, y, r: data[i], g: data[i + 1], b: data[i + 2], a: alpha / 255 });
      }
    }
  }
  return points;
}

/**
 * SandDisintegrate — imperative-handle component (no forwardRef, to
 * match this codebase's plain-props style elsewhere). `apiRef`
 * receives { disintegrate, reassemble }, each returning a Promise.
 */
function SandDisintegrate({ children, apiRef, className = '', direction = 'up' }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const particlesRef = useRef(null); // { points, width, height, dpr }
  const rafRef = useRef(null);
  const [phase, setPhase] = useState('visible'); // visible | hidden

  const capture = useCallback(async () => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return false;

    const rect = wrap.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    if (width <= 1 || height <= 1) return false;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    try {
      const contentNode = wrap.firstElementChild;
      const img = await captureNodeToImage(contentNode, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      const points = samplePoints(ctx, canvas.width, canvas.height);
      if (!points.length) return false;
      particlesRef.current = { points, width: canvas.width, height: canvas.height, dpr };
      return true;
    } catch {
      // Capture can fail in unusual environments (e.g. a browser that
      // restricts rasterizing foreignObject SVGs, or a tainted canvas).
      // Fall back gracefully: caller treats false as "just hide/show
      // the real DOM node with a plain fade" instead of animating dust.
      particlesRef.current = null;
      return false;
    }
  }, []);

  const animateParticles = useCallback((forming) => {
    return new Promise((resolve) => {
      const canvas = canvasRef.current;
      const data = particlesRef.current;
      if (!canvas || !data) {
        resolve();
        return;
      }
      const ctx = canvas.getContext('2d');
      const { width, height, dpr } = data;
      const dirSign = direction === 'up' ? -1 : 1;

      const particles = data.points.map((p) => {
        const angle = (Math.random() - 0.5) * 1.3;
        const dist = (60 + Math.random() * 150) * dpr;
        return {
          ...p,
          drift: {
            dx: Math.sin(angle) * dist,
            dy: dirSign * (90 + Math.random() * 170) * dpr - Math.random() * 30 * dpr,
          },
          delay: Math.random() * 0.4,
          size: (1 + Math.random() * 1.8) * dpr,
          color: SAND_COLORS[Math.floor(Math.random() * SAND_COLORS.length)],
          origColor: `rgb(${p.r},${p.g},${p.b})`,
        };
      });

      const start = performance.now();

      const frame = (now) => {
        const elapsed = now - start;
        const globalT = Math.min(elapsed / DURATION, 1);

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, width, height);

        for (const p of particles) {
          let t = (globalT - p.delay) / (1 - p.delay);
          t = Math.max(0, Math.min(t, 1));
          const eased = forming ? easeOutCubic(t) : easeInCubic(t);

          const px = forming ? p.x + p.drift.dx * (1 - eased) : p.x + p.drift.dx * eased;
          const py = forming ? p.y + p.drift.dy * (1 - eased) : p.y + p.drift.dy * eased;
          const alpha = forming ? p.a * eased : p.a * (1 - eased);
          if (alpha <= 0.01) continue;

          const midFlight = eased > 0.12 && eased < 0.9;
          ctx.globalAlpha = alpha;
          ctx.fillStyle = midFlight ? p.color : p.origColor;
          const size = p.size * (0.65 + 0.35 * (forming ? eased : 1 - eased));
          ctx.fillRect(px, py, size, size);
        }
        ctx.globalAlpha = 1;

        if (globalT < 1) {
          rafRef.current = requestAnimationFrame(frame);
        } else {
          resolve();
        }
      };

      rafRef.current = requestAnimationFrame(frame);
    });
  }, [direction]);

  useEffect(() => {
    if (!apiRef) return undefined;

    apiRef.current = {
      disintegrate: async () => {
        const ok = await capture();
        if (!ok) {
          // Fallback: plain fade, no particles, if capture didn't work
          // in this environment. Still ends in the same "hidden" state
          // the caller expects.
          setPhase('fading-out');
          await new Promise((r) => setTimeout(r, 350));
          setPhase('hidden');
          return;
        }
        await new Promise((r) => requestAnimationFrame(r));
        setPhase('hidden');
        await animateParticles(false);
      },
      reassemble: async () => {
        if (!particlesRef.current) {
          setPhase('fading-in');
          await new Promise((r) => setTimeout(r, 350));
          setPhase('visible');
          return;
        }
        await animateParticles(true);
        setPhase('visible');
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      },
    };

    return () => {
      if (apiRef) apiRef.current = null;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [capture, animateParticles]);

  // 'hidden' truly removes content from view (used once real dust
  // particles have taken over, or once a no-particle fallback fade
  // has finished). 'fading-out' still renders the real node but at
  // opacity 0, transitioning — this is the plain-fade fallback path.
  const contentVisible = phase !== 'hidden';
  const contentOpacity = phase === 'fading-out' ? 0 : 1;

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <div
        className="h-full"
        style={{
          visibility: contentVisible ? 'visible' : 'hidden',
          opacity: contentOpacity,
          transition: phase === 'fading-out' || phase === 'fading-in' ? 'opacity 0.35s ease' : undefined,
        }}
      >
        {children}
      </div>
      <canvas ref={canvasRef} className="pointer-events-none absolute left-0 top-0" />
    </div>
  );
}

export default SandDisintegrate;
