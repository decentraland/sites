const HLS_MIME = 'application/vnd.apple.mpegurl'

/**
 * Attaches an HLS stream to a video element: natively where the browser plays HLS,
 * otherwise through a lazily imported hls.js.
 *
 * @returns A cleanup that releases hls.js; a no-op on the native path.
 * @throws When the browser supports neither native HLS nor hls.js.
 */
const attachHls = async (video: HTMLVideoElement, src: string): Promise<() => void> => {
  if (video.canPlayType(HLS_MIME)) {
    video.src = src
    return () => undefined
  }
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const { default: Hls } = await import('hls.js')
  if (!Hls.isSupported()) throw new Error('HLS is not supported')
  const hls = new Hls()
  hls.loadSource(src)
  hls.attachMedia(video)
  return () => hls.destroy()
}

export { attachHls }
