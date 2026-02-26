import { Box, Typography, dclColors, styled } from 'decentraland-ui2'

const CreatorsCreateTabContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column'
})

const CreatorsCreateTabInfoSection = styled(Box)(({ theme }) => ({
  borderRadius: '16px',
  background: '#43404a80',
  padding: theme.spacing(2, 3),
  marginBottom: theme.spacing(1),
  ['&:last-child']: {
    marginBottom: 0
  },
  [theme.breakpoints.down('xs')]: {
    padding: theme.spacing(2)
  }
}))

const CreatorsCreateTabSectionTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 500,
  fontSize: '16px',
  lineHeight: '20px',
  color: dclColors.neutral.white,
  marginBottom: 0,
  [theme.breakpoints.down('xs')]: {
    textAlign: 'center',
    fontSize: '18px',
    fontWeight: 600
  }
}))

const CreatorsCreateTabSectionSubtitle = styled(Typography)(({ theme }) => ({
  fontSize: '16px',
  lineHeight: '24px',
  fontWeight: 400,
  color: dclColors.neutral.gray4,
  marginBottom: 0,
  [theme.breakpoints.down('xs')]: {
    textAlign: 'center'
  }
}))

const CreatorsCreateTabSkillsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  marginTop: theme.spacing(1.5),
  [theme.breakpoints.down('xs')]: {
    flexDirection: 'column',
    alignItems: 'center'
  }
}))

const CreatorsCreateTabSkill = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1, 2),
  borderRadius: '16px',
  marginRight: theme.spacing(1),
  marginBottom: theme.spacing(1),
  background: dclColors.neutral.gray0,
  fontSize: '13px',
  fontWeight: 600,
  textTransform: 'uppercase',
  color: dclColors.neutral.white,
  whiteSpace: 'nowrap'
}))

const CreatorsCreateTabLinksContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  flexDirection: 'row',
  marginTop: theme.spacing(1.5),
  ['& p']: {
    width: '50%',
    marginBottom: theme.spacing(1),
    marginTop: 0,
    [theme.breakpoints.down('md')]: {
      width: '100%'
    }
  },
  ['& a.create-tab__link, & a.create-tab__link:active, & a.create-tab__link:visited, & a.create-tab__link:hover, & a.create-tab__link:focus']:
    {
      fontSize: '16px',
      lineHeight: '24px',
      fontWeight: 500,
      textDecorationLine: 'underline',
      color: dclColors.brand.melon,
      display: 'inline-block'
    }
}))

export {
  CreatorsCreateTabContainer,
  CreatorsCreateTabInfoSection,
  CreatorsCreateTabLinksContainer,
  CreatorsCreateTabSectionSubtitle,
  CreatorsCreateTabSectionTitle,
  CreatorsCreateTabSkill,
  CreatorsCreateTabSkillsContainer
}
