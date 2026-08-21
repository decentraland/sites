import { memo, useState } from 'react'
import { useMediaQuery } from 'decentraland-ui2'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useTrackClick } from '../../../hooks/adapters/useTrackLinkContext'
import { SectionViewedTrack, SegmentEvent } from '../../../modules/segment'
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
  cardId: string
}

const CreateTabContent = memo(({ tab, cardId }: CreateTabContentProps) => {
  const l = useFormatMessage()
  const trackClick = useTrackClick()
  // The Creator Hub only ships desktop installers, so its download links
  // dead-end on phones — hide them there (same breakpoint as the hero).
  const isMobile = useMediaQuery('(max-width: 767px)')
  const visibleLinks = tab.links.filter(link => !isMobile || !link.desktopOnly)

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
          {visibleLinks.map(link => (
            <LinkItem
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={trackClick}
              data-place={SectionViewedTrack.CREATORS_CREATE}
              data-event={SegmentEvent.CLICK}
              data-card={cardId}
              data-tab={tab.title}
              data-title={link.label}
            >
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
  const [activeTab, setActiveTab] = useState(card.tabs[0].title)
  const trackClick = useTrackClick()
  const currentTab = card.tabs.find(tab => tab.title === activeTab) ?? card.tabs[0]

  return (
    <CreateCardContainer>
      <CreateCardImage bgImage={card.imageBackground}>
        <img src={card.image} alt={card.title} />
      </CreateCardImage>
      <CreateCardInfo>
        <CreateCardTitle>{card.title}</CreateCardTitle>
        <CreateCardDescription>{card.description}</CreateCardDescription>
        <TabContainer>
          {card.tabs.length > 1 && (
            <TabButtons>
              {card.tabs.map(tab => (
                <TabButton
                  key={tab.title}
                  isActive={activeTab === tab.title}
                  onClick={event => {
                    trackClick(event)
                    setActiveTab(tab.title)
                  }}
                  data-place={SectionViewedTrack.CREATORS_CREATE}
                  data-event={SegmentEvent.CLICK}
                  data-card={card.id}
                  data-tab={tab.title}
                >
                  {tab.title}
                </TabButton>
              ))}
            </TabButtons>
          )}
          <CreateTabContent tab={currentTab} cardId={card.id} />
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
    <AnimatedSection trackPlace={SectionViewedTrack.CREATORS_CREATE}>
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
