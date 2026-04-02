import { memo, useCallback } from 'react'
import { useWalletState } from '@dcl/core-web3/lazy'
import { useAdvancedUserAgentData, useAsyncMemo } from '@dcl/hooks'
import { AnimatedBackground, DownloadModal, JumpInIcon, useDesktopMediaQuery } from 'decentraland-ui2'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useTrackClick } from '../../../hooks/adapters/useTrackLinkContext'
import { useHangOutAction } from '../../../hooks/useHangOutAction'
import appleLogo from '../../../images/apple-logo.svg'
import microsoftLogo from '../../../images/microsoft-logo.svg'
import { ExplorerDownloads } from '../../../modules/explorerDownloads'
import { formatToShorthand } from '../../../modules/number'
import { SectionViewedTrack } from '../../../modules/segment'
import { OperativeSystem } from '../../../types/download.types'
import { assetUrl } from '../../../utils/assetUrl'
import { VerifiedIcon } from '../../Icon/VerifiedIcon'
import {
  AvatarsImage,
  ComeHangOutContainer,
  Content,
  DownloadCounts,
  DownloadInfo,
  DownloadSeparator,
  HangOutButton,
  OsIcon,
  PlatformIcon,
  PlatformIcons,
  Title
} from './ComeHangOut.styled'

const imageByOs: Record<string, string> = {
  [OperativeSystem.WINDOWS]: microsoftLogo,
  [OperativeSystem.MACOS]: appleLogo
}

// Module-level cache for the formatted download count string. Preferred over
// useRef because this component lazy-loads after scroll and may remount via
// Suspense — useRef would lose its value on unmount/remount, causing the count
// to flash from null to the formatted value. Module scope survives all of that.
let cachedDownloadCounts: string | null = null

const ComeHangOut = memo(() => {
  const l = useFormatMessage()
  const isDesktop = useDesktopMediaQuery()
  const onClickHandle = useTrackClick()
  const { handleClick, isDownloadModalOpen, closeDownloadModal, downloadModalProps } = useHangOutAction()
  const { isConnected, address } = useWalletState()
  const effectivelySignedIn = isConnected || !!address
  const [, userAgentData] = useAdvancedUserAgentData()
  const [rawDownloads, rawDownloadsStatus] = useAsyncMemo(async () => ExplorerDownloads.get().getTotalDownloads(), [])

  const rawFormatted = !rawDownloadsStatus.loading && rawDownloadsStatus.loaded && rawDownloads ? formatToShorthand(rawDownloads) : null
  if (rawFormatted) cachedDownloadCounts = rawFormatted
  const downloadCountsFormatted = cachedDownloadCounts

  const currentOs = userAgentData?.os.name
  const osImage = userAgentData ? imageByOs[userAgentData.os.name] : null

  const handleDownloadClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      onClickHandle(e)
      if (userAgentData) {
        window.location.href = `/download_success?os=${userAgentData.os.name}`
      }
    },
    [onClickHandle, userAgentData]
  )

  return (
    <ComeHangOutContainer>
      <AnimatedBackground variant="absolute" />
      <Content>
        <Title variant="h2">{l('page.home.come_hang_out.title')}</Title>
        {effectivelySignedIn ? (
          <>
            <HangOutButton
              variant="contained"
              onClick={handleDownloadClick}
              data-place={SectionViewedTrack.LANDING_HERO}
              data-event="click"
              endIcon={osImage ? <OsIcon src={osImage} alt="" /> : undefined}
            >
              {l('page.download.download')}
            </HangOutButton>
            {downloadCountsFormatted && (
              <DownloadInfo>
                <DownloadCounts>
                  <VerifiedIcon /> {l('page.download.total_downloads', { downloads: downloadCountsFormatted })}
                </DownloadCounts>
                <DownloadSeparator />
                <PlatformIcons>
                  {currentOs !== OperativeSystem.WINDOWS &&
                    (isDesktop ? (
                      <a href="/download_success?os=Windows">
                        <PlatformIcon src={microsoftLogo} alt="Windows" />
                      </a>
                    ) : (
                      <PlatformIcon src={microsoftLogo} alt="Windows" />
                    ))}
                  {currentOs !== OperativeSystem.MACOS &&
                    (isDesktop ? (
                      <a href="/download_success?os=macOS">
                        <PlatformIcon src={appleLogo} alt="macOS" />
                      </a>
                    ) : (
                      <PlatformIcon src={appleLogo} alt="macOS" />
                    ))}
                  {isDesktop ? (
                    <a
                      href="https://play.google.com/store/apps/details?id=org.decentraland.godotexplorer&pcampaignid=web_share&utm_source=partners&utm_medium=pr&utm_campaign=mobile_launch&utm_content=android"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <PlatformIcon src={assetUrl('/google_play_icon.svg')} alt="Android" />
                    </a>
                  ) : (
                    <PlatformIcon src={assetUrl('/google_play_icon.svg')} alt="Android" />
                  )}
                  {isDesktop ? (
                    <a href="https://store.epicgames.com/en-US/p/decentraland-b692fb" target="_blank" rel="noopener noreferrer">
                      <PlatformIcon src={assetUrl('/epic_icon.svg')} alt="Epic Games" />
                    </a>
                  ) : (
                    <PlatformIcon src={assetUrl('/epic_icon.svg')} alt="Epic Games" />
                  )}
                </PlatformIcons>
              </DownloadInfo>
            )}
          </>
        ) : (
          <HangOutButton
            variant="contained"
            onClick={e => {
              onClickHandle(e)
              handleClick(e)
            }}
            data-place={SectionViewedTrack.LANDING_HERO}
            data-event="click"
            endIcon={<JumpInIcon />}
          >
            {l('page.home.hang_out_now')}
          </HangOutButton>
        )}
      </Content>
      <AvatarsImage src={assetUrl('/come_hang_out_background.webp')} alt="" aria-hidden width={1920} height={840} loading="lazy" />
      <DownloadModal open={isDownloadModalOpen} onClose={closeDownloadModal} {...downloadModalProps} />
    </ComeHangOutContainer>
  )
})

ComeHangOut.displayName = 'ComeHangOut'

export { ComeHangOut }
