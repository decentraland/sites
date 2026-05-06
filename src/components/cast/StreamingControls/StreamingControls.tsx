/* eslint-disable @typescript-eslint/naming-convention */
import { useCallback, useEffect, useState } from 'react'
import { useConnectionState, useLocalParticipant, useRemoteParticipants, useRoomContext, useTrackToggle } from '@livekit/components-react'
import CallEndIcon from '@mui/icons-material/CallEnd'
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import MicIcon from '@mui/icons-material/Mic'
import MicOffIcon from '@mui/icons-material/MicOff'
import PeopleIcon from '@mui/icons-material/People'
import ScreenShareIcon from '@mui/icons-material/ScreenShare'
import SlideshowIcon from '@mui/icons-material/Slideshow'
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare'
import VideocamIcon from '@mui/icons-material/Videocam'
import VideocamOffIcon from '@mui/icons-material/VideocamOff'
import VolumeOffIcon from '@mui/icons-material/VolumeOff'
import VolumeUpIcon from '@mui/icons-material/VolumeUp'
import { ConnectionState, LocalAudioTrack, LocalVideoTrack, Track } from 'livekit-client'
import { useLiveKitCredentials } from '../../../features/cast2/contexts/LiveKitContext'
import { usePresentationOptional } from '../../../features/cast2/contexts/PresentationContext'
import { useCastTranslation } from '../../../features/cast2/useCastTranslation'
import { SharePresentationModal } from '../SharePresentationModal/SharePresentationModal'
import { ShareMenuDropdown } from './ShareMenuDropdown'
import { StreamingControlsProps } from './StreamingControls.types'
import {
  ButtonWithMenu,
  ChevronButton,
  CircleButton,
  CircleEndButton,
  ControlsCenter,
  ControlsContainer,
  ControlsLeft,
  ControlsRight,
  DesktopMediaControls,
  DeviceMenu,
  DeviceMenuItem,
  EndStreamButton,
  IconButton,
  MobileIconButton,
  MobileLeftGroup,
  MobileRightGroup,
  NotificationBadge
} from './StreamingControls.styled'

export function StreamingControls({
  onToggleChat,
  onTogglePeople,
  isStreamer = false,
  onLeave,
  unreadMessagesCount = 0,
  isTabMuted = false,
  onToggleTabMute
}: StreamingControlsProps) {
  const { t } = useCastTranslation()
  const room = useRoomContext()
  const { localParticipant } = useLocalParticipant()
  const remoteParticipants = useRemoteParticipants()
  const connectionState = useConnectionState()
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [showAudioMenu, setShowAudioMenu] = useState(false)
  const [showVideoMenu, setShowVideoMenu] = useState(false)
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([])
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>('')
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>('')
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [showPresentationModal, setShowPresentationModal] = useState(false)

  const presentationContext = usePresentationOptional()
  const isPresentationActive = presentationContext?.isPresentationActive ?? false

  const handleShareScreenClick = () => {
    setShowShareMenu(false)
    handleScreenShare()
  }

  const handleSharePresentationClick = () => {
    setShowShareMenu(false)
    setShowPresentationModal(true)
  }

  const handleStopPresentation = () => {
    setShowShareMenu(false)
    presentationContext?.stopPresentation()
  }

  const handleShareButtonClick = () => {
    if (isScreenSharing) {
      handleScreenShare() // stops screen share
    } else {
      setShowShareMenu(prev => !prev)
    }
  }

  const handlePresentationFileSelected = async (file: File) => {
    if (!presentationContext) return
    await presentationContext.startPresentation(file)
  }

  const handlePresentationUrlSubmitted = async (url: string) => {
    if (!presentationContext) return
    await presentationContext.startPresentationFromUrl(url)
  }

  const { enabled: isMicEnabled } = useTrackToggle({
    source: Track.Source.Microphone
  })

  const { enabled: isCameraEnabled } = useTrackToggle({
    source: Track.Source.Camera
  })

  const getDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      // Keep ALL devices including "default" - let the user choose their system default
      const audioInputs = devices.filter(d => d.kind === 'audioinput')
      const videoInputs = devices.filter(d => d.kind === 'videoinput')

      setAudioDevices(audioInputs)
      setVideoDevices(videoInputs)

      // Auto-select "default" device or first available if none selected
      if (!selectedAudioDevice && audioInputs.length > 0) {
        const defaultDevice = audioInputs.find(d => d.deviceId === 'default') || audioInputs[0]
        setSelectedAudioDevice(defaultDevice.deviceId)
      }
      if (!selectedVideoDevice && videoInputs.length > 0) {
        const defaultDevice = videoInputs.find(d => d.deviceId === 'default') || videoInputs[0]
        setSelectedVideoDevice(defaultDevice.deviceId)
      }
    } catch (error) {
      console.error('[StreamingControls] Failed to enumerate devices:', error)
    }
  }, [selectedAudioDevice, selectedVideoDevice])

  useEffect(() => {
    getDevices()
    navigator.mediaDevices.addEventListener('devicechange', getDevices)
    return () => navigator.mediaDevices.removeEventListener('devicechange', getDevices)
  }, [getDevices])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      // Check if click is outside of any dropdown menu
      if (!target.closest('[data-dropdown-menu]') && !target.closest('[data-dropdown-button]')) {
        setShowAudioMenu(false)
        setShowVideoMenu(false)
        setShowShareMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const screenShareTrack = Array.from(localParticipant?.videoTrackPublications.values() || []).find(
      pub => pub.source === Track.Source.ScreenShare
    )
    setIsScreenSharing(!!screenShareTrack)

    // Listen for screen share track ending (e.g., when user stops from Chrome controls)
    if (screenShareTrack?.track) {
      const handleTrackEnded = () => {
        setIsScreenSharing(false)
      }

      const mediaStreamTrack = screenShareTrack.track.mediaStreamTrack
      mediaStreamTrack?.addEventListener('ended', handleTrackEnded)

      return () => {
        mediaStreamTrack?.removeEventListener('ended', handleTrackEnded)
      }
    }
  }, [localParticipant])

  const handleToggleMic = async () => {
    if (!localParticipant) return

    try {
      if (isMicEnabled) {
        await localParticipant.setMicrophoneEnabled(false)
      } else {
        // Use "exact" constraint to force the specific device
        await localParticipant.setMicrophoneEnabled(true, selectedAudioDevice ? { deviceId: { exact: selectedAudioDevice } } : undefined)
      }
    } catch (error) {
      console.error('[StreamingControls] Failed to toggle microphone:', error)
    }
  }

  const handleToggleCamera = async () => {
    if (!localParticipant) return

    try {
      if (isCameraEnabled) {
        await localParticipant.setCameraEnabled(false)
      } else {
        // Use "exact" constraint to force the specific device
        await localParticipant.setCameraEnabled(true, selectedVideoDevice ? { deviceId: { exact: selectedVideoDevice } } : undefined)
      }
    } catch (error) {
      console.error('[StreamingControls] Failed to toggle camera:', error)
    }
  }

  const handleScreenShare = async () => {
    if (!localParticipant) {
      console.error('[StreamingControls] No local participant for screen share')
      return
    }

    if (isScreenSharing) {
      const screenShareTrack = Array.from(localParticipant.videoTrackPublications.values()).find(
        pub => pub.source === Track.Source.ScreenShare
      )
      if (screenShareTrack) {
        await localParticipant.unpublishTrack(screenShareTrack.track!)
        setIsScreenSharing(false)
      }
    } else {
      try {
        // Check if screen share is supported
        const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

        if (isMobileDevice) {
          alert(t('streaming_controls.screen_share_mobile_not_supported'))
          return
        }

        if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
          console.error('[StreamingControls] Screen share not supported on this device/browser')
          alert('Screen sharing is not supported on this device or browser')
          return
        }

        await localParticipant.setScreenShareEnabled(true, { audio: true })
        setIsScreenSharing(true)
      } catch (error) {
        console.error('[StreamingControls] Error enabling screen share:', error)
        setIsScreenSharing(false)

        // Show user-friendly error message
        if (error instanceof Error) {
          if (error.name === 'NotAllowedError') {
            alert('Permission denied. Please allow screen sharing to continue.')
          } else if (error.name === 'NotSupportedError') {
            alert('Screen sharing is not supported on this device')
          }
        }
      }
    }
  }

  const handleAudioDeviceSelect = async (deviceId: string) => {
    setSelectedAudioDevice(deviceId)
    setShowAudioMenu(false)

    // Only switch if mic is currently enabled
    if (!localParticipant || !isMicEnabled) {
      return
    }

    try {
      // Get current audio track
      const audioPublication = localParticipant.getTrackPublication(Track.Source.Microphone)
      const audioTrack = audioPublication?.track as LocalAudioTrack | undefined

      if (audioTrack && 'restartTrack' in audioTrack) {
        // Use restartTrack with "exact" constraint (no renegotiation, seamless switch)
        await audioTrack.restartTrack({ deviceId: { exact: deviceId } })
      } else {
        // Fallback: disable then re-enable with exact constraint
        await localParticipant.setMicrophoneEnabled(false)
        await localParticipant.setMicrophoneEnabled(true, { deviceId: { exact: deviceId } })
      }
    } catch (error) {
      console.error('[StreamingControls] Failed to switch audio device:', error)
    }
  }

  const handleVideoDeviceSelect = async (deviceId: string) => {
    setSelectedVideoDevice(deviceId)
    setShowVideoMenu(false)

    // Only switch if camera is currently enabled
    if (!localParticipant || !isCameraEnabled) {
      return
    }

    try {
      // Get current video track
      const videoPublication = localParticipant.getTrackPublication(Track.Source.Camera)
      const videoTrack = videoPublication?.track as LocalVideoTrack | undefined

      if (videoTrack && 'restartTrack' in videoTrack) {
        // Use restartTrack with "exact" constraint (no renegotiation, seamless switch)
        await videoTrack.restartTrack({ deviceId: { exact: deviceId } })
      } else {
        // Fallback: disable then re-enable with exact constraint
        await localParticipant.setCameraEnabled(false)
        await localParticipant.setCameraEnabled(true, { deviceId: { exact: deviceId } })
      }
    } catch (error) {
      console.error('[StreamingControls] Failed to switch video device:', error)
    }
  }

  const isDisconnected = connectionState === ConnectionState.Disconnected
  const { credentials } = useLiveKitCredentials()

  const handleReconnect = async () => {
    if (!room || !credentials) {
      window.location.reload()
      return
    }

    try {
      await room.connect(credentials.url, credentials.token)
    } catch {
      window.location.reload()
    }
  }

  const totalParticipants = remoteParticipants.length + 1 // Include local

  const handleLeave = () => {
    room?.disconnect()
    onLeave?.()
  }

  return (
    <>
      <ControlsContainer>
        {/* Mobile Left Controls: Media controls (visible only on mobile) */}
        <ControlsLeft>
          {/* Mic Control - Only for streamer */}
          {isStreamer && (
            <ButtonWithMenu>
              <CircleButton onClick={handleToggleMic}>{isMicEnabled ? <MicIcon /> : <MicOffIcon />}</CircleButton>
              {audioDevices.length > 1 && (
                <ChevronButton data-dropdown-button onClick={() => setShowAudioMenu(!showAudioMenu)}>
                  <ExpandMoreIcon />
                </ChevronButton>
              )}
              {showAudioMenu && (
                <DeviceMenu data-dropdown-menu>
                  {audioDevices.map(device => (
                    <DeviceMenuItem
                      key={device.deviceId}
                      $active={device.deviceId === selectedAudioDevice}
                      onClick={() => handleAudioDeviceSelect(device.deviceId)}
                    >
                      {device.label || `Microphone ${device.deviceId.slice(0, 5)}`}
                    </DeviceMenuItem>
                  ))}
                </DeviceMenu>
              )}
            </ButtonWithMenu>
          )}

          {/* Camera Control - Only for streamer */}
          {isStreamer && (
            <ButtonWithMenu>
              <CircleButton onClick={handleToggleCamera}>{isCameraEnabled ? <VideocamIcon /> : <VideocamOffIcon />}</CircleButton>
              {videoDevices.length > 1 && (
                <ChevronButton data-dropdown-button onClick={() => setShowVideoMenu(!showVideoMenu)}>
                  <ExpandMoreIcon />
                </ChevronButton>
              )}
              {showVideoMenu && (
                <DeviceMenu data-dropdown-menu>
                  {videoDevices.map(device => (
                    <DeviceMenuItem
                      key={device.deviceId}
                      $active={device.deviceId === selectedVideoDevice}
                      onClick={() => handleVideoDeviceSelect(device.deviceId)}
                    >
                      {device.label || `Camera ${device.deviceId.slice(0, 5)}`}
                    </DeviceMenuItem>
                  ))}
                </DeviceMenu>
              )}
            </ButtonWithMenu>
          )}

          {/* Share (Screen / Presentation) - Only for streamer */}
          {isStreamer && (
            <ButtonWithMenu>
              <CircleButton onClick={handleShareButtonClick} data-dropdown-button>
                {isPresentationActive ? <SlideshowIcon /> : isScreenSharing ? <StopScreenShareIcon /> : <ScreenShareIcon />}
              </CircleButton>
              {!isScreenSharing && (
                <ChevronButton data-dropdown-button onClick={() => setShowShareMenu(!showShareMenu)}>
                  <ExpandMoreIcon />
                </ChevronButton>
              )}
              {showShareMenu && (
                <ShareMenuDropdown
                  isPresentationActive={isPresentationActive}
                  onShareScreen={handleShareScreenClick}
                  onSharePresentation={handleSharePresentationClick}
                  onStopPresentation={handleStopPresentation}
                />
              )}
            </ButtonWithMenu>
          )}
        </ControlsLeft>

        {/* Center Controls: Media controls (desktop) + Chat/People (mobile) */}
        <ControlsCenter>
          {/* Media controls - Only for streamer, visible only on desktop */}
          {isStreamer && (
            <DesktopMediaControls>
              <ButtonWithMenu>
                <CircleButton onClick={handleToggleMic}>{isMicEnabled ? <MicIcon /> : <MicOffIcon />}</CircleButton>
                {audioDevices.length > 1 && (
                  <ChevronButton data-dropdown-button onClick={() => setShowAudioMenu(!showAudioMenu)}>
                    <ExpandMoreIcon />
                  </ChevronButton>
                )}
                {showAudioMenu && (
                  <DeviceMenu data-dropdown-menu>
                    {audioDevices.map(device => (
                      <DeviceMenuItem
                        key={device.deviceId}
                        $active={device.deviceId === selectedAudioDevice}
                        onClick={() => handleAudioDeviceSelect(device.deviceId)}
                      >
                        {device.label || `Microphone ${device.deviceId.slice(0, 5)}`}
                      </DeviceMenuItem>
                    ))}
                  </DeviceMenu>
                )}
              </ButtonWithMenu>

              <ButtonWithMenu>
                <CircleButton onClick={handleToggleCamera}>{isCameraEnabled ? <VideocamIcon /> : <VideocamOffIcon />}</CircleButton>
                {videoDevices.length > 1 && (
                  <ChevronButton data-dropdown-button onClick={() => setShowVideoMenu(!showVideoMenu)}>
                    <ExpandMoreIcon />
                  </ChevronButton>
                )}
                {showVideoMenu && (
                  <DeviceMenu data-dropdown-menu>
                    {videoDevices.map(device => (
                      <DeviceMenuItem
                        key={device.deviceId}
                        $active={device.deviceId === selectedVideoDevice}
                        onClick={() => handleVideoDeviceSelect(device.deviceId)}
                      >
                        {device.label || `Camera ${device.deviceId.slice(0, 5)}`}
                      </DeviceMenuItem>
                    ))}
                  </DeviceMenu>
                )}
              </ButtonWithMenu>

              {/* Share (Screen / Presentation) dropdown */}
              <ButtonWithMenu>
                <CircleButton onClick={handleShareButtonClick} data-dropdown-button>
                  {isPresentationActive ? <SlideshowIcon /> : isScreenSharing ? <StopScreenShareIcon /> : <ScreenShareIcon />}
                </CircleButton>
                {!isScreenSharing && (
                  <ChevronButton data-dropdown-button onClick={() => setShowShareMenu(!showShareMenu)}>
                    <ExpandMoreIcon />
                  </ChevronButton>
                )}
                {showShareMenu && (
                  <ShareMenuDropdown
                    isPresentationActive={isPresentationActive}
                    onShareScreen={handleShareScreenClick}
                    onSharePresentation={handleSharePresentationClick}
                    onStopPresentation={handleStopPresentation}
                  />
                )}
              </ButtonWithMenu>

              {/* Leave/Hang-up button - Desktop only, positioned after media controls */}
              {isDisconnected ? (
                <EndStreamButton onClick={handleReconnect}>{t('streaming_controls.reconnect')}</EndStreamButton>
              ) : (
                <EndStreamButton onClick={handleLeave} startIcon={<CallEndIcon />}>
                  {isStreamer ? t('streaming_controls.leave_stream') : t('streaming_controls.leave')}
                </EndStreamButton>
              )}
            </DesktopMediaControls>
          )}

          {/* Leave button for watchers (centered) */}
          {!isStreamer && (
            <>
              {isDisconnected ? (
                <EndStreamButton onClick={handleReconnect}>{t('streaming_controls.reconnect')}</EndStreamButton>
              ) : (
                <EndStreamButton onClick={handleLeave} startIcon={<CallEndIcon />}>
                  {t('streaming_controls.leave')}
                </EndStreamButton>
              )}
            </>
          )}
        </ControlsCenter>

        {/* Right Controls: Chat + People buttons */}
        <ControlsRight>
          {/* Desktop buttons */}
          {onToggleTabMute && (
            <IconButton
              onClick={onToggleTabMute}
              title={isTabMuted ? t('streaming_controls.unmute_cast') : t('streaming_controls.mute_cast')}
            >
              {isTabMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
            </IconButton>
          )}

          {onToggleChat && (
            <IconButton onClick={onToggleChat}>
              <ChatBubbleOutlineIcon />
              {unreadMessagesCount > 0 && <NotificationBadge>{unreadMessagesCount}</NotificationBadge>}
            </IconButton>
          )}

          {onTogglePeople && (
            <IconButton onClick={onTogglePeople}>
              <PeopleIcon />
              <NotificationBadge>{totalParticipants}</NotificationBadge>
            </IconButton>
          )}

          {/* Mobile: Chat and People on the left */}
          <MobileLeftGroup>
            {onToggleTabMute && (
              <MobileIconButton onClick={onToggleTabMute}>{isTabMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}</MobileIconButton>
            )}

            {onToggleChat && (
              <MobileIconButton onClick={onToggleChat}>
                <ChatBubbleOutlineIcon />
                {unreadMessagesCount > 0 && <NotificationBadge>{unreadMessagesCount}</NotificationBadge>}
              </MobileIconButton>
            )}

            {onTogglePeople && (
              <MobileIconButton onClick={onTogglePeople}>
                <PeopleIcon />
                <NotificationBadge>{totalParticipants}</NotificationBadge>
              </MobileIconButton>
            )}
          </MobileLeftGroup>

          {/* Mobile: End Call on the right */}
          <MobileRightGroup>
            {isDisconnected ? (
              <CircleEndButton onClick={handleReconnect}>
                <CallEndIcon />
              </CircleEndButton>
            ) : (
              <CircleEndButton onClick={handleLeave}>
                <CallEndIcon />
              </CircleEndButton>
            )}
          </MobileRightGroup>
        </ControlsRight>
      </ControlsContainer>

      {showPresentationModal && (
        <SharePresentationModal
          onClose={() => setShowPresentationModal(false)}
          onFileSelected={handlePresentationFileSelected}
          onUrlSubmitted={handlePresentationUrlSubmitted}
        />
      )}
    </>
  )
}
