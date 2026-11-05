import { memo } from 'react'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useScrollParallax } from '../../../hooks/useScrollParallax'
import avatarsImage from '../../../images/creator-fund/avatars.webp'
import { PARALLAX_OFFSET_PROPERTY, PARALLAX_SPEED, PrimaryButtonLink } from '../CreatorFund.styled'
import { AvatarsImage, JoinActions, JoinInner, JoinSection, JoinSubtitle, JoinTitle, TermsLink } from './Join.styled'

const Join = memo(() => {
  const l = useFormatMessage()
  const bandRef = useScrollParallax<HTMLElement>(PARALLAX_OFFSET_PROPERTY, PARALLAX_SPEED)

  return (
    <JoinSection id="join" band spacing="top" ref={bandRef}>
      <JoinInner>
        <JoinTitle>{l('page.creator_fund.join.title')}</JoinTitle>
        <JoinSubtitle>
          {l('page.creator_fund.join.subtitle')} <TermsLink href="#terms">{l('page.creator_fund.join.see_terms')}</TermsLink>
        </JoinSubtitle>
        <JoinActions>
          <PrimaryButtonLink href="/create">{l('page.creator_fund.cta.get_creator_hub')}</PrimaryButtonLink>
        </JoinActions>
      </JoinInner>
      <AvatarsImage src={avatarsImage} alt={l('page.creator_fund.join.avatars_alt')} width={1920} height={620} loading="lazy" />
    </JoinSection>
  )
})

Join.displayName = 'Join'

export { Join }
