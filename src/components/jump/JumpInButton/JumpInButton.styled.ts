/* eslint-disable @typescript-eslint/naming-convention */
import { Button, IconButton, styled } from 'decentraland-ui2'

const JumpInIconButton = styled(IconButton)({
  backgroundColor: '#FF2D55',
  border: '1px solid rgba(252, 252, 252, 0.3)',
  width: 36,
  height: 36,
  borderRadius: 8,
  padding: 0,
  '&:hover': {
    backgroundColor: '#E02347',
    borderColor: '#FCFCFC'
  },
  '&:focus-visible': {
    backgroundColor: '#E02347',
    borderColor: '#FCFCFC'
  }
})

const StyledJumpInButton = styled(Button)(({ theme }) => ({
  textTransform: 'none',
  fontWeight: 600,
  [theme.breakpoints.down('xs')]: {
    fontSize: 16
  }
}))

export { JumpInIconButton, StyledJumpInButton }
