import { Box, Typography, dclColors, styled } from 'decentraland-ui2'
import { CARD_HOVER_SHADOW } from '../common/CardActions.styled'

const FutureCardContainer = styled(Box)({
  borderRadius: 12,
  overflow: 'hidden',
  cursor: 'pointer',
  position: 'relative',
  width: '100%',
  minWidth: 0,
  ['&:hover']: {
    boxShadow: CARD_HOVER_SHADOW
  },
  ['&:hover [data-role="hover-actions"]']: {
    opacity: 1,
    transform: 'translateY(0)'
  },
  ['&:hover [data-role="time-pill"], &:hover [data-role="creator-row"]']: {
    opacity: 0
  },
  ['&:focus-within [data-role="hover-actions"]']: {
    opacity: 1,
    transform: 'translateY(0)'
  },
  ['&:focus-within [data-role="time-pill"], &:focus-within [data-role="creator-row"]']: {
    opacity: 0
  }
})

const CardImageWrapper = styled(Box)({
  width: '100%',
  aspectRatio: '16 / 9',
  overflow: 'hidden',
  flexShrink: 0
})

const CardImage = styled('img')({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block',
  pointerEvents: 'none',
  userSelect: 'none'
})

const CardContent = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  padding: 12,
  position: 'relative',
  backgroundColor: dclColors.blackTransparent.blurry
})

const CardTitle = styled(Typography)({
  fontWeight: 600,
  fontSize: 16,
  lineHeight: 1.5,
  color: dclColors.neutral.softWhite,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap'
})

// Overrides for decentraland-ui2 EventCard internals.
// Coupled to MUI class names — verify on decentraland-ui2 upgrades.
const LiveCardWrapper = styled(Box)({
  width: '100%',
  minWidth: 0,
  overflow: 'hidden',
  ['& .MuiCard-root']: {
    maxWidth: '100%',
    minWidth: 0,
    width: '100%',
    maxHeight: 'none',
    containerType: 'inline-size',
    overflow: 'hidden',
    animation: 'none'
  },
  ['& .MuiCardContent-root']: {
    backgroundColor: dclColors.blackTransparent.backdrop
  },
  ['& .MuiCardMedia-root']: {
    height: 'min(62.5cqw, 200px)',
    pointerEvents: 'none',
    userSelect: 'none'
  },
  // Disable all hover transitions and transforms on the card
  ['& .MuiCardActionArea-root']: {
    transition: 'none',
    transform: 'none'
  },
  ['&& .MuiCardActionArea-root:hover']: {
    transform: 'none',
    boxShadow: 'none'
  },
  ['&& .MuiCard-root:hover']: {
    boxShadow: 'none'
  },
  ['&& .MuiCardActionArea-root:hover .MuiCardMedia-root']: {
    height: 'min(62.5cqw, 200px)',
    transform: 'none'
  },
  // Hide avatar/by row — EventCard DOM: CardContent > SceneInfoContainer > AvatarAndLocationRow > AvatarContainer(.MuiAvatar-root)
  ['& .MuiCardContent-root .MuiBox-root .MuiBox-root:has(.MuiAvatar-root)']: {
    display: 'none'
  },
  ['& .MuiCardContent-root .MuiTypography-h6']: {
    display: 'block',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    WebkitLineClamp: 'unset', // eslint-disable-line @typescript-eslint/naming-convention
    WebkitBoxOrient: 'unset' // eslint-disable-line @typescript-eslint/naming-convention
  }
})

export { CardContent, CardImage, CardImageWrapper, CardTitle, FutureCardContainer, LiveCardWrapper }
