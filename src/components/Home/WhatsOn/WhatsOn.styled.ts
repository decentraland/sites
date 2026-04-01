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
    padding: theme.spacing(6, 2)
  }
}))

const SectionTitle = styled(Typography)(({ theme }) => ({
  color: dclColors.neutral.white,
  fontWeight: 700,
  textAlign: 'center',
  position: 'relative',
  zIndex: 10,
  fontSize: 48,
  [theme.breakpoints.down('sm')]: {
    fontSize: 32
  }
}))

const JUMP_IN_HEIGHT = 62

const CardsGrid = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  gap: theme.spacing(3),
  width: '100%',
  position: 'relative',
  zIndex: 10,
  /* eslint-disable @typescript-eslint/naming-convention */
  '& > *': {
    flex: '0 1 510px'
  },
  '& .MuiCard-root': {
    containerType: 'inline-size'
  },
  '& .MuiCardMedia-root': {
    height: '62.5cqw !important'
  },
  '& .MuiCardActionArea-root:hover .MuiCardMedia-root': {
    height: `calc(62.5cqw - ${JUMP_IN_HEIGHT}px) !important`
  },
  // Expand avatar container so the "by" label is not truncated
  // (targets the inner Box wrapping the AvatarFace inside EventCard)
  '& .MuiCardContent-root .MuiBox-root .MuiBox-root:has(.MuiAvatar-root)': {
    maxWidth: '100%'
  },
  /* eslint-enable @typescript-eslint/naming-convention */
  [theme.breakpoints.down('sm')]: {
    display: 'none'
  }
}))

const MobileCarousel = styled(Box)(({ theme }) => ({
  display: 'none',
  width: '100%',
  position: 'relative',
  zIndex: 10,
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
    height: 486,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    '& > *': {
      minWidth: 0,
      width: '100%',
      height: '100%'
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

const CardWrapper = styled('div')({
  borderRadius: 16,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  // Override ui2's 0.4 opacity to 0.6
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&& .MuiCardContent-root': {
    backgroundColor: 'rgba(0, 0, 0, 0.6)'
  },
  // Force card to respect container width on small screens
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&& .MuiCard-root': {
    minWidth: 0,
    maxWidth: '100%'
  },
  /* eslint-disable @typescript-eslint/naming-convention */
  '&& .MuiTypography-h6': {
    display: 'block',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    WebkitLineClamp: 'unset',
    WebkitBoxOrient: 'unset'
  }
  /* eslint-enable @typescript-eslint/naming-convention */
})

export { CardWrapper, CardsGrid, MobileCarousel, SectionTitle, WhatsOnContainer }
