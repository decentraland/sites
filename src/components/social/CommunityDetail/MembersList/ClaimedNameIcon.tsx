import { memo } from 'react'
import type { ClaimedNameIconProps } from './ClaimedNameIcon.types'

const ClaimedNameIcon = memo(function ClaimedNameIcon(props: ClaimedNameIconProps) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <defs>
        <linearGradient id="claimed-name-gradient" x1="8.90609" y1="2.91992" x2="8.90609" y2="15.2673" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FF2D55" />
          <stop offset="1" stopColor="#C640CD" />
        </linearGradient>
      </defs>
      <path
        d="M8.28711 3.17578C8.62869 2.83429 9.1827 2.83451 9.52441 3.17578L10.8203 4.47168H12.6523C13.1355 4.47168 13.5273 4.86351 13.5273 5.34668V7.17871L14.8232 8.47461C15.1649 8.81629 15.1649 9.3702 14.8232 9.71191L13.5273 11.0078V12.8398C13.5273 13.3231 13.1356 13.7148 12.6523 13.7148H10.8203L9.52441 15.0107C9.1827 15.3524 8.62879 15.3524 8.28711 15.0107L6.99121 13.7148H5.15918C4.67595 13.7148 4.28418 13.3231 4.28418 12.8398V11.0078L2.98828 9.71191C2.64701 9.3702 2.64679 8.81619 2.98828 8.47461L4.28418 7.17871V5.34668C4.28427 4.86352 4.676 4.4717 5.15918 4.47168H6.99121L8.28711 3.17578Z"
        fill="url(#claimed-name-gradient)"
      />
      <path
        d="M6.57324 9.65231L7.76162 10.9199L11.4641 7.4603"
        stroke="#FCFCFC"
        strokeWidth="1.59488"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
})

export { ClaimedNameIcon }
