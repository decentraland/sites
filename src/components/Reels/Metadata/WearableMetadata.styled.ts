import { Box, Button, styled } from 'decentraland-ui2'
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

/* eslint-disable @typescript-eslint/naming-convention */
const WearableContainer = styled('a')({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 10,
  borderRadius: 12,
  background: 'rgba(255, 255, 255, 0.1)',
  padding: 6,
  transition: 'background 0.35s',
  textDecoration: 'none',
  '&:hover': {
    background: '#716b7c'
  },
  '&:hover .reels-wearable-buy': {
    opacity: 1
  },
  '&:hover .reels-wearable-wrapper': {
    width: 'calc(100% - 69px)',
    minWidth: 'calc(100% - 69px)'
  },
  '@media (max-width: 991px)': {
    '&:hover .reels-wearable-buy': { opacity: 0 },
    '&:hover .reels-wearable-wrapper': { width: '100%', minWidth: '100%' }
  }
})

const WearableWrapper = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  width: '100%'
})

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

const BuyButton = styled(Button)({
  width: 'auto',
  maxWidth: 'none',
  minWidth: 59,
  padding: '8px 16.5px',
  marginRight: 36,
  opacity: 0,
  transition: 'opacity 0.35s'
})

export { BuyButton, WearableContainer, WearableImage, WearableName, WearableWrapper }
