import { Box, Typography, styled } from 'decentraland-ui2'

const PageContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  padding: theme.spacing(20, 3, 8),
  minHeight: 'calc(100vh - 164px)',
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(12, 2, 6)
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(4, 2, 6)
  }
}))

const LayoutGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: '220px 1fr',
  gap: theme.spacing(6),
  maxWidth: 1140,
  width: '100%',
  [theme.breakpoints.down('md')]: {
    gridTemplateColumns: '1fr',
    gap: theme.spacing(3)
  }
}))

const SidebarContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 0,
  [theme.breakpoints.down('md')]: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing(0.5)
  }
}))

const SidebarLink = styled('a')<{ active?: boolean }>(({ theme, active }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  padding: theme.spacing(1.5, 0),
  fontSize: 17,
  fontWeight: 500,
  lineHeight: 1.45,
  textDecoration: 'none',
  cursor: 'pointer',
  color: active ? theme.palette.primary.main : theme.palette.text.primary,
  ['&:hover']: {
    color: theme.palette.primary.main
  },
  ['& svg']: {
    fontSize: 20,
    flexShrink: 0
  },
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(1, 1.5),
    fontSize: 14,
    gap: theme.spacing(1)
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(0.75, 1),
    fontSize: 13
  }
}))

const ContentArea = styled(Box)({
  minWidth: 0
})

const DocumentTitle = styled(Typography)(({ theme }) => ({
  fontSize: 34,
  fontWeight: 500,
  lineHeight: '42px',
  letterSpacing: 0.4,
  margin: `0 0 ${theme.spacing(3)}`,
  [theme.breakpoints.down('sm')]: {
    fontSize: 26,
    lineHeight: '34px'
  }
}))

const TOCList = styled('ul')(({ theme }) => ({
  listStyle: 'none',
  padding: 0,
  margin: `0 0 ${theme.spacing(3)}`,
  ['& > li']: {
    paddingBottom: theme.spacing(1)
  },
  ['& a']: {
    color: theme.palette.text.primary,
    textDecoration: 'none',
    ['&:hover']: {
      textDecoration: 'underline'
    }
  }
}))

const Section = styled(Box)(({ theme }) => ({
  scrollMarginTop: theme.spacing(10)
}))

const SectionTitle = styled('h2')(({ theme }) => ({
  fontSize: 20,
  fontWeight: 500,
  lineHeight: '28px',
  letterSpacing: 0.3,
  marginTop: theme.spacing(4.5),
  marginBottom: theme.spacing(1)
}))

const SubsectionTitle = styled('h3')(({ theme }) => ({
  fontSize: 17,
  fontWeight: 500,
  marginTop: theme.spacing(3.75),
  marginBottom: theme.spacing(1)
}))

const Paragraph = styled(Typography)(({ theme }) => ({
  fontSize: 15,
  lineHeight: '28px',
  color: theme.palette.text.primary,
  margin: `0 0 ${theme.spacing(3)}`,
  ['& a']: {
    color: theme.palette.primary.main,
    textDecoration: 'none',
    ['&:hover']: {
      textDecoration: 'underline'
    }
  }
}))

const BulletList = styled('ul')(({ theme }) => ({
  paddingLeft: theme.spacing(3),
  marginBottom: theme.spacing(3),
  ['& li']: {
    color: theme.palette.text.primary,
    fontSize: 15,
    lineHeight: '28px',
    marginBottom: theme.spacing(1)
  },
  ['& a']: {
    color: theme.palette.primary.main,
    textDecoration: 'none',
    ['&:hover']: {
      textDecoration: 'underline'
    }
  }
}))

export {
  BulletList,
  ContentArea,
  DocumentTitle,
  LayoutGrid,
  PageContainer,
  Paragraph,
  Section,
  SectionTitle,
  SidebarContainer,
  SidebarLink,
  SubsectionTitle,
  TOCList
}
