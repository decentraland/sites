import { Box, styled } from 'decentraland-ui2'

interface ViewerContainerProps {
  metadataVisible: boolean
}

const ViewerContainer = styled(Box, {
  shouldForwardProp: prop => prop !== 'metadataVisible'
})<ViewerContainerProps>(({ theme, metadataVisible }) => ({
  width: '100vw',
  height: '100vh',
  position: 'absolute',
  inset: 0,
  zIndex: 1,
  overflow: 'hidden',
  transition: 'width 0.35s',
  ...(metadataVisible ? { width: 'calc(100vw - 571px)' } : {}),
  [theme.breakpoints.down('lg')]: {
    position: 'relative',
    width: '100% !important',
    height: metadataVisible ? 'calc(100vw * 0.8)' : '100vh',
    transition: 'height 0.35s'
  }
}))

/* eslint-disable @typescript-eslint/naming-convention */
const ImageWrapper = styled(Box)({
  width: '100%',
  height: '100%',
  backgroundColor: 'black',
  '& img': {
    width: '100%',
    height: '100%',
    objectFit: 'contain'
  }
})
/* eslint-enable @typescript-eslint/naming-convention */

const Gradient = styled(Box)({
  width: '100%',
  height: 100,
  position: 'absolute',
  top: 0,
  left: 0,
  opacity: 0.7,
  background: 'linear-gradient(180deg, #161518 0%, rgba(22, 21, 24, 0) 100%)',
  pointerEvents: 'none',
  zIndex: 1
})

const LoaderOverlay = styled(Box)({
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 2
})

export { Gradient, ImageWrapper, LoaderOverlay, ViewerContainer }
