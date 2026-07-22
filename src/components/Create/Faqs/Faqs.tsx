import { type KeyboardEvent, type SyntheticEvent, memo, useCallback, useRef, useState } from 'react'
import { useInView } from 'react-intersection-observer'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useTrackClick } from '../../../hooks/adapters/useTrackLinkContext'
import { useSectionViewedTracking } from '../../../hooks/useSectionViewedTracking'
import { SectionViewedTrack, SegmentEvent } from '../../../modules/segment'
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
  const trackClick = useTrackClick()
  const questionId = `create-faq-question-${index}`
  const answerId = `create-faq-answer-${index}`

  const handleToggle = useCallback(
    (event: SyntheticEvent<HTMLElement>) => {
      // Only the expand is a meaningful engagement signal; a collapse is not
      // tracked. useTrackClick accepts any SyntheticEvent (it only reads
      // currentTarget), so both the mouse and keyboard paths pass through
      // without a cast.
      if (!isOpen) {
        trackClick(event)
      }
      setExpanded(isOpen ? false : index)
    },
    [isOpen, index, setExpanded, trackClick]
  )

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        handleToggle(event)
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
      data-place={SectionViewedTrack.CREATORS_FAQS}
      data-event={SegmentEvent.CLICK}
      data-title={title}
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
  const trackClick = useTrackClick()
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 })

  // Faqs has no reveal animation, so it is not wrapped in AnimatedSection; it
  // observes its own viewport intersection to emit the Section Viewed event.
  useSectionViewedTracking(SectionViewedTrack.CREATORS_FAQS, inView)

  return (
    <FaqsSection ref={ref} aria-label="Frequently Asked Questions">
      <FaqsInnerBorder>
        <FaqsContainer>
          <FaqsSubtitle>{l('component.landing.faqs.subtitle')}</FaqsSubtitle>
          <FaqsTitle {...({ component: 'h2' } as Record<string, unknown>)}>{l('component.landing.faqs.title')}</FaqsTitle>
          {faqItems.map((faq, index) => (
            <FaqAccordion key={index} title={faq.question} index={index} expanded={expanded} setExpanded={setExpanded}>
              {faq.answer}
            </FaqAccordion>
          ))}
          <FaqsCta
            href={l('component.landing.faqs.cta.link')}
            onClick={trackClick}
            data-place={SectionViewedTrack.CREATORS_FAQS}
            data-event={SegmentEvent.CLICK}
            data-title="faqs-cta"
          >
            {l('component.landing.faqs.cta.label')}
          </FaqsCta>
        </FaqsContainer>
      </FaqsInnerBorder>
    </FaqsSection>
  )
})

export { CreatorsFaqs }
