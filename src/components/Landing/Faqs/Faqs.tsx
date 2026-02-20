import { memo, useCallback, useState } from 'react'
import { documentToReactComponents } from '@contentful/rich-text-react-renderer'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import type { FaqsProps } from './Faqs.types'
import {
  FaqAnswer,
  FaqAnswerText,
  FaqChevron,
  FaqItem,
  FaqQuestion,
  FaqQuestionText,
  FaqsContainer,
  FaqsCta,
  FaqsSection,
  FaqsSubtitle,
  FaqsTitle
} from './Faqs.styled'

const Faqs = memo((props: FaqsProps) => {
  const { faqs } = props
  const l = useFormatMessage()
  const [expanded, setExpanded] = useState<number | false>(false)

  const handleToggle = useCallback((index: number) => {
    setExpanded(prev => (prev === index ? false : index))
  }, [])

  return (
    <FaqsSection>
      <FaqsContainer>
        <FaqsSubtitle>{l('component.landing.faqs.subtitle')}</FaqsSubtitle>
        <FaqsTitle variant="h1">{l('component.landing.faqs.title')}</FaqsTitle>
        {faqs.list.map((faq, index) => {
          const isOpen = expanded === index
          return (
            <FaqItem key={index} isOpen={isOpen} onClick={() => handleToggle(index)}>
              <FaqQuestion>
                <FaqQuestionText>{faq.question.text}</FaqQuestionText>
                <FaqChevron isOpen={isOpen}>
                  <ExpandMoreIcon sx={{ fontSize: '2rem' }} />
                </FaqChevron>
              </FaqQuestion>
              <FaqAnswer isOpen={isOpen}>
                <FaqAnswerText>
                  {(() => {
                    try {
                      return documentToReactComponents(JSON.parse(faq.answer.raw))
                    } catch {
                      return faq.answer.raw
                    }
                  })()}
                </FaqAnswerText>
              </FaqAnswer>
            </FaqItem>
          )
        })}
        <FaqsCta size="large" href={l('component.landing.faqs.cta.link')} variant="outlined" color="secondary">
          {l('component.landing.faqs.cta.label')}
        </FaqsCta>
      </FaqsContainer>
    </FaqsSection>
  )
})

export { Faqs }
