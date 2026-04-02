import { memo, useState } from 'react'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { Carousel } from '../../Carousel'
import { AnimatedSection } from '../AnimatedSection'
import { createCards } from '../data'
import type { CreateCardData, CreateCardTab } from '../data'
import {
  CreateCardContainer,
  CreateCardDescription,
  CreateCardImage,
  CreateCardInfo,
  CreateCardTitle,
  CreateSection,
  CreateTitle,
  LinkItem,
  LinksContainer,
  SkillBadge,
  SkillsContainer,
  TabButton,
  TabButtons,
  TabContainer,
  TabInfoBlock,
  TabInfoSubtitle,
  TabInfoTitle
} from './CreateCards.styled'

type CreateTabContentProps = {
  tab: CreateCardTab
}

const CreateTabContent = memo(({ tab }: CreateTabContentProps) => {
  const l = useFormatMessage()

  return (
    <>
      <TabInfoBlock>
        <TabInfoTitle>{tab.descriptionTitle}</TabInfoTitle>
        <TabInfoSubtitle>{tab.descriptionSubTitle}</TabInfoSubtitle>
      </TabInfoBlock>
      <TabInfoBlock>
        <TabInfoTitle>{l('component.creators_landing.create.tab.required_skills')}</TabInfoTitle>
        <SkillsContainer>
          {tab.skills.map(skill => (
            <SkillBadge key={skill}>{skill}</SkillBadge>
          ))}
        </SkillsContainer>
      </TabInfoBlock>
      <TabInfoBlock>
        <TabInfoTitle>{l('component.creators_landing.create.tab.useful_links')}</TabInfoTitle>
        <LinksContainer>
          {tab.links.map(link => (
            <LinkItem key={link.url} href={link.url} target="_blank" rel="noopener noreferrer">
              {link.label}
            </LinkItem>
          ))}
        </LinksContainer>
      </TabInfoBlock>
    </>
  )
})

type CreateCardProps = {
  card: CreateCardData
}

const CreateCard = memo(({ card }: CreateCardProps) => {
  const [activeTab, setActiveTab] = useState(card.tab1.title)

  return (
    <CreateCardContainer>
      <CreateCardImage bgImage={card.imageBackground}>
        <img src={card.image} alt={card.title} />
      </CreateCardImage>
      <CreateCardInfo>
        <CreateCardTitle>{card.title}</CreateCardTitle>
        <CreateCardDescription>{card.description}</CreateCardDescription>
        <TabContainer>
          {card.tab2 && (
            <TabButtons>
              <TabButton isActive={activeTab === card.tab1.title} onClick={() => setActiveTab(card.tab1.title)}>
                {card.tab1.title}
              </TabButton>
              <TabButton isActive={activeTab === card.tab2.title} onClick={() => setActiveTab(card.tab2!.title)}>
                {card.tab2.title}
              </TabButton>
            </TabButtons>
          )}
          {activeTab === card.tab1.title && <CreateTabContent tab={card.tab1} />}
          {card.tab2 && activeTab === card.tab2.title && <CreateTabContent tab={card.tab2} />}
        </TabContainer>
      </CreateCardInfo>
    </CreateCardContainer>
  )
})

const renderCard = (card: CreateCardData) => <CreateCard card={card} />
const keyExtractor = (card: CreateCardData) => card.id

const CreatorsCreate = memo(() => {
  const l = useFormatMessage()
  return (
    <AnimatedSection>
      <CreateSection>
        <CreateTitle>
          {l('component.creators_landing.create.title')}
          <span>{l('component.creators_landing.create.title_highlight')}</span>
          {l('component.creators_landing.create.title_second_part')}
        </CreateTitle>
        <Carousel items={createCards} renderItem={renderCard} keyExtractor={keyExtractor} slideWidth={1200} autoplayDelay={0} />
      </CreateSection>
    </AnimatedSection>
  )
})

export { CreatorsCreate }
