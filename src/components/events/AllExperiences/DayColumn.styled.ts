import { Box, dclColors, styled } from 'decentraland-ui2'

const COLUMN_BORDER_RADIUS = 24
/** 280px accounts for: navbar (~64px) + section title + date nav + section padding (~216px) */
const COLUMN_HEIGHT = 'calc(100vh - 280px)'
const CARD_GAP = 8
const CARD_PADDING = 8
const FILLER_BORDER_RADIUS = 12
const SKELETON_HEIGHT = 200

const DayColumnContainer = styled(Box)(({ theme }) => ({
  borderRadius: COLUMN_BORDER_RADIUS,
  backgroundColor: 'rgba(179, 32, 255, 0.25)',
  border: `2px solid ${dclColors.whiteTransparent.subtle}`,
  display: 'flex',
  flexDirection: 'column',
  height: COLUMN_HEIGHT,
  overflow: 'hidden',
  [theme.breakpoints.down('sm')]: {
    height: 'auto'
  }
}))

const CardScrollArea = styled(Box)({
  flex: 1,
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: CARD_GAP,
  padding: CARD_PADDING,
  scrollbarWidth: 'none',
  ['&::-webkit-scrollbar']: {
    display: 'none'
  }
})

const ColumnFiller = styled(Box)({
  flex: 1,
  minHeight: FILLER_BORDER_RADIUS,
  backgroundColor: dclColors.whiteTransparent.subtle,
  borderRadius: FILLER_BORDER_RADIUS
})

const SkeletonCard = styled(Box)({
  height: SKELETON_HEIGHT,
  borderRadius: FILLER_BORDER_RADIUS,
  backgroundColor: 'rgba(255, 255, 255, 0.08)',
  animation: 'pulse 1.5s ease-in-out infinite',
  ['@keyframes pulse']: {
    ['0%, 100%']: { opacity: 0.4 },
    ['50%']: { opacity: 0.15 }
  }
})

export { CardScrollArea, ColumnFiller, DayColumnContainer, SkeletonCard }
