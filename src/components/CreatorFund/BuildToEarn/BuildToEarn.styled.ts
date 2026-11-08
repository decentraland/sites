import { styled } from 'decentraland-ui2'
import { CardTitle, CreatorFundSection, GlassCard, creatorFundColors } from '../CreatorFund.styled'

// The page's headline band: more room than the other sections (64px / 112px).
const BuildSection = styled(CreatorFundSection)(({ theme }) => ({
  paddingTop: theme.spacing(8),
  paddingBottom: theme.spacing(8),
  [theme.breakpoints.up('sm')]: {
    paddingTop: theme.spacing(14),
    paddingBottom: theme.spacing(14)
  }
}))

const StepsGrid = styled('ol')(({ theme }) => ({
  display: 'grid',
  gap: theme.spacing(3),
  margin: `${theme.spacing(6)} 0 0`,
  padding: 0,
  listStyle: 'none',
  [theme.breakpoints.up('sm')]: {
    gridTemplateColumns: 'repeat(2, 1fr)'
  },
  [theme.breakpoints.up('lg')]: {
    gridTemplateColumns: 'repeat(3, 1fr)'
  }
}))

const StepCard = styled(GlassCard)(({ theme }) => ({
  height: '100%',
  boxSizing: 'border-box',
  padding: theme.spacing(4),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(5),
    minHeight: 300
  }
}))

const StepNumber = styled('span')(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(3),
  right: theme.spacing(4),
  fontSize: 56,
  fontWeight: 600,
  letterSpacing: '-0.025em',
  lineHeight: 1,
  color: 'rgba(236, 235, 237, 0.2)'
}))

const StepTitle = styled(CardTitle)(({ theme }) => ({
  marginTop: theme.spacing(3)
}))

const StepText = styled('p')(({ theme }) => ({
  margin: `${theme.spacing(1.5)} 0 0`,
  fontSize: 16,
  lineHeight: 1.5,
  color: creatorFundColors.text,
  [theme.breakpoints.up('sm')]: {
    fontSize: 18
  }
}))

// Same weight and color as the sentence around it; only the underline marks it as a link.
const StepLink = styled('a')({
  fontWeight: 'inherit',
  color: 'inherit',
  textDecoration: 'underline',
  textUnderlineOffset: 4,
  ['&:hover']: {
    color: creatorFundColors.linkHover
  },
  ['&:focus-visible']: {
    outline: `2px solid ${creatorFundColors.white}`,
    outlineOffset: 2,
    borderRadius: 2
  }
})

export { BuildSection, StepCard, StepLink, StepNumber, StepText, StepTitle, StepsGrid }
