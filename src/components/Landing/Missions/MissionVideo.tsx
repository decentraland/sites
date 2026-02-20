import { memo } from 'react'
import { useVideoOptimization } from '../../../hooks/contentful'
import { MissionsProps } from './Missions.types'
import { MissionContent, MissionVideo as StyledMissionVideo } from './MissionVideo.styled'

const MissionVideo = memo((props: MissionsProps & { isSectionInView: boolean }) => {
  const { videoLandscape, videoPortrait, isDesktop, isSectionInView } = props
  const videoLandscapeOptimized = useVideoOptimization(videoLandscape?.url)
  const videoPortraitOptimized = useVideoOptimization(videoPortrait?.url)

  return (
    <MissionContent>
      {isDesktop && videoLandscape && (
        <StyledMissionVideo
          loop
          muted
          play={isSectionInView}
          preload={isSectionInView ? 'metadata' : 'none'}
          playsInline={true}
          width={videoLandscape.width}
          height={videoLandscape.height}
          isInView={isSectionInView}
          source={videoLandscapeOptimized || videoLandscape.url}
          type={videoLandscape.mimeType}
        />
      )}

      {!isDesktop && videoPortrait && (
        <StyledMissionVideo
          loop
          muted
          play={isSectionInView}
          preload={isSectionInView ? 'metadata' : 'none'}
          playsInline={true}
          width={videoPortrait.width}
          height={videoPortrait.height}
          isInView={isSectionInView}
          source={videoPortraitOptimized || videoPortrait.url}
          type={videoPortrait.mimeType}
        />
      )}
    </MissionContent>
  )
})

export { MissionVideo }
