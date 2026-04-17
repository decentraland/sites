import { styled } from 'decentraland-ui2'

const MobileActionButton = styled('button')(({ theme }) => ({
  display: 'none',
  [theme.breakpoints.down('md')]: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    flexShrink: 0,
    borderRadius: 6,
    border: 'none',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    cursor: 'pointer',
    padding: 0,
    color: '#FCFCFC',
    ['&:active']: {
      backgroundColor: 'rgba(255, 255, 255, 0.3)'
    }
  }
}))

export { MobileActionButton }
