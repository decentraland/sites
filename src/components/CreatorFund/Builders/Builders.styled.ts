import { Box, styled } from 'decentraland-ui2'
import { MutedText, creatorFundColors } from '../CreatorFund.styled'

const BuildersHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'space-between',
  gap: theme.spacing(2)
}))

const BuildersSubtitle = styled(MutedText)(({ theme }) => ({
  marginTop: theme.spacing(2),
  fontSize: 18
}))

const DesktopArrows = styled(Box)(({ theme }) => ({
  display: 'none',
  gap: theme.spacing(1),
  [theme.breakpoints.up('sm')]: {
    display: 'flex'
  }
}))

const ArrowButton = styled('button', {
  shouldForwardProp: prop => prop !== 'compact'
})<{ compact?: boolean }>(({ theme, compact = false }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: compact ? theme.spacing(1) : theme.spacing(1.5),
  borderRadius: '50%',
  border: `1px solid ${creatorFundColors.border}`,
  background: 'none',
  color: creatorFundColors.text,
  cursor: 'pointer',
  transition: 'background-color 0.2s',
  ['& svg']: {
    fontSize: compact ? 16 : 24
  },
  ['&:hover']: {
    backgroundColor: creatorFundColors.card
  },
  ['&:focus-visible']: {
    outline: `2px solid ${creatorFundColors.white}`,
    outlineOffset: 2
  },
  ['&:active']: {
    transform: 'scale(0.95)'
  },
  [theme.breakpoints.up('sm')]: compact ? { display: 'none' } : {}
}))

const CarouselViewport = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(5),
  overflow: 'hidden'
}))

const CarouselTrack = styled('ul', {
  shouldForwardProp: prop => prop !== 'page' && prop !== 'perPage'
})<{ page: number; perPage: number }>(({ page, perPage }) => ({
  display: 'flex',
  transform: `translateX(-${(page * 100) / perPage}%)`,
  margin: 0,
  padding: 0,
  listStyle: 'none',
  transition: 'transform 0.5s',
  ['@media (prefers-reduced-motion: reduce)']: {
    transition: 'none'
  }
}))

const CarouselSlide = styled('li', {
  shouldForwardProp: prop => prop !== 'perPage'
})<{ perPage: number }>(({ theme, perPage }) => ({
  flexShrink: 0,
  width: `${100 / perPage}%`,
  padding: `0 ${theme.spacing(1)}`
}))

const QuoteCard = styled('figure')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  height: '100%',
  margin: 0,
  padding: theme.spacing(3),
  borderRadius: 16,
  border: `1px solid ${creatorFundColors.border}`,
  backgroundColor: creatorFundColors.card
}))

const Quote = styled('blockquote')({
  margin: 0,
  lineHeight: 1.6,
  color: creatorFundColors.text
})

const QuoteAuthor = styled('figcaption')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  marginTop: theme.spacing(3)
}))

const AuthorAvatar = styled('img')({
  width: 48,
  height: 48,
  borderRadius: '50%',
  objectFit: 'cover'
})

const AuthorName = styled('span')({
  display: 'block',
  fontWeight: 600
})

const AuthorRole = styled('span')({
  display: 'block',
  fontSize: 14,
  color: creatorFundColors.mutedText
})

const CarouselControls = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(2),
  marginTop: theme.spacing(3)
}))

const Dots = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1)
}))

const Dot = styled('button', {
  shouldForwardProp: prop => prop !== 'active'
})<{ active: boolean }>(({ active }) => ({
  width: active ? 24 : 8,
  height: 8,
  padding: 0,
  border: 'none',
  borderRadius: 9999,
  backgroundColor: active ? creatorFundColors.primary : creatorFundColors.border,
  cursor: 'pointer',
  transition: 'width 0.2s, background-color 0.2s',
  ['&:hover']: {
    backgroundColor: active ? creatorFundColors.primary : creatorFundColors.mutedText
  },
  ['&:focus-visible']: {
    outline: `2px solid ${creatorFundColors.white}`,
    outlineOffset: 2
  }
}))

export {
  ArrowButton,
  AuthorAvatar,
  AuthorName,
  AuthorRole,
  BuildersHeader,
  BuildersSubtitle,
  CarouselControls,
  CarouselSlide,
  CarouselTrack,
  CarouselViewport,
  DesktopArrows,
  Dot,
  Dots,
  Quote,
  QuoteAuthor,
  QuoteCard
}
