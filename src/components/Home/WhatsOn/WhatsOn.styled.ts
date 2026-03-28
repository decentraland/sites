import { Box, Typography, dclColors, styled } from 'decentraland-ui2'

const WhatsOnContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  padding: theme.spacing(10, 8),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(6),
  position: 'relative',
  overflow: 'hidden',
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(6, 0)
  }
}))

const SectionTitle = styled(Typography)({
  color: dclColors.neutral.white,
  fontWeight: 700,
  textAlign: 'center',
  fontSize: 'clamp(1.75rem, 3vw, 2.5rem)'
})

const CardsGrid = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  gap: theme.spacing(3),
  width: '100%',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& > *': {
    flex: '0 1 510px',
    // Fix: prevent card from shrinking on hover by locking its height
    // after first render via min-height on the container
    minHeight: 452
  },
  [theme.breakpoints.down('sm')]: {
    display: 'none'
  }
}))

const MobileCarousel = styled(Box)(({ theme }) => ({
  display: 'none',
  width: '100%',
  [theme.breakpoints.down('sm')]: {
    display: 'block'
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& .swiper': {
    paddingBottom: theme.spacing(5)
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& .swiper-slide': {
    padding: `0 ${theme.spacing(2)}`,
    boxSizing: 'border-box',
    // eslint-disable-next-line @typescript-eslint/naming-convention
    '& > *': {
      maxWidth: '100%'
    }
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& .swiper-pagination': {
    bottom: '0 !important'
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& .swiper-pagination-bullet': {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    opacity: 1,
    width: 8,
    height: 8
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& .swiper-pagination-bullet-active': {
    backgroundColor: dclColors.neutral.white
  }
}))

export { CardsGrid, MobileCarousel, SectionTitle, WhatsOnContainer }
