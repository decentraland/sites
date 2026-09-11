import { dclColors, styled } from 'decentraland-ui2'

const SNOW = dclColors.neutral.softWhite

// Square outlined control, sized and shaped like the jump-in modal's copy CTA so
// the two share affordances read as the same button on both surfaces.
const ShareCta = styled('button')(({ theme }) => ({
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  width: 'clamp(38px, 2.396vw, 46px)',
  height: 'clamp(38px, 2.396vw, 46px)',
  padding: 10,
  border: `1px solid ${SNOW}`,
  borderRadius: 12,
  backgroundColor: 'transparent',
  color: SNOW,
  cursor: 'pointer',
  transition: theme.transitions.create('background-color', { duration: theme.transitions.duration.short }),
  ['&:hover']: { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
  ['&:active']: { backgroundColor: 'rgba(255, 255, 255, 0.18)' },
  ['&:focus-visible']: { outline: `2px solid ${SNOW}`, outlineOffset: 2 }
}))

// Transient confirmation for the clipboard path. Anchored above the button so it
// never widens the row it sits in.
const CopiedBubble = styled('span')(({ theme }) => ({
  position: 'absolute',
  bottom: 'calc(100% + 8px)',
  left: '50%',
  transform: 'translateX(-50%)',
  padding: theme.spacing(0.5, 1),
  borderRadius: 6,
  whiteSpace: 'nowrap',
  fontSize: 12,
  fontWeight: 600,
  color: dclColors.neutral.softBlack1,
  backgroundColor: SNOW
}))

export { CopiedBubble, ShareCta }
