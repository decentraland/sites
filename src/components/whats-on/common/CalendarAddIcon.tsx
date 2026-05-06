type CalendarAddIconProps = {
  size?: number
  style?: React.CSSProperties
  className?: string
}

function CalendarAddIcon({ size = 18, style, className }: CalendarAddIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 25 25"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: size, height: size, flexShrink: 0, ...style }}
      className={className}
    >
      <path
        d="M8.286 1.865v3.976M16.237 1.865v3.976"
        stroke="currentColor"
        strokeWidth="1.036"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="3.425" y="4.142" width="17.889" height="17.889" rx="3.667" stroke="currentColor" strokeWidth="2.073" />
      <path d="M3.316 8.872h17.89" stroke="currentColor" strokeWidth="1.036" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15.546 15.035h-2.665v2.665h-.888v-2.665H9.328v-.888h2.665v-2.665h.888v2.665h2.665v.888Z" fill="currentColor" />
    </svg>
  )
}

export { CalendarAddIcon }
