import { Button, styled, useTheme } from 'decentraland-ui2'

const BannerButtonStyled = styled(Button)(() => {
  const theme = useTheme()
  return {
    ['&.MuiButton-sizeMedium.MuiButton-containedPrimary']: {
      padding: `${theme.spacing(2.3125)} ${theme.spacing(7.625)}`,
      fontSize: '15px',
      fontWeight: 600,
      borderRadius: '8px',
      [theme.breakpoints.down('xs')]: {
        width: '100%'
      }
    },
    ['&.MuiButton-sizeMedium.MuiButton-outlinedSecondary']: {
      padding: `${theme.spacing(2.3125)} ${theme.spacing(7.625)}`,
      fontSize: '15px',
      fontWeight: 600,
      borderRadius: '8px',
      [theme.breakpoints.down('xs')]: {
        width: '100%'
      }
    },
    ['&.MuiButton-sizeMedium.MuiButton-outlinedSecondary:not(.Mui-disabled):not(.Mui-focusVisible):not(:hover)']: {
      color: theme.palette.secondary.main
    },
    ['&.MuiButton-sizeMedium.MuiButton-outlinedSecondary:not(.Mui-disabled):not(.Mui-focusVisible):hover']: {
      color: theme.palette.secondary.main
    },
    ['&.MuiButton-sizeMedium.MuiButton-containedPrimary:not(.Mui-disabled):not(.Mui-focusVisible):hover']: {
      backgroundColor: theme.palette.primary.main
    }
  }
})

export { BannerButtonStyled }
