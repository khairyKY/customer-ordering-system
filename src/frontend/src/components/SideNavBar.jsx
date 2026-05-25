// ============================================================
// SideNavBar — Dev-Cosmic Vertical Navigation (Zone 3 + Zone 4)
// pc-parts.store  |  CSE323 Customer Ordering System
//
// Shared SideNavBar used by:
//   - AccountDashboard      (accent="cyan",  width=w-[220px])
//   - AdminDashboard        (accent="amber", width=w-64)
//   - CatalogManagement     (accent="amber", width=w-64)
//
// Spec source: stitch_terminal_hardware_store/frontend_update.txt
//   - Catalog Management  (line 174)
//   - User Dashboard      (line 460)
//   - Admin Dashboard     (line 1525)
//
// Layout: desktop-only (hidden md:flex), sticky top-0, vertical
// flex column. Active item gets `border-l-2 border-{accent}` +
// `bg-surface-container-highest` + accent text color.
// ============================================================

import { NavLink } from 'react-router-dom';

/**
 * Accent variants — kept as discrete full class strings so the
 * Tailwind JIT scanner can detect them (it can't see template-
 * interpolated class names).
 */
const ACCENT_MAP = {
  cyan: {
    border:     'border-primary-container',
    text:       'text-primary-container',
    avatarText: 'text-primary-container',
  },
  amber: {
    border:     'border-accent-amber',
    text:       'text-accent-amber',
    avatarText: 'text-accent-amber',
  },
};

/**
 * @typedef {object} NavItem
 * @property {string}  to       - react-router path
 * @property {string}  icon     - Material Symbols Outlined name (e.g. "dashboard")
 * @property {string}  label    - UPPERCASE display label
 * @property {boolean} [end]    - NavLink `end` flag (exact-match the index route)
 *
 * @param {object}     props
 * @param {NavItem[]}  props.items         - Nav links to render
 * @param {'cyan'|'amber'} [props.accent]  - Active-state accent color (default 'cyan')
 * @param {string}     [props.width]       - Tailwind width class (default 'w-64')
 * @param {string}     [props.sessionLabel]- Header label above session (default 'USER_SESSION')
 * @param {string}     [props.sessionSub]  - Sub-line under header (e.g. 'dev_admin_01')
 * @param {string}     [props.avatar]      - Optional 2-letter initials chip
 * @param {string}     [props.testId]      - data-testid for the <aside>
 */
export default function SideNavBar({
  items,
  accent       = 'cyan',
  width        = 'w-64',
  sessionLabel = 'USER_SESSION',
  sessionSub,
  avatar,
  testId       = 'side-nav',
}) {
  const a = ACCENT_MAP[accent] ?? ACCENT_MAP.cyan;

  // Base classes shared by every nav row
  const linkBase =
    'flex items-center gap-2 px-4 py-2 font-mono text-label-md uppercase ' +
    'transition-none';

  // Inactive: muted text, fills surface-container on hover
  const linkIdle =
    `${linkBase} text-on-surface-variant hover:bg-surface-container hover:text-on-surface`;

  // Active: accent text + filled bg + 2px accent left border (overrides
  // the 0-radius global so the bar reads as a tab indicator)
  const linkActive =
    `${linkBase} ${a.text} bg-surface-container-highest border-l-2 ${a.border}`;

  return (
    <aside
      data-testid={testId}
      className={[
        'hidden md:flex flex-col',
        width,
        'h-screen sticky top-0 z-10 flex-shrink-0',
        'bg-surface-container-low border-r border-outline-variant',
        'py-unit-4',
      ].join(' ')}
      aria-label="Side navigation"
    >
      {/* ── Session header ─────────────────────────────────── */}
      <div className="px-4 mb-unit-8">
        {avatar ? (
          // Avatar variant (User Dashboard pattern)
          <div className="flex items-center gap-unit-4 mb-unit-2">
            <div
              className={[
                'w-unit-12 h-unit-12 flex items-center justify-center',
                'bg-surface-container-highest border border-outline-variant',
                'font-mono text-headline-md font-bold',
                a.avatarText,
              ].join(' ')}
              aria-hidden="true"
            >
              {avatar}
            </div>
            <div>
              <div className="font-mono text-label-md text-on-surface uppercase">
                {sessionLabel}
              </div>
              {sessionSub && (
                <div className="font-mono text-code-snippet text-on-surface-variant">
                  {sessionSub}
                </div>
              )}
            </div>
          </div>
        ) : (
          // Compact variant (Catalog Management / Admin Dashboard pattern)
          <>
            <h1 className={`font-mono text-headline-sm ${a.text}`}>
              {sessionLabel}
            </h1>
            {sessionSub && (
              <p className="font-mono text-code-snippet text-on-surface-variant mt-1">
                {sessionSub}
              </p>
            )}
          </>
        )}
      </div>

      {/* ── Nav rail ───────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto flex flex-col gap-1" aria-label="Sidebar navigation">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => (isActive ? linkActive : linkIdle)}
            data-testid={`side-nav-${item.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              {item.icon}
            </span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
