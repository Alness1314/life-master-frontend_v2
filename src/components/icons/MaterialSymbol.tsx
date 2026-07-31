import type { CSSProperties, HTMLAttributes } from 'react'

interface MaterialSymbolProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  name: string
  size?: number | string
  weight?: number
}

export function MaterialSymbol({
  name,
  size = 24,
  weight = 400,
  className = '',
  style,
  ...props
}: MaterialSymbolProps) {
  const iconStyle: CSSProperties = {
    direction: 'ltr',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: size,
    fontStyle: 'normal',
    fontVariationSettings: `'FILL' 1, 'wght' ${weight}, 'GRAD' 0, 'opsz' 24`,
    letterSpacing: 'normal',
    lineHeight: 1,
    textTransform: 'none',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    wordWrap: 'normal',
    WebkitFontFeatureSettings: 'liga',
    WebkitFontSmoothing: 'antialiased',
    ...style,
  }

  return (
    <span
      aria-hidden="true"
      className={`material-symbols-outlined ${className}`.trim()}
      style={iconStyle}
      {...props}
    >
      {name}
    </span>
  )
}
