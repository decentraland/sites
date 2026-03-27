import { memo } from 'react'

const StatusHealthyIcon = memo(function StatusHealthyIcon(props: { className?: string }) {
  return (
    <svg width="16" height="17" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg" className={props.className}>
      <circle cx="8" cy="8.5" r="8" fill="#34CE76" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11.913 5.04734C12.1879 5.31166 12.1965 5.7488 11.9322 6.0237L6.73377 11.43C6.42328 11.7529 5.90817 11.758 5.59142 11.4412L3.6267 9.47652C3.35704 9.20685 3.35704 8.76963 3.6267 8.49997C3.89637 8.2303 4.33359 8.2303 4.60326 8.49997L6.14897 10.0457L10.9367 5.06648C11.201 4.79158 11.6381 4.78301 11.913 5.04734Z"
        fill="white"
      />
    </svg>
  )
})

export { StatusHealthyIcon }
