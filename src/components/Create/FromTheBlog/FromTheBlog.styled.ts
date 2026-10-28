import { Link } from 'react-router-dom'
import { Box, Typography, dclColors, styled } from 'decentraland-ui2'
import { CreateSectionTitle } from '../SectionTitle.styled'

const BlogSection = styled('section')({
  position: 'relative',
  overflow: 'hidden',
  width: '100%',
  paddingTop: 40,
  paddingBottom: 100
})

const BlogTitle = styled(CreateSectionTitle)({
  marginTop: 0,
  marginBottom: 62
})

const BlogCardsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  gap: 20,
  paddingLeft: 100,
  paddingRight: 100,
  [theme.breakpoints.down('md')]: {
    overflowX: 'auto',
    justifyContent: 'flex-start',
    scrollbarWidth: 'none',
    ['&::-webkit-scrollbar']: {
      display: 'none'
    },
    paddingLeft: 16,
    paddingRight: 16
  }
}))

const BlogCard = styled(Link)(({ theme }) => ({
  width: 380,
  minWidth: 300,
  flexShrink: 1,
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
  [theme.breakpoints.down('md')]: {
    flexShrink: 0,
    width: 300
  }
}))

const BlogCardImage = styled(Box)({
  width: '100%',
  height: 200,
  background: 'linear-gradient(206deg, #c640cd 2.47%, #691fa9 98.81%)',
  ['& img']: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block'
  }
})

const BlogCardInfo = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  padding: '18px 24px 28px'
})

const BlogCardMeta = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12
})

const BlogCardCategory = styled(Typography)({
  fontSize: 13,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  color: dclColors.base.primary
})

const BlogCardDate = styled(Typography)({
  fontSize: 14,
  fontWeight: 600,
  color: dclColors.neutral.gray3
})

const BlogCardTitle = styled(Typography)({
  fontSize: 20,
  lineHeight: '28px',
  fontWeight: 700,
  color: dclColors.neutral.softWhite
})

const BlogViewAllLink = styled(Link)({
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
  BlogCard,
  BlogCardCategory,
  BlogCardDate,
  BlogCardImage,
  BlogCardInfo,
  BlogCardMeta,
  BlogCardTitle,
  BlogCardsContainer,
  BlogSection,
  BlogTitle,
  BlogViewAllLink
}
