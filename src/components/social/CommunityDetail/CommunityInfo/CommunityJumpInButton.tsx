import { useCallback, useState } from 'react'
import { useAdvancedUserAgentData } from '@dcl/hooks'
import { DownloadModal, JumpInIcon, launchDesktopApp } from 'decentraland-ui2'
import { getEnv } from '../../../../config/env'
import { useFormatMessage } from '../../../../hooks/adapters/useFormatMessage'
import { useAuthIdentity } from '../../../../hooks/useAuthIdentity'
import { DOWNLOAD_URLS, detectDownloadOS } from '../../../../modules/downloadConstants'
import type { CommunityJumpInButtonProps } from './CommunityJumpInButton.types'
import { JumpInButton } from './CommunityJumpInButton.styled'

function CommunityJumpInButton({ communityId, onTrack }: CommunityJumpInButtonProps) {
  const t = useFormatMessage()
  const [, advancedUserAgent] = useAdvancedUserAgentData()
  const { hasValidIdentity } = useAuthIdentity()
  const [isDownloadModalOpen, setDownloadModalOpen] = useState(false)

  const onboardingUrl = getEnv('ONBOARDING_URL') ?? ''
  const downloadUrl = getEnv('DOWNLOAD_URL') ?? DOWNLOAD_URLS.windows
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

  const handleClick = useCallback(async () => {
    onTrack?.({ type: 'JUMP_IN' })
    if (isMobile) {
      const storeUrl = downloadOs === 'android' ? DOWNLOAD_URLS.googlePlay : DOWNLOAD_URLS.appStore
      window.open(storeUrl, '_self')
      return
    }
    try {
      const launched = await launchDesktopApp({ communityId })
      if (!launched) openDownloadFallback()
    } catch {
      openDownloadFallback()
    }
  }, [communityId, isMobile, downloadOs, openDownloadFallback, onTrack])

  const downloadModalProps = {
    os: downloadOs,
    downloadUrl: downloadOs === 'apple' ? DOWNLOAD_URLS.apple : DOWNLOAD_URLS.windows,
    epicUrl: DOWNLOAD_URLS.epic,
    googlePlayUrl: DOWNLOAD_URLS.googlePlay,
    appStoreUrl: DOWNLOAD_URLS.appStore
  } as const

  return (
    <>
      <JumpInButton variant="contained" endIcon={<JumpInIcon />} onClick={handleClick}>
        {t('community.info.jump_in')}
      </JumpInButton>
      {!isMobile && <DownloadModal open={isDownloadModalOpen} onClose={() => setDownloadModalOpen(false)} {...downloadModalProps} />}
    </>
  )
}

export { CommunityJumpInButton }
