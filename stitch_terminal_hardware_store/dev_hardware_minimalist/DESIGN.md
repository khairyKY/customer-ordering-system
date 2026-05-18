---
name: Dev-Hardware Minimalist
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#bcc8d1'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#87929b'
  outline-variant: '#3d4850'
  surface-tint: '#7ad0ff'
  primary: '#8fd6ff'
  on-primary: '#003549'
  primary-container: '#00bfff'
  on-primary-container: '#004a65'
  inverse-primary: '#00668a'
  secondary: '#d2bbff'
  on-secondary: '#3f008e'
  secondary-container: '#6001d1'
  on-secondary-container: '#c9aeff'
  tertiary: '#53e97d'
  on-tertiary: '#003915'
  tertiary-container: '#2ecc64'
  on-tertiary-container: '#005020'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#c3e8ff'
  primary-fixed-dim: '#7ad0ff'
  on-primary-fixed: '#001e2c'
  on-primary-fixed-variant: '#004c69'
  secondary-fixed: '#eaddff'
  secondary-fixed-dim: '#d2bbff'
  on-secondary-fixed: '#25005a'
  on-secondary-fixed-variant: '#5a00c6'
  tertiary-fixed: '#6bff8f'
  tertiary-fixed-dim: '#4ae176'
  on-tertiary-fixed: '#002109'
  on-tertiary-fixed-variant: '#005321'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  headline-lg:
    fontFamily: JetBrains Mono
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: JetBrains Mono
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-sm:
    fontFamily: JetBrains Mono
    fontSize: 18px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: JetBrains Mono
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.0'
  code-snippet:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: '1.5'
spacing:
  base: 4px
  unit-1: 4px
  unit-2: 8px
  unit-4: 16px
  unit-6: 24px
  unit-8: 32px
  unit-12: 48px
  gutter: 16px
  margin: 24px
---

## Brand & Style
This design system is built for the high-performance PC hardware enthusiast through the lens of a developer's workspace. The aesthetic is strictly functional, drawing inspiration from high-end code editors (VS Code) and terminal interfaces. It prioritizes clarity, performance, and information density over visual fluff.

The emotional response should be one of precision and reliability. By utilizing a "Flat-Tech" approach, we strip away all unnecessary skeuomorphism, shadows, and blurs, leaving a raw, digital-first environment where hardware specs and compatibility take center stage.

## Colors
The palette is rooted in a "soft near-black" ecosystem to reduce eye strain during long research sessions. 

- **Primary Action:** Dodger Blue (#00BFFF) is used for critical paths and active states.
- **System States:** Success (Green), Warning (Amber), and Destructive (Red) follow standard CLI color conventions.
- **Hierarchy:** Surfaces are distinguished solely through hex value shifts and 1px borders rather than elevation or shadows. 
- **The CosmicCanvas:** The global background should feature a subtle, low-contrast starfield drift using 1x1 and 2x2 pixel blocks in #222222 and #555555.

## Typography
We utilize a strict monospaced stack led by **JetBrains Mono**. This reinforces the "hardware manifest" feel and ensures that technical specifications (like clock speeds or dimensions) align perfectly in vertical columns.

- **Weight Usage:** Use Bold (700) sparingly for primary headings. Regular (400) should be the default for all UI labels to maintain the "terminal" look.
- **Caps:** Labels and button text should frequently use uppercase to mimic command-line prompts.
- **Scale:** On mobile devices, `headline-lg` should scale down to 24px to prevent excessive line wrapping.

## Layout & Spacing
The layout follows a rigorous 4px grid system. Every margin, padding, and gap must be a multiple of this base unit.

- **Grid Model:** 12-column fluid grid for desktop with 16px gutters.
- **Alignment:** Elements should align to the hard edges of the grid. Do not use centered layouts for content; stick to left-aligned "block" structures reminiscent of a code editor's file tree.
- **Mobile:** Reflow to a single column with 16px side margins. Padding inside cards should reduce from 24px to 16px.

## Elevation & Depth
This design system uses **zero shadows**. Depth is communicated exclusively through:
1.  **Z-Index Stacking:** Modals or tooltips sit directly on top of content with a 1px solid primary border.
2.  **Tonal Differentiation:** Background (#0D0D0D) vs. Surface (#111111).
3.  **Active Borders:** An element gains depth visually when its border color changes from #222222 to #00BFFF.
4.  **No Blurs:** Backgrounds behind overlays should be a solid 80% black tint, never blurred.

## Shapes
The shape language is strictly orthogonal. 
- **Corner Radius:** 0px across all elements (buttons, cards, inputs, dropdowns).
- **Borders:** Constant 1px thickness. 
- **Indicators:** Use square pips for checkboxes and square markers for radio buttons to maintain geometric consistency.

## Components

### NeonButton
Ghost-style by default.
- **Structure:** 1px border, transparent background, uppercase text wrapped in brackets, e.g., `[ ADD TO CART ]`.
- **Variants:**
    - **Primary:** #00BFFF border and text. Hover: Solid #00BFFF background, #0D0D0D text.
    - **Secondary:** #222222 border, #999999 text. Hover: Solid #E0E0E0 background, #0D0D0D text.
    - **Destructive:** #EF4444 border and text. Hover: Solid #EF4444 background, #0D0D0D text.
- **Interaction:** No transition timing; hover states should be instantaneous (0ms) to feel like a snappy CLI.

### TerminalInput
- **Structure:** #0D0D0D background, 1px #222222 border. 
- **Prefix:** A non-editable `>_` character in #22C55E (Success Green) sits at the start of the input.
- **Focus:** Border changes to #7C3AED (Violet).

### CmdCard
- **Structure:** 1px #222222 border, #111111 background.
- **Image Area:** Top-aligned, 1px bottom border separating image from text content.
- **Metadata:** Category tags should look like code comments: `// GPU`.
- **Stock Indicator:** Simple square icon: Green (#22C55E) for 'IN_STOCK', Amber (#F59E0B) for 'LOW_STOCK'.

### List Items
- Use a "diff" style for selected items: a '+' or '>' prefix in the primary color to indicate the active line.