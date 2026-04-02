import { Button, dclColors, styled } from 'decentraland-ui2'
import { DCL_RED } from './colors'

const HangOutButton = styled(Button)(({ theme }) => ({
  transition: theme.transitions.create(['transform'], {
    duration: theme.transitions.duration.shorter,
    easing: theme.transitions.easing.easeInOut
  }),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&&.MuiButton-root': {
    backgroundColor: DCL_RED,
    color: '#FCFCFC',
    width: 270,
    height: 60,
    borderRadius: '16px !important',
    padding: '20px 40px',
    gap: 24,
    fontSize: 20,
    fontWeight: 600,
    lineHeight: '32px',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
    boxShadow: 'rgba(0, 0, 0, 0.4) 0px 2px 8px',
    // eslint-disable-next-line @typescript-eslint/naming-convention
    '& .MuiButton-endIcon': {
      marginLeft: 0
    },
    // eslint-disable-next-line @typescript-eslint/naming-convention
    '& .MuiSvgIcon-root': {
      fontSize: 32
    }
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&::before': {
    content: "''",
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    border: `4px solid ${dclColors.neutral.white}`,
    borderRadius: 24,
    opacity: 0,
    transition: theme.transitions.create(['top', 'right', 'bottom', 'left', 'opacity'], {
      duration: theme.transitions.duration.shorter,
      easing: theme.transitions.easing.easeInOut
    })
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&&.MuiButton-root:hover, &&.MuiButton-root:focus, &&.MuiButton-root:active, &&.MuiButton-root.Mui-focusVisible': {
    backgroundColor: DCL_RED,
    transform: 'scale(1.03)'
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&:hover::before': {
    opacity: 1,
    top: -7.5,
    right: -7.5,
    bottom: -7.5,
    left: -7.5
  },
  [theme.breakpoints.down('sm')]: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    '&&.MuiButton-root': {
      width: 240,
      height: 52,
      fontSize: 16,
      padding: '16px 32px'
    }
  }
}))

export { HangOutButton }
