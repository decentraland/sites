import { Box, styled } from 'decentraland-ui2'
import { CreatorFundSection, DisplayTitle, SectionInner, creatorFundColors } from '../CreatorFund.styled'

// Shorter top padding than the other sections: the avatars image closes it instead. The scene
// photo behind it sits at z-index -1, so the section isolates it.
const JoinSection = styled(CreatorFundSection)(({ theme }) => ({
  position: 'relative',
  isolation: 'isolate',
  overflow: 'hidden',
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

// Larger and soft white, so it reads over the scene photo.
const JoinSubtitle = styled('p')(({ theme }) => ({
  maxWidth: 576,
  margin: `${theme.spacing(2.5)} auto 0`,
  fontSize: 20,
  fontWeight: 500,
  lineHeight: 1.5,
  color: creatorFundColors.onBand,
  [theme.breakpoints.up('sm')]: {
    fontSize: 22
  }
}))

const TermsLink = styled('a')({
  color: 'inherit',
  textDecoration: 'underline',
  textUnderlineOffset: 4,
  ['&:hover, &:focus-visible']: {
    color: creatorFundColors.linkHover
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

const JoinBackground = styled('img')({
  position: 'absolute',
  inset: 0,
  zIndex: -1,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  objectPosition: 'center'
})

export { AvatarsImage, JoinActions, JoinBackground, JoinInner, JoinSection, JoinSubtitle, JoinTitle, TermsLink }
