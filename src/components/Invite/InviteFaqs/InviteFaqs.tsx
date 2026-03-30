import { type KeyboardEvent, memo, useCallback, useMemo, useRef, useState } from 'react'
import { useTranslation } from '@dcl/hooks'
import { CircleAndArrow } from '../../Icon/CircleAndArrow'
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
} from './InviteFaqs.styled'

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
  const questionId = `faq-question-${index}`
  const answerId = `faq-answer-${index}`

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

const InviteFaqs = memo(() => {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState<number | false>(false)

  const faqs = useMemo(() => {
    const count = parseInt(t('page_invite.faq.item_count'), 10)
    return Array.from({ length: count }, (_, i) => ({
      question: t(`page_invite.faq.item_${i}_question`),
      answer: t(`page_invite.faq.item_${i}_answer`)
    }))
  }, [t])

  return (
    <FaqsSection aria-label="Frequently Asked Questions">
      <FaqsInnerBorder>
        <FaqsContainer>
          <FaqsSubtitle>{t('component.landing.faqs.subtitle')}</FaqsSubtitle>
          <FaqsTitle {...({ component: 'h2' } as Record<string, unknown>)}>{t('component.landing.faqs.title')}</FaqsTitle>
          {faqs.map((faq, index) => (
            <FaqAccordion key={index} title={faq.question} index={index} expanded={expanded} setExpanded={setExpanded}>
              {faq.answer}
            </FaqAccordion>
          ))}
          <FaqsCta href={t('component.landing.faqs.cta.link')}>{t('component.landing.faqs.cta.label')}</FaqsCta>
        </FaqsContainer>
      </FaqsInnerBorder>
    </FaqsSection>
  )
})

export { InviteFaqs }
