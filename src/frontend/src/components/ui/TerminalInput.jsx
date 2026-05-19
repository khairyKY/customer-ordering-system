// ============================================================
// TerminalInput — Dev-Cosmic CLI-Style Text / Number Input
// Dev-Cosmic Design System · 2026-05-17
//
// Extracted from .terminal-input-wrapper / .terminal-input /
// .terminal-input-prefix CSS in the stitch_terminal_hardware_store
// Stitch export.
//
// Visual anatomy:
//   [ prefix ] [ input field ─────────── ]
//   e.g. ">_  ENTER_PROMO_CODE"
//
// Focus behaviour:
//   - Border transitions from #242424 → #00BFFF (primary-container)
//   - Subtle box-shadow glow on focus-within (defined in index.css)
//
// Used in:
//   - Promo code entry (Cart page)
//   - Quantity selector (Cart table)
//   - Inventory search (Storefront / Components pages)
//   - QTY input on Product Detail page
// ============================================================

/**
 * @param {object}   props
 * @param {string}   [props.prefix='>_']     - Terminal prefix glyph
 * @param {string}   [props.placeholder='']
 * @param {string}   [props.value]
 * @param {function} [props.onChange]
 * @param {'text'|'number'|'search'|'email'} [props.type='text']
 * @param {string}   [props.id]
 * @param {string}   [props.name]
 * @param {string}   [props.ariaLabel]
 * @param {number}   [props.min]             - For type="number"
 * @param {number}   [props.max]             - For type="number"
 * @param {boolean}  [props.disabled]
 * @param {boolean}  [props.readOnly]
 * @param {string}   [props.className]       - Extra classes on the wrapper
 * @param {string}   [props.inputClassName]  - Extra classes on the <input>
 * @param {'left'|'right'} [props.textAlign] - Input text alignment (default "left")
 */
export default function TerminalInput({
  prefix        = '>_',
  placeholder   = '',
  value,
  onChange,
  type          = 'text',
  id,
  name,
  ariaLabel,
  min,
  max,
  disabled      = false,
  readOnly      = false,
  className     = '',
  inputClassName = '',
  textAlign     = 'left',
  // Forward passthrough attributes (e.g. data-testid, autoComplete) onto
  // the underlying <input> — additive, so storefront usages are unaffected.
  ...rest
}) {
  return (
    <div className={`terminal-input-wrapper ${className}`}>
      {/* Prefix glyph — always visible, never interactive */}
      {prefix && (
        <span className="terminal-input-prefix" aria-hidden="true">
          {prefix}
        </span>
      )}

      <input
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        readOnly={readOnly}
        min={min}
        max={max}
        aria-label={ariaLabel ?? placeholder ?? undefined}
        className={[
          'terminal-input',
          textAlign === 'right' ? 'text-right' : 'text-left',
          inputClassName,
        ]
          .filter(Boolean)
          .join(' ')}
        {...rest}
      />
    </div>
  );
}
