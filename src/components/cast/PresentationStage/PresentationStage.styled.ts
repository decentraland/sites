/* eslint-disable @typescript-eslint/naming-convention */
import { VideoTrack } from '@livekit/components-react'
import { styled } from 'decentraland-ui2'

const StageContainer = styled('div')(({ theme }) => ({
  position: 'relative',
  width: '100%',
  height: '100%',
  overflow: 'hidden',
  backgroundColor: theme.palette.common.black
}))

const SlideBox = styled('div')({
  position: 'absolute'
})

const SlideImage = styled('img')({
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  userSelect: 'none',
  pointerEvents: 'none'
})

const VideoRegion = styled('div')(({ theme }) => ({
  position: 'absolute',
  backgroundColor: theme.palette.common.black,
  pointerEvents: 'none'
}))

const RegionVideo = styled(VideoTrack)({
  '&&&': {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    borderRadius: 0
  }
})

const CameraCircle = styled('div')({
  position: 'absolute',
  borderRadius: '50%',
  overflow: 'hidden',
  pointerEvents: 'none'
})

const CircleVideo = styled(VideoTrack)({
  '&&&': {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: 0
  }
})

export { CameraCircle, CircleVideo, RegionVideo, SlideBox, SlideImage, StageContainer, VideoRegion }
