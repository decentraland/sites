import { Dialog, styled } from 'decentraland-ui2'

const MOBILE_NAVBAR_OFFSET = 64

type ProfileDialogVariant = 'profile' | 'photo' | 'place' | 'community' | 'friends'

// Paper sizing per variant. `profile` matches Figma 167:78643 (1650×930);
// `photo`, `place`, and `community` shrink to the standalone modal sizes so
// the swap-in-place feels like opening the corresponding dialog instead of
// floating a small surface inside the wide profile Paper.
const VARIANT_PAPER: Record<ProfileDialogVariant, { maxWidth: number; maxHeight: string }> = {
  profile: { maxWidth: 1650, maxHeight: 'min(930px, 90vh)' },
  // photo matches the standalone PhotoModal (1500 × 92vh) so the snapshot
  // doesn't get cropped vertically when the swap-in-profile view opens it.
  photo: { maxWidth: 1500, maxHeight: '92vh' },
  place: { maxWidth: 880, maxHeight: '90vh' },
  community: { maxWidth: 1240, maxHeight: '90vh' },
  // matches the standalone FriendsModal dialog (520 × 80vh)
  friends: { maxWidth: 520, maxHeight: '80vh' }
}

// Mirrors `whats-on/DetailModal/DetailModal.styled.ts` StyledDialog in its
// `$wide=true` profile mode — same paper chrome (rounded corners, glow
// shadow, brand radial gradient) so the standalone modal and the in-event
// swap render with a consistent surface. ProfileSurface is mounted with
// `embedded` here so its LayoutRoot does NOT paint a second gradient on top.
// eslint-disable-next-line @typescript-eslint/naming-convention
const ProfileDialog = styled(Dialog, {
  shouldForwardProp: prop => prop !== '$variant'
})<{ $variant?: ProfileDialogVariant }>(({ theme, $variant = 'profile' }) => {
  const paper = VARIANT_PAPER[$variant]
  // `place` and `photo` surfaces render a full-bleed Hero image; padding the
  // Paper would push the Hero off the rounded corners. `profile` and `community`
  // surfaces render gutter-aware content (back chevron, avatar, info column)
  // and need the 27/30 inset to match Figma node 167:78643.
  const needsGutters = $variant === 'profile' || $variant === 'community'
  return {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    '& .MuiBackdrop-root': {
      backgroundColor: 'rgba(0, 0, 0, 0.8)'
    },
    // eslint-disable-next-line @typescript-eslint/naming-convention
    '& .MuiDialog-paper': {
      borderRadius: theme.spacing(2),
      maxWidth: paper.maxWidth,
      width: '100%',
      maxHeight: paper.maxHeight,
      margin: 0,
      overflowY: 'auto',
      overflowX: 'hidden',
      // Embedded ProfileSurface skips ContentArea, so the Paper itself must reproduce its
      // gutters (theme.spacing(2) mobile, 27px lateral / 30px vertical ≥ md per Figma) so
      // the back chevron + avatar don't hug the dialog edge.
      ...(needsGutters && {
        paddingLeft: theme.spacing(2),
        paddingRight: theme.spacing(2),
        paddingTop: theme.spacing(2),
        paddingBottom: theme.spacing(2),
        [theme.breakpoints.up('md')]: {
          paddingLeft: '27px',
          paddingRight: '27px',
          paddingTop: '30px',
          paddingBottom: '30px'
        }
      }),
      background: 'radial-gradient(123.58% 82% at 9.01% 25.79%, #7434B1 0%, #481C6C 37.11%, #2B1040 100%)',
      boxShadow: '0px 4px 25px 0px #FFFFFF40',
      display: 'flex',
      flexDirection: 'column',
      scrollbarWidth: 'none',
      transition: 'max-width 280ms cubic-bezier(0.4, 0, 0.2, 1), max-height 280ms cubic-bezier(0.4, 0, 0.2, 1)'
    },
    // eslint-disable-next-line @typescript-eslint/naming-convention
    '& .MuiDialog-paper::-webkit-scrollbar': {
      display: 'none'
    },
    [theme.breakpoints.down('sm')]: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
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
  }
}) as React.ComponentType<React.ComponentProps<typeof Dialog> & { $variant?: ProfileDialogVariant }>

export { ProfileDialog }
export type { ProfileDialogVariant }
