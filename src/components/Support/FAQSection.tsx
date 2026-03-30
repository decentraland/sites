import { useMemo, useState } from 'react'
import { useTranslation } from '@dcl/hooks'
import {
  AccordionContainer,
  FaqAccordion,
  FaqAccordionDetails,
  FaqAccordionSummary,
  FaqQuestion,
  HelpSectionDescription,
  HelpSectionTexts,
  HelpSectionTitle
} from '../../pages/help/HelpPage.styled'
import { CircleAndArrowIcon } from '../Icons'

type FAQSectionProps = {
  isActive: boolean
}

const FAQ_PREFIX = 'component.landing.help.faq_section'

const FAQSection = ({ isActive }: FAQSectionProps) => {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState<number | false>(false)

  const items = useMemo(() => {
    const count = Number(t(`${FAQ_PREFIX}.item_count`))
    return Array.from({ length: count }, (_, i) => ({
      question: t(`${FAQ_PREFIX}.item_${i}_question`),
      answer: t(`${FAQ_PREFIX}.item_${i}_answer`)
    }))
  }, [t])

  if (!isActive) return null

  return (
    <div>
      <HelpSectionTexts>
        <HelpSectionTitle>{t(`${FAQ_PREFIX}.title`)}</HelpSectionTitle>
        <HelpSectionDescription>
          {t(`${FAQ_PREFIX}.paragraph`)} <a href="https://docs.decentraland.org/faqs/decentraland-101">{t(`${FAQ_PREFIX}.cta_link`)}.</a>
        </HelpSectionDescription>
      </HelpSectionTexts>
      <AccordionContainer>
        {items.map((faq, index) => (
          <FaqAccordion key={index} expanded={expanded === index} onChange={(_, isExpanded) => setExpanded(isExpanded ? index : false)}>
            <FaqAccordionSummary>
              <FaqQuestion>{faq.question}</FaqQuestion>
              <CircleAndArrowIcon isOpen={expanded === index} />
            </FaqAccordionSummary>
            <FaqAccordionDetails>{faq.answer}</FaqAccordionDetails>
          </FaqAccordion>
        ))}
      </AccordionContainer>
    </div>
  )
}

export { FAQSection }
