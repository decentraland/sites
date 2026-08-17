import { Link } from 'react-router-dom'
import { Box, Typography, dclColors, styled } from 'decentraland-ui2'
import { CreateSectionTitle } from '../SectionTitle.styled'

const LiveScenesSection = styled('section')({
  position: 'relative',
  overflow: 'hidden',
  width: '100%',
  paddingBottom: 40
})

const LiveScenesTitle = styled(CreateSectionTitle)({
  marginTop: 0,
  marginBottom: 62
})

const LiveScenesCardsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  overflowX: 'auto',
  gap: 20,
  paddingLeft: 100,
  paddingRight: 100,
  scrollbarWidth: 'none',
  ['&::-webkit-scrollbar']: {
    display: 'none'
  },
  [theme.breakpoints.down('sm')]: {
    paddingLeft: 16,
    paddingRight: 16
  }
}))

const SceneCard = styled(Link)(({ theme }) => ({
  width: 320,
  minWidth: 320,
  flexShrink: 0,
  borderRadius: 20,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  background: dclColors.neutral.softBlack2,
  textDecoration: 'none',
  color: 'inherit',
  cursor: 'pointer',
  transition: 'transform 0.35s ease-in-out',
  ['@media (hover: hover)']: {
    ['&:hover']: {
      transform: 'scale(1.03)'
    }
  },
  ['&:focus-visible']: {
    outline: `2px solid ${dclColors.neutral.softWhite}`,
    outlineOffset: 2
  },
  [theme.breakpoints.down('sm')]: {
    width: 280,
    minWidth: 280
  }
}))

const SceneCardImage = styled(Box)({
  position: 'relative',
  width: '100%',
  height: 180,
  ['& img']: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block'
  }
})

const SceneCardBadge = styled(Box)({
  position: 'absolute',
  top: 12,
  left: 12,
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '4px 10px',
  borderRadius: 999,
  background: 'rgba(0, 0, 0, 0.65)',
  color: dclColors.neutral.white,
  fontSize: 13,
  fontWeight: 600,
  ['&::before']: {
    content: '""',
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#3fb950'
  }
})

const SceneCardInfo = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  padding: '16px 20px 20px'
})

const SceneCardTitle = styled(Typography)({
  fontSize: 18,
  lineHeight: '24px',
  fontWeight: 700,
  color: dclColors.neutral.softWhite,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap'
})

const SceneCardCoords = styled(Typography)({
  fontSize: 14,
  fontWeight: 600,
  color: dclColors.neutral.gray3
})

const ViewAllLink = styled(Link)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 'fit-content',
  margin: '40px auto 0',
  color: dclColors.neutral.softWhite,
  fontSize: 18,
  fontWeight: 600,
  textDecoration: 'none',
  ['&:hover']: {
    textDecoration: 'underline'
  },
  ['&:focus-visible']: {
    outline: `2px solid ${dclColors.neutral.softWhite}`,
    outlineOffset: 2
  }
})

export {
  LiveScenesCardsContainer,
  LiveScenesSection,
  LiveScenesTitle,
  SceneCard,
  SceneCardBadge,
  SceneCardCoords,
  SceneCardImage,
  SceneCardInfo,
  SceneCardTitle,
  ViewAllLink
}
