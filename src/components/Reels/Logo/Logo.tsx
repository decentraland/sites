import { type MouseEvent, memo } from 'react'
import { Logo as DclLogo } from 'decentraland-ui2'
import { getEnv } from '../../../config/env'
import { useTrackClick } from '../../../hooks/adapters/useTrackLinkContext'
import dclTextSrc from '../../../images/reels/dcl-text.svg'
import { SegmentEvent } from '../../../modules/segment'
import { LogoContainer } from './Logo.styled'

const Logo = memo(() => {
  const trackClick = useTrackClick()
  const homepageUrl = getEnv('DECENTRALAND_HOMEPAGE_URL') ?? 'https://decentraland.org'

  return (
    <LogoContainer
      href={homepageUrl}
      data-event={SegmentEvent.REELS_CLICK_DCL_LOGO}
      onClick={(event: MouseEvent<HTMLAnchorElement>) => trackClick(event)}
    >
      <DclLogo className="reels-logo-image" titleAccess="Decentraland" />
      <img className="reels-logo-text" src={dclTextSrc} alt="" />
    </LogoContainer>
  )
})

export { Logo }
