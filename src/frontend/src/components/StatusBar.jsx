// ============================================================
// StatusBar — Dev-Cosmic Fixed Footer / Status Strip
// Extracted from stitch_terminal_hardware_store Stitch export
// ============================================================

export default function StatusBar() {
  return (
    <footer
      id="statusbar"
      role="contentinfo"
      className="fixed bottom-0 left-0 w-full h-unit-6 bg-background border-t border-outline-variant
                 z-50 flex items-center justify-between px-margin"
    >
      <span className="statusbar__label">[ STATUS: STORE_ONLINE ]</span>

      <div className="flex gap-unit-6">
        <span className="statusbar__link">SHIPPING: GLOBAL_PRIORITY</span>
        <span className="statusbar__label hidden sm:block">v2.0.4-STABLE</span>
      </div>
    </footer>
  );
}
