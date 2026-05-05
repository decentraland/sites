import { SvgIcon } from 'decentraland-ui2'

function EmptyEventsIcon() {
  return (
    <SvgIcon sx={{ width: '100px', height: '100px', fill: 'none' }} viewBox="0 0 100 100">
      <path
        d="M37.2773 18.9824V31.2046M61.7218 18.9824V31.2046"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="22.333"
        y="25.9824"
        width="55"
        height="55"
        rx="10"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M22 43.4268H77" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </SvgIcon>
  )
}

export { EmptyEventsIcon }
