import { memo } from 'react'
import { Button } from 'decentraland-ui2'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { AnimatedSection } from '../AnimatedSection'
import { earnSkills } from '../data'
import { EarnActionBlock, EarnActions, EarnContent, EarnSection, EarnSubtitle, EarnTitle, SkillBadge, SkillsContainer } from './Earn.styled'

const CreatorsEarn = memo(() => {
  const l = useFormatMessage()
  return (
    <AnimatedSection>
      <EarnSection>
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
              >
                {l('component.creators_landing.earn.browse_creator_button')}
              </Button>
            </EarnActionBlock>
            <EarnActionBlock sx={{ marginTop: { xs: '33px', md: 0 } }}>
              {l('component.creators_landing.earn.are_you_creator_label')}
              <Button
                variant="outlined"
                component="a"
                href={l('component.creators_landing.earn.are_you_creator_url')}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ backgroundColor: '#fff', color: '#43404a', ['&:hover']: { backgroundColor: '#e0e0e0' } }}
              >
                {l('component.creators_landing.earn.are_you_creator_button')}
              </Button>
            </EarnActionBlock>
          </EarnActions>
        </EarnContent>
      </EarnSection>
    </AnimatedSection>
  )
})

export { CreatorsEarn }
