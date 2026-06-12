import { Button, styled } from 'decentraland-ui2'

// Figma I322:49174;322:64427 ("edit CTAS") — CTA anchored to the top-right of the
// Badges/About/Links InfoSurface (right 14 / top 12): bg rgba(0,0,0,0.4), h 40, radius 12,
// px 16, Inter SemiBold 14 uppercase soft-white label + 24px pencil icon, gap 8. Hidden
// below md (mobile navigates through ProfileMobileNav instead).
const EditButton = styled(Button)(({ theme }) => ({
  position: 'absolute',
  right: 14,
  top: 12,
  height: 40,
  minWidth: 0,
  padding: '0 16px',
  gap: 8,
  borderRadius: 12,
  backgroundColor: 'rgba(0, 0, 0, 0.4)',
  fontFamily: '"Inter", sans-serif',
  fontWeight: 600,
  fontSize: 14,
  letterSpacing: 0,
  textTransform: 'uppercase',
  color: '#FCFCFC',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.55)'
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&:focus-visible': {
    outline: '2px solid rgba(252, 252, 252, 0.6)',
    outlineOffset: 2
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&:active': {
    backgroundColor: 'rgba(0, 0, 0, 0.65)'
  },
  [theme.breakpoints.down('md')]: {
    display: 'none'
  }
}))

// Figma I322:49174;322:64436 ("line-md:edit") — 24px pencil to the right of the label.
const EditButtonIcon = styled('span')({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 24,
  height: 24
})

export { EditButton, EditButtonIcon }
