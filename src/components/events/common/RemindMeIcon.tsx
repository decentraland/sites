import { styled } from 'decentraland-ui2'

// Provided SVG: bell outline without check (viewBox 0 0 25 25)
const BELL_OUTLINE_BODY =
  'M5.4167 9.44547C5.44685 7.63928 6.21335 5.91687 7.55087 4.64979C8.88839 3.38271 10.6897 2.6725 12.5663 2.67236C14.4429 2.67223 16.2444 3.38217 17.5821 4.64907C18.9198 5.91596 19.6866 7.63825 19.717 9.44444L19.7173 12.2663L21.4284 15.9735C21.4888 16.1045 21.5143 16.2479 21.5025 16.3907C21.4907 16.5335 21.4421 16.6712 21.361 16.7914C21.2799 16.9115 21.169 17.0103 21.0382 17.0787C20.9074 17.1471 20.7609 17.183 20.6121 17.1831L15.3891 17.1835L15.3919 17.1891L9.73956 17.1894L9.74313 17.1835L4.52097 17.1824C4.37215 17.1824 4.2257 17.1465 4.0949 17.0782C3.96411 17.0099 3.85311 16.9112 3.77197 16.7911C3.69084 16.671 3.64213 16.5333 3.63028 16.3905C3.61843 16.2477 3.6438 16.1043 3.7041 15.9733L5.41606 12.2689L5.41581 9.44696L5.4167 9.44547ZM7.20443 9.44545L7.20361 12.4516C7.20351 12.5717 7.17727 12.6905 7.1266 12.8002L5.89689 15.4632L19.2368 15.4629L18.006 12.7997C17.9557 12.69 17.9298 12.5713 17.93 12.4514L17.9284 9.44595C17.9026 8.09324 17.3262 6.80431 16.3233 5.85649C15.3203 4.90867 13.971 4.37771 12.5655 4.37784C11.16 4.37797 9.81067 4.90918 8.80791 5.85719C7.80515 6.80519 7.22904 8.09422 7.20354 9.44694L7.20443 9.44545Z'

const BELL_OUTLINE_CLAPPER =
  'M9.48535 18.7616C9.59625 19.475 9.96951 20.1265 10.5372 20.5974C11.1049 21.0683 11.8294 21.3274 12.5788 21.3275C13.3282 21.3277 14.0528 21.0689 14.6207 20.5982C15.1886 20.1276 15.5622 19.4763 15.6734 18.7629L9.48535 18.7616Z'

// Provided SVG: bell with cutout for check (viewBox 0 0 25 25)
const BELL_ACTIVE =
  'M15.6737 18.7625C15.5625 19.4758 15.1888 20.1277 14.621 20.5984C14.0531 21.069 13.3282 21.328 12.579 21.3279C11.8296 21.3277 11.1047 21.0683 10.537 20.5974C9.96927 20.1265 9.59613 19.4749 9.48522 18.7615L15.6737 18.7625ZM12.5663 2.67261C14.4428 2.67251 16.2442 3.38232 17.5819 4.64917C17.9225 4.97176 18.2253 5.32444 18.4891 5.69995L16.4413 7.74976L16.1805 7.48901C15.0869 6.3954 13.3142 6.39538 12.2206 7.48901C11.1271 8.58265 11.127 10.3554 12.2206 11.449L14.4608 13.6892C14.9859 14.2141 15.6988 14.5095 16.4413 14.5095C17.1837 14.5093 17.8958 14.2142 18.4208 13.6892L19.7567 12.3523L21.4286 15.9734C21.4889 16.1042 21.5135 16.2477 21.5018 16.3904C21.4901 16.5332 21.4423 16.6716 21.3612 16.7917C21.2801 16.9119 21.1687 17.0105 21.038 17.0789C20.9073 17.1472 20.7609 17.1832 20.6122 17.1833H15.3885L15.3915 17.1892H9.73913L9.74304 17.1833L4.52038 17.1824C4.37169 17.1823 4.22528 17.1462 4.0946 17.0779C3.96389 17.0095 3.85245 16.9108 3.77136 16.7908C3.69038 16.6708 3.64159 16.533 3.62975 16.3904C3.61793 16.2476 3.6437 16.1043 3.70397 15.9734L5.41589 12.2693V9.44702L5.41686 9.44507C5.44712 7.63911 6.21335 5.91712 7.55065 4.65015C8.88817 3.38306 10.6897 2.67274 12.5663 2.67261Z'

// Provided SVG: checkmark (viewBox 0 0 25 25, absolute position)
const CHECK_ACTIVE =
  'M20.0042 6.3392C20.4417 5.90174 21.1508 5.90174 21.5882 6.3392C22.0257 6.77666 22.0257 7.48574 21.5882 7.9232L17.1075 12.4039C16.8974 12.614 16.6126 12.7321 16.3155 12.7321C16.0184 12.7321 15.7336 12.614 15.5235 12.4039L13.2832 10.1635C12.8457 9.72609 12.8457 9.01701 13.2832 8.57955C13.7206 8.14209 14.4297 8.14209 14.8672 8.57955L16.3155 10.0279L20.0042 6.3392Z'

/* eslint-disable @typescript-eslint/naming-convention */
const Container = styled('span')({
  position: 'relative',
  display: 'inline-flex',
  flexShrink: 0,
  transformOrigin: 'top center',
  '@keyframes bellShake': {
    '0%': { transform: 'rotate(0)' },
    '15%': { transform: 'rotate(14deg)' },
    '30%': { transform: 'rotate(-14deg)' },
    '45%': { transform: 'rotate(10deg)' },
    '60%': { transform: 'rotate(-8deg)' },
    '75%': { transform: 'rotate(4deg)' },
    '85%': { transform: 'rotate(-2deg)' },
    '100%': { transform: 'rotate(0)' }
  },
  '&.shake': {
    animation: 'bellShake 0.6s ease-in-out'
  }
})
/* eslint-enable @typescript-eslint/naming-convention */

const Layer = styled('svg')({
  position: 'absolute',
  inset: 0,
  transition: 'opacity 0.3s ease'
})

/* eslint-disable @typescript-eslint/naming-convention */
const CheckPath = styled('path')({
  transformOrigin: '17px 9px',
  transition: 'opacity 0.25s ease 0.15s, transform 0.25s ease 0.15s',
  '&.hidden': {
    opacity: 0,
    transform: 'scale(0)',
    transition: 'opacity 0.15s ease, transform 0.15s ease'
  }
})
/* eslint-enable @typescript-eslint/naming-convention */

type RemindMeIconProps = {
  active: boolean
  shaking?: boolean
  className?: string
  size?: number
}

function RemindMeIcon({ active, shaking, className, size = 18 }: RemindMeIconProps) {
  const classes = [className, shaking ? 'shake' : ''].filter(Boolean).join(' ') || undefined
  return (
    <Container className={classes} style={{ width: size, height: size }}>
      {/* Inactive: outline bell */}
      <Layer viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ opacity: active ? 0 : 1 }}>
        <path d={BELL_OUTLINE_BODY} fill="currentColor" />
        <path d={BELL_OUTLINE_CLAPPER} fill="currentColor" />
      </Layer>
      {/* Active: filled bell with check from provided SVGs */}
      <Layer viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ opacity: active ? 1 : 0 }}>
        <path d={BELL_ACTIVE} fill="#FF2D55" />
        <CheckPath className={active ? '' : 'hidden'} d={CHECK_ACTIVE} fill="#FF2D55" />
      </Layer>
    </Container>
  )
}

export { RemindMeIcon }
