import * as React from 'react'
import { SvgIcon, SvgIconProps } from 'decentraland-ui2'

const VerifiedIcon = React.memo((props: SvgIconProps) => {
  return (
    <SvgIcon {...props}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M6.84062 1.68992C7.42197 1.10857 8.36454 1.10857 8.94589 1.68992L14.3105 7.05449C14.8918 7.63584 14.8918 8.5784 14.3105 9.15976L8.94589 14.5243C8.36454 15.1057 7.42197 15.1057 6.84062 14.5243L1.47606 9.15976C0.894701 8.57841 0.8947 7.63584 1.47605 7.05449L6.84062 1.68992Z"
          fill="url(#paint0_linear_2570_1584)"
        />
        <path
          d="M2.61117 4.31378C2.61117 3.49162 3.27766 2.82513 4.09982 2.82513H11.6865C12.5086 2.82513 13.1751 3.49162 13.1751 4.31378V11.9004C13.1751 12.7226 12.5086 13.3891 11.6865 13.3891H4.09983C3.27766 13.3891 2.61117 12.7226 2.61117 11.9004V4.31378Z"
          fill="url(#paint1_linear_2570_1584)"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M11.1814 5.89887C11.3699 6.10063 11.3592 6.41703 11.1574 6.60557L6.92609 10.5594C6.72455 10.7477 6.40859 10.7373 6.21995 10.5361L4.8618 9.08736C4.67293 8.8859 4.68314 8.56949 4.88459 8.38062C5.08605 8.19176 5.40247 8.20196 5.59133 8.40342L6.60808 9.48794L10.4747 5.87491C10.6765 5.68637 10.9929 5.6971 11.1814 5.89887Z"
          fill="#FCFCFC"
        />
        <defs>
          <linearGradient id="paint0_linear_2570_1584" x1="7.89326" y1="1.25391" x2="7.89326" y2="14.9603" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FF2D55" />
            <stop offset="1" stopColor="#C640CD" />
          </linearGradient>
          <linearGradient id="paint1_linear_2570_1584" x1="7.89326" y1="1.25391" x2="7.89326" y2="14.9603" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FF2D55" />
            <stop offset="1" stopColor="#C640CD" />
          </linearGradient>
        </defs>
      </svg>
    </SvgIcon>
  )
})

export { VerifiedIcon }
