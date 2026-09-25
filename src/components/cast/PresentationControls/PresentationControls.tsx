/* eslint-disable @typescript-eslint/naming-convention */
import { useCallback, useEffect, useId, useState } from 'react'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty'
import PauseIcon from '@mui/icons-material/Pause'
import PictureInPictureAltIcon from '@mui/icons-material/PictureInPictureAlt'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import StopIcon from '@mui/icons-material/Stop'
import type { OverlayLayout, OverlaySize } from '../../../features/cast2/cast2.types'
import { usePresentation } from '../../../features/cast2/contexts/PresentationContext'
import { useCastTranslation } from '../../../features/cast2/useCastTranslation'
import { useLocalVideoTracks } from '../../../hooks/useLocalVideoTracks'
import { DropdownItem, DropdownList } from '../common/DeviceSelector/DeviceSelector.styled'
import {
  Divider,
  NavButton,
  OverlayMenuButton,
  OverlayMenuDivider,
  PresentationControlsOverlay,
  SlideInfo,
  UploadingOverlay,
  VideoButton
} from './PresentationControls.styled'

const OVERLAY_SIZES: OverlaySize[] = ['small', 'large']

const OVERLAY_CORNERS = [
  { key: 'top_left', x: 0, y: 0 },
  { key: 'top_right', x: 1, y: 0 },
  { key: 'bottom_left', x: 0, y: 1 },
  { key: 'bottom_right', x: 1, y: 1 }
] as const

export function PresentationControls() {
  const { t } = useCastTranslation()
  const { state, navigateSlide, playVideo, pauseVideo, stopVideo, setOverlay } = usePresentation()
  const { hasLocalCamera } = useLocalVideoTracks()
  const [overlayMenuAnchor, setOverlayMenuAnchor] = useState<HTMLButtonElement | null>(null)
  const overlayTriggerId = useId()
  const overlayListId = useId()

  const isActive = state.status === 'active'
  const isFirstSlide = state.currentSlide === 0
  const isLastSlide = state.currentSlide === state.slideCount - 1
  const hasVideos = state.slideVideos.length > 0
  const isVideoPlaying = state.videoState === 'playing'
  const isVideoLoading = state.videoState === 'loading'
  const isOverlayMenuOpen = overlayMenuAnchor !== null

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

  const handleOverlayMenuOpen = useCallback((event: React.MouseEvent<HTMLButtonElement>) => setOverlayMenuAnchor(event.currentTarget), [])
  const handleOverlayMenuClose = useCallback(() => setOverlayMenuAnchor(null), [])

  const handleOverlaySelect = useCallback(
    (patch: Partial<OverlayLayout>) => {
      setOverlay(patch)
      setOverlayMenuAnchor(null)
    },
    [setOverlay]
  )

  useEffect(() => {
    if (!hasLocalCamera || !isActive) setOverlayMenuAnchor(null)
  }, [hasLocalCamera, isActive])

  useEffect(() => {
    if (!isActive) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (overlayMenuAnchor) return
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
  }, [isActive, isFirstSlide, isLastSlide, hasVideos, navigateSlide, handleToggleVideo, overlayMenuAnchor])

  // 'starting' is the brief window between upload completion and the bot
  // joining the room — keep the overlay up so the UI doesn't go blank.
  if (state.status === 'uploading' || state.status === 'starting') {
    return <UploadingOverlay>{t('streaming_controls.uploading_presentation')}</UploadingOverlay>
  }

  if (!isActive) {
    return null
  }

  const overlayMenuLabel = t('streaming_controls.camera_overlay.menu_button')

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

      {hasLocalCamera && (
        <>
          <Divider />
          <OverlayMenuButton
            id={overlayTriggerId}
            type="button"
            aria-label={overlayMenuLabel}
            title={overlayMenuLabel}
            aria-haspopup="menu"
            aria-expanded={isOverlayMenuOpen}
            aria-controls={isOverlayMenuOpen ? overlayListId : undefined}
            onClick={handleOverlayMenuOpen}
          >
            <PictureInPictureAltIcon />
          </OverlayMenuButton>
          <DropdownList
            anchorEl={overlayMenuAnchor}
            open={isOverlayMenuOpen}
            onClose={handleOverlayMenuClose}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            MenuListProps={{ id: overlayListId, ['aria-labelledby']: overlayTriggerId }}
          >
            {OVERLAY_SIZES.map(size => (
              <DropdownItem
                key={size}
                role="menuitemradio"
                aria-checked={state.overlay.size === size}
                selected={state.overlay.size === size}
                onClick={() => handleOverlaySelect({ size })}
              >
                {t(`streaming_controls.camera_overlay.size_${size}`)}
              </DropdownItem>
            ))}
            <OverlayMenuDivider role="separator" />
            {OVERLAY_CORNERS.map(corner => {
              const isCurrentCorner = state.overlay.x === corner.x && state.overlay.y === corner.y
              return (
                <DropdownItem
                  key={corner.key}
                  role="menuitemradio"
                  aria-checked={isCurrentCorner}
                  selected={isCurrentCorner}
                  onClick={() => handleOverlaySelect({ x: corner.x, y: corner.y })}
                >
                  {t(`streaming_controls.camera_overlay.${corner.key}`)}
                </DropdownItem>
              )
            })}
          </DropdownList>
        </>
      )}
    </PresentationControlsOverlay>
  )
}
