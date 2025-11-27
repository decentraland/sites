import { Box, styled } from 'decentraland-ui2'

const Mission = styled(Box)(({ theme }) => {
  return {
    height: '100vh',
    width: '100%',
    position: 'relative',
    display: 'flex',
    flexFlow: 'column nowrap',
    justifyContent: 'center',
    paddingTop: '0',
    [theme.breakpoints.down('xs')]: {
      justifyContent: 'flex-end',
      paddingBottom: theme.spacing(8.75)
    }
  }
})

export { Mission }
