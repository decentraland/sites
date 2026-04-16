import { memo, useState } from 'react'
import { useAdvancedUserAgentData, useAsyncMemo } from '@dcl/hooks'
import { AnimatedBackground, DownloadModal, DownloadQRModal } from 'decentraland-ui2'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useTrackClick } from '../../../hooks/adapters/useTrackLinkContext'
import { useAnimatedCounter } from '../../../hooks/useAnimatedCounter'
import { useHangOutAction } from '../../../hooks/useHangOutAction'
import { useShareAction } from '../../../hooks/useShareAction'
import appleLogo from '../../../images/apple-logo.svg'
import microsoftLogo from '../../../images/microsoft-logo.svg'
import { ExplorerDownloads } from '../../../modules/explorerDownloads'
import { formatToShorthand } from '../../../modules/number'
import { SectionViewedTrack } from '../../../modules/segment'
import { OperativeSystem } from '../../../types/download.types'
import { assetUrl } from '../../../utils/assetUrl'
import { VerifiedIcon } from '../../Icon/VerifiedIcon'
import { GOOGLE_PLAY_MOBILE_URL, googlePlayBadge } from '../shared/googlePlay'
import { ShareIcon } from '../shared/ShareIcon'
import {
  AvatarsImage,
  ComeHangOutContainer,
  ComingSoonIcon,
  ComingSoonRow,
  ComingSoonText,
  Content,
  DownloadCounts,
  DownloadInfo,
  DownloadSeparator,
  GooglePlayButton,
  GooglePlayImage,
  HangOutButton,
  MobileSubtitle,
  PlatformIcon,
  PlatformIcons,
  SendLinkButton,
  Title
} from './ComeHangOut.styled'

let cachedDownloadCounts: string | null = null

const ComeHangOut = memo(() => {
  const l = useFormatMessage()
  const onClickHandle = useTrackClick()
  const { handleClick, isDownloadModalOpen, closeDownloadModal, downloadModalProps, totalDownloads } = useHangOutAction()
  const [, userAgentData] = useAdvancedUserAgentData()
  const [rawDownloads, rawDownloadsStatus] = useAsyncMemo(async () => ExplorerDownloads.get().getTotalDownloads(), [])

  const targetDownloads = !rawDownloadsStatus.loading && rawDownloadsStatus.loaded && rawDownloads ? rawDownloads : null
  if (targetDownloads) cachedDownloadCounts = formatToShorthand(targetDownloads)
  const animatedDownloads = useAnimatedCounter(targetDownloads)
  const downloadCountsFormatted = animatedDownloads ? formatToShorthand(animatedDownloads) : cachedDownloadCounts ?? '+400K'

  const currentOs = userAgentData?.os.name
  const isMobile = !!userAgentData?.mobile
  const isMobileAndroid = isMobile && currentOs === 'Android'

  const handleShareClick = useShareAction()

  // Mobile download modal for platform icon clicks
  const [mobileModalOs, setMobileModalOs] = useState<'ios' | 'android' | null>(null)

  const renderMobileContent = () => {
    if (isMobileAndroid) {
      return (
        <GooglePlayButton href={GOOGLE_PLAY_MOBILE_URL} target="_blank" rel="noopener noreferrer">
          <GooglePlayImage src={googlePlayBadge} alt="Get it on Google Play" />
        </GooglePlayButton>
      )
    }

    return (
      <>
        <MobileSubtitle>{l('page.home.hero.mobile_ios_subtitle')}</MobileSubtitle>
        <SendLinkButton type="button" onClick={handleShareClick}>
          {l('page.home.hero.mobile_ios_send_link')}
          <ShareIcon />
        </SendLinkButton>
        <ComingSoonRow>
          <ComingSoonIcon src={appleLogo} alt="Apple" />
          <ComingSoonText>{l('page.home.hero.mobile_ios_coming_soon')}</ComingSoonText>
        </ComingSoonRow>
      </>
    )
  }

  const renderDesktopContent = () => (
    <>
      <HangOutButton
        variant="contained"
        onClick={e => {
          onClickHandle(e)
          handleClick(e)
        }}
        data-place={SectionViewedTrack.LANDING_HERO}
        data-event="click"
      >
        {l('page.home.hang_out_now')}
      </HangOutButton>
      <DownloadInfo>
        <DownloadCounts>
          <VerifiedIcon /> {l('page.download.total_downloads', { downloads: downloadCountsFormatted })}
        </DownloadCounts>
        <DownloadSeparator />
        <PlatformIcons>
          {currentOs === OperativeSystem.MACOS && (
            <a href="/download_success?os=Windows">
              <PlatformIcon src={microsoftLogo} alt="Windows" />
            </a>
          )}
          {currentOs === OperativeSystem.WINDOWS && (
            <a href="/download_success?os=macOS">
              <PlatformIcon src={appleLogo} alt="macOS" />
            </a>
          )}
          {!currentOs && <span style={{ display: 'inline-block', width: 24, height: 24 }} />}
          <a
            href="#"
            onClick={e => {
              e.preventDefault()
              setMobileModalOs('ios')
            }}
          >
            <PlatformIcon src={assetUrl('/ios-logo.svg')} alt="iOS" />
          </a>
          <a
            href="#"
            onClick={e => {
              e.preventDefault()
              setMobileModalOs('android')
            }}
          >
            <PlatformIcon src={assetUrl('/google_play_icon.svg')} alt="Android" />
          </a>
        </PlatformIcons>
      </DownloadInfo>
    </>
  )

  return (
    <ComeHangOutContainer>
      <AnimatedBackground variant="absolute" />
      <Content>
        <Title variant="h2">{l('page.home.come_hang_out.title')}</Title>
        {isMobile ? renderMobileContent() : renderDesktopContent()}
      </Content>
      <AvatarsImage src={assetUrl('/come_hang_out_background.webp')} alt="" aria-hidden width={1920} height={840} loading="lazy" />
      <DownloadModal open={isDownloadModalOpen} onClose={closeDownloadModal} {...downloadModalProps} />
      {mobileModalOs && (
        <DownloadQRModal
          open
          onClose={() => setMobileModalOs(null)}
          os={mobileModalOs}
          qrImageUrl={assetUrl(`/qr-${mobileModalOs}.svg`)}
          i18n={{ totalDownloads: `Total Downloads: ${totalDownloads}` }}
        />
      )}
    </ComeHangOutContainer>
  )
})

ComeHangOut.displayName = 'ComeHangOut'

export { ComeHangOut }
