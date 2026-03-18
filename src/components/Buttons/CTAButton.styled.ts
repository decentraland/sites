import { Box, Button, styled } from 'decentraland-ui2'

const CTAButtonStyled = styled(Button)(({ theme }) => ({
  ['&.MuiButton-sizeMedium.MuiButton-containedPrimary']: {
    padding: theme.spacing(3, 6),
    fontSize: '19.89px',
    fontWeight: 600,
    lineHeight: '31.82px',
    letterSpacing: '0.61px',
    textTransform: 'uppercase',
    borderRadius: theme.shape.borderRadius,
    boxShadow: 'rgba(0, 0, 0, 0.4) 0px 2px 8px',
    ['& .MuiButton-icon.MuiButton-endIcon']: {
      marginLeft: theme.spacing(5.25)
    }
  },
  ['&.MuiButton-sizeMedium.MuiButton-containedPrimary:not(.Mui-disabled):not(.Mui-focusVisible):hover']: {
    backgroundColor: theme.palette.primary.main
  },
  ['&::before']: {
    content: "''",
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    border: `4px solid ${theme.palette.common.white}`,
    borderRadius: '14px',
    opacity: 0,
    transition: theme.transitions.create(['top', 'right', 'bottom', 'left', 'opacity'], {
      duration: theme.transitions.duration.shorter,
      easing: theme.transitions.easing.easeInOut
    })
  },
  ['&:hover']: {
    ['&::before']: {
      opacity: 1,
      top: '-7.5px',
      right: '-7.5px',
      bottom: '-7.5px',
      left: '-7.5px'
    }
  }
}))

const CTAButtonLabelContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  ['& span']: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 400,
    lineHeight: '20.02px'
  }
})

export { CTAButtonLabelContainer, CTAButtonStyled }
