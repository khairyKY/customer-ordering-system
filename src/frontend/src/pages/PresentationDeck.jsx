// ============================================================
// PresentationDeck — fullscreen native React deck (route: /presentation)
// Dev-Cosmic theme · COS CSE323 Final Presentation
//
// Performance notes:
//  - The animated starfield (CosmicCanvas) is mounted ONCE at the App
//    root, outside the router. Slide state lives here, so the canvas
//    never re-renders on navigation — background isolation is structural.
//  - SlideView is wrapped in React.memo: it re-renders only when the
//    slide object identity changes, never on unrelated deck state.
//  - Transitions animate ONLY opacity + x (and the progress bar's
//    scaleX). No layout properties are animated. willChange is set.
//  - <AnimatePresence mode="wait"> fully unmounts the outgoing slide
//    before the incoming one mounts (clean DOM).
//  - Keyboard navigation is throttled with a 250 ms cooldown.
//
// Print / PDF export:
//  - A second DOM tree (the "print stack") renders every slide vertically.
//    On screen it is `display:none`; under `@media print` it is `display:flex`
//    while the interactive deck is hidden. This bypasses Framer Motion's
//    single-slide rendering completely without touching the screen flow.
//  - Each printed slide is wrapped in a `.print-slide` block that owns the
//    page break (`break-after: page`) and disables the screen-only height
//    clamp on `.liquid-card` so content flows naturally onto A4.
//  - The global CosmicCanvas is hidden in print to avoid colossal raster
//    output and browser crashes on slow machines.
//  - All transitions / animations / transforms are nuked inside
//    `@media print` so Framer Motion cannot leave a slide mid-animation.
//  - `print-color-adjust: exact` keeps the dark backgrounds + cyan accents
//    in the exported PDF (Chrome / Edge / Firefox).
// ============================================================

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import NeonButton from '../components/ui/NeonButton';
import { slides } from './presentationSlides';

const NAV_COOLDOWN_MS = 250;

// Scoped @media print rules — injected once via a single <style> element.
// Kept inline so the print contract travels with the component file and is
// trivial to reason about during academic submission. Selectors only target
// classes owned by this deck (`.screen-deck`, `.print-stack`, `.print-slide`)
// plus the global `canvas` (only one canvas exists in the app — CosmicCanvas).
const PRINT_CSS = `
@media print {
  @page {
    size: A4 landscape;
    margin: 12mm;
  }

  html, body {
    background: #0D0D0D !important;
    color: #e5e2e1 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  /* The CosmicCanvas starfield is mounted globally at the App root.
     Hide it for print — saves the renderer from rasterising a 4K canvas
     onto every page and prevents low-RAM browsers from crashing. */
  canvas {
    display: none !important;
  }

  /* Force-disable every transition / animation / transform. Framer Motion
     uses inline 'transform' + 'opacity' styles; the !important here wins
     over them so the printed slide is always in its rest state. */
  *,
  *::before,
  *::after {
    transition: none !important;
    animation: none !important;
    transform: none !important;
    will-change: auto !important;
    opacity: 1 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  /* Hide the interactive deck + the floating export button. */
  .screen-deck,
  .deck-print-trigger {
    display: none !important;
  }

  /* Reveal and lay out the unrolled print stack. */
  .print-stack {
    display: flex !important;
    flex-direction: column;
    width: 100%;
  }

  /* Every slide owns its page. */
  .print-slide {
    width: 100%;
    padding: 6mm 0;
    break-after: page;
    page-break-after: always;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .print-slide:last-child {
    break-after: auto;
    page-break-after: auto;
  }

  /* The screen version of liquid-card clamps height to 80vh and scrolls.
     In print, content must flow naturally onto the page. */
  .print-slide .liquid-card {
    max-height: none !important;
    overflow: visible !important;
    width: 100% !important;
    max-width: none !important;
    margin: 0 auto;
    box-shadow: none !important;
  }
}
`;

// ── Inline **bold** renderer ─────────────────────────────────
function RichText({ text }) {
  return text.split('**').map((part, i) =>
    i % 2 === 1
      ? <strong key={i} className="font-semibold text-[#8fd6ff]">{part}</strong>
      : <span key={i}>{part}</span>,
  );
}

const Bullet = () => (
  <span className="select-none font-mono text-[#00bfff]" aria-hidden="true">›</span>
);

// ── Single content block ─────────────────────────────────────
function Block({ block }) {
  switch (block.type) {
    case 'lead':
      return (
        <p className="font-mono text-[15px] leading-[1.6] text-[#87929b]">
          <RichText text={block.text} />
        </p>
      );

    case 'bullets':
      return (
        <ul className="flex flex-col gap-2.5">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-3 font-sans text-[17px] leading-[1.5] text-[#e5e2e1]">
              <Bullet />
              <span><RichText text={item} /></span>
            </li>
          ))}
        </ul>
      );

    case 'ordered':
      return (
        <ol className="flex flex-col gap-2.5">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-3 font-sans text-[16px] leading-[1.5] text-[#e5e2e1]">
              <span className="w-6 shrink-0 select-none font-mono text-[14px] text-[#00bfff]">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span><RichText text={item} /></span>
            </li>
          ))}
        </ol>
      );

    case 'group':
      return (
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[13px] uppercase tracking-[0.12em] text-[#8fd6ff]">
            {block.label}
          </span>
          <ul className="flex flex-col gap-1.5">
            {block.items.map((item, i) => (
              <li key={i} className="flex gap-2.5 font-sans text-[15px] leading-[1.5] text-[#e5e2e1]">
                <Bullet />
                <span><RichText text={item} /></span>
              </li>
            ))}
          </ul>
        </div>
      );

    case 'table':
      return (
        <div className="border border-[#242424]">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {block.head.map((h, i) => (
                  <th
                    key={i}
                    className="border-b border-[#242424] bg-[#0D0D0D] px-3 py-2 text-left font-mono text-[12px] uppercase tracking-[0.1em] text-[#00bfff]"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      className="border-b border-[#242424] px-3 py-2 align-top font-mono text-[13px] text-[#e5e2e1]"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    default:
      return null;
  }
}

// ── Slide content — memoized so it re-renders only on slide change ──
const SlideView = memo(function SlideView({ slide }) {
  return (
    <div
      className="liquid-card w-full max-w-[920px] max-h-[80vh] overflow-y-auto px-10 py-9"
      /* Local override: the global `.liquid-card:hover` rule reveals a cyan
         top border on hover. The deck wants that look permanently, so we pin
         the hovered value inline here — no change to the global component,
         so the storefront's LiquidCard hover behaviour is untouched. */
      style={{ borderTopColor: '#00bfff' }}
    >
      <div className="flex flex-col gap-5">
        {slide.eyebrow && (
          <span className="font-mono text-[12px] uppercase tracking-[0.2em] text-[#00bfff]">
            {slide.eyebrow}
          </span>
        )}
        <h1 className="font-sans font-bold leading-[1.12] text-[#e5e2e1] text-[clamp(28px,3.6vw,44px)]">
          {slide.title}
        </h1>
        {slide.subtitle && (
          <p className="-mt-3 font-mono text-[15px] text-[#87929b]">{slide.subtitle}</p>
        )}
        <div className="mt-1 flex flex-col gap-5">
          {slide.blocks.map((block, i) => <Block key={i} block={block} />)}
        </div>
      </div>
    </div>
  );
});

// ── Deck ─────────────────────────────────────────────────────
const slideVariants = {
  enter:  (dir) => ({ opacity: 0, x: dir >= 0 ? 56 : -56 }),
  center: { opacity: 1, x: 0 },
  exit:   (dir) => ({ opacity: 0, x: dir >= 0 ? -56 : 56 }),
};

export default function PresentationDeck() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const cooldownRef = useRef(0);
  const total = slides.length;

  // Throttled navigation — ignores presses inside the 250 ms cooldown.
  const go = useCallback((delta) => {
    const now = Date.now();
    if (now - cooldownRef.current < NAV_COOLDOWN_MS) return;
    cooldownRef.current = now;
    setDirection(delta);
    setIndex((i) => {
      const next = i + delta;
      return next < 0 || next >= total ? i : next;
    });
  }, [total]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        go(1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        go(-1);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [go]);

  const slide = slides[index];

  return (
    <>
      {/* Print-mode CSS — injected once, scoped via class selectors. */}
      <style>{PRINT_CSS}</style>

      {/* Floating "Export PDF" trigger — hidden in print output. */}
      <div className="deck-print-trigger fixed right-6 top-6 z-50 print:hidden">
        <NeonButton
          variant="secondary"
          onClick={() => window.print()}
          aria-label="Export this presentation to PDF"
        >
          ⇩ Export PDF
        </NeonButton>
      </div>

      {/* ── Interactive deck (screen only) ──────────────────── */}
      <div className="screen-deck flex min-h-screen w-full select-none flex-col items-center justify-center px-6 py-10 print:hidden">
        {/* Slide stage */}
        <div className="flex w-full flex-1 items-center justify-center">
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.div
              key={slide.id}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28, ease: 'easeOut' }}
              style={{ willChange: 'transform, opacity' }}
              className="flex w-full justify-center"
            >
              <SlideView slide={slide} />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="mt-8 flex w-full max-w-[920px] items-center justify-between gap-5">
          <NeonButton variant="secondary" onClick={() => go(-1)} disabled={index === 0}>
            ‹ Prev
          </NeonButton>

          <div className="flex flex-1 flex-col items-center gap-2">
            <span className="font-mono text-[12px] tracking-[0.18em] text-[#87929b]">
              {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
            </span>
            <div className="h-[2px] w-full bg-[#242424]">
              <motion.div
                className="h-full origin-left bg-[#00bfff]"
                animate={{ scaleX: (index + 1) / total }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
                style={{ willChange: 'transform' }}
              />
            </div>
            <span className="font-mono text-[10px] tracking-[0.15em] text-[#87929b]/70">
              ← → / SPACE TO NAVIGATE
            </span>
          </div>

          <NeonButton variant="secondary" onClick={() => go(1)} disabled={index === total - 1}>
            Next ›
          </NeonButton>
        </div>
      </div>

      {/* ── Unrolled print stack (print only) ────────────────
          `hidden` on screen + `display:flex !important` under @media print
          (see PRINT_CSS .print-stack). Renders every slide once, in order,
          bypassing the AnimatePresence single-slide rendering. */}
      <div
        className="print-stack hidden"
        aria-hidden="true"
      >
        {slides.map((s) => (
          <section key={s.id} className="print-slide">
            <SlideView slide={s} />
          </section>
        ))}
      </div>
    </>
  );
}
