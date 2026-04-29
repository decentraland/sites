import { memo, useCallback } from 'react'
import { useAdvancedUserAgentData, useAsyncMemo } from '@dcl/hooks'
import { JumpInIcon } from 'decentraland-ui2'
import { getEnv } from '../../config/env'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import { useTrackClick } from '../../hooks/adapters/useTrackLinkContext'
import { ExplorerDownloads } from '../../modules/explorerDownloads'
import { formatToShorthand } from '../../modules/number'
import { DownloadPlace, SectionViewedTrack } from '../../modules/segment'
import { CTAButton } from '../Buttons/CTAButton'
import { VerifiedIcon } from '../Icon/VerifiedIcon'
import { AlreadyUserContainer, AlreadyUserLink, JumpInButtonWrapper, JumpInContainer, JumpInDownloadCounts } from './JumpIn.styled'

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
          label={l('page.home.hero.jump_in')}
          place={SectionViewedTrack.LANDING_HERO}
          isLoading={isLoadingUserAgentData || isLoading}
          endIcon={<JumpInIcon fontSize="large" />}
        />
      </JumpInButtonWrapper>
      {!hideAlreadyUser && isDesktop && userAgentData && (
        <AlreadyUserContainer>
          {l('page.home.hero.already_user', {
            download: (
              <AlreadyUserLink href={`/download_success?os=${userAgentData.os.name}&place=${DownloadPlace.JUMP_IN_ALREADY_USER}`}>
                {l('page.home.hero.download')} <img src="/JumpIn.svg" alt="" width={24} height={24} />
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
