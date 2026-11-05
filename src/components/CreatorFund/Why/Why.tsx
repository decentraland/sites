import { memo } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import TollOutlinedIcon from '@mui/icons-material/TollOutlined'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { getDownloadUrl } from '../../../modules/downloadConstants'
import { CreatorFundSection } from '../CreatorFund.styled'
import { platformLinks, scenes } from '../data'
import {
  AwardedLine,
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

  return (
    <CreatorFundSection>
      <WhyGrid>
        <div>
          <HomeLink href="/" aria-label={l('page.creator_fund.why.visit')}>
            <WhyLogo aria-hidden="true" />
            <WhyTitle>{l('page.creator_fund.why.title')}</WhyTitle>
          </HomeLink>
          <WhySubtitle>{l('page.creator_fund.why.subtitle')}</WhySubtitle>
          <AwardedLine>
            <TollOutlinedIcon aria-hidden="true" />
            <span>{l('page.creator_fund.why.awarded')}</span>
          </AwardedLine>
          <PlatformGrid aria-label={l('page.creator_fund.why.platforms_label')}>
            {/* eslint-disable-next-line @typescript-eslint/naming-convention */}
            {platformLinks.map(({ name, os, icon: Icon }) => (
              <li key={name}>
                <PlatformLink href={getDownloadUrl(os)} target="_blank" rel="noopener noreferrer">
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
