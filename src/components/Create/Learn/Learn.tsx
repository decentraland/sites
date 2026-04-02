import { memo, useCallback } from 'react'
import { Button } from 'decentraland-ui2'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { AnimatedSection } from '../AnimatedSection'
import { learnCards } from '../data'
import { PlayIcon } from './PlayIcon'
import {
  LearnCard,
  LearnCardDate,
  LearnCardInfo,
  LearnCardTitle,
  LearnCardUser,
  LearnCardUserImage,
  LearnCardUserName,
  LearnCardUserRow,
  LearnCardVideoImage,
  LearnCardsContainer,
  LearnExtraBlock,
  LearnExtraContainer,
  LearnSection,
  LearnTitle
} from './Learn.styled'

const CreatorsLearn = memo(() => {
  const l = useFormatMessage()
  const handleCardClick = useCallback((url: string) => {
    window.open(url, '_blank')
  }, [])

  return (
    <AnimatedSection>
      <LearnSection>
        <LearnTitle>
          <span>{l('component.creators_landing.learn.title_highlight')}</span> {l('component.creators_landing.learn.title')}
        </LearnTitle>
        <LearnCardsContainer>
          {learnCards.map(card => (
            <LearnCard key={card.id} onClick={() => handleCardClick(card.url)}>
              <LearnCardVideoImage>
                <img src={card.image} alt={card.title} />
                <PlayIcon />
              </LearnCardVideoImage>
              <LearnCardInfo>
                <LearnCardUserRow>
                  <LearnCardUser>
                    <LearnCardUserImage>
                      <img src={card.userImage} alt={card.name} />
                    </LearnCardUserImage>
                    <LearnCardUserName>{card.name}</LearnCardUserName>
                  </LearnCardUser>
                  <LearnCardDate>{card.date}</LearnCardDate>
                </LearnCardUserRow>
                <LearnCardTitle>{card.title}</LearnCardTitle>
              </LearnCardInfo>
            </LearnCard>
          ))}
        </LearnCardsContainer>
        <LearnExtraContainer>
          <LearnExtraBlock sx={{ marginRight: { xs: 0, md: '80px' } }}>
            {l('component.creators_landing.learn.watch_more')}
            <Button
              variant="contained"
              component="a"
              href={l('component.creators_landing.learn.watch_more_target')}
              target="_blank"
              rel="noopener noreferrer"
            >
              {l('component.creators_landing.learn.watch_more_button')}
            </Button>
          </LearnExtraBlock>
          <LearnExtraBlock sx={{ marginTop: { xs: '33px', md: 0 } }}>
            {l('component.creators_landing.learn.your_tutorial')}
            <Button
              variant="outlined"
              component="a"
              href={l('component.creators_landing.learn.your_tutorial_target')}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ backgroundColor: '#fff', color: '#43404a', ['&:hover']: { backgroundColor: '#e0e0e0' } }}
            >
              {l('component.creators_landing.learn.your_tutorial_button')}
            </Button>
          </LearnExtraBlock>
        </LearnExtraContainer>
      </LearnSection>
    </AnimatedSection>
  )
})

export { CreatorsLearn }
