import { useEffect, useRef, useState } from 'react'
import { useLocalParticipant, useTracks } from '@livekit/components-react'
import { RoomEvent, Track } from 'livekit-client'
import { getPresenterServerUrl } from '../../../features/cast2/cast2.helpers'
import { MIN_CIRCLE_DIAMETER, containRect, overlayRect } from '../../../features/cast2/cast2.overlay'
import { isAllowedSlideUrl } from '../../../features/cast2/cast2.slideUrl'
import { PRESENTATION_VIDEO_TRACK } from '../../../features/cast2/cast2.utils'
import { usePresentation } from '../../../features/cast2/contexts/PresentationContext'
import { useCastTranslation } from '../../../features/cast2/useCastTranslation'
import type { PresentationStageProps } from './PresentationStage.types'
import { CameraCircle, CircleVideo, RegionVideo, SlideBox, SlideImage, StageContainer, VideoRegion } from './PresentationStage.styled'

const TRACK_SOURCES = [Track.Source.Camera, Track.Source.ScreenShare]
const TRACK_OPTIONS = { updateOnlyOn: [RoomEvent.TrackMuted, RoomEvent.TrackUnmuted] }

const percent = (value: number, total: number): string => `${(value / total) * 100}%`

/** Composites a client-composed (v2) presentation: slide image, embedded-video track and presenter camera. */
function PresentationStage({ overlay }: PresentationStageProps) {
  const { t } = useCastTranslation()
  const { state, presentationParticipantIdentity } = usePresentation()
  const { localParticipant } = useLocalParticipant()
  const tracks = useTracks(TRACK_SOURCES, TRACK_OPTIONS)
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [failedSlideUrl, setFailedSlideUrl] = useState<string | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const measure = () => setSize({ width: container.clientWidth, height: container.clientHeight })
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  const { slide } = state
  if (!slide || size.width === 0 || size.height === 0) return <StageContainer ref={containerRef} />

  const box = containRect(size.width, size.height, slide.width, slide.height)

  const showSlide = failedSlideUrl !== slide.url && isAllowedSlideUrl(slide.url, getPresenterServerUrl())
  const handleSlideError = () => {
    console.warn('[presentation] slide image failed to load')
    setFailedSlideUrl(slide.url)
  }

  const videoTrackRef = tracks.find(
    ref =>
      ref.participant.identity === presentationParticipantIdentity &&
      ref.source === Track.Source.ScreenShare &&
      ref.publication.trackName === PRESENTATION_VIDEO_TRACK
  )
  const playingVideo =
    state.playingVideoIndex !== null && (state.videoState === 'playing' || state.videoState === 'paused')
      ? state.slideVideos[state.playingVideoIndex]
      : undefined

  // NOTE: the `!participant.isLocal` check was dropped (2026-10); the presenterIdentity guard already excludes the local participant.
  const cameraTrackRef =
    state.presenterIdentity && state.presenterIdentity !== localParticipant.identity
      ? tracks.find(
          ref => ref.participant.identity === state.presenterIdentity && ref.source === Track.Source.Camera && !ref.publication.isMuted
        )
      : undefined
  const circle = overlayRect(state.overlay, slide.width, slide.height)

  return (
    <StageContainer ref={containerRef}>
      <SlideBox style={box}>
        {showSlide ? (
          <SlideImage src={slide.url} alt={t('streaming_controls.presentation')} draggable={false} onError={handleSlideError} />
        ) : null}
        {playingVideo && videoTrackRef ? (
          <VideoRegion
            style={{
              left: percent(playingVideo.geometry.x, slide.width),
              top: percent(playingVideo.geometry.y, slide.height),
              width: percent(playingVideo.geometry.width, slide.width),
              height: percent(playingVideo.geometry.height, slide.height)
            }}
          >
            <RegionVideo trackRef={videoTrackRef} />
          </VideoRegion>
        ) : null}
        {cameraTrackRef && circle.d >= MIN_CIRCLE_DIAMETER ? (
          <CameraCircle
            style={{
              left: percent(circle.left, slide.width),
              top: percent(circle.top, slide.height),
              width: percent(circle.d, slide.width),
              height: percent(circle.d, slide.height)
            }}
          >
            <CircleVideo trackRef={cameraTrackRef} />
          </CameraCircle>
        ) : null}
        {overlay}
      </SlideBox>
    </StageContainer>
  )
}

export { PresentationStage }
