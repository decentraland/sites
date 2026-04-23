import type { FC } from 'react'

interface LiveEventIconProps {
  width?: number
  height?: number
  color?: string
}

const LiveEventIcon: FC<LiveEventIconProps> = ({ width = 16, height = 12, color = '#FCFCFC' }) => {
  return (
    <svg width={width} height={height} viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="7.79575" cy="5.99967" r="1.90317" fill={color} />
      <path
        d="M10.4466 3.19928C11.1889 3.90207 11.6519 4.89681 11.6519 5.99969C11.6519 7.10257 11.1889 8.09731 10.4466 8.8001M5.14549 3.19928C4.40322 3.90207 3.94019 4.89681 3.94019 5.99969C3.94019 7.10257 4.40322 8.09731 5.14549 8.8001"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.3984 1C13.7468 2.24189 14.5916 4.02229 14.5916 6C14.5916 7.97771 13.7468 9.75811 12.3984 11M3.19325 1C1.84481 2.24189 1 4.02229 1 6C1 7.97771 1.84481 9.75811 3.19325 11"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export { LiveEventIcon }
