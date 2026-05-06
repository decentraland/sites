import { useCallback, useEffect, useState } from 'react'

interface MediaDevice {
  deviceId: string
  label: string
  kind: MediaDeviceKind
}

interface UseMediaDevicesOptions {
  requestAudio?: boolean
  requestVideo?: boolean
  requestAudioOutput?: boolean
}

interface UseMediaDevicesResult {
  audioInputs: MediaDevice[]
  audioOutputs: MediaDevice[]
  videoInputs: MediaDevice[]
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

let cachedStream: MediaStream | null = null
let permissionsRequested = false

const useMediaDevices = (options: UseMediaDevicesOptions = {}): UseMediaDevicesResult => {
  const { requestAudio = false, requestVideo = false, requestAudioOutput = false } = options

  const [audioInputs, setAudioInputs] = useState<MediaDevice[]>([])
  const [audioOutputs, setAudioOutputs] = useState<MediaDevice[]>([])
  const [videoInputs, setVideoInputs] = useState<MediaDevice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchDevices = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      if (!permissionsRequested && (requestAudio || requestVideo)) {
        const constraints: MediaStreamConstraints = {}
        if (requestAudio) constraints.audio = true
        if (requestVideo) constraints.video = true

        try {
          if (cachedStream) {
            cachedStream.getTracks().forEach(track => track.stop())
          }
          cachedStream = await navigator.mediaDevices.getUserMedia(constraints)
          permissionsRequested = true
        } catch (err) {
          console.error('[useMediaDevices] Permission denied:', err)
          throw new Error('Permission denied to access media devices')
        }
      }

      const devices = await navigator.mediaDevices.enumerateDevices()

      const audioIns: MediaDevice[] = []
      const audioOuts: MediaDevice[] = []
      const videoIns: MediaDevice[] = []

      devices.forEach((device, index) => {
        if (!device.deviceId) return
        const mediaDevice: MediaDevice = {
          deviceId: device.deviceId,
          label: device.label || `${device.kind} ${index + 1}`,
          kind: device.kind
        }
        if (device.kind === 'audioinput' && requestAudio) audioIns.push(mediaDevice)
        else if (device.kind === 'audiooutput' && requestAudioOutput) audioOuts.push(mediaDevice)
        else if (device.kind === 'videoinput' && requestVideo) videoIns.push(mediaDevice)
      })

      // iOS/Safari does not expose audio outputs for privacy reasons; the
      // browser routes to the system default automatically.
      if (requestAudioOutput && audioOuts.length === 0) {
        audioOuts.push({ deviceId: 'default', label: 'Default Audio Output', kind: 'audiooutput' })
      }

      setAudioInputs(audioIns)
      setAudioOutputs(audioOuts)
      setVideoInputs(videoIns)
    } catch (err) {
      const wrapped = err instanceof Error ? err : new Error('Unknown error fetching devices')
      console.error('[useMediaDevices] Error:', wrapped)
      setError(wrapped)
    } finally {
      setIsLoading(false)
    }
  }, [requestAudio, requestVideo, requestAudioOutput])

  useEffect(() => {
    fetchDevices()

    if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
      const handleDeviceChange = () => {
        fetchDevices()
      }
      navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange)
      return () => {
        if (navigator.mediaDevices && navigator.mediaDevices.removeEventListener) {
          navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange)
        }
        if (cachedStream) {
          cachedStream.getTracks().forEach(track => track.stop())
          cachedStream = null
          permissionsRequested = false
        }
      }
    }

    return () => {
      if (cachedStream) {
        cachedStream.getTracks().forEach(track => track.stop())
        cachedStream = null
        permissionsRequested = false
      }
    }
  }, [fetchDevices])

  return { audioInputs, audioOutputs, videoInputs, isLoading, error, refetch: fetchDevices }
}

export type { MediaDevice }
export { useMediaDevices }
