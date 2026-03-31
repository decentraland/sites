import { memo } from 'react'

type IconProps = React.SVGAttributes<SVGElement>

const DclLogo = memo(function DclLogo(props: IconProps) {
  return (
    <svg viewBox="0 0 90 90" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M45 89.9999C69.8528 89.9999 89.9999 69.8528 89.9999 45C89.9999 20.1472 69.8528 0 45 0C20.1472 0 0 20.1472 0 45C0 69.8528 20.1472 89.9999 45 89.9999Z"
        fill="url(#dcl0)"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M18 80.9996C25.515 86.6471 34.875 89.9996 45 89.9996C55.125 89.9996 64.485 86.6471 72 80.9996H18Z"
        fill="#FF2D55"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9 71.9996C11.565 75.397 14.603 78.435 18 80.9996H72C75.398 78.435 78.435 75.397 81 71.9996H9Z"
        fill="#FFA25A"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M60.368 62.9997H3.758C5.153 66.2172 6.93 69.2322 9 71.9997H60.39V62.9997H60.368Z"
        fill="#FFC95B"
      />
      <path fillRule="evenodd" clipRule="evenodd" d="M31.883 29.25V63H60.008L31.883 29.25Z" fill="url(#dcl1)" />
      <path fillRule="evenodd" clipRule="evenodd" d="M3.758 63H31.883V29.25L3.758 63Z" fill="white" />
      <path fillRule="evenodd" clipRule="evenodd" d="M60.368 47.25V72H81L60.368 47.25Z" fill="url(#dcl2)" />
      <path fillRule="evenodd" clipRule="evenodd" d="M39.757 72H60.367V47.25L39.757 72Z" fill="white" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M60.368 40.5C66.58 40.5 71.618 35.463 71.618 29.25C71.618 23.037 66.58 18 60.368 18C54.154 18 49.118 23.037 49.118 29.25C49.118 35.463 54.154 40.5 60.368 40.5Z"
        fill="#FFC95B"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M31.882 22.5C34.989 22.5 37.507 19.981 37.507 16.875C37.507 13.768 34.989 11.25 31.882 11.25C28.776 11.25 26.257 13.768 26.257 16.875C26.257 19.981 28.776 22.5 31.882 22.5Z"
        fill="#FFC95B"
      />
      <defs>
        <linearGradient id="dcl0" x1="45" y1="-18.64" x2="-18.64" y2="45" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FF2D55" />
          <stop offset="1" stopColor="#FFBC5B" />
        </linearGradient>
        <linearGradient id="dcl1" x1="31.873" y1="29.25" x2="31.873" y2="63" gradientUnits="userSpaceOnUse">
          <stop stopColor="#A524B3" />
          <stop offset="1" stopColor="#FF2D55" />
        </linearGradient>
        <linearGradient id="dcl2" x1="60.36" y1="47.25" x2="60.36" y2="72" gradientUnits="userSpaceOnUse">
          <stop stopColor="#A524B3" />
          <stop offset="1" stopColor="#FF2D55" />
        </linearGradient>
      </defs>
    </svg>
  )
})

const HamburgerIcon = memo(function HamburgerIcon(props: IconProps) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M3 6H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M3 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
})

const CloseIcon = memo(function CloseIcon(props: IconProps) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
})

const ChevronDownIcon = memo(function ChevronDownIcon(props: IconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
})

const ChevronUpIcon = memo(function ChevronUpIcon(props: IconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M15 12.5L10 7.5L5 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
})

const BellIcon = memo(function BellIcon(props: IconProps) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M12 21.75C13.1 21.75 14 20.85 14 19.75H10C10 20.85 10.89 21.75 12 21.75ZM18 15.75V10.75C18 7.68 16.36 5.11 13.5 4.43V3.75C13.5 2.92 12.83 2.25 12 2.25C11.17 2.25 10.5 2.92 10.5 3.75V4.43C7.63 5.11 6 7.67 6 10.75V15.75L4 17.75V18.75H20V17.75L18 15.75Z"
        fill="#FCFCFC"
      />
    </svg>
  )
})

const ExternalLinkIcon = memo(function ExternalLinkIcon(props: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M12 8.66667V12.6667C12 13.0203 11.8595 13.3594 11.6095 13.6095C11.3594 13.8595 11.0203 14 10.6667 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V5.33333C2 4.97971 2.14048 4.64057 2.39052 4.39052C2.64057 4.14048 2.97971 4 3.33333 4H7.33333"
        stroke="currentColor"
        strokeWidth="1.33"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M10 2H14V6" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.66699 9.33333L14.0003 2" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
})

const LogoutIcon = memo(function LogoutIcon(props: IconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M7.5 17.5H4.16667C3.72464 17.5 3.30072 17.3244 2.98816 17.0118C2.67559 16.6993 2.5 16.2754 2.5 15.8333V4.16667C2.5 3.72464 2.67559 3.30072 2.98816 2.98816C3.30072 2.67559 3.72464 2.5 4.16667 2.5H7.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.333 14.1667L17.4997 10.0001L13.333 5.83337"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M17.5 10H7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
})

const JumpInIcon = memo(function JumpInIcon(props: IconProps) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect x="0.75" y="0.75" width="22.5" height="22.5" rx="5.25" stroke="#FCFCFC" strokeOpacity="0.3" strokeWidth="1.5" />
      <path
        d="M18.7111 11.065L14.034 6.39027C13.2002 5.55695 11.7971 6.14637 11.7971 7.32523V8.86994C11.7564 8.86994 11.7361 8.86994 11.6954 8.86994H7.25895C6.50654 8.86994 5.89648 9.45936 5.89648 10.2114V13.7683C5.89648 14.5203 6.50654 15.1301 7.25895 15.1301H11.6751C11.7158 15.1301 11.7361 15.1301 11.7768 15.1301V16.6748C11.7768 17.8536 13.2002 18.4431 14.0137 17.6097L18.6908 12.935C19.2195 12.4065 19.2195 11.5732 18.7111 11.065Z"
        fill="#FCFCFC"
      />
    </svg>
  )
})

const CopyIcon = memo(function CopyIcon(props: IconProps) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1" />
      <path
        d="M8.5 3.5V2C8.5 1.17157 7.82843 0.5 7 0.5H2C1.17157 0.5 0.5 1.17157 0.5 2V7C0.5 7.82843 1.17157 8.5 2 8.5H3.5"
        stroke="currentColor"
        strokeWidth="1"
      />
    </svg>
  )
})

export { BellIcon, ChevronDownIcon, ChevronUpIcon, CloseIcon, CopyIcon, DclLogo, ExternalLinkIcon, HamburgerIcon, JumpInIcon, LogoutIcon }
