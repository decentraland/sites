import { type MouseEvent, memo } from 'react'
import { getEnv } from '../../../config/env'
import { useTrackClick } from '../../../hooks/adapters/useTrackLinkContext'
import dclTextSrc from '../../../images/reels/dcl-text.svg'
import { SegmentEvent } from '../../../modules/segment'
import { LogoContainer, LogoImage, LogoText } from './Logo.styled'

const Logo = memo(() => {
  const trackClick = useTrackClick()
  const homepageUrl = getEnv('DECENTRALAND_HOMEPAGE_URL') ?? 'https://decentraland.org'

  return (
    <LogoContainer
      href={homepageUrl}
      data-event={SegmentEvent.REELS_CLICK_DCL_LOGO}
      onClick={(event: MouseEvent<HTMLAnchorElement>) => trackClick(event)}
    >
      <LogoImage titleAccess="Decentraland" />
      <LogoText src={dclTextSrc} alt="" />
    </LogoContainer>
  )
})

export { Logo }
