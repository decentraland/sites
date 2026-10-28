import { memo } from 'react'
import type { WalletNetwork } from './manaContract'

type IconProps = React.SVGAttributes<SVGElement>

// Ethereum brand badge (blue circle + white ETH mark).
const EthereumBadge = memo(function EthereumBadge(props: IconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width="26" height="26" rx="13" fill="#627EEA" />
      <path
        fill="#FCFCFC"
        d="M13.0577 4.07854L7.64691 13.1687L13.0577 16.4152L18.4686 13.1687L13.0577 4.07854ZM7.64691 14.2509L13.0577 21.8261L18.4686 14.2509L13.0577 17.4974L7.64691 14.2509Z"
      />
    </svg>
  )
})

// Polygon brand badge (purple gradient circle + white Polygon mark) — polygonscan token-light asset.
const PolygonBadge = memo(function PolygonBadge(props: IconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 252 252" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <mask id="polygon-badge-mask" style={{ maskType: 'luminance' }} maskUnits="userSpaceOnUse" x="0" y="0" width="252" height="252">
        <path
          fill="white"
          d="M125.999 251.394C195.253 251.394 251.393 195.253 251.393 126C251.393 56.7468 195.253 0.606079 125.999 0.606079C56.7462 0.606079 0.605469 56.7468 0.605469 126C0.605469 195.253 56.7462 251.394 125.999 251.394Z"
        />
      </mask>
      <g mask="url(#polygon-badge-mask)">
        <path fill="url(#polygon-badge-gradient)" d="M263.267 -11.2672H-11.2676V263.267H263.267V-11.2672Z" />
      </g>
      <path
        fill="white"
        d="M162.264 153.059L197.741 132.574C199.62 131.489 200.782 129.471 200.782 127.301V86.3354C200.782 84.1696 199.615 82.1472 197.741 81.0618L162.264 60.5767C160.385 59.4912 158.056 59.4964 156.177 60.5767L120.7 81.0618C118.821 82.1472 117.659 84.1696 117.659 86.3354V159.546L92.781 173.908L67.9029 159.546V130.818L92.781 116.456L109.191 125.928V106.657L95.8222 98.9408C94.9006 98.4084 93.8459 98.1268 92.7758 98.1268C91.7058 98.1268 90.651 98.4084 89.7346 98.9408L54.2581 119.426C52.379 120.511 51.2168 122.529 51.2168 124.7V165.665C51.2168 167.83 52.3842 169.853 54.2581 170.938L89.7346 191.423C91.6085 192.504 93.9432 192.504 95.8222 191.423L131.299 170.943C133.178 169.858 134.34 167.836 134.34 165.67V92.4589L134.791 92.2029L159.218 78.0973L184.096 92.4589V121.187L159.218 135.549L142.834 126.087V145.359L156.177 153.064C158.056 154.145 160.385 154.145 162.264 153.064V153.059Z"
      />
      <defs>
        <linearGradient id="polygon-badge-gradient" x1="-61.4385" y1="11.2966" x2="221.974" y2="184.732" gradientUnits="userSpaceOnUse">
          <stop stopColor="#A229C5" />
          <stop offset="1" stopColor="#7B3FE4" />
        </linearGradient>
      </defs>
    </svg>
  )
})

interface NetworkIconProps extends IconProps {
  network: WalletNetwork
}

// Network badges for a Wallets balance card. Kept as custom SVGs (not decentraland-ui2's `IconChain`)
// on purpose: ui2's Ethereum chain icon has a hardcoded gray fill, not the brand blue this design
// needs, and it can't be recolored via the `SvgIcon` color prop. Pairing a custom blue Ethereum
// badge with ui2's Polygon icon would also risk mismatched sizes, so both stay custom here (#637).
const NetworkIcon = ({ network, ...props }: NetworkIconProps) =>
  network === 'ethereum' ? <EthereumBadge {...props} /> : <PolygonBadge {...props} />

export { NetworkIcon }
