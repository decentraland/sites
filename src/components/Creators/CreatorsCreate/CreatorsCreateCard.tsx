import { memo, useState } from 'react'
import { isWebpSupported, useImageOptimization } from '../../../hooks/contentful'
import { CreatorsCreateTab } from './CreatorsCreateTab'
import type { CreatorsCreateCardProps } from './CreatorsCreate.types'
import {
  CreatorsCreateCardContainer,
  CreatorsCreateCardDescription,
  CreatorsCreateCardImageContainer,
  CreatorsCreateCardInfoContainer,
  CreatorsCreateCardTab,
  CreatorsCreateCardTabs,
  CreatorsCreateCardTitle
} from './CreatorsCreateCard.styled'

const CreatorsCreateCard = memo(({ item }: CreatorsCreateCardProps) => {
  const [activeTab, setActiveTab] = useState(0)

  const image = useImageOptimization(item.image.url)
  const imageBackground = useImageOptimization(item.imageBackground.url)

  const hasTwoTabs = Boolean(item.tab2Title)

  const parseLinks = (raw: string): Document | null => {
    if (!raw) return null
    try {
      return JSON.parse(raw) as Document
    } catch {
      return null
    }
  }

  const tab1Links = parseLinks(item.tab1Links.raw)
  const tab2Links = parseLinks(item.tab2Links.raw)

  return (
    <CreatorsCreateCardContainer>
      <CreatorsCreateCardImageContainer
        backgroundUrl={(isWebpSupported() && imageBackground.webp) || imageBackground.jpg || imageBackground.optimized}
      >
        <img src={(isWebpSupported() && image.webp) || image.png || image.optimized} alt={item.title} loading="lazy" />
      </CreatorsCreateCardImageContainer>
      <CreatorsCreateCardInfoContainer>
        <CreatorsCreateCardTitle variant="h5">{item.title}</CreatorsCreateCardTitle>
        <CreatorsCreateCardDescription>{item.description}</CreatorsCreateCardDescription>

        <div>
          {hasTwoTabs && (
            <CreatorsCreateCardTabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
              <CreatorsCreateCardTab label={item.tab1Title} />
              <CreatorsCreateCardTab label={item.tab2Title} />
            </CreatorsCreateCardTabs>
          )}

          {activeTab === 0 && tab1Links && (
            <CreatorsCreateTab
              title={item.tab1DescriptionTitle}
              subtitle={item.tab1DescriptionSubTitle}
              skills={item.tab1Skills}
              links={tab1Links}
            />
          )}
          {activeTab === 1 && tab2Links && (
            <CreatorsCreateTab
              title={item.tab2DescriptionTitle}
              subtitle={item.tab2DescriptionSubTitle}
              skills={item.tab2Skills}
              links={tab2Links}
            />
          )}
        </div>
      </CreatorsCreateCardInfoContainer>
    </CreatorsCreateCardContainer>
  )
})

export { CreatorsCreateCard }
export type { CreatorsCreateCardProps }
