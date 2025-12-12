import { Box, Button, Typography, dclColors, styled } from 'decentraland-ui2'

const TrendingNewsSlideContainer = styled(Box)(({ theme }) => ({
  backgroundColor: dclColors.neutral.softBlack2,
  paddingBottom: theme.spacing(3)
}))

const TrendingNewsSlide = styled(Box)(({ theme }) => {
  return {
    position: 'relative',
    height: '260px',
    width: '520px',
    borderTopRightRadius: '16px',
    borderTopLeftRadius: '16px',
    overflow: 'hidden',
    ['::after']: {
      content: "''",
      position: 'absolute',
      top: '50%',
      right: 0,
      bottom: 0,
      left: 0,
      zIndex: 1
    },
    [theme.breakpoints.down('xs')]: {
      width: '100%',
      height: 0,
      paddingTop: '50%'
    }
  }
})

const TrendingNewsSlideDescriptionContainer = styled(Box)(({ theme }) => {
  return {
    zIndex: 2,
    margin: theme.spacing(3, 4, 0, 4),
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: '480px',
    [theme.breakpoints.down('xl')]: {
      minHeight: '410px'
    },
    [theme.breakpoints.down('md')]: {
      marginLeft: theme.spacing(2.5),
      marginRight: theme.spacing(2.5)
    },
    [theme.breakpoints.down('sm')]: {
      minHeight: '300px'
    }
  }
})

const TrendingNewsSlideTextWrapper = styled(Box)({
  position: 'relative'
})

const TrendingNewsSlideTitle = styled(Typography)(({ theme }) => {
  return {
    marginBottom: theme.spacing(3),
    fontWeight: '600',
    [theme.breakpoints.down('sm')]: {
      fontSize: '2rem'
    }
  }
})

const TrendingNewsSlideSubtitle = styled(Typography)(({ theme }) => {
  return {
    color: theme.palette.text.secondary
  }
})

const TrendingNewsSlideActionsContainer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(4.25),
  width: '100%',
  display: 'flex',
  justifyContent: 'flex-end'
}))

const TrendingNewsSlideButton = styled(Button)(({ theme }) => {
  return {
    ['&.MuiButton-sizeMedium.MuiButton-outlinedSecondary:not(.Mui-disabled):not(.Mui-focusVisible):not(:hover)']: {
      color: theme.palette.secondary.main
    },
    ['&.MuiButton-sizeMedium.MuiButton-outlinedSecondary:not(.Mui-disabled):not(.Mui-focusVisible):hover']: {
      color: theme.palette.secondary.main
    },
    ['&.MuiButton-sizeMedium.MuiButton-outlinedSecondary']: {
      height: '54px'
    },
    [theme.breakpoints.down('xs')]: {
      ['&.MuiButton-sizeMedium.MuiButton-outlinedSecondary']: {
        height: '54px'
      }
    }
  }
})

const TrendingNewsSlideImageContainer = styled(Box)<{ imageUrl?: string }>(({ imageUrl }) => {
  return {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 1,
    backgroundImage: `url(${imageUrl})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center'
  }
})

export {
  TrendingNewsSlideContainer,
  TrendingNewsSlide,
  TrendingNewsSlideDescriptionContainer,
  TrendingNewsSlideTextWrapper,
  TrendingNewsSlideTitle,
  TrendingNewsSlideSubtitle,
  TrendingNewsSlideActionsContainer,
  TrendingNewsSlideButton,
  TrendingNewsSlideImageContainer
}
