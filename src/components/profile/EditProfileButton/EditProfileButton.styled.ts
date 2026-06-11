import { Button, styled } from 'decentraland-ui2'

// Figma I322:49174;322:64434 ("edit CTAS" > JumpCTA) — floating CTA anchored to the
// top-right of the tabs row: bg rgba(0,0,0,0.4), h 40, radius 12, px 16, Inter SemiBold 14
// uppercase soft-white label. Hidden below md alongside the tabs row (mobile navigates
// through ProfileMobileMenu instead).
/* eslint-disable @typescript-eslint/naming-convention */
const EditButton = styled(Button)(({ theme }) => ({
  position: 'absolute',
  right: 14,
  top: 0,
  height: 40,
  minWidth: 0,
  padding: '0 16px',
  borderRadius: 12,
  backgroundColor: 'rgba(0, 0, 0, 0.4)',
  fontFamily: '"Inter", sans-serif',
  fontWeight: 600,
  fontSize: 14,
  letterSpacing: 0,
  textTransform: 'uppercase',
  color: '#FCFCFC',
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.55)'
  },
  '&:focus-visible': {
    outline: '2px solid rgba(252, 252, 252, 0.6)',
    outlineOffset: 2
  },
  '&:active': {
    backgroundColor: 'rgba(0, 0, 0, 0.65)'
  },
  [theme.breakpoints.down('md')]: {
    display: 'none'
  }
}))
/* eslint-enable @typescript-eslint/naming-convention */

export { EditButton }
