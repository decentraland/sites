import { memo } from 'react'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useUnloadSafeTrackClick } from '../../../hooks/useUnloadSafeTrackClick'
import { getDownloadUrl } from '../../../modules/downloadConstants'
import { clickTrackingAttributes } from '../CreatorFund.helpers'
import { CreatorFundSection } from '../CreatorFund.styled'
import { CLICK_SECTIONS, platformLinks, scenes } from '../data'
import {
  HomeLink,
  PlatformGrid,
  PlatformLink,
  SceneCard,
  SceneImage,
  SceneStack,
  WhyGrid,
  WhyLogo,
  WhySubtitle,
  WhyTitle
} from './Why.styled'

const Why = memo(() => {
  const l = useFormatMessage()
  const trackClick = useUnloadSafeTrackClick()

  return (
    <CreatorFundSection>
      <WhyGrid>
        <div>
          <HomeLink
            href="/"
            aria-label={l('page.creator_fund.why.visit')}
            {...clickTrackingAttributes(CLICK_SECTIONS.intro, 'Visit Decentraland')}
            onClick={trackClick}
          >
            <WhyLogo aria-hidden="true" />
            <WhyTitle>{l('page.creator_fund.why.title')}</WhyTitle>
          </HomeLink>
          <WhySubtitle>{l('page.creator_fund.why.subtitle')}</WhySubtitle>
          <PlatformGrid aria-label={l('page.creator_fund.why.platforms_label')}>
            {/* eslint-disable-next-line @typescript-eslint/naming-convention */}
            {platformLinks.map(({ name, os, icon: Icon, downloadTarget }) => (
              <li key={name}>
                <PlatformLink
                  href={getDownloadUrl(os)}
                  target="_blank"
                  rel="noopener noreferrer"
                  {...clickTrackingAttributes(CLICK_SECTIONS.intro, name, downloadTarget)}
                  onClick={trackClick}
                >
                  <Icon aria-hidden="true" />
                  <span>{name}</span>
                </PlatformLink>
              </li>
            ))}
          </PlatformGrid>
        </div>
        <SceneStack>
          {scenes.map((scene, index) => (
            <SceneCard key={scene.name} position={index}>
              <SceneImage src={scene.image} alt={l('page.creator_fund.why.scene_alt', { name: scene.name })} loading="lazy" />
            </SceneCard>
          ))}
        </SceneStack>
      </WhyGrid>
    </CreatorFundSection>
  )
})

Why.displayName = 'Why'

export { Why }
