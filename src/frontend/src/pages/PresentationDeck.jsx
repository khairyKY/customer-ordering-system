import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { slides } from './presentationSlides';
import CosmicCanvas from '../components/CosmicCanvas';
import NeonButton from '../components/ui/NeonButton';

// 1. Isolate Canvas to prevent re-renders
const Background = memo(() => (
  <CosmicCanvas variant="canvas" className="opacity-80" />
));

const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 500 : -500, // Reduced distance for smoother feel
    opacity: 0,
    scale: 0.98,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: {
      x: { type: 'spring', stiffness: 300, damping: 30 },
      opacity: { duration: 0.25 },
      scale: { duration: 0.3 }
    }
  },
  exit: (direction) => ({
    x: direction < 0 ? 500 : -500,
    opacity: 0,
    scale: 0.98,
    transition: {
      x: { type: 'spring', stiffness: 300, damping: 30 },
      opacity: { duration: 0.2 },
      scale: { duration: 0.2 }
    }
  }),
};

export default function PresentationDeck() {
  const [[page, direction], setPage] = useState([0, 0]);
  const lastNavTime = useRef(0);
  const NAV_COOLDOWN = 250; // 250ms throttling

  const slideIndex = Math.max(0, Math.min(page, slides.length - 1));
  const currentSlide = slides[slideIndex];

  const paginate = useCallback((newDirection) => {
    const now = Date.now();
    if (now - lastNavTime.current < NAV_COOLDOWN) return;
    
    const nextIndex = page + newDirection;
    if (nextIndex >= 0 && nextIndex < slides.length) {
      lastNavTime.current = now;
      setPage([nextIndex, newDirection]);
    }
  }, [page]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        paginate(1);
      } else if (e.key === 'ArrowLeft') {
        paginate(-1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [paginate]);

  const renderContent = (slide) => {
    switch (slide.layout) {
      case 'title':
        return (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <h1 className="text-6xl font-bold mb-8 text-[#e5e2e1] drop-shadow-[0_0_20px_rgba(0,191,255,0.5)]">{slide.title}</h1>
            <h3 className="text-4xl text-[#00bfff] mb-12">{slide.subtitle}</h3>
            <div className="bg-surface-container-low/60 backdrop-blur-xl border border-outline-variant p-8 rounded-xl shadow-2xl">
              <p className="font-mono text-2xl text-primary-container mb-2">Team Dev-Cosmic</p>
              <p className="font-mono text-xl text-text-muted">{slide.meta}</p>
            </div>
          </div>
        );

      case 'two-col':
        return (
          <div className="flex flex-col h-full">
            <h2 className="text-5xl font-bold text-[#00bfff] mb-10 border-b-2 border-[#00bfff]/30 pb-4">{slide.title}</h2>
            <div className="flex gap-10 flex-1">
              <div className="flex-1 bg-surface-container-low/60 backdrop-blur-xl border border-outline-variant p-8 rounded-xl">
                <ul className="space-y-6">
                  {slide.left.map((item, i) => (
                    <li key={`left-${i}`} className="text-2xl text-text-muted leading-relaxed flex items-start">
                      <span className="text-[#00bfff] mr-4 mt-1">▶</span>
                      <span dangerouslySetInnerHTML={{ __html: item.replace(/HTTP 400 PROMPT_INJECTION_BLOCKED/g, '<span class="text-[#7C3AED] font-mono">HTTP 400 PROMPT_INJECTION_BLOCKED</span>') }} />
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex-1 bg-surface-container-low/60 backdrop-blur-xl border border-outline-variant p-8 rounded-xl">
                <ul className="space-y-6">
                  {slide.right.map((item, i) => (
                    <li key={`right-${i}`} className="text-2xl text-text-muted leading-relaxed flex items-start">
                      <span className="text-[#00bfff] mr-4 mt-1">▶</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        );

      case 'bullets':
        return (
          <div className="flex flex-col h-full">
            <h2 className="text-5xl font-bold text-[#00bfff] mb-10 border-b-2 border-[#00bfff]/30 pb-4">{slide.title}</h2>
            <div className="bg-surface-container-low/60 backdrop-blur-xl border border-outline-variant p-10 rounded-xl flex-1 flex items-center justify-center">
              <ul className="space-y-8 w-full max-w-4xl">
                {slide.bullets.map((b, i) => (
                  <li key={`bullet-${i}`} className="text-3xl text-text-muted leading-relaxed flex items-start">
                    <span className="text-[#00bfff] mr-4 mt-2">■</span>
                    <div>
                      {b.label && <strong className="text-[#00bfff] mr-2">{b.label}</strong>}
                      {b.text}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );

      case 'two-col-table':
        return (
          <div className="flex flex-col h-full">
            <h2 className="text-5xl font-bold text-[#00bfff] mb-8 border-b-2 border-[#00bfff]/30 pb-4">{slide.title}</h2>
            <div className="flex gap-8 flex-1">
              <div className="flex-1">
                <ul className="space-y-6">
                  {slide.bullets.map((b, i) => (
                    <li key={`bullet-table-${i}`} className="text-2xl text-text-muted leading-relaxed flex items-start">
                      <span className="text-[#00bfff] mr-4 mt-1">●</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <table className="w-full bg-surface-container-low/60 backdrop-blur-xl border border-outline-variant rounded-xl overflow-hidden">
                  <thead>
                    <tr>
                      {slide.table.headers.map((h, i) => (
                        <th key={`header-${i}`} className="bg-[#00bfff]/10 text-[#00bfff] font-mono text-xl uppercase p-4 text-left border-b border-white/10">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {slide.table.rows.map((row, i) => (
                      <tr key={`row-${i}`} className="border-b border-white/5 last:border-0">
                        {row.map((cell, j) => (
                          <td key={`cell-${i}-${j}`} className={`p-4 text-xl ${j === 0 ? 'font-mono text-primary-container' : 'text-text-muted'}`}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'three-cards':
        return (
          <div className="flex flex-col h-full">
            <h2 className="text-5xl font-bold text-[#00bfff] mb-10 border-b-2 border-[#00bfff]/30 pb-4">{slide.title}</h2>
            <div className="grid grid-cols-3 gap-8 flex-1">
              {slide.cards.map((card, i) => (
                <div key={`card-${i}`} className="bg-surface-container-low/60 backdrop-blur-xl border border-outline-variant p-8 rounded-xl flex flex-col">
                  <h3 className="text-3xl text-white border-b border-outline-variant pb-4 mb-6 flex items-center gap-3">
                    <span className="text-[#00bfff]">{"{ }"}</span> {card.heading}
                  </h3>
                  <ul className="space-y-4">
                    {card.items.map((item, j) => (
                      <li key={`card-item-${i}-${j}`} className="text-xl text-text-muted flex items-start">
                        <span className="text-[#00bfff] mr-3">▹</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        );

      case 'four-cards':
        return (
          <div className="flex flex-col h-full">
            <h2 className="text-5xl font-bold text-[#00bfff] mb-8 border-b-2 border-[#00bfff]/30 pb-4">{slide.title}</h2>
            <div className="grid grid-cols-4 gap-6 flex-1">
              {slide.cards.map((card, i) => (
                <div key={`card-4-${i}`} className="bg-surface-container-low/60 backdrop-blur-xl border-l-4 p-6 rounded-xl flex flex-col justify-center" style={{ borderLeftColor: card.color }}>
                  <h3 className="text-2xl font-bold text-white mb-4">{card.heading}</h3>
                  <p className="text-xl text-text-muted">{card.text}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 text-center bg-surface-container-low/30 p-4 rounded border border-outline-variant/30">
              <p className="text-xl text-text-muted">{slide.footer}</p>
            </div>
          </div>
        );

      case 'audit':
        return (
          <div className="flex flex-col h-full">
            <h2 className="text-5xl font-bold text-[#00bfff] mb-10 border-b-2 border-[#00bfff]/30 pb-4">{slide.title}</h2>
            <div className="bg-surface-container-low/60 backdrop-blur-xl border border-outline-variant p-10 rounded-xl flex-1 flex flex-col items-center justify-center">
              <p className="text-3xl text-text-muted mb-12 text-center">{slide.note}</p>
              <div className="flex flex-col gap-8 w-full max-w-4xl">
                {slide.transforms.map((t, i) => (
                  <div key={`transform-${i}`} className="flex items-center gap-8 bg-black/30 p-6 rounded-xl border-l-4 border-error">
                    <span className="text-3xl text-error w-40 text-center font-mono">{t.from}</span>
                    <span className="text-3xl text-text-muted">➔</span>
                    <span className="text-3xl text-accent-green font-mono font-bold">{t.to}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'table-only':
        return (
          <div className="flex flex-col h-full">
            <h2 className="text-5xl font-bold text-[#00bfff] mb-8 border-b-2 border-[#00bfff]/30 pb-4">{slide.title}</h2>
            <table className="w-full bg-surface-container-low/60 backdrop-blur-xl border border-outline-variant rounded-xl overflow-hidden mb-8">
              <thead>
                <tr>
                  {slide.table.headers.map((h, i) => (
                    <th key={`head-only-${i}`} className="bg-[#00bfff]/10 text-[#00bfff] font-mono text-2xl uppercase p-6 text-left border-b border-white/10">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {slide.table.rows.map((row, i) => (
                  <tr key={`row-only-${i}`} className="border-b border-white/5 last:border-0">
                    {row.map((cell, j) => (
                      <td key={`cell-only-${i}-${j}`} className={`p-6 text-2xl ${j === 1 ? 'font-mono text-primary-container' : j === 0 ? 'font-bold text-white' : 'text-text-muted'}`}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <ul className="space-y-4">
              {slide.bullets.map((b, i) => (
                <li key={`bullet-only-${i}`} className="text-2xl text-text-muted leading-relaxed flex items-center">
                  <span className="text-[#00bfff] mr-4">●</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        );

      case 'timeline':
        return (
          <div className="flex flex-col h-full">
            <h2 className="text-5xl font-bold text-[#00bfff] mb-10 border-b-2 border-[#00bfff]/30 pb-4">{slide.title}</h2>
            <div className="bg-surface-container-low/60 backdrop-blur-xl border border-outline-variant p-10 rounded-xl flex-1 flex items-center justify-center">
              <ul className="flex flex-col gap-8 w-full max-w-5xl">
                {slide.items.map((item, i) => (
                  <li key={`timeline-${i}`} className="flex items-center gap-6">
                    <div className="font-mono text-3xl font-bold text-[#00bfff] w-48 text-right">{item.sprint}</div>
                    <div className={`w-6 h-6 rounded-full ${item.highlight ? 'bg-accent-green shadow-[0_0_15px_#22C55E]' : 'bg-[#00bfff]'}`}></div>
                    <div className={`text-3xl flex-1 pl-4 ${item.highlight ? 'text-white font-bold' : 'text-text-muted'}`}>{item.text}</div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );

      case 'ai-workflow':
        return (
          <div className="flex flex-col h-full">
            <h2 className="text-5xl font-bold text-[#00bfff] mb-10 border-b-2 border-[#00bfff]/30 pb-4">{slide.title}</h2>
            <div className="bg-surface-container-low/60 backdrop-blur-xl border border-outline-variant p-10 rounded-xl flex-1 flex flex-col items-center justify-center">
              <div className="text-center mb-16">
                <h3 className="text-4xl text-[#00bfff] mb-4">{slide.heading}</h3>
                <p className="text-3xl text-white">{slide.subtitle}</p>
              </div>
              <div className="flex items-center justify-center gap-12 mb-12 w-full">
                <div className="bg-[#00bfff]/10 border border-[#00bfff] p-8 rounded-xl text-center flex-1 max-w-sm">
                  <p className="text-3xl font-bold text-white mb-2">{slide.left.role}</p>
                  <p className="text-2xl text-text-muted">{slide.left.action}</p>
                </div>
                <div className="text-5xl text-text-muted">⇆</div>
                <div className="bg-accent-green/10 border border-accent-green p-8 rounded-xl text-center flex-1 max-w-sm">
                  <p className="text-3xl font-bold text-white mb-2">{slide.right.role}</p>
                  <p className="text-2xl text-text-muted">{slide.right.action}</p>
                </div>
              </div>
              <p className="text-xl text-text-muted">* AI disclosure is present in code headers / appendix per the submission checklist.</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0D0D0D] overflow-hidden select-none font-inter">
      {/* 1. Memoized Dynamic Starfield Background */}
      <Background />

      {/* Slide Container */}
      <div className="absolute inset-0 flex items-center justify-center p-8">
        <div className="relative w-full max-w-[1400px] aspect-[16/9] overflow-hidden">
          {/* 2. Optimized AnimatePresence with GPU acceleration properties */}
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={currentSlide.id}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              style={{ willChange: "transform, opacity" }}
              className="absolute inset-0 bg-[#0D0D0D]/85 backdrop-blur-md border border-outline-variant/50 rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.3)] p-16"
            >
              {renderContent(currentSlide)}

              {/* Slide Footer */}
              <div className="absolute bottom-8 left-16 font-mono text-xl text-white/30 uppercase">
                DEV-COSMIC // {currentSlide.layout.replace(/-/g, '_').toUpperCase()}
              </div>

              {/* Slide Number */}
              <div className="absolute bottom-8 right-16 font-mono text-2xl text-white/30">
                {String(slideIndex + 1).padStart(2, '0')} / {slides.length}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation Controls (On-screen) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 z-50">
        <NeonButton 
          variant="secondary" 
          onClick={() => paginate(-1)} 
          disabled={slideIndex === 0}
          className="!px-4 !py-2 !text-lg"
        >
          [ PREV ]
        </NeonButton>
        <span className="font-mono text-white/50 text-sm">USE ARROWS OR SPACE</span>
        <NeonButton 
          variant="primary" 
          onClick={() => paginate(1)} 
          disabled={slideIndex === slides.length - 1}
          className="!px-4 !py-2 !text-lg"
        >
          [ NEXT ]
        </NeonButton>
      </div>
    </div>
  );
}
