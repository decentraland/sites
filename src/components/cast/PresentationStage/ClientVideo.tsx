import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button } from 'decentraland-ui2'
import { targetPositionMs, toClientPlayerSource } from '../../../features/cast2/cast2.clientVideo'
import { usePresentation } from '../../../features/cast2/contexts/PresentationContext'
import { useCastTranslation } from '../../../features/cast2/useCastTranslation'
import { attachHls } from './hlsSource'
import { createYouTubePlayer, loadYouTubeApi } from './youtubePlayer'
import type { ClientVideoProps } from './ClientVideo.types'
import type { ClientPlayerEvents, ClientPlayerHandle } from './PresentationStage.types'
import { PlayerContainer, PlayerVideo, UnmuteSlot } from './ClientVideo.styled'

const DRIFT_MS = 2000
const SYNC_INTERVAL_MS = 5000

const videoElementPlayer = (
  video: HTMLVideoElement,
  events: Pick<ClientPlayerEvents, 'onAutoplayBlocked' | 'onError'>
): ClientPlayerHandle => ({
  play: () => {
    const attemptWasMuted = video.muted
    video.play().catch((error: unknown) => {
      const name = error instanceof DOMException ? error.name : ''
      if (name === 'NotAllowedError') events.onAutoplayBlocked(attemptWasMuted)
      else if (name !== 'AbortError') events.onError()
    })
  },
  pause: () => video.pause(),
  seekTo: ms => {
    video.currentTime = ms / 1000
  },
  currentTimeMs: () => video.currentTime * 1000,
  durationMs: () => (Number.isFinite(video.duration) ? video.duration * 1000 : null),
  isPlaying: () => !video.paused,
  isBusy: () => video.seeking || video.readyState < HTMLMediaElement.HAVE_FUTURE_DATA,
  setMuted: muted => {
    video.muted = muted
  },
  destroy: () => video.pause()
})

/** Plays a client-played slide video (YouTube, Drive file or HLS) in sync with the presentation state. */
function ClientVideo({ video, muted }: ClientVideoProps) {
  const { t } = useCastTranslation()
  const { state } = usePresentation()
  const { videoState, videoPositionMs, videoPositionAt } = state
  const source = useMemo(() => toClientPlayerSource(video.url), [video.url])
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const handleRef = useRef<ClientPlayerHandle | null>(null)
  const endedRef = useRef(false)
  const videoStateRef = useRef(videoState)
  const viewerUnmutedRef = useRef(false)
  const [ready, setReady] = useState(false)
  const [autoplayMuted, setAutoplayMuted] = useState(false)
  const [failed, setFailed] = useState(false)

  const handleReady = useCallback(() => setReady(true), [])
  const handleEnded = useCallback(() => {
    endedRef.current = true
  }, [])
  const handleFailure = useCallback(() => {
    console.warn('[presentation] client video failed', source?.kind)
    setFailed(true)
  }, [source])
  const handleAutoplayBlocked = useCallback(
    (attemptWasMuted: boolean) => {
      const handle = handleRef.current
      if (!handle || viewerUnmutedRef.current) return
      if (attemptWasMuted) {
        handleFailure()
        return
      }
      setAutoplayMuted(true)
      handle.setMuted(true)
      if (videoStateRef.current === 'playing') handle.play()
    },
    [handleFailure]
  )
  const handleUnmute = () => {
    viewerUnmutedRef.current = true
    setAutoplayMuted(false)
  }

  useEffect(() => {
    videoStateRef.current = videoState
  }, [videoState])

  useEffect(() => {
    const container = containerRef.current
    const element = videoRef.current
    if (!source || failed) return
    const events = { onReady: handleReady, onEnded: handleEnded, onError: handleFailure, onAutoplayBlocked: handleAutoplayBlocked }
    let cancelled = false
    let releaseHls: (() => void) | undefined
    const failUnlessCancelled = () => {
      if (!cancelled) handleFailure()
    }
    if (source.kind === 'youtube' && container) {
      container.setAttribute('inert', '')
      loadYouTubeApi()
        .then(() => {
          if (!cancelled) handleRef.current = createYouTubePlayer(container, source.id, events)
        })
        .catch(failUnlessCancelled)
    } else if (element) {
      handleRef.current = videoElementPlayer(element, events)
      if (source.kind === 'hls') {
        attachHls(element, source.src, failUnlessCancelled).then(release => {
          if (cancelled) release()
          else releaseHls = release
        }, failUnlessCancelled)
      }
    }
    return () => {
      cancelled = true
      handleRef.current?.destroy()
      handleRef.current = null
      releaseHls?.()
    }
  }, [source, failed, handleReady, handleEnded, handleFailure, handleAutoplayBlocked])

  useEffect(() => {
    if (ready) handleRef.current?.setMuted(muted || autoplayMuted)
  }, [ready, muted, autoplayMuted])

  useEffect(() => {
    if (!ready) return
    const sync = () => {
      const handle = handleRef.current
      if (!handle || endedRef.current) return
      const target = targetPositionMs({ videoState, videoPositionMs, videoPositionAt }, Date.now())
      if (target !== null && !handle.isBusy()) {
        const duration = handle.durationMs()
        const clamped = duration === null ? target : Math.min(target, duration)
        if (Math.abs(handle.currentTimeMs() - clamped) > DRIFT_MS) handle.seekTo(clamped)
      }
      if (videoState === 'playing' && !handle.isPlaying()) handle.play()
      if (videoState === 'paused') handle.pause()
    }
    sync()
    if (videoState !== 'playing') return
    const timer = setInterval(sync, SYNC_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [ready, videoState, videoPositionMs, videoPositionAt])

  if (!source || failed) return null

  const unmuteLabel = t('streaming_controls.click_to_unmute')

  return (
    <>
      {source.kind === 'youtube' ? (
        <PlayerContainer ref={containerRef} />
      ) : (
        <PlayerVideo
          ref={videoRef}
          playsInline
          preload="auto"
          src={source.kind === 'file' ? source.src : undefined}
          onCanPlay={handleReady}
          onEnded={handleEnded}
          onError={handleFailure}
        />
      )}
      {autoplayMuted ? (
        <UnmuteSlot>
          <Button variant="contained" size="small" aria-label={unmuteLabel} onClick={handleUnmute}>
            {unmuteLabel}
          </Button>
        </UnmuteSlot>
      ) : null}
    </>
  )
}

export { ClientVideo }
