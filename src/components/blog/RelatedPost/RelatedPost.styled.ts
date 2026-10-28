import { Box, Typography, dclColors, styled } from 'decentraland-ui2'
import type { PolymorphicTypographyProps } from '../../../types/polymorphic.types'

const RelatedSection = styled('section')(({ theme }) => ({
  backgroundColor: dclColors.neutral.softBlack2,
  paddingBottom: theme.spacing(13),
  paddingTop: theme.spacing(12),
  width: '100%'
}))

const RelatedContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(3),
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2),
  width: '100%',
  maxWidth: theme.spacing(136.875),
  margin: '0 auto'
}))

// The related rail follows the article's <h1>, so its title has to be an <h2>
// while keeping the h6 type scale.
const RelatedTitle = styled(Typography)<PolymorphicTypographyProps>(({ theme }) => ({
  ...theme.typography.h6,
  color: theme.palette.text.primary
}))

const RelatedWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'nowrap',
  justifyContent: 'flex-start',
  gap: theme.spacing(4),
  [theme.breakpoints.down('xs')]: {
    justifyContent: 'center',
    flexWrap: 'wrap'
  }
}))

export { RelatedContainer, RelatedSection, RelatedTitle, RelatedWrapper }
