const HLS_MIME = 'application/vnd.apple.mpegurl'

/**
 * Attaches an HLS stream to a video element: natively where the browser plays HLS,
 * otherwise through a lazily imported hls.js.
 *
 * @param onFatal - Called when hls.js reports an error it cannot recover from.
 * @returns A cleanup that releases hls.js; a no-op on the native path.
 * @throws When the browser supports neither native HLS nor hls.js.
 */
const attachHls = async (video: HTMLVideoElement, src: string, onFatal: () => void): Promise<() => void> => {
  if (video.canPlayType(HLS_MIME)) {
    video.src = src
    return () => undefined
  }
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const { default: Hls } = await import('hls.js')
  if (!Hls.isSupported()) throw new Error('HLS is not supported')
  const hls = new Hls()
  let recovered = false
  hls.on(Hls.Events.ERROR, (_event, data) => {
    if (!data.fatal) return
    if (!recovered && data.type === Hls.ErrorTypes.NETWORK_ERROR) {
      recovered = true
      hls.startLoad()
    } else if (!recovered && data.type === Hls.ErrorTypes.MEDIA_ERROR) {
      recovered = true
      hls.recoverMediaError()
    } else {
      onFatal()
    }
  })
  hls.loadSource(src)
  hls.attachMedia(video)
  return () => hls.destroy()
}

export { attachHls }
