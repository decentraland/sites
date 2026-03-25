import { memo, useCallback } from 'react'
import { useAdvancedUserAgentData, useAsyncMemo } from '@dcl/hooks'
import { JumpInIcon, muiIcons } from 'decentraland-ui2'
import { getEnv } from '../../config/env'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import { useTrackClick } from '../../hooks/adapters/useTrackLinkContext'
import { ExplorerDownloads } from '../../modules/explorerDownloads'
import { formatToShorthand } from '../../modules/number'
import { SectionViewedTrack } from '../../modules/segment'
import { CTAButton } from '../Buttons/CTAButton'
import { VerifiedIcon } from '../Icon/VerifiedIcon'
import { AlreadyUserContainer, AlreadyUserLink, JumpInButtonWrapper, JumpInContainer, JumpInDownloadCounts } from './JumpIn.styled'

const { FileDownloadOutlined: FileDownloadOutlinedIcon } = muiIcons

interface JumpInProps {
  isDesktop: boolean
  isLoading?: boolean
  hideAlreadyUser?: boolean
  hideDownloadCounts?: boolean
}

const JumpIn = memo(({ isDesktop, isLoading, hideAlreadyUser, hideDownloadCounts }: JumpInProps) => {
  const [isLoadingUserAgentData, userAgentData] = useAdvancedUserAgentData()
  const l = useFormatMessage()
  const onClickHandle = useTrackClick()

  const [downloads, downloadsStatus] = useAsyncMemo(async () => ExplorerDownloads.get().getTotalDownloads(), [])

  const handleOnboardingClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault()
      onClickHandle(event)
      const href = event.currentTarget.getAttribute('href')!
      setTimeout(() => {
        window.location.href = href
      }, 500)
    },
    [onClickHandle]
  )

  const downloadCountsFormatted = !downloadsStatus.loading && downloadsStatus.loaded && downloads ? formatToShorthand(downloads) : null

  return (
    <JumpInContainer>
      <JumpInButtonWrapper>
        <CTAButton
          href={getEnv('ONBOARDING_URL')!}
          onClick={handleOnboardingClick}
          label={l('component.home.hero.jump_in')}
          place={SectionViewedTrack.LANDING_HERO}
          isLoading={isLoadingUserAgentData || isLoading}
          endIcon={<JumpInIcon fontSize="large" />}
        />
      </JumpInButtonWrapper>
      {!hideAlreadyUser && isDesktop && userAgentData && (
        <AlreadyUserContainer>
          {l('component.home.hero.already_user', {
            download: (
              <AlreadyUserLink href={`/download_success?os=${userAgentData.os.name}`}>
                {l('component.home.hero.download')} <FileDownloadOutlinedIcon fontSize="large" />
              </AlreadyUserLink>
            )
          })}
        </AlreadyUserContainer>
      )}
      {!hideDownloadCounts && downloadCountsFormatted && (
        <JumpInDownloadCounts variant="body1">
          <VerifiedIcon /> {l('page.download.total_downloads', { downloads: downloadCountsFormatted })}
        </JumpInDownloadCounts>
      )}
    </JumpInContainer>
  )
})

JumpIn.displayName = 'JumpIn'

export { JumpIn }
