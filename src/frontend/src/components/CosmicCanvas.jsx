import { useRef, useEffect } from 'react';

// ============================================================
// CosmicCanvas — Animated Star-Field Background
// Dev-Cosmic Design System · 2026-05-17
//
// Renders a two-layer parallax canvas starfield extracted from
// the stitch_terminal_hardware_store Stitch export.
//
// Accepts a `variant` prop:
//   "canvas"  — JS-driven requestAnimationFrame parallax (default)
//   "css"     — lightweight CSS-only drift animation (fallback)
// ============================================================

const LAYERS = [
  { count: 200, size: 1, color: '#777777', dx: 0.04, dy: 0.12 },
  { count: 150, size: 2, color: '#AAAAAA', dx: 0.08, dy: 0.28 },
];

/**
 * @param {object}  props
 * @param {'canvas'|'css'} [props.variant='canvas'] - Rendering strategy.
 * @param {string}  [props.className=''] - Extra class names on the wrapper.
 */
export default function CosmicCanvas({ variant = 'canvas', className = '' }) {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);

  useEffect(() => {
    if (variant !== 'canvas') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Build star pools
    const pools = LAYERS.map(layer => ({
      ...layer,
      stars: [],
    }));

    let width, height;

    function resize() {
      width  = window.innerWidth;
      height = window.innerHeight;
      canvas.width  = width;
      canvas.height = height;

      pools.forEach(pool => {
        pool.stars = Array.from({ length: pool.count }, () => ({
          x: Math.random() * width,
          y: Math.random() * height,
        }));
      });
    }

    function animate() {
      ctx.fillStyle = '#0D0D0D';
      ctx.fillRect(0, 0, width, height);

      pools.forEach(pool => {
        ctx.fillStyle = pool.color;
        pool.stars.forEach(star => {
          star.x += pool.dx;
          star.y += pool.dy;
          if (star.x > width)  star.x = 0;
          if (star.y > height) star.y = 0;
          ctx.fillRect(star.x, star.y, pool.size, pool.size);
        });
      });

      animRef.current = requestAnimationFrame(animate);
    }

    window.addEventListener('resize', resize);
    resize();
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animRef.current);
    };
  }, [variant]);

  // ── Canvas (JS-driven) variant ─────────────────────────────
  if (variant === 'canvas') {
    return (
      <canvas
        ref={canvasRef}
        id="cosmic-canvas"
        aria-hidden="true"
        className={`cosmic-canvas ${className}`}
      />
    );
  }

  // ── CSS-only variant (fallback) ────────────────────────────
  return (
    <div
      aria-hidden="true"
      className={`cosmic-canvas ${className}`}
    >
      <div className="stars" />
    </div>
  );
}
