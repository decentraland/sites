import { memo } from 'react'
import { Options, documentToReactComponents } from '@contentful/rich-text-react-renderer'
import { INLINES, type Text } from '@contentful/rich-text-types'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import type { CreatorsCreateTabProps } from './CreatorsCreate.types'
import {
  CreatorsCreateTabContainer,
  CreatorsCreateTabInfoSection,
  CreatorsCreateTabLinksContainer,
  CreatorsCreateTabSectionSubtitle,
  CreatorsCreateTabSectionTitle,
  CreatorsCreateTabSkill,
  CreatorsCreateTabSkillsContainer
} from './CreatorsCreateTab.styled'

const richTextOptions: Options = {
  renderNode: {
    [INLINES.HYPERLINK]: node => {
      const content = node.content as [Text]
      return (
        <a href={node.data.uri} target="_blank" rel="noopener noreferrer" className="create-tab__link">
          {content[0].value}
        </a>
      )
    }
  },
  renderText: () => null
}

const CreatorsCreateTab = memo(({ title, subtitle, skills, links }: CreatorsCreateTabProps) => {
  const l = useFormatMessage()

  return (
    <CreatorsCreateTabContainer>
      <CreatorsCreateTabInfoSection>
        <CreatorsCreateTabSectionTitle variant="body1">{title}</CreatorsCreateTabSectionTitle>
        <CreatorsCreateTabSectionSubtitle>{subtitle}</CreatorsCreateTabSectionSubtitle>
      </CreatorsCreateTabInfoSection>

      <CreatorsCreateTabInfoSection>
        <CreatorsCreateTabSectionTitle variant="body1">
          {l('component.creators_landing.create.tab.required_skills')}
        </CreatorsCreateTabSectionTitle>
        <CreatorsCreateTabSkillsContainer>
          {skills.map(skill => (
            <CreatorsCreateTabSkill key={skill}>{skill}</CreatorsCreateTabSkill>
          ))}
        </CreatorsCreateTabSkillsContainer>
      </CreatorsCreateTabInfoSection>

      <CreatorsCreateTabInfoSection>
        <CreatorsCreateTabSectionTitle variant="body1">
          {l('component.creators_landing.create.tab.useful_links')}
        </CreatorsCreateTabSectionTitle>
        <CreatorsCreateTabLinksContainer>{documentToReactComponents(links, richTextOptions)}</CreatorsCreateTabLinksContainer>
      </CreatorsCreateTabInfoSection>
    </CreatorsCreateTabContainer>
  )
})

export { CreatorsCreateTab }
export type { CreatorsCreateTabProps }
