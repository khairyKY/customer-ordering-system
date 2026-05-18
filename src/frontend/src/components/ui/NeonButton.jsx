// ============================================================
// NeonButton — Dev-Cosmic Terminal-Style Button
// ============================================================

const VARIANT_CLASSES = {
  primary:     'btn-neon-primary',
  secondary:   'btn-neon-secondary',
  destructive: 'btn-neon-destructive',
};

export default function NeonButton({
  variant   = 'primary',
  className = '',
  fullWidth = false,
  disabled  = false,
  type      = 'button',
  onClick,
  children,
  ...rest
}) {
  const base = VARIANT_CLASSES[variant] || VARIANT_CLASSES.primary;

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={[base, fullWidth ? 'w-full' : '', className].filter(Boolean).join(' ')}
      {...rest}
    >
      {children}
    </button>
  );
}
