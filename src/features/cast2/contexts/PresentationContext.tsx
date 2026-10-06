/* eslint-disable @typescript-eslint/naming-convention */
import { type ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useRemoteParticipants, useRoomContext } from '@livekit/components-react'
import { RemoteParticipant, RoomEvent } from 'livekit-client'
import { useGetPresentationBotTokenMutation, useUploadPresentationFromUrlMutation, useUploadPresentationMutation } from '../cast2.client'
import type { OverlayLayout, PresentationInfo, SlideVideoInfo } from '../cast2.types'
import { getStreamerToken as getStoredToken, isPresentationBot, isRetryableVideoErrorCode, parseParticipantMetadata } from '../cast2.utils'
import { decodeCommsPacket, encodeCommsPacket } from '../commsProtocol'
import { useCastTranslation } from '../useCastTranslation'
import { useNotifications } from './NotificationContext'

interface PresentationState {
  id: string | null
  slideCount: number
  currentSlide: number
  fileType: 'pdf' | 'pptx' | null
  status: 'idle' | 'uploading' | 'starting' | 'active'
  slideVideos: SlideVideoInfo[]
  videoState: 'idle' | 'loading' | 'playing' | 'paused'
  overlay: OverlayLayout
}

interface PresentationContextValue {
  state: PresentationState
  startPresentation: (file: File) => Promise<void>
  startPresentationFromUrl: (url: string) => Promise<void>
  navigateSlide: (action: 'next' | 'prev') => Promise<void>
  goToSlide: (index: number) => Promise<void>
  playVideo: (videoIndex: number) => Promise<void>
  pauseVideo: () => Promise<void>
  stopVideo: () => Promise<void>
  setOverlay: (patch: Partial<OverlayLayout>) => Promise<void>
  stopPresentation: () => Promise<void>
  isPresentationActive: boolean
  presentationParticipantIdentity: string | null
}

const PRESENTATION_TOPIC = 'presentation'
const DEFAULT_OVERLAY: OverlayLayout = { x: 0, y: 1, size: 'small' }
const OVERLAY_HOLD_MS = 1000

interface PresentationBotMetadata {
  role: 'presentation'
  id?: string
  slideCount?: number
  currentSlide?: number
  fileType?: 'pdf' | 'pptx'
  videoState?: PresentationState['videoState']
  slideVideos?: SlideVideoInfo[]
  overlay?: unknown
}

const initialState: PresentationState = {
  id: null,
  slideCount: 0,
  currentSlide: 0,
  fileType: null,
  status: 'idle',
  slideVideos: [],
  videoState: 'idle',
  overlay: DEFAULT_OVERLAY
}

const isOverlayLayout = (value: unknown): value is OverlayLayout => {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return Number.isFinite(v.x) && Number.isFinite(v.y) && (v.size === 'small' || v.size === 'large')
}

const sameOverlay = (a: OverlayLayout, b: OverlayLayout): boolean =>
  Math.abs(a.x - b.x) < 0.001 && Math.abs(a.y - b.y) < 0.001 && a.size === b.size

const isPresentationStateMessage = (
  data: unknown
): data is {
  type: 'presentation:state'
  id: string
  slideCount: number
  currentSlide: number
  fileType: 'pdf' | 'pptx'
  slideVideos?: SlideVideoInfo[]
  videoState?: PresentationState['videoState']
  overlay?: unknown
} => {
  if (typeof data !== 'object' || data === null) return false
  const d = data as Record<string, unknown>
  return (
    d.type === 'presentation:state' &&
    typeof d.id === 'string' &&
    typeof d.slideCount === 'number' &&
    typeof d.currentSlide === 'number' &&
    (d.fileType === 'pdf' || d.fileType === 'pptx')
  )
}

const isPresentationStoppedMessage = (data: unknown): data is { type: 'presentation:stopped' } =>
  typeof data === 'object' && data !== null && (data as Record<string, unknown>).type === 'presentation:stopped'

const isPresentationErrorMessage = (
  data: unknown
): data is {
  type: 'presentation:error'
  code: string
  message: string
  videoIndex?: number
  videoUrl?: string
} => {
  if (typeof data !== 'object' || data === null) return false
  const d = data as Record<string, unknown>
  if (d.type !== 'presentation:error') return false
  if (typeof d.code !== 'string') return false
  if (typeof d.message !== 'string') return false
  if (d.videoIndex !== undefined && typeof d.videoIndex !== 'number') return false
  if (d.videoUrl !== undefined && typeof d.videoUrl !== 'string') return false
  return true
}

const isPresentationBotMetadata = (data: unknown): data is PresentationBotMetadata => {
  if (typeof data !== 'object' || data === null) return false
  const d = data as Record<string, unknown>
  if (d.role !== 'presentation') return false
  if (d.id !== undefined && typeof d.id !== 'string') return false
  if (d.slideCount !== undefined && typeof d.slideCount !== 'number') return false
  if (d.currentSlide !== undefined && typeof d.currentSlide !== 'number') return false
  if (d.fileType !== undefined && d.fileType !== 'pdf' && d.fileType !== 'pptx') return false
  if (
    d.videoState !== undefined &&
    d.videoState !== 'idle' &&
    d.videoState !== 'loading' &&
    d.videoState !== 'playing' &&
    d.videoState !== 'paused'
  )
    return false
  if (d.slideVideos !== undefined && !Array.isArray(d.slideVideos)) return false
  return true
}

const PresentationContext = createContext<PresentationContextValue | undefined>(undefined)

const PresentationProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<PresentationState>(initialState)
  const remoteParticipants = useRemoteParticipants()
  const room = useRoomContext()
  const notifications = useNotifications()
  const { t } = useCastTranslation()

  const [getPresentationBotToken] = useGetPresentationBotTokenMutation()
  const [uploadPresentationMutation] = useUploadPresentationMutation()
  const [uploadPresentationFromUrlMutation] = useUploadPresentationFromUrlMutation()

  const idRef = useRef<string | null>(null)
  idRef.current = state.id
  const uploadingRef = useRef(false)
  const pendingOverlayRef = useRef<{ layout: OverlayLayout; until: number } | null>(null)

  const resolveIncomingOverlay = (prev: OverlayLayout, incoming: OverlayLayout): OverlayLayout => {
    const pending = pendingOverlayRef.current
    if (!pending) return incoming
    if (Date.now() >= pending.until) {
      pendingOverlayRef.current = null
      return incoming
    }
    return sameOverlay(incoming, pending.layout) ? incoming : prev
  }

  const sendCommand = useCallback(
    async (command: Record<string, unknown>) => {
      if (!room?.localParticipant) return
      const packet = encodeCommsPacket(PRESENTATION_TOPIC, command)
      try {
        await room.localParticipant.publishData(packet, { reliable: true })
      } catch (err) {
        console.warn('[presentation] publishData failed', err)
      }
    },
    [room]
  )

  const { presentationParticipantIdentity, botMetadata } = useMemo<{
    presentationParticipantIdentity: string | null
    botMetadata: PresentationBotMetadata | null
  }>(() => {
    for (const p of remoteParticipants) {
      const parsed = parseParticipantMetadata(p)
      if (isPresentationBotMetadata(parsed)) {
        return { presentationParticipantIdentity: p.identity, botMetadata: parsed }
      }
    }
    return { presentationParticipantIdentity: null, botMetadata: null }
  }, [remoteParticipants])

  const botId = botMetadata?.id ?? null
  const botSlideCount = botMetadata?.slideCount ?? 0
  const botCurrentSlide = botMetadata?.currentSlide ?? 0
  const botFileType = botMetadata?.fileType ?? null
  const botVideoState = botMetadata?.videoState ?? 'idle'
  const {
    x: botOverlayX,
    y: botOverlayY,
    size: botOverlaySize
  } = isOverlayLayout(botMetadata?.overlay) ? botMetadata.overlay : DEFAULT_OVERLAY
  const botSlideVideosJson = useMemo(() => JSON.stringify(botMetadata?.slideVideos ?? []), [botMetadata])
  const hasBotMetadata = botMetadata !== null

  useEffect(() => {
    if (!hasBotMetadata) return
    if (botId) {
      setState(prev => {
        const overlay = resolveIncomingOverlay(prev.overlay, { x: botOverlayX, y: botOverlayY, size: botOverlaySize })
        if (
          prev.status === 'active' &&
          prev.id === botId &&
          prev.currentSlide === botCurrentSlide &&
          prev.slideCount === botSlideCount &&
          prev.fileType === botFileType &&
          prev.videoState === botVideoState &&
          JSON.stringify(prev.slideVideos) === botSlideVideosJson &&
          prev.overlay === overlay
        ) {
          return prev
        }
        return {
          id: botId,
          slideCount: botSlideCount,
          currentSlide: botCurrentSlide,
          fileType: botFileType,
          status: 'active',
          slideVideos: JSON.parse(botSlideVideosJson),
          videoState: botVideoState,
          overlay
        }
      })
      return
    }
    sendCommand({ type: 'presentation:get-state' })
  }, [
    hasBotMetadata,
    botId,
    botSlideCount,
    botCurrentSlide,
    botFileType,
    botVideoState,
    botSlideVideosJson,
    botOverlayX,
    botOverlayY,
    botOverlaySize,
    sendCommand
  ])

  const showNotificationRef = useRef(notifications.show)
  showNotificationRef.current = notifications.show
  const tRef = useRef(t)
  tRef.current = t
  const sendCommandRef = useRef(sendCommand)
  sendCommandRef.current = sendCommand

  useEffect(() => {
    if (!room) return
    const handleData = (payload: Uint8Array, participant?: RemoteParticipant) => {
      if (!participant || !isPresentationBot(participant)) return
      const decoded = decodeCommsPacket(payload)
      if (!decoded || decoded.topic !== PRESENTATION_TOPIC) return

      if (isPresentationStateMessage(decoded.data)) {
        const stateMessage = decoded.data
        setState(prev => ({
          id: stateMessage.id,
          slideCount: stateMessage.slideCount,
          currentSlide: stateMessage.currentSlide,
          fileType: stateMessage.fileType,
          status: 'active',
          slideVideos: stateMessage.slideVideos ?? [],
          videoState: stateMessage.videoState ?? 'idle',
          overlay: resolveIncomingOverlay(prev.overlay, isOverlayLayout(stateMessage.overlay) ? stateMessage.overlay : DEFAULT_OVERLAY)
        }))
      } else if (isPresentationStoppedMessage(decoded.data)) {
        setState(initialState)
      } else if (isPresentationErrorMessage(decoded.data)) {
        const { code, message, videoIndex } = decoded.data
        const action =
          isRetryableVideoErrorCode(code) && typeof videoIndex === 'number'
            ? {
                label: tRef.current('notifications.retry'),
                onClick: () => {
                  sendCommandRef.current({ type: 'presentation:video:play', videoIndex })
                }
              }
            : undefined
        showNotificationRef.current('VideoPlaybackFailed', { message, code, action })
      }
    }
    room.on(RoomEvent.DataReceived, handleData)
    return () => {
      room.off(RoomEvent.DataReceived, handleData)
    }
  }, [room])

  const runPresentationUpload = useCallback(
    async (upload: (livekitToken: string, livekitUrl: string) => Promise<PresentationInfo>, errorLabel: string) => {
      if (uploadingRef.current) return
      uploadingRef.current = true
      setState(prev => ({ ...prev, status: 'uploading' }))

      try {
        const streamingKey = getStoredToken()
        if (!streamingKey) {
          throw new Error('No streaming key available')
        }
        const botToken = await getPresentationBotToken({ streamingKey }).unwrap()
        const info = await upload(botToken.token, botToken.url)

        setState(prev =>
          prev.status === 'active'
            ? prev
            : {
                id: info.id,
                slideCount: info.slideCount,
                currentSlide: 0,
                fileType: info.fileType,
                status: 'starting',
                slideVideos: [],
                videoState: 'idle',
                overlay: DEFAULT_OVERLAY
              }
        )
      } catch (err) {
        const message = err instanceof Error ? err.message : errorLabel
        setState(initialState)
        showNotificationRef.current('PresentationDownloadFailed', { message, persistent: true })
      } finally {
        uploadingRef.current = false
      }
    },
    [getPresentationBotToken]
  )

  const startPresentation = useCallback(
    (file: File) =>
      runPresentationUpload(
        (livekitToken, livekitUrl) => uploadPresentationMutation({ file, livekitToken, livekitUrl }).unwrap(),
        'Failed to start presentation'
      ),
    [runPresentationUpload, uploadPresentationMutation]
  )

  const startPresentationFromUrl = useCallback(
    (url: string) =>
      runPresentationUpload(
        (livekitToken, livekitUrl) => uploadPresentationFromUrlMutation({ url, livekitToken, livekitUrl }).unwrap(),
        'Failed to start presentation from URL'
      ),
    [runPresentationUpload, uploadPresentationFromUrlMutation]
  )

  const navigateSlide = useCallback(
    async (action: 'next' | 'prev') => {
      if (!idRef.current) return
      await sendCommand({ type: 'presentation:navigate', action })
    },
    [sendCommand]
  )

  const goToSlide = useCallback(
    async (index: number) => {
      if (!idRef.current) return
      await sendCommand({ type: 'presentation:navigate', action: 'goto', slideIndex: index })
    },
    [sendCommand]
  )

  const playVideo = useCallback(
    async (videoIndex: number) => {
      if (!idRef.current) return
      await sendCommand({ type: 'presentation:video:play', videoIndex })
    },
    [sendCommand]
  )

  const pauseVideo = useCallback(async () => {
    if (!idRef.current) return
    await sendCommand({ type: 'presentation:video:pause' })
  }, [sendCommand])

  const stopVideo = useCallback(async () => {
    if (!idRef.current) return
    await sendCommand({ type: 'presentation:video:stop' })
  }, [sendCommand])

  const setOverlay = useCallback(
    async (patch: Partial<OverlayLayout>) => {
      if (!idRef.current) return
      setState(prev => {
        const overlay = { ...prev.overlay, ...patch }
        pendingOverlayRef.current = { layout: overlay, until: Date.now() + OVERLAY_HOLD_MS }
        return { ...prev, overlay }
      })
      await sendCommand({ type: 'presentation:overlay:update', ...patch })
    },
    [sendCommand]
  )

  const stopPresentationHandler = useCallback(async () => {
    if (!idRef.current) return
    await sendCommand({ type: 'presentation:stop' })
  }, [sendCommand])

  useEffect(() => {
    if (state.status === 'active' && !presentationParticipantIdentity) {
      setState(initialState)
    }
  }, [presentationParticipantIdentity, state.status])

  const value = useMemo<PresentationContextValue>(
    () => ({
      state,
      startPresentation,
      startPresentationFromUrl,
      navigateSlide,
      goToSlide,
      playVideo,
      pauseVideo,
      stopVideo,
      setOverlay,
      stopPresentation: stopPresentationHandler,
      isPresentationActive: state.status === 'active' || state.status === 'starting',
      presentationParticipantIdentity
    }),
    [
      state,
      startPresentation,
      startPresentationFromUrl,
      navigateSlide,
      goToSlide,
      playVideo,
      pauseVideo,
      stopVideo,
      setOverlay,
      stopPresentationHandler,
      presentationParticipantIdentity
    ]
  )

  return <PresentationContext.Provider value={value}>{children}</PresentationContext.Provider>
}

const usePresentation = (): PresentationContextValue => {
  const context = useContext(PresentationContext)
  if (!context) {
    throw new Error('usePresentation must be used within PresentationProvider')
  }
  return context
}

const usePresentationOptional = (): PresentationContextValue | null => useContext(PresentationContext) ?? null

export { PresentationProvider, usePresentation, usePresentationOptional }
export type { PresentationContextValue, PresentationState }
