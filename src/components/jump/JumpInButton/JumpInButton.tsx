import { type FC, type ReactNode, useCallback, useState } from 'react'
import { useAdvancedUserAgentData, useAnalytics } from '@dcl/hooks'
import { type ButtonProps, DownloadModal, JumpInIcon, launchDesktopApp } from 'decentraland-ui2'
import { getEnv } from '../../../config/env'
import { buildDeepLinkOptions } from '../../../features/experiences/jump/jump.helpers'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useAuthIdentity } from '../../../hooks/useAuthIdentity'
import { DOWNLOAD_URLS, detectDownloadOS } from '../../../modules/downloadConstants'
import { SegmentEvent } from '../../../modules/segment'
import { JumpInIconButton, StyledJumpInButton } from './JumpInButton.styled'

interface JumpInButtonProps extends Omit<ButtonProps, 'onClick' | 'children'> {
  position: string
  realm?: string
  onlyIcon?: boolean
  children?: ReactNode
}

const JumpInButton: FC<JumpInButtonProps> = ({
  position,
  realm,
  onlyIcon = false,
  size = 'large',
  children,
  fullWidth,
  sx,
  color = 'primary',
  variant = 'contained'
}) => {
  const [, advancedUserAgent] = useAdvancedUserAgentData()
  const { track } = useAnalytics()
  const formatMessage = useFormatMessage()
  const { hasValidIdentity } = useAuthIdentity()
  const [isDownloadModalOpen, setDownloadModalOpen] = useState(false)

  const onboardingUrl = getEnv('ONBOARDING_URL') ?? ''
  const downloadUrl = getEnv('DOWNLOAD_URL') ?? DOWNLOAD_URLS.windows
  const osName = advancedUserAgent?.os?.name ?? 'unknown'
  const arch = advancedUserAgent?.cpu?.architecture?.toLowerCase() ?? 'unknown'
  const isMobile = Boolean(advancedUserAgent?.mobile)
  const downloadOs = detectDownloadOS()

  const openDownloadFallback = useCallback(() => {
    if (hasValidIdentity) {
      window.open(downloadUrl, '_self')
      return
    }
    if (onboardingUrl) {
      window.open(onboardingUrl, '_self')
    } else {
      setDownloadModalOpen(true)
    }
  }, [hasValidIdentity, downloadUrl, onboardingUrl])

  const handleJumpIn = useCallback(async () => {
    if (isMobile) {
      const storeUrl = downloadOs === 'android' ? DOWNLOAD_URLS.googlePlay : DOWNLOAD_URLS.appStore
      track(SegmentEvent.GO_TO_EXPLORER, { position, realm, osName, arch, target: 'mobile-store' })
      window.open(storeUrl, '_self')
      return
    }

    track(SegmentEvent.GO_TO_EXPLORER, { position, realm, osName, arch })

    try {
      const launched = await launchDesktopApp(buildDeepLinkOptions(position, realm))
      if (!launched) {
        track(SegmentEvent.CLICK, { event: 'Client not installed', osName, arch })
        openDownloadFallback()
      }
    } catch {
      openDownloadFallback()
    }
  }, [isMobile, downloadOs, track, position, realm, osName, arch, openDownloadFallback])

  const closeDownloadModal = useCallback(() => setDownloadModalOpen(false), [])

  const downloadModalProps = {
    os: downloadOs,
    downloadUrl: downloadOs === 'apple' ? DOWNLOAD_URLS.apple : DOWNLOAD_URLS.windows,
    epicUrl: DOWNLOAD_URLS.epic,
    googlePlayUrl: DOWNLOAD_URLS.googlePlay,
    appStoreUrl: DOWNLOAD_URLS.appStore
  }

  const renderButton = () => {
    if (onlyIcon) {
      return (
        <JumpInIconButton onClick={handleJumpIn} aria-label={formatMessage('component.jump.jump_in_button.jump_in')} sx={sx}>
          <JumpInIcon />
        </JumpInIconButton>
      )
    }
    return (
      <StyledJumpInButton
        variant={variant}
        color={color}
        size={size}
        fullWidth={fullWidth}
        sx={sx}
        endIcon={<JumpInIcon />}
        onClick={handleJumpIn}
      >
        {children ?? formatMessage('component.jump.jump_in_button.jump_in')}
      </StyledJumpInButton>
    )
  }

  return (
    <>
      {renderButton()}
      {!isMobile && <DownloadModal open={isDownloadModalOpen} onClose={closeDownloadModal} {...downloadModalProps} />}
    </>
  )
}

export { JumpInButton }
export type { JumpInButtonProps }
