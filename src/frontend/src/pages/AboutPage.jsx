// ============================================================
// AboutPage — Dev-Cosmic /about (Zone 1, public)
// pc-parts.store  |  CSE323 Customer Ordering System
//
// Spec source: stitch_terminal_hardware_store/frontend_update.txt
//   "About Us" page (line ~591)  +  duplicate in all_of_the_frontend.txt
//   (line ~5172).
//
// Layout: centered card (max-w-720px) on the global CosmicCanvas
// starfield — uses the standard global TopNavBar + StatusBar (no
// chrome suppression needed).
// ============================================================

export default function AboutPage() {
  return (
    <main
      data-testid="about-page"
      className="flex-grow flex justify-center items-start py-unit-12 px-gutter"
    >
      <article
        className="w-full max-w-[720px] bg-surface-dim/80 backdrop-blur-sm
                   border border-outline-variant p-unit-8"
      >
        {/* ── Header ────────────────────────────────────────── */}
        <header className="mb-unit-8 border-b border-outline-variant pb-unit-4">
          <h1 className="font-inter font-bold text-[36px] text-on-surface leading-tight">
            About Us
          </h1>
          <p className="font-mono text-code-snippet text-primary-container mt-unit-2">
            // SYSTEM_INFO: ENTHUSIAST_HARDWARE_PROVIDER
          </p>
        </header>

        {/* ── Body copy ─────────────────────────────────────── */}
        <div className="space-y-unit-6 font-inter text-[15px] text-text-muted leading-loose">
          <p>
            We built this platform for the builders. The over-clockers, the
            water-coolers, the benchmark-chasers. We strip away the marketing
            fluff and deliver raw specs, precise compatibility checks, and the
            high-performance components you need to build machines that
            compile code faster and render frames quicker.
          </p>
          <p>
            Our inventory is curated by engineers, for engineers. We don&apos;t
            just sell parts; we provide the architecture for your next
            workstation or gaming rig. Everything is categorized, documented,
            and ready for integration into your system pipeline.
          </p>
        </div>

        {/* ── Footer signature ─────────────────────────────── */}
        <div className="mt-unit-8 pt-unit-4 border-t border-outline-variant
                        font-mono text-code-snippet text-on-surface-variant
                        flex flex-wrap gap-x-4 gap-y-1">
          <span>// EST: 2026</span>
          <span>// LOC: Cairo, EG</span>
          <span>// STATUS: <span className="text-tertiary-container">OPERATIONAL</span></span>
        </div>
      </article>
    </main>
  );
}
