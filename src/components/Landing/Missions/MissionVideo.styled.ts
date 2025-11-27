import { Box, styled } from 'decentraland-ui2'
import { Video } from '../../Video'

const MissionContent = styled(Box)({
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  zIndex: 1,
  width: '100%',
  height: '100%'
})

const MissionVideo = styled(Video, {
  shouldForwardProp: (prop) => prop !== 'isInView'
})<{ isInView: boolean }>(({ theme, isInView }) => {
  return {
    position: 'sticky',
    top: 0,
    right: 0,
    left: 0,
    zIndex: 2,
    width: '100%',
    height: '100vh',
    opacity: isInView ? 1 : 0,
    pointerEvents: isInView ? 'auto' : 'none',
    objectFit: 'cover',
    objectPosition: 'right',
    transition: 'opacity 1s',
    '@media (max-aspect-ratio: 16 / 9)': {
      '&.Video': {
        width: '100vw',
        height: '100vh'
      }
    },
    '@media (min-aspect-ratio: 16 / 9)': {
      '&.Video': {
        width: '100vw',
        height: '100vh'
      }
    },
    [theme.breakpoints.down('sm')]: {
      '@media (max-aspect-ratio: 16 / 9)': {
        '&.Video': {
          width: '100vw',
          height: '100vh',
          paddingBottom: '53vh'
        }
      },
      '&.Video': {
        objectFit: 'contain',
        objectPosition: 'bottom'
      }
    }
  }
})

export { MissionContent, MissionVideo }
