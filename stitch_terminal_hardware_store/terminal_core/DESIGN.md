---
name: Terminal Core
colors:
  surface: '#0e1418'
  surface-dim: '#0e1418'
  surface-bright: '#343a3e'
  surface-container-lowest: '#090f13'
  surface-container-low: '#161c20'
  surface-container: '#1a2024'
  surface-container-high: '#252b2f'
  surface-container-highest: '#30363a'
  on-surface: '#dee3e8'
  on-surface-variant: '#bcc8d1'
  inverse-surface: '#dee3e8'
  inverse-on-surface: '#2b3135'
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
  tertiary: '#ffc184'
  on-tertiary: '#492900'
  tertiary-container: '#fb9c24'
  on-tertiary-container: '#653a00'
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
  tertiary-fixed: '#ffdcbd'
  tertiary-fixed-dim: '#ffb86e'
  on-tertiary-fixed: '#2c1600'
  on-tertiary-fixed-variant: '#693c00'
  background: '#0e1418'
  on-background: '#dee3e8'
  surface-variant: '#30363a'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  data-lg:
    fontFamily: JetBrains Mono
    fontSize: 20px
    fontWeight: '500'
    lineHeight: '1.4'
  data-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.4'
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: 0.05em
spacing:
  max_width: 1280px
  sidebar_width: 260px
  section_padding_v: 48px
  grid_gap: 20px
  container_margin: auto
---

## Brand & Style

The design system is engineered for the "Modern Developer" aesthetic—a high-performance, technical environment tailored for PC enthusiasts and hardware architects. It draws heavily from **Brutalist Minimalism**, characterized by raw edges, high-contrast borders, and a focus on data density over decorative flourishes. 

The emotional response should be one of "Precision Performance." It feels like a high-end BIOS or a sophisticated IDE. To elevate the technical atmosphere, the UI sits atop a "Cosmic Canvas": a fixed background starfield (#0D0D0D) featuring two layers of sharp pixel stars (#777777 and #AAAAAA) that drift subtly downward and rightward, suggesting a vast, high-speed digital universe.

## Colors

The palette is rooted in a deep, nocturnal base. Backgrounds are pure black-adjacent to ensure hardware specs and accent colors "pop" with neon-like intensity. 

- **Primary & Secondary:** Used for high-priority actions (Accent Blue) and focus states (Focus Purple).
- **Accents:** Green, Amber, and Destructive Red are reserved for functional status indicators (e.g., In Stock, Low Stock, Error).
- **Interactive States:** Surfaces transition from `#131313` to `#1A1A1A` on hover to provide tactile feedback without relying on lighting effects.

## Typography

This design system utilizes a dual-font strategy to separate narrative from data.

1.  **Inter (Sans-Serif):** Used for the structural UI—headings, navigation, and descriptions. It provides a clean, neutral foundation that ensures legibility.
2.  **JetBrains Mono (Monospace):** Used for all quantitative data, pricing, technical specifications, button labels, and input fields. This font choice signals a "developer-first" environment and treats hardware specs like blocks of code.

Headlines should use tight letter spacing for a compact, aggressive look. Data labels should remain monospaced for perfect vertical alignment in tables and spec lists.

## Layout & Spacing

The layout is structured and rigid. Content is housed within a **fixed-width container of 1280px**, centered on the screen. 

- **The Sidebar:** A persistent 260px left-hand column handles category filtering and navigation, mimicking the structure of a documentation site or code editor.
- **The Grid:** A 12-column system with a fixed 20px gap. Components align strictly to this grid.
- **Vertical Rhythm:** Sections are clearly demarcated by 48px of vertical padding, creating a rhythmic "breathing room" between dense data sets.
- **Alignment:** Use flush-left alignment for all text blocks to maintain the mechanical, technical feel.

## Elevation & Depth

This design system intentionally avoids shadows, blurs, and glassmorphism. Depth is achieved entirely through **Tonal Layering** and **High-Contrast Outlines**.

1.  **Level 0 (Base):** The Background (#0D0D0D) with the starfield.
2.  **Level 1 (Surface):** Cards and containers use `#131313`.
3.  **Level 2 (Interaction):** Hover states shift the background to `#1A1A1A`.

Hierarchical depth is communicated via the `#242424` border. When an element is active or focused, the border color switches to the Primary Blue or Focus Purple, creating a "glow-less" highlight that feels sharp and immediate.

## Shapes

The shape language is strictly **Sharp**. A border-radius of `0` is applied universally to all elements—buttons, cards, inputs, and dropdowns. This reinforces the Brutalist, industrial nature of PC hardware and differentiates the design system from softer, consumer-grade interfaces.

## Components

### Buttons
- **Style:** 1px solid border, sharp corners.
- **Typography:** JetBrains Mono, Uppercase.
- **States:** Default uses Border Default. Hover uses Primary Blue background with black text.

### Cards (Product/Parts)
- **Background:** #131313.
- **Border:** 1px solid #242424.
- **Hover:** Border shifts to #00BFFF. No scaling or lifting.

### Input Fields
- **Background:** #0D0D0D (Inset look).
- **Typography:** JetBrains Mono.
- **Focus:** 1px solid #7C3AED.

### Data Chips / Specs
- Small, rectangular blocks with a `#242424` background.
- Use JetBrains Mono for the value and Inter (all-caps) for the property label (e.g., `VRAM: 16GB`).

### Checkboxes & Radios
- Sharp squares (checkboxes) or sharp diamonds (radios).
- Primary Blue fill when selected.

### Tables (Hardware Specs)
- Horizontal lines only (#242424).
- Alternating row highlights on hover (#1A1A1A).
- Header text in Inter (All-caps, bold).