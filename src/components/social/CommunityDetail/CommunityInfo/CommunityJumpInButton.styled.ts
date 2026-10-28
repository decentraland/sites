import { Button, styled } from 'decentraland-ui2'

const JumpInButton = styled(Button)(({ theme }) => ({
  minWidth: 140,
  height: 40,
  whiteSpace: 'nowrap',
  [theme.breakpoints.down('sm')]: { width: '100%' }
}))

export { JumpInButton }
