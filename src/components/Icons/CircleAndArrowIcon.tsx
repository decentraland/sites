import { memo, useId } from 'react'

type CircleAndArrowIconProps = React.SVGAttributes<SVGElement> & {
  isOpen: boolean
}

const CircleAndArrowIcon = memo(function CircleAndArrowIcon({ isOpen, ...props }: CircleAndArrowIconProps) {
  const clipId = useId()
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle opacity={isOpen ? '1' : '0.2'} cx="36" cy="36" r="35" stroke="white" fill={isOpen ? 'white' : 'none'} strokeWidth="2" />
      <g clipPath={`url(#${clipId})`}>
        <path
          d="M45 33.0022L42.885 30.8872L36 37.7572L29.115 30.8872L27 33.0022L36 42.0022L45 33.0022Z"
          fill={isOpen ? '#242129' : 'white'}
        />
      </g>
      <defs>
        <clipPath id={clipId}>
          <rect width="36" height="36" fill="white" transform="translate(54 18) rotate(90)" />
        </clipPath>
      </defs>
    </svg>
  )
})

export { CircleAndArrowIcon }
