import { Box, styled } from 'decentraland-ui2'
import type { Rarity } from '../../../features/reels'

const RARITY_COLORS: Record<Rarity, string> = {
  common: '#A4A4A4',
  uncommon: '#5BBD7A',
  rare: '#3F8FFE',
  epic: '#9F72E2',
  legendary: '#FF8044',
  mythic: '#FF45B0',
  unique: '#FFC75A'
}

const sharedContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 10,
  borderRadius: 12,
  background: 'rgba(255, 255, 255, 0.1)',
  padding: 6,
  textDecoration: 'none'
}

const WearableStaticContainer = styled(Box)(sharedContainerStyle)

/* eslint-disable @typescript-eslint/naming-convention */
const WearableContainer = styled('a')(({ theme }) => ({
  ...sharedContainerStyle,
  transition: 'background 0.35s',
  cursor: 'pointer',
  '&:hover': {
    background: '#716b7c'
  },
  [theme.breakpoints.down('lg')]: {
    cursor: 'default'
  }
}))

interface WearableWrapperProps {
  hovered: boolean
}

const WearableWrapper = styled(Box, {
  shouldForwardProp: prop => prop !== 'hovered'
})<WearableWrapperProps>(({ hovered, theme }) => ({
  display: 'flex',
  alignItems: 'center',
  width: hovered ? 'calc(100% - 69px)' : '100%',
  minWidth: hovered ? 'calc(100% - 69px)' : '100%',
  transition: 'width 0.2s',
  [theme.breakpoints.down('lg')]: {
    width: '100%',
    minWidth: '100%'
  }
}))

interface WearableImageProps {
  rarity: Rarity
}

const WearableImage = styled(Box, {
  shouldForwardProp: prop => prop !== 'rarity'
})<WearableImageProps>(({ rarity }) => ({
  width: 80,
  height: 80,
  borderRadius: 10,
  backgroundColor: RARITY_COLORS[rarity],
  flexShrink: 0,
  '& img': { width: 80, height: 80, borderRadius: 10 }
}))
/* eslint-enable @typescript-eslint/naming-convention */

const WearableName = styled('span')({
  color: '#fcfcfc',
  fontSize: 16,
  fontWeight: 600,
  marginLeft: 32,
  marginRight: 32,
  textOverflow: 'ellipsis',
  overflow: 'hidden',
  whiteSpace: 'nowrap'
})

interface BuyButtonProps {
  visible: boolean
}

const BuyButton = styled('button', {
  shouldForwardProp: prop => prop !== 'visible'
})<BuyButtonProps>(({ visible, theme }) => ({
  width: 'auto',
  maxWidth: 'none',
  minWidth: 59,
  padding: '8px 16.5px',
  marginRight: 36,
  border: 'none',
  borderRadius: 6,
  background: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  fontWeight: 600,
  fontSize: 14,
  textTransform: 'uppercase',
  cursor: 'pointer',
  opacity: visible ? 1 : 0,
  // Slide the button off to the right while it fades — without the translate the
  // wrapper finishes its `calc(100% - 69px) → 100%` expansion before the opacity
  // hits zero, so a thin sliver of the BUY button keeps painting through the gap.
  transform: visible ? 'translateX(0)' : 'translateX(120%)',
  transition: 'opacity 0.15s, transform 0.2s',
  pointerEvents: visible ? 'auto' : 'none',
  [theme.breakpoints.down('lg')]: {
    opacity: 0,
    transform: 'translateX(120%)',
    pointerEvents: 'none'
  }
}))

export { BuyButton, WearableContainer, WearableImage, WearableName, WearableStaticContainer, WearableWrapper }
