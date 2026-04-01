import { memo, useCallback } from 'react'
import { useWalletState } from '@dcl/core-web3/lazy'
import { useAdvancedUserAgentData, useAsyncMemo } from '@dcl/hooks'
import { AnimatedBackground, DownloadModal, JumpInIcon } from 'decentraland-ui2'
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
import { AvatarsImage, ComeHangOutContainer, Content, HangOutButton, Title } from './ComeHangOut.styled'

const imageByOs: Record<string, string> = {
  [OperativeSystem.WINDOWS]: microsoftLogo,
  [OperativeSystem.MACOS]: appleLogo
}

let cachedDownloadCounts: string | null = null

const ComeHangOut = memo(() => {
  const l = useFormatMessage()
  const onClickHandle = useTrackClick()
  const { handleClick, isDownloadModalOpen, closeDownloadModal, downloadModalProps } = useHangOutAction()
  const { isConnected, address } = useWalletState()
  const effectivelySignedIn = isConnected || !!address
  const [, userAgentData] = useAdvancedUserAgentData()
  const [rawDownloads, rawDownloadsStatus] = useAsyncMemo(async () => ExplorerDownloads.get().getTotalDownloads(), [])

  const rawFormatted = !rawDownloadsStatus.loading && rawDownloadsStatus.loaded && rawDownloads ? formatToShorthand(rawDownloads) : null
  if (rawFormatted) cachedDownloadCounts = rawFormatted
  const downloadCountsFormatted = cachedDownloadCounts

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
              endIcon={
                osImage ? <img src={osImage} alt="" style={{ width: 32, height: 32, filter: 'brightness(0) invert(1)' }} /> : undefined
              }
            >
              {l('page.download.download')}
            </HangOutButton>
            {downloadCountsFormatted && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  position: 'relative',
                  zIndex: 1
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#fff', fontSize: 16 }}>
                  <VerifiedIcon /> {l('page.download.total_downloads', { downloads: downloadCountsFormatted })}
                </span>
                <span style={{ width: 1, height: 20, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <img src={microsoftLogo} alt="Windows" style={{ width: 24, height: 24, filter: 'brightness(0) invert(1)' }} />
                  <img src={appleLogo} alt="macOS" style={{ width: 24, height: 24, filter: 'brightness(0) invert(1)' }} />
                  <img src={assetUrl('/android.svg')} alt="Android" style={{ width: 24, height: 24, filter: 'brightness(0) invert(1)' }} />
                  <img src={assetUrl('/epic_games.svg')} alt="Epic Games" style={{ width: 24, height: 24, opacity: 0.9 }} />
                </span>
              </div>
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
