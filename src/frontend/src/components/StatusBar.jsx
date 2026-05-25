// ============================================================
// StatusBar — Dev-Cosmic Fixed Footer / Status Strip
// pc-parts.store  |  CSE323 Customer Ordering System
//
// Spec source: stitch_terminal_hardware_store/frontend_update.txt
//   Repeated footer across Admin Dashboard, Catalog Management,
//   User Dashboard and "Build Your Next Rig":
//     v2.4.0-stable // SYSTEM_STATUS: ONLINE
//                            GITHUB / SPEC_SHEETS / WARRANTY / SUPPORT
//
// The 4 right-side links are placeholders until a real /docs +
// support routing tree exists. They render as anchors so a future
// wiring pass can swap each `href="#"` for the real destination
// without touching the JSX shape.
// ============================================================

const STATUS_LINKS = [
  { label: 'GITHUB',      href: 'https://github.com/' },
  { label: 'SPEC_SHEETS', href: '#' },
  { label: 'WARRANTY',    href: '#' },
  { label: 'SUPPORT',     href: '/tickets/new' },
];

export default function StatusBar() {
  return (
    <footer
      id="statusbar"
      role="contentinfo"
      className="fixed bottom-0 left-0 w-full h-unit-6 bg-surface-container-lowest
                 border-t border-outline-variant z-50
                 flex items-center justify-between px-margin"
    >
      <span className="statusbar__label">
        v2.4.0-stable // SYSTEM_STATUS: ONLINE
      </span>

      <div className="hidden sm:flex gap-unit-4">
        {STATUS_LINKS.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target={link.href.startsWith('http') ? '_blank' : undefined}
            rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
            className="statusbar__link"
          >
            {link.label}
          </a>
        ))}
      </div>
    </footer>
  );
}
