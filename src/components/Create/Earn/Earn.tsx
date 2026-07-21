import { memo } from 'react'
import { Button } from 'decentraland-ui2'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useTrackClick } from '../../../hooks/adapters/useTrackLinkContext'
import { SectionViewedTrack, SegmentEvent } from '../../../modules/segment'
import earnVideo from '../../../videos/background_video_studios.mp4'
import { Video } from '../../Video'
import { AnimatedSection } from '../AnimatedSection'
import { LightCtaButton } from '../CreateButtons.styled'
import { earnSkills } from '../data'
import {
  EarnActionBlock,
  EarnActions,
  EarnBackground,
  EarnContent,
  EarnSection,
  EarnSubtitle,
  EarnTitle,
  SkillBadge,
  SkillsContainer
} from './Earn.styled'

const CreatorsEarn = memo(() => {
  const l = useFormatMessage()
  const trackClick = useTrackClick()
  return (
    <AnimatedSection trackPlace={SectionViewedTrack.CREATORS_EARN}>
      <EarnSection>
        <EarnBackground>
          <Video loop muted autoPlay playsInline width={1352} height={534} source={earnVideo} />
        </EarnBackground>
        <EarnContent>
          <EarnTitle>
            {l('component.creators_landing.earn.title')} {l('component.creators_landing.earn.second_title')}
            <span>{l('component.creators_landing.earn.title_highlight')}</span>
          </EarnTitle>
          <EarnSubtitle>
            {l('component.creators_landing.earn.subtitle')}
            <SkillsContainer>
              {earnSkills.map(skill => (
                <SkillBadge key={skill}>{skill}</SkillBadge>
              ))}
            </SkillsContainer>
          </EarnSubtitle>
          <EarnActions>
            <EarnActionBlock sx={{ marginRight: { xs: 0, md: '80px' } }}>
              {l('component.creators_landing.earn.browse_creator_label')}
              <Button
                variant="contained"
                component="a"
                href={l('component.creators_landing.earn.browse_creator_url')}
                target="_blank"
                rel="noopener noreferrer"
                onClick={trackClick}
                data-place={SectionViewedTrack.CREATORS_EARN}
                data-event={SegmentEvent.CLICK}
                data-title="browse-studios"
              >
                {l('component.creators_landing.earn.browse_creator_button')}
              </Button>
            </EarnActionBlock>
            <EarnActionBlock sx={{ marginTop: { xs: '33px', md: 0 } }}>
              {l('component.creators_landing.earn.are_you_creator_label')}
              <LightCtaButton
                variant="outlined"
                component="a"
                href={l('component.creators_landing.earn.are_you_creator_url')}
                target="_blank"
                rel="noopener noreferrer"
                onClick={trackClick}
                data-place={SectionViewedTrack.CREATORS_EARN}
                data-event={SegmentEvent.CLICK}
                data-title="join-registry"
              >
                {l('component.creators_landing.earn.are_you_creator_button')}
              </LightCtaButton>
            </EarnActionBlock>
          </EarnActions>
        </EarnContent>
      </EarnSection>
    </AnimatedSection>
  )
})

export { CreatorsEarn }
