import { Box, styled } from 'decentraland-ui2'
import { CreatorFundSection, DisplayTitle, SectionInner, creatorFundColors } from '../CreatorFund.styled'

// Shorter top padding than the other bands: the avatars image closes the section instead.
const JoinSection = styled(CreatorFundSection)(({ theme }) => ({
  paddingTop: theme.spacing(6),
  [theme.breakpoints.up('sm')]: {
    paddingTop: theme.spacing(8)
  }
}))

const JoinInner = styled(SectionInner)({
  textAlign: 'center'
})

const JoinTitle = styled(DisplayTitle)({
  maxWidth: 768,
  marginLeft: 'auto',
  marginRight: 'auto'
})

const JoinSubtitle = styled('p')(({ theme }) => ({
  maxWidth: 576,
  margin: `${theme.spacing(2.5)} auto 0`,
  fontSize: 18,
  lineHeight: 1.55,
  color: creatorFundColors.text
}))

const TermsLink = styled('a')({
  color: 'inherit',
  textDecoration: 'underline',
  textUnderlineOffset: 4,
  ['&:hover, &:focus-visible']: {
    color: creatorFundColors.primaryHover
  }
})

const JoinActions = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(2),
  marginTop: theme.spacing(4)
}))

const AvatarsImage = styled('img')(({ theme }) => ({
  display: 'block',
  width: '100%',
  maxWidth: 1152,
  height: 'auto',
  margin: `${theme.spacing(4)} auto 0`,
  [theme.breakpoints.up('sm')]: {
    marginTop: theme.spacing(5)
  }
}))

export { AvatarsImage, JoinActions, JoinInner, JoinSection, JoinSubtitle, JoinTitle, TermsLink }
