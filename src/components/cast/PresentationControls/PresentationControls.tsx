import { useCallback, useEffect } from 'react'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty'
import PauseIcon from '@mui/icons-material/Pause'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import StopIcon from '@mui/icons-material/Stop'
import { usePresentation } from '../../../features/cast2/contexts/PresentationContext'
import { useCastTranslation } from '../../../features/cast2/useCastTranslation'
import { Divider, NavButton, PresentationControlsOverlay, SlideInfo, UploadingOverlay, VideoButton } from './PresentationControls.styled'

export function PresentationControls() {
  const { t } = useCastTranslation()
  const { state, navigateSlide, playVideo, pauseVideo, stopVideo } = usePresentation()

  const isActive = state.status === 'active'
  const isFirstSlide = state.currentSlide === 0
  const isLastSlide = state.currentSlide === state.slideCount - 1
  const hasVideos = state.slideVideos.length > 0
  const isVideoPlaying = state.videoState === 'playing'
  const isVideoLoading = state.videoState === 'loading'

  const handleToggleVideo = useCallback(() => {
    if (isVideoLoading) return
    if (isVideoPlaying) {
      pauseVideo()
    } else {
      playVideo(0)
    }
  }, [isVideoLoading, isVideoPlaying, pauseVideo, playVideo])

  const handleStopVideo = useCallback(() => {
    if (isVideoLoading) return
    stopVideo()
  }, [isVideoLoading, stopVideo])

  // Keyboard shortcuts: arrows for navigation, space for video play/pause
  useEffect(() => {
    if (!isActive) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          if (!isFirstSlide) navigateSlide('prev')
          break
        case 'ArrowRight':
          e.preventDefault()
          if (!isLastSlide) navigateSlide('next')
          break
        case ' ':
          e.preventDefault()
          if (hasVideos) handleToggleVideo()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isActive, isFirstSlide, isLastSlide, hasVideos, navigateSlide, handleToggleVideo])

  // 'starting' is the brief window between upload completion and the bot
  // joining the room — keep the overlay up so the UI doesn't go blank.
  if (state.status === 'uploading' || state.status === 'starting') {
    return <UploadingOverlay>{t('streaming_controls.uploading_presentation')}</UploadingOverlay>
  }

  if (!isActive) {
    return null
  }

  return (
    <PresentationControlsOverlay>
      <NavButton onClick={() => navigateSlide('prev')} disabled={isFirstSlide}>
        <ChevronLeftIcon />
      </NavButton>

      <SlideInfo>
        {state.currentSlide + 1} / {state.slideCount}
      </SlideInfo>

      <NavButton onClick={() => navigateSlide('next')} disabled={isLastSlide}>
        <ChevronRightIcon />
      </NavButton>

      <Divider style={{ visibility: hasVideos ? 'visible' : 'hidden' }} />
      <VideoButton onClick={handleToggleVideo} disabled={isVideoLoading} style={{ visibility: hasVideos ? 'visible' : 'hidden' }}>
        {isVideoLoading ? <HourglassEmptyIcon /> : isVideoPlaying ? <PauseIcon /> : <PlayArrowIcon />}
      </VideoButton>
      <VideoButton
        onClick={handleStopVideo}
        disabled={isVideoLoading || state.videoState === 'idle'}
        style={{ visibility: hasVideos ? 'visible' : 'hidden' }}
      >
        <StopIcon />
      </VideoButton>
    </PresentationControlsOverlay>
  )
}
