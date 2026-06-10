import { useCallback, useEffect, useRef } from 'react'
import { useConnectionState, useLocalParticipant } from '@livekit/components-react'
import { captureException, captureMessage } from '@sentry/browser'
import { ConnectionState, Track } from 'livekit-client'
import { useNotifications } from '../features/cast2/contexts/NotificationContext'
import { useCastTranslation } from '../features/cast2/useCastTranslation'
import { useLocalVideoTracks } from './useLocalVideoTracks'
import type { ScreenShareStats, UseScreenShareResult } from './useScreenShare.types'

const MOBILE_UA = /iPhone|iPad|iPod|Android/i

const useScreenShare = (): UseScreenShareResult => {
  const { t } = useCastTranslation()
  const notifications = useNotifications()
  const { localParticipant } = useLocalParticipant()
  const connectionState = useConnectionState()
  const { hasLocalScreenShare } = useLocalVideoTracks()

  // Distinguishes a user-initiated stop from a silent death.
  const intentionalStopRef = useRef(false)
  // Snapshot of the track at start — the publication may be gone by death time.
  const shareStartedAtRef = useRef<number | null>(null)
  const trackStatsRef = useRef<ScreenShareStats>({})
  // Previous value of hasLocalScreenShare, for true->false edge detection.
  const wasSharingRef = useRef(false)
  // Latest start fn for the toast Retry action (avoids a stale closure).
  const startScreenShareRef = useRef<() => Promise<void>>(async () => {})
  // Latest connectionState for the transition effect, without making it a dep.
  const connectionStateRef = useRef(connectionState)
  connectionStateRef.current = connectionState

  const startScreenShare = useCallback(async () => {
    if (!localParticipant) {
      console.error('[useScreenShare] No local participant for screen share')
      return
    }

    if (MOBILE_UA.test(navigator.userAgent)) {
      notifications.show('ScreenShareFailed', { message: t('streaming_controls.screen_share_mobile_not_supported') })
      return
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      console.error('[useScreenShare] Screen share not supported on this device/browser')
      notifications.show('ScreenShareFailed', { message: t('streaming_controls.screen_share_not_supported') })
      return
    }

    try {
      await localParticipant.setScreenShareEnabled(true, { audio: true })

      const publication = localParticipant.getTrackPublication(Track.Source.ScreenShare)
      const settings = publication?.track?.mediaStreamTrack?.getSettings()
      trackStatsRef.current = { width: settings?.width, height: settings?.height, frameRate: settings?.frameRate }
      shareStartedAtRef.current = Date.now()
      intentionalStopRef.current = false
    } catch (error) {
      console.error('[useScreenShare] Error enabling screen share:', error)
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          notifications.show('ScreenShareFailed', { message: t('streaming_controls.screen_share_permission_denied') })
        } else if (error.name === 'NotSupportedError') {
          notifications.show('ScreenShareFailed', { message: t('streaming_controls.screen_share_not_supported') })
        } else {
          notifications.show('ScreenShareFailed')
        }
      }
      captureException(error, { tags: { feature: 'cast', area: 'screen_share', step: 'start' } })
    }
  }, [localParticipant, notifications, t])

  startScreenShareRef.current = startScreenShare

  const stopScreenShare = useCallback(async () => {
    if (!localParticipant) return
    intentionalStopRef.current = true
    try {
      const publication = localParticipant.getTrackPublication(Track.Source.ScreenShare)
      if (publication?.track) {
        await localParticipant.unpublishTrack(publication.track)
      } else {
        await localParticipant.setScreenShareEnabled(false)
      }
    } catch (error) {
      console.error('[useScreenShare] Error stopping screen share:', error)
    }
  }, [localParticipant])

  // Detect screen-share death: recover the button (state is derived, so that is
  // automatic), and on an UNEXPECTED death notify the user + report to Sentry.
  useEffect(() => {
    const wasSharing = wasSharingRef.current
    wasSharingRef.current = hasLocalScreenShare

    // Only act on the true -> false edge.
    if (!wasSharing || hasLocalScreenShare) return

    // User asked to stop — clean exit, no toast.
    if (intentionalStopRef.current) {
      intentionalStopRef.current = false
      shareStartedAtRef.current = null
      trackStatsRef.current = {}
      return
    }

    // Connection still up but the screen track vanished on its own — the real
    // failure mode. A full disconnect is handled by the existing Reconnect UI.
    if (connectionStateRef.current !== ConnectionState.Connected) {
      shareStartedAtRef.current = null
      trackStatsRef.current = {}
      return
    }

    const { width, height, frameRate } = trackStatsRef.current
    const durationMs = shareStartedAtRef.current ? Date.now() - shareStartedAtRef.current : undefined

    // Programmatic getDisplayMedia is rejected without a transient user gesture,
    // so auto-restart is impossible — recovery is always a manual Retry (below).
    notifications.show('ScreenShareFailed', {
      message: t('notifications.screen_share_failed.stopped_message'),
      action: {
        label: t('notifications.retry'),
        onClick: () => {
          void startScreenShareRef.current()
        }
      }
    })

    captureMessage('Screen share stopped unexpectedly', {
      level: 'warning',
      tags: { feature: 'cast', area: 'screen_share' },
      extra: { width, height, frameRate, durationMs, connectionState: connectionStateRef.current }
    })

    shareStartedAtRef.current = null
    trackStatsRef.current = {}
  }, [hasLocalScreenShare, notifications, t])

  return { isScreenSharing: hasLocalScreenShare, startScreenShare, stopScreenShare }
}

export { useScreenShare }
export type { UseScreenShareResult } from './useScreenShare.types'
