import { Link } from 'react-router-dom'
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
  gap: theme.spacing(3),
  justifyContent: 'center',
  width: '100%',
  position: 'relative',
  zIndex: 10,
  /* eslint-disable @typescript-eslint/naming-convention */
  '& > *': {
    flex: '1 1 0',
    minWidth: 0,
    maxWidth: 850,
    '&:only-child, &:first-child:nth-last-child(2), &:first-child:nth-last-child(2) ~ *': {
      minHeight: 427
    }
  },
  '& .MuiCard-root': {
    containerType: 'inline-size',
    overflow: 'hidden',
    height: 'min(62.5cqw + 130px, 427px)'
  },
  '& .MuiCardActionArea-root': {
    height: '100%'
  },
  '&& .MuiCardMedia-root': {
    height: 'min(62.5cqw, 297px)',
    transition: 'height 0.3s ease'
  },
  '&& .MuiCardActionArea-root:hover .MuiCardMedia-root': {
    height: `min(calc(62.5cqw - ${JUMP_IN_HEIGHT}px), ${297 - JUMP_IN_HEIGHT}px)`
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
  }
}))

interface CardWrapperProps {
  $avatarBackgroundColor?: string
}

// EventCard renders the AvatarFace from decentraland-ui2 internally — there's no prop to override
// its background color. Targeting `.MuiAvatar-root` here paints the per-creator color computed from
// ADR-292's NameColorHelper. `&&` doubles specificity so it wins over ui2's themed default.
const CardWrapper = styled('div', { shouldForwardProp: prop => prop !== '$avatarBackgroundColor' })<CardWrapperProps>(props => ({
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
  },
  ...(props.$avatarBackgroundColor && {
    '&& .MuiAvatar-root': {
      backgroundColor: props.$avatarBackgroundColor
    }
  })
  /* eslint-enable @typescript-eslint/naming-convention */
}))

const ViewAllButton = styled(Link)(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  padding: '9px 32px',
  border: `2px solid ${dclColors.neutral.white}`,
  borderRadius: 10,
  color: dclColors.neutral.white,
  fontWeight: 700,
  fontSize: 16,
  lineHeight: '16px',
  textTransform: 'uppercase',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
  position: 'relative',
  zIndex: 10,
  transition: 'background-color 0.2s ease, transform 0.2s ease',
  cursor: 'pointer',
  /* eslint-disable @typescript-eslint/naming-convention */
  '&:hover': {
    backgroundColor: 'rgba(252, 252, 252, 0.1)'
  },
  '&:focus-visible': {
    outline: `2px solid ${dclColors.neutral.white}`,
    outlineOffset: 2
  },
  '&:active': {
    transform: 'scale(0.98)'
  },
  '& svg': {
    fontSize: 20
  }
  /* eslint-enable @typescript-eslint/naming-convention */
}))

export { CardWrapper, CardsGrid, WhatsOnContainer, MobileCarousel, SectionTitle, ViewAllButton }
