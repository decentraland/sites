// eslint-disable-next-line @typescript-eslint/naming-convention
import CloseIcon from '@mui/icons-material/Close'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import { Box, Dialog, Typography, dclColors, styled } from 'decentraland-ui2'

const MOBILE_NAVBAR_OFFSET = 64

type SwapVariant = 'profile' | 'photo' | 'place' | 'community' | 'friends'

const SWAP_PAPER: Record<SwapVariant, { maxWidth: number; maxHeight: string }> = {
  profile: { maxWidth: 1650, maxHeight: 'min(930px, 90vh)' },
  photo: { maxWidth: 1500, maxHeight: '92vh' },
  place: { maxWidth: 880, maxHeight: '90vh' },
  community: { maxWidth: 1240, maxHeight: '90vh' },
  // matches the standalone FriendsModal dialog (520 × 80vh)
  friends: { maxWidth: 520, maxHeight: '80vh' }
}

const StyledDialog = styled(Dialog, {
  shouldForwardProp: prop => prop !== '$wide' && prop !== '$swapVariant'
})<{ $wide?: boolean; $swapVariant?: SwapVariant }>(({ theme, $wide, $swapVariant }) => {
  const variant = $swapVariant ?? 'profile'
  const swap = $wide ? SWAP_PAPER[variant] : null
  // Place and photo surfaces are full-bleed Hero (event mode is too) — no
  // Paper gutters. Profile and community surfaces render header/avatar
  // content that needs the 27/30 inset to match Figma 167:78643.
  const needsGutters = $wide && (variant === 'profile' || variant === 'community')
  return {
    /* eslint-disable @typescript-eslint/naming-convention */
    '& .MuiBackdrop-root': {
      backgroundColor: 'rgba(0, 0, 0, 0.8)'
    },
    '& .MuiDialog-paper': {
      borderRadius: theme.spacing(2),
      maxWidth: swap ? swap.maxWidth : 880,
      width: '100%',
      maxHeight: swap ? swap.maxHeight : '80vh',
      margin: 0,
      overflowY: 'auto',
      overflowX: 'hidden',
      // The profile-view swap uses the brand radial gradient defined in ui2 so
      // the background matches the standalone /profile route. Event mode keeps
      // its transparent Paper since the Hero image fills the top.
      background: $wide ? 'radial-gradient(123.58% 82% at 9.01% 25.79%, #7434B1 0%, #481C6C 37.11%, #2B1040 100%)' : 'transparent',
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
      boxShadow: '0px 4px 25px 0px #FFFFFF40',
      display: 'flex',
      flexDirection: 'column',
      scrollbarWidth: 'none',
      transition:
        'max-width 280ms cubic-bezier(0.4, 0, 0.2, 1), max-height 280ms cubic-bezier(0.4, 0, 0.2, 1), background 280ms ease, padding 280ms ease'
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
    /* eslint-enable @typescript-eslint/naming-convention */
  }
})

const HeroSection = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: 880,
  height: 450,
  maxWidth: '100%',
  overflow: 'hidden',
  flexShrink: 0,
  [theme.breakpoints.down('sm')]: {
    width: '100%',
    height: 'auto'
  }
}))

const HeroImage = styled('img')(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  [theme.breakpoints.down('sm')]: {
    position: 'relative',
    aspectRatio: '16 / 9',
    height: 'auto'
  }
}))

const HeroOverlay = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  background: 'linear-gradient(0deg, #000000 0%, rgba(0, 0, 0, 0.8) 30.02%, rgba(0, 0, 0, 0) 106.22%)',
  [theme.breakpoints.down('sm')]: {
    display: 'none'
  }
}))

// Shared chrome between Close (top-right) and Back (top-left) Hero buttons.
const HERO_ICON_BASE = {
  position: 'absolute' as const,
  top: 8 * 1.5,
  width: 40,
  height: 40,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(0, 0, 0, 0.4)',
  border: 'none',
  borderRadius: '50%',
  cursor: 'pointer',
  zIndex: 2,
  padding: 0
}

// Close (X) — top-right. On mobile, when there's no Back chevron, it falls back
// to the legacy single-button position (top-left) shown as a back-style chevron
// for the standalone event modal UX. When a Back button is present ($hasBack),
// Close stays on the right.
const CloseButton = styled('button', {
  shouldForwardProp: prop => prop !== '$hasBack'
})<{ $hasBack?: boolean }>(({ theme, $hasBack }) => ({
  ...HERO_ICON_BASE,
  top: theme.spacing(1.5),
  right: theme.spacing(1.5),
  /* eslint-disable @typescript-eslint/naming-convention */
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.6)'
  },
  '&:focus-visible': {
    outline: '2px solid #FCFCFC',
    outlineOffset: 2
  },
  [theme.breakpoints.down('sm')]: {
    top: theme.spacing(1),
    ...($hasBack ? { right: theme.spacing(1) } : { left: theme.spacing(1), right: 'auto' })
  }
  /* eslint-enable @typescript-eslint/naming-convention */
}))

// Back (chevron) — top-left, only rendered when the surface is swapped inside
// another modal (`onBack` callback is provided).
const BackButton = styled('button')(({ theme }) => ({
  ...HERO_ICON_BASE,
  top: theme.spacing(1.5),
  left: theme.spacing(1.5),
  /* eslint-disable @typescript-eslint/naming-convention */
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.6)'
  },
  '&:focus-visible': {
    outline: '2px solid #FCFCFC',
    outlineOffset: 2
  },
  [theme.breakpoints.down('sm')]: {
    top: theme.spacing(1),
    left: theme.spacing(1)
  }
  /* eslint-enable @typescript-eslint/naming-convention */
}))

const CloseIconStyled = styled(CloseIcon)({
  fontSize: 20,
  color: '#FCFCFC'
})

const HeroContent = styled(Box)(({ theme }) => ({
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  padding: theme.spacing(0, 3.75, 6.25, 3.75),
  zIndex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
  [theme.breakpoints.down('sm')]: {
    position: 'relative',
    padding: theme.spacing(2),
    background: 'linear-gradient(180deg, #1A0A2E 0%, #32134C 100%)'
  }
}))

const ModalTitle = styled(Typography)({
  fontSize: 32,
  fontWeight: 600,
  lineHeight: 1.24,
  color: '#FCFCFC',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  display: '-webkit-box',
  /* eslint-disable @typescript-eslint/naming-convention */
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical'
  /* eslint-enable @typescript-eslint/naming-convention */
})

const CreatorRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1)
}))

/* eslint-disable @typescript-eslint/naming-convention */
const CreatorButton = styled('button')(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: 0,
  margin: 0,
  background: 'transparent',
  border: 'none',
  color: 'inherit',
  cursor: 'pointer',
  font: 'inherit',
  borderRadius: theme.spacing(1),
  transition: 'opacity 150ms ease',
  '&:hover': {
    opacity: 0.85
  },
  '&:focus-visible': {
    outline: `2px solid ${dclColors.base.primary}`,
    outlineOffset: 2
  }
}))
/* eslint-enable @typescript-eslint/naming-convention */

const AvatarImage = styled('img', { shouldForwardProp: prop => prop !== 'fallbackColor' })<{ fallbackColor: string }>(
  ({ theme, fallbackColor }) => ({
    width: theme.spacing(3),
    height: theme.spacing(3),
    borderRadius: '50%',
    border: '1.5px solid rgba(255, 255, 255, 0.5)',
    flexShrink: 0,
    objectFit: 'cover',
    backgroundColor: fallbackColor
  })
)

const AvatarFallback = styled(Box, { shouldForwardProp: prop => prop !== 'fallbackColor' })<{ fallbackColor: string }>(
  ({ theme, fallbackColor }) => ({
    width: theme.spacing(3),
    height: theme.spacing(3),
    borderRadius: '50%',
    backgroundColor: fallbackColor,
    border: '1.5px solid rgba(255, 255, 255, 0.5)',
    flexShrink: 0
  })
)

const CreatorName = styled(Typography)({
  fontSize: 14,
  lineHeight: 1,
  color: '#FCFCFC',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap'
})

const CreatorNameHighlight = styled('span')({
  color: '#FF2D55'
})

const ActionsRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1)
}))

const PrimaryActionButton = styled('button')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(1),
  height: 46,
  backgroundColor: '#FCFCFC',
  color: '#161518',
  border: 'none',
  borderRadius: theme.spacing(1.5),
  padding: theme.spacing(0, 2.5),
  fontSize: 14,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  transition: theme.transitions.create('background-color', {
    duration: theme.transitions.duration.short
  }),
  /* eslint-disable @typescript-eslint/naming-convention */
  '&:disabled': {
    opacity: 0.5,
    cursor: 'default'
  },
  '&:hover:not(:disabled)': {
    backgroundColor: 'rgba(252, 252, 252, 0.85)'
  },
  '&:focus-visible': {
    outline: '2px solid #FCFCFC',
    outlineOffset: 2
  }
  /* eslint-enable @typescript-eslint/naming-convention */
}))

const SecondaryButton = styled('button')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(1),
  backgroundColor: 'transparent',
  color: '#FCFCFC',
  border: '1px solid #FCFCFC',
  borderRadius: theme.spacing(1),
  padding: theme.spacing(1, 2),
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  transition: theme.transitions.create('background-color', {
    duration: theme.transitions.duration.short
  }),
  /* eslint-disable @typescript-eslint/naming-convention */
  '&:disabled': {
    opacity: 0.5,
    cursor: 'default'
  },
  '&:hover:not(:disabled)': {
    backgroundColor: 'rgba(255, 255, 255, 0.2)'
  },
  '&:focus-visible': {
    outline: '2px solid #FCFCFC',
    outlineOffset: 2
  }
  /* eslint-enable @typescript-eslint/naming-convention */
}))

const CopyButton = styled('button')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'transparent',
  border: '1px solid #FCFCFC',
  borderRadius: theme.spacing(1),
  padding: theme.spacing(1, 2),
  flexShrink: 0,
  cursor: 'pointer',
  transition: theme.transitions.create('background-color', {
    duration: theme.transitions.duration.short
  }),
  /* eslint-disable @typescript-eslint/naming-convention */
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.2)'
  },
  '&:focus-visible': {
    outline: '2px solid #FCFCFC',
    outlineOffset: 2
  }
  /* eslint-enable @typescript-eslint/naming-convention */
}))

const CopyIconStyled = styled(ContentCopyIcon)({
  fontSize: 18,
  color: '#FCFCFC'
})

const ContentSection = styled(Box)(({ theme }) => ({
  background: 'radial-gradient(47.37% 84.21% at 42.4% 26.48%, #6E31A7 0%, #32134C 100%)',
  padding: theme.spacing(3.75, 6.25),
  flex: 1,
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(3, 2)
  }
}))

const SectionLabel = styled(Typography)(({ theme }) => ({
  fontSize: 14,
  fontWeight: 600,
  lineHeight: 1.75,
  textTransform: 'uppercase',
  color: '#A09BA8',
  marginBottom: theme.spacing(1)
}))

const DescriptionText = styled(Typography)({
  fontSize: 14,
  lineHeight: 1.6,
  color: dclColors.neutral.softWhite,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  ['& a']: {
    color: dclColors.base.primary,
    textDecoration: 'underline',
    ['&:hover']: { color: dclColors.base.primaryLight1 },
    ['&:focus-visible']: { outline: `2px solid ${dclColors.base.primary}`, outlineOffset: 2, borderRadius: 2 }
  }
})

const ContentDivider = styled(Box)(({ theme }) => ({
  height: 1,
  backgroundColor: 'rgba(255, 255, 255, 0.15)',
  margin: theme.spacing(2, 0)
}))

const MetaRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  flexWrap: 'wrap'
}))

const MetaText = styled(Typography)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  fontSize: 14,
  lineHeight: 1.5,
  color: '#FCFCFC'
}))

export {
  ActionsRow,
  AvatarFallback,
  AvatarImage,
  BackButton,
  CloseButton,
  CloseIconStyled,
  ContentDivider,
  ContentSection,
  CopyButton,
  CopyIconStyled,
  CreatorButton,
  CreatorName,
  CreatorNameHighlight,
  CreatorRow,
  DescriptionText,
  HeroContent,
  HeroImage,
  HeroOverlay,
  HeroSection,
  MetaRow,
  MetaText,
  ModalTitle,
  PrimaryActionButton,
  SecondaryButton,
  SectionLabel,
  StyledDialog
}
