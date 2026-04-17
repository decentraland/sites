import { Box, styled } from 'decentraland-ui2'

const BlogLayoutContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  width: '100%'
})

const BlogContentWrapper = styled(Box)(({ theme }) => ({
  flex: 1,
  padding: theme.spacing(5, 0, 2, 0),
  maxWidth: theme.spacing(133),
  margin: '0 auto',
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(5, 2, 2, 2)
  }
}))

export { BlogContentWrapper, BlogLayoutContainer }
