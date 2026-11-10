// eslint-disable-next-line @typescript-eslint/naming-convention
import FormatQuoteIcon from '@mui/icons-material/FormatQuote'
import { Box, styled } from 'decentraland-ui2'
import { MutedText, creatorFundColors } from '../CreatorFund.styled'

type QuoteSize = 'large' | 'medium' | 'small'

// The design sizes each quote by length so short and long quotes fill their cards evenly.
const QUOTE_TYPE: Record<QuoteSize, { fontSize: number; lineHeight: number }> = {
  large: { fontSize: 24, lineHeight: 1.375 },
  medium: { fontSize: 20, lineHeight: 1.625 },
  small: { fontSize: 18, lineHeight: 1.625 }
}

const BuildersSubtitle = styled(MutedText)(({ theme }) => ({
  marginTop: theme.spacing(2),
  fontSize: 18
}))

const CarouselViewport = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(5),
  overflow: 'hidden'
}))

const CarouselTrack = styled('ul', {
  shouldForwardProp: prop => prop !== 'page' && prop !== 'perPage'
})<{ page: number; perPage: number }>(({ page, perPage }) => ({
  display: 'flex',
  alignItems: 'flex-start',
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
  margin: 0,
  padding: theme.spacing(3),
  borderRadius: 16,
  border: `1px solid ${creatorFundColors.border}`,
  backgroundColor: creatorFundColors.card
}))

const QuoteMark = styled(FormatQuoteIcon)(({ theme }) => ({
  width: 28,
  height: 28,
  marginBottom: theme.spacing(2),
  color: creatorFundColors.primary
}))

const Quote = styled('blockquote', {
  shouldForwardProp: prop => prop !== 'size'
})<{ size: QuoteSize }>(({ size }) => ({
  margin: 0,
  ...QUOTE_TYPE[size],
  color: creatorFundColors.heading
}))

const QuoteAuthor = styled('figcaption')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  marginTop: theme.spacing(3),
  paddingTop: theme.spacing(2),
  borderTop: `1px solid ${creatorFundColors.border}`
}))

const AuthorAvatar = styled('img')({
  width: 48,
  height: 48,
  flexShrink: 0,
  borderRadius: '50%',
  objectFit: 'cover'
})

const AuthorInitial = styled('span')({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 48,
  height: 48,
  flexShrink: 0,
  borderRadius: '50%',
  backgroundColor: creatorFundColors.border,
  color: creatorFundColors.heading,
  fontSize: 18,
  fontWeight: 700,
  textTransform: 'uppercase'
})

const AuthorName = styled('span')({
  fontWeight: 700,
  color: creatorFundColors.heading
})

// Rendered only when the quotes need more than one page (one card per page on mobile).
const CarouselControls = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(2),
  marginTop: theme.spacing(3)
}))

const ArrowButton = styled('button')(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(1),
  borderRadius: '50%',
  border: `1px solid ${creatorFundColors.border}`,
  background: 'none',
  color: creatorFundColors.text,
  cursor: 'pointer',
  transition: 'background-color 0.2s',
  ['& svg']: {
    fontSize: 16
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
  }
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
  AuthorInitial,
  AuthorName,
  BuildersSubtitle,
  CarouselControls,
  CarouselSlide,
  CarouselTrack,
  CarouselViewport,
  Dot,
  Dots,
  Quote,
  QuoteAuthor,
  QuoteCard,
  QuoteMark
}
export type { QuoteSize }
