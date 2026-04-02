import { type KeyboardEvent, memo, useCallback, useRef, useState } from 'react'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { CircleAndArrow } from '../../Icon/CircleAndArrow'
import { faqItems } from '../data'
import {
  FaqAccordionItem,
  FaqAnswerContainer,
  FaqAnswerText,
  FaqQuestionRow,
  FaqQuestionText,
  FaqsContainer,
  FaqsCta,
  FaqsInnerBorder,
  FaqsSection,
  FaqsSubtitle,
  FaqsTitle
} from './Faqs.styled'

type FaqAccordionProps = {
  title: string
  children: React.ReactNode
  index: number
  expanded: number | false
  setExpanded: (value: number | false) => void
}

const FaqAccordion = memo((props: FaqAccordionProps) => {
  const { title, children, index, expanded, setExpanded } = props
  const isOpen = index === expanded
  const contentRef = useRef<HTMLDivElement>(null)
  const questionId = `create-faq-question-${index}`
  const answerId = `create-faq-answer-${index}`

  const handleToggle = useCallback(() => {
    setExpanded(isOpen ? false : index)
  }, [isOpen, index, setExpanded])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        handleToggle()
      }
    },
    [handleToggle]
  )

  return (
    <FaqAccordionItem
      isOpen={isOpen}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      role="button"
      aria-expanded={isOpen}
      aria-controls={answerId}
      tabIndex={0}
    >
      <FaqQuestionRow>
        <FaqQuestionText id={questionId}>{title}</FaqQuestionText>
        <CircleAndArrow isOpen={isOpen} aria-hidden="true" />
      </FaqQuestionRow>
      <FaqAnswerContainer ref={contentRef} id={answerId} role="region" aria-labelledby={questionId} aria-hidden={!isOpen} isOpen={isOpen}>
        <FaqAnswerText>{children}</FaqAnswerText>
      </FaqAnswerContainer>
    </FaqAccordionItem>
  )
})

const CreatorsFaqs = memo(() => {
  const l = useFormatMessage()
  const [expanded, setExpanded] = useState<number | false>(false)

  return (
    <FaqsSection aria-label="Frequently Asked Questions">
      <FaqsInnerBorder>
        <FaqsContainer>
          <FaqsSubtitle>{l('component.landing.faqs.subtitle')}</FaqsSubtitle>
          <FaqsTitle {...({ component: 'h2' } as Record<string, unknown>)}>{l('component.landing.faqs.title')}</FaqsTitle>
          {faqItems.map((faq, index) => (
            <FaqAccordion key={index} title={faq.question} index={index} expanded={expanded} setExpanded={setExpanded}>
              {faq.answer}
            </FaqAccordion>
          ))}
          <FaqsCta href={l('component.landing.faqs.cta.link')}>{l('component.landing.faqs.cta.label')}</FaqsCta>
        </FaqsContainer>
      </FaqsInnerBorder>
    </FaqsSection>
  )
})

export { CreatorsFaqs }
