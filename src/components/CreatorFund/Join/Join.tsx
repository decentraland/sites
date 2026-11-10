import { memo } from 'react'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useUnloadSafeTrackClick } from '../../../hooks/useUnloadSafeTrackClick'
import avatarsImage from '../../../images/creator-fund/avatars.webp'
import closingBackground from '../../../images/creator-fund/closing-scene-background.jpg'
import { DownloadTarget } from '../../../modules/segment'
import { clickTrackingAttributes } from '../CreatorFund.helpers'
import { PrimaryButtonLink } from '../CreatorFund.styled'
import { CLICK_SECTIONS, CREATOR_FUND_TERMS_URL, CREATOR_HUB_DOWNLOAD_PATH } from '../data'
import { AvatarsImage, JoinActions, JoinBackground, JoinInner, JoinSection, JoinSubtitle, JoinTitle, TermsLink } from './Join.styled'

const Join = memo(() => {
  const l = useFormatMessage()
  const trackClick = useUnloadSafeTrackClick()

  return (
    <JoinSection id="join" spacing="top">
      <JoinBackground src={closingBackground} alt="" aria-hidden="true" loading="lazy" />
      <JoinInner>
        <JoinTitle>{l('page.creator_fund.join.title')}</JoinTitle>
        <JoinSubtitle>
          {l('page.creator_fund.join.subtitle')}{' '}
          <TermsLink
            href={CREATOR_FUND_TERMS_URL}
            target="_blank"
            rel="noopener noreferrer"
            {...clickTrackingAttributes(CLICK_SECTIONS.finalCta, 'See Terms')}
            onClick={trackClick}
          >
            {l('page.creator_fund.join.see_terms')}
          </TermsLink>
        </JoinSubtitle>
        <JoinActions>
          <PrimaryButtonLink
            href={CREATOR_HUB_DOWNLOAD_PATH}
            {...clickTrackingAttributes(CLICK_SECTIONS.finalCta, 'Join From Creator Hub', DownloadTarget.CREATOR_HUB)}
            onClick={trackClick}
          >
            {l('page.creator_fund.cta.join')}
          </PrimaryButtonLink>
        </JoinActions>
      </JoinInner>
      <AvatarsImage src={avatarsImage} alt={l('page.creator_fund.join.avatars_alt')} width={1920} height={620} loading="lazy" />
    </JoinSection>
  )
})

Join.displayName = 'Join'

export { Join }
