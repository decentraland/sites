import { Box, Typography, dclColors, styled } from 'decentraland-ui2'
import { CreateSectionTitle } from '../SectionTitle.styled'

const LearnSection = styled('section')({
  position: 'relative',
  overflow: 'hidden',
  width: '100%',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center',
  paddingLeft: 0,
  paddingRight: 0
})

const LearnTitle = styled(CreateSectionTitle)({
  marginTop: 97,
  marginBottom: 62
})

const LearnCardsContainer = styled(Box)(({ theme }) => ({
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

const LearnCard = styled(Box)(({ theme }) => ({
  width: 529,
  minWidth: 529,
  height: 398,
  flexShrink: 0,
  borderRadius: 20,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  boxSizing: 'border-box',
  position: 'relative',
  cursor: 'pointer',
  transition: 'transform 0.35s ease-in-out',
  [theme.breakpoints.down('sm')]: {
    width: 360,
    minWidth: 360,
    maxWidth: 360,
    height: 310
  }
}))

const LearnCardVideoImage = styled(Box)(({ theme }) => ({
  width: '100%',
  height: 236,
  position: 'relative',
  cursor: 'pointer',
  flex: 1,
  ['& img']: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: '10px 10px 0 0'
  },
  ['& .play-icon']: {
    width: 80,
    height: 80,
    position: 'absolute',
    top: '50%',
    left: '50%',
    transition: 'all 0.35s ease-in-out',
    transform: 'translate(-50%, -50%)',
    opacity: 0.7
  },
  ['&:hover .play-icon']: {
    opacity: 1,
    filter: 'brightness(1.3)'
  },
  [theme.breakpoints.down('sm')]: {
    height: 160
  }
}))

const LearnCardInfo = styled(Box)({
  borderRadius: '0 0 20px 20px',
  background: dclColors.neutral.softBlack2,
  width: '100%',
  display: 'flex',
  flexDirection: 'column'
})

const LearnCardUserRow = styled(Box)({
  display: 'flex',
  flexDirection: 'row',
  padding: '18px 24px',
  width: '100%',
  alignItems: 'center',
  justifyContent: 'space-between'
})

const LearnCardUser = styled(Box)({
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center'
})

const LearnCardUserImage = styled(Box)({
  width: 40,
  height: 40,
  borderRadius: '50%',
  overflow: 'hidden',
  ['& img']: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  }
})

const LearnCardUserName = styled(Typography)(({ theme }) => ({
  color: dclColors.neutral.gray3,
  fontSize: 18,
  fontWeight: 600,
  marginLeft: 8,
  [theme.breakpoints.down('sm')]: {
    fontSize: 16
  }
}))

const LearnCardDate = styled(Typography)(({ theme }) => ({
  color: dclColors.neutral.gray3,
  fontSize: 18,
  fontWeight: 600,
  textAlign: 'right',
  textTransform: 'uppercase',
  [theme.breakpoints.down('sm')]: {
    fontSize: 16
  }
}))

const LearnCardTitle = styled(Typography)(({ theme }) => ({
  fontSize: 20,
  lineHeight: '28px',
  fontWeight: 700,
  padding: '0 24px 40px',
  [theme.breakpoints.down('sm')]: {
    textAlign: 'left',
    fontSize: 18
  }
}))

const LearnExtraContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  margin: '72px 20px',
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
    margin: 0,
    paddingLeft: 16,
    paddingRight: 16,
    marginTop: 28,
    marginBottom: 32,
    width: 'calc(100% - 16px)'
  }
}))

const LearnExtraBlock = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  color: dclColors.neutral.white,
  textAlign: 'center',
  fontSize: 20,
  fontWeight: 600,
  lineHeight: '48px',
  ['& a']: {
    marginLeft: 16
  },
  [theme.breakpoints.down('lg')]: {
    flexDirection: 'column'
  },
  [theme.breakpoints.down('sm')]: {
    fontSize: 18,
    width: '100%',
    ['& a']: {
      marginLeft: 0,
      width: '100%',
      marginTop: 16
    }
  }
}))

export {
  LearnCard,
  LearnCardDate,
  LearnCardInfo,
  LearnCardTitle,
  LearnCardUser,
  LearnCardUserImage,
  LearnCardUserName,
  LearnCardUserRow,
  LearnCardVideoImage,
  LearnCardsContainer,
  LearnExtraBlock,
  LearnExtraContainer,
  LearnSection,
  LearnTitle
}
