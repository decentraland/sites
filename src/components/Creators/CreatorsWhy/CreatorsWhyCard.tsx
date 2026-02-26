import { memo } from 'react'
import type { CreatorsWhyCardProps } from './CreatorsWhy.types'
import {
  CreatorsWhyCardContainer,
  CreatorsWhyCardDescription,
  CreatorsWhyCardImageContainer,
  CreatorsWhyCardTitle
} from './CreatorsWhyCard.styled'

const CreatorsWhyCard = memo(({ item }: CreatorsWhyCardProps) => {
  return (
    <CreatorsWhyCardContainer cardId={item.id}>
      <CreatorsWhyCardImageContainer>
        <img src={item.image.url} alt={item.title} loading="lazy" />
      </CreatorsWhyCardImageContainer>
      <CreatorsWhyCardTitle variant="h5">{item.title}</CreatorsWhyCardTitle>
      <CreatorsWhyCardDescription>{item.description}</CreatorsWhyCardDescription>
    </CreatorsWhyCardContainer>
  )
})

export { CreatorsWhyCard }
export type { CreatorsWhyCardProps }
