/* eslint-disable @typescript-eslint/naming-convention */
import { type ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useRemoteParticipants, useRoomContext } from '@livekit/components-react'
import { RemoteParticipant, RoomEvent } from 'livekit-client'
import { useGetPresentationBotTokenMutation, useUploadPresentationFromUrlMutation, useUploadPresentationMutation } from '../cast2.client'
import type { OverlayLayout, PresentationInfo, SlideInfo, SlideVideoInfo } from '../cast2.types'
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
  slide: SlideInfo | null
  presenterIdentity: string | null
  playingVideoIndex: number | null
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

type PresentationBotMetadata = Record<string, unknown> & { role: 'presentation'; id?: string }

type IncomingState = Omit<PresentationState, 'status'>

const VIDEO_STATES: PresentationState['videoState'][] = ['idle', 'loading', 'playing', 'paused']

const initialState: PresentationState = {
  id: null,
  slideCount: 0,
  currentSlide: 0,
  fileType: null,
  status: 'idle',
  slideVideos: [],
  videoState: 'idle',
  overlay: DEFAULT_OVERLAY,
  slide: null,
  presenterIdentity: null,
  playingVideoIndex: null
}

const toOverlay = (value: unknown): OverlayLayout => {
  if (typeof value !== 'object' || value === null) return DEFAULT_OVERLAY
  const { x, y, size } = value as Record<string, unknown>
  return typeof x === 'number' &&
    Number.isFinite(x) &&
    typeof y === 'number' &&
    Number.isFinite(y) &&
    (size === 'small' || size === 'large')
    ? { x, y, size }
    : DEFAULT_OVERLAY
}

const toVideoState = (value: unknown): PresentationState['videoState'] => VIDEO_STATES.find(videoState => videoState === value) ?? 'idle'

const isPositiveFinite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0

const toSlideInfo = (value: unknown): SlideInfo | null => {
  if (typeof value !== 'object' || value === null) return null
  const { url, width, height } = value as Record<string, unknown>
  return typeof url === 'string' && url !== '' && isPositiveFinite(width) && isPositiveFinite(height) ? { url, width, height } : null
}

const toPresenterIdentity = (value: unknown): string | null => (typeof value === 'string' && value !== '' ? value : null)

const toPlayingVideoIndex = (value: unknown): number | null =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : null

const isSlideVideo = (value: unknown): value is SlideVideoInfo => {
  if (typeof value !== 'object' || value === null) return false
  const { url, geometry } = value as Record<string, unknown>
  if (typeof url !== 'string' || typeof geometry !== 'object' || geometry === null) return false
  const { x, y, width, height } = geometry as Record<string, unknown>
  return [x, y, width, height].every(Number.isFinite)
}

const toSlideVideos = (value: unknown): SlideVideoInfo[] => (Array.isArray(value) && value.every(isSlideVideo) ? value : [])

const toIncomingState = (id: string, data: Record<string, unknown>): IncomingState => ({
  id,
  slideCount: typeof data.slideCount === 'number' ? data.slideCount : 0,
  currentSlide: typeof data.currentSlide === 'number' ? data.currentSlide : 0,
  fileType: data.fileType === 'pdf' || data.fileType === 'pptx' ? data.fileType : null,
  slideVideos: toSlideVideos(data.slideVideos),
  videoState: toVideoState(data.videoState),
  overlay: toOverlay(data.overlay),
  slide: toSlideInfo(data.slide),
  presenterIdentity: toPresenterIdentity(data.presenterIdentity),
  playingVideoIndex: toPlayingVideoIndex(data.playingVideoIndex)
})

const sameOverlay = (a: OverlayLayout, b: OverlayLayout): boolean =>
  Math.abs(a.x - b.x) < 0.001 && Math.abs(a.y - b.y) < 0.001 && a.size === b.size

const isPresentationStateMessage = (data: unknown): data is Record<string, unknown> & { type: 'presentation:state'; id: string } => {
  if (typeof data !== 'object' || data === null) return false
  const d = data as Record<string, unknown>
  // NOTE: slideCount, currentSlide and fileType are no longer required here (2026-10); toIncomingState defaults them, so packets parse like bot metadata.
  return d.type === 'presentation:state' && typeof d.id === 'string'
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
  // NOTE: per-field checks moved to toIncomingState (2026-10), which defaults bad fields instead of rejecting the whole metadata.
  return d.role === 'presentation' && (d.id === undefined || typeof d.id === 'string')
}

const PresentationContext = createContext<PresentationContextValue | undefined>(undefined)

const PresentationProvider = ({ children, canControl = false }: { children: ReactNode; canControl?: boolean }) => {
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

  const applyIncoming = useCallback((incoming: IncomingState) => {
    setState(prev => {
      const pending = pendingOverlayRef.current
      const isHeld = pending !== null && Date.now() < pending.until
      if (!isHeld) pendingOverlayRef.current = null
      const overlay = isHeld && !sameOverlay(incoming.overlay, pending.layout) ? prev.overlay : incoming.overlay
      const next: PresentationState = { ...initialState, ...incoming, status: 'active', overlay }
      return JSON.stringify(next) === JSON.stringify(prev) ? prev : next
    })
  }, [])

  const sendCommand = useCallback(
    async (command: Record<string, unknown>): Promise<boolean> => {
      if (!room?.localParticipant) return false
      const packet = encodeCommsPacket(PRESENTATION_TOPIC, command)
      try {
        await room.localParticipant.publishData(packet, { reliable: true })
        return true
      } catch (err) {
        console.warn('[presentation] publishData failed', err)
        return false
      }
    },
    [room]
  )

  const { presentationParticipantIdentity, botMetadataJson } = useMemo(() => {
    let firstBotIdentity: string | null = null
    for (const p of remoteParticipants) {
      if (!isPresentationBot(p)) continue
      firstBotIdentity ??= p.identity
      if (isPresentationBotMetadata(parseParticipantMetadata(p))) {
        return { presentationParticipantIdentity: p.identity, botMetadataJson: p.metadata ?? null }
      }
    }
    return { presentationParticipantIdentity: firstBotIdentity, botMetadataJson: null }
  }, [remoteParticipants])

  const botIncoming = useMemo(() => {
    const metadata = parseParticipantMetadata<PresentationBotMetadata>({ metadata: botMetadataJson ?? undefined })
    return metadata?.id ? toIncomingState(metadata.id, metadata) : null
  }, [botMetadataJson])
  const hasBotMetadata = botMetadataJson !== null

  useEffect(() => {
    if (!hasBotMetadata) return
    if (botIncoming) {
      applyIncoming(botIncoming)
      return
    }
    sendCommand({ type: 'presentation:get-state' })
  }, [hasBotMetadata, botIncoming, applyIncoming, sendCommand])

  const claimedForRef = useRef<string | null | undefined>(undefined)

  const presenterIdentity = state.presenterIdentity
  const hasSlide = state.slide !== null

  useEffect(() => {
    if (!canControl || !hasSlide) return
    const isPresenterInRoom =
      presenterIdentity !== null &&
      (presenterIdentity === room?.localParticipant?.identity || remoteParticipants.some(p => p.identity === presenterIdentity))
    if (isPresenterInRoom || claimedForRef.current === presenterIdentity) return
    claimedForRef.current = presenterIdentity
    sendCommand({ type: 'presentation:presenter:claim' }).then(sent => {
      if (!sent && claimedForRef.current === presenterIdentity) claimedForRef.current = undefined
    })
  }, [canControl, hasSlide, presenterIdentity, remoteParticipants, room, sendCommand])

  const showNotificationRef = useRef(notifications.show)
  showNotificationRef.current = notifications.show
  const tRef = useRef(t)
  tRef.current = t
  const sendCommandRef = useRef(sendCommand)
  sendCommandRef.current = sendCommand
  const presentationParticipantIdentityRef = useRef(presentationParticipantIdentity)
  presentationParticipantIdentityRef.current = presentationParticipantIdentity

  useEffect(() => {
    if (!room) return
    const handleData = (payload: Uint8Array, participant?: RemoteParticipant) => {
      if (!participant || participant.identity !== presentationParticipantIdentityRef.current) return
      const decoded = decodeCommsPacket(payload)
      if (!decoded || decoded.topic !== PRESENTATION_TOPIC) return

      if (isPresentationStateMessage(decoded.data)) {
        applyIncoming(toIncomingState(decoded.data.id, decoded.data))
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
  }, [room, applyIncoming])

  const runPresentationUpload = useCallback(
    async (
      upload: (livekitToken: string, livekitUrl: string, presenterIdentity: string | undefined) => Promise<PresentationInfo>,
      errorLabel: string
    ) => {
      if (uploadingRef.current) return
      uploadingRef.current = true
      setState(prev => ({ ...prev, status: 'uploading' }))

      try {
        const streamingKey = getStoredToken()
        if (!streamingKey) {
          throw new Error('No streaming key available')
        }
        const botToken = await getPresentationBotToken({ streamingKey }).unwrap()
        const info = await upload(botToken.token, botToken.url, room?.localParticipant?.identity || undefined)

        setState(prev =>
          prev.status === 'active'
            ? prev
            : { ...initialState, id: info.id, slideCount: info.slideCount, fileType: info.fileType, status: 'starting' }
        )
      } catch (err) {
        const message = err instanceof Error ? err.message : errorLabel
        setState(initialState)
        showNotificationRef.current('PresentationDownloadFailed', { message, persistent: true })
      } finally {
        uploadingRef.current = false
      }
    },
    [getPresentationBotToken, room]
  )

  const startPresentation = useCallback(
    (file: File) =>
      runPresentationUpload(
        (livekitToken, livekitUrl, presenterIdentity) =>
          uploadPresentationMutation({ file, livekitToken, livekitUrl, presenterIdentity }).unwrap(),
        'Failed to start presentation'
      ),
    [runPresentationUpload, uploadPresentationMutation]
  )

  const startPresentationFromUrl = useCallback(
    (url: string) =>
      runPresentationUpload(
        (livekitToken, livekitUrl, presenterIdentity) =>
          uploadPresentationFromUrlMutation({ url, livekitToken, livekitUrl, presenterIdentity }).unwrap(),
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
