import { Dialog, styled } from 'decentraland-ui2'

const MOBILE_NAVBAR_OFFSET = 64

// Mirrors `whats-on/DetailModal/DetailModal.styled.ts` StyledDialog in its
// `$wide=true` profile mode — same paper chrome (rounded corners, glow
// shadow, brand radial gradient) so the standalone modal and the in-event
// swap render with a consistent surface. ProfileSurface is mounted with
// `embedded` here so its LayoutRoot does NOT paint a second gradient on top.
/* eslint-disable @typescript-eslint/naming-convention */
const ProfileDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiBackdrop-root': {
    backgroundColor: 'rgba(0, 0, 0, 0.8)'
  },
  '& .MuiDialog-paper': {
    borderRadius: theme.spacing(2),
    maxWidth: 1650,
    width: '100%',
    maxHeight: 'min(930px, 90vh)',
    margin: 0,
    overflowY: 'auto',
    overflowX: 'hidden',
    background: 'radial-gradient(123.58% 82% at 9.01% 25.79%, #7434B1 0%, #481C6C 37.11%, #2B1040 100%)',
    boxShadow: '0px 4px 25px 0px #FFFFFF40',
    display: 'flex',
    flexDirection: 'column',
    scrollbarWidth: 'none',
    transition: 'max-width 280ms cubic-bezier(0.4, 0, 0.2, 1), max-height 280ms cubic-bezier(0.4, 0, 0.2, 1)'
  },
  '& .MuiDialog-paper::-webkit-scrollbar': {
    display: 'none'
  },
  [theme.breakpoints.down('sm')]: {
    '& .MuiDialog-paper': {
      borderRadius: 0,
      maxWidth: '100%',
      maxHeight: `calc(100% - ${MOBILE_NAVBAR_OFFSET}px)`,
      height: `calc(100% - ${MOBILE_NAVBAR_OFFSET}px)`,
      margin: 0,
      marginTop: MOBILE_NAVBAR_OFFSET,
      backgroundColor: '#1A0A2E'
    }
  }
})) as typeof Dialog
/* eslint-enable @typescript-eslint/naming-convention */

export { ProfileDialog }
