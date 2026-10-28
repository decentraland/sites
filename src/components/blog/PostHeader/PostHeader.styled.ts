import { Box, Typography, styled } from 'decentraland-ui2'
import type { PolymorphicTypographyProps } from '../../../types/polymorphic.types'

const HeaderBox = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(5)
}))

const MetaText = styled(Typography)(({ theme }) => ({
  ...theme.typography.caption,
  color: theme.palette.text.primary,
  letterSpacing: theme.typography.caption.letterSpacing,
  textTransform: 'uppercase',
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1)
}))

const MetaSeparator = styled('span')(({ theme }) => ({
  color: theme.palette.text.secondary
}))

const TitleBox = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(1.5)
}))

// `styled()` drops Typography's polymorphic `component` overload, so re-declare it: the
// title keeps the h4 type scale while rendering as the page's only <h1>, and the standfirst
// keeps the h6 scale without claiming to be a heading.
const TitleText = styled(Typography)<PolymorphicTypographyProps>(({ theme }) => ({
  color: theme.palette.text.primary
}))

const SubtitleText = styled(Typography)<PolymorphicTypographyProps>(({ theme }) => ({
  color: theme.palette.text.primary,
  marginTop: theme.spacing(1)
}))

export { HeaderBox, MetaSeparator, MetaText, SubtitleText, TitleBox, TitleText }
