import { memo, useEffect, useRef } from 'react'
import type { VideoProps } from './Video.types'

const Video = memo((props: VideoProps) => {
  const { play, source, className, ...videoProps } = props
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (!ref.current || typeof play !== 'boolean') {
      return
    }

    const video = ref.current
    const isPlaying = video.currentTime > 0 && !video.paused && !video.ended && video.readyState > video.HAVE_CURRENT_DATA

    if (play) {
      if (isPlaying) return
      const playVideo = async () => {
        try {
          await video.play()
        } catch (err) {
          if (err instanceof Error && err.name === 'AbortError') {
            video.muted = true
            try {
              await video.play()
            } catch (retryErr) {
              console.error('Could not play video:', retryErr)
            }
          } else {
            console.error('Could not play video:', err)
          }
        }
      }
      playVideo()
    } else {
      if (!isPlaying) return
      video.pause()
    }
  }, [play, source])

  return <video {...videoProps} ref={ref} src={source} className={className} />
})

export { Video }
