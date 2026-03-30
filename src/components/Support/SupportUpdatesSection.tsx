import { useMemo, useState } from 'react'
import { useTranslation } from '@dcl/hooks'
import {
  AccordionContainer,
  FaqAccordion,
  FaqAccordionDetails,
  FaqAccordionSummary,
  FaqQuestion,
  HelpSectionTexts,
  HelpSectionTitle
} from '../../pages/help/HelpPage.styled'
import { CircleAndArrowIcon } from '../Icons'

type SupportUpdatesSectionProps = {
  isActive: boolean
}

const SUPPORT_PREFIX = 'component.landing.help.support_updates_section'

const SupportUpdatesSection = ({ isActive }: SupportUpdatesSectionProps) => {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState<number | false>(false)

  const items = useMemo(() => {
    const count = Number(t(`${SUPPORT_PREFIX}.item_count`))
    return Array.from({ length: count }, (_, i) => ({
      question: t(`${SUPPORT_PREFIX}.item_${i}_question`),
      answer: t(`${SUPPORT_PREFIX}.item_${i}_answer`)
    }))
  }, [t])

  if (!isActive) return null

  return (
    <div>
      <HelpSectionTexts>
        <HelpSectionTitle>{t(`${SUPPORT_PREFIX}.title`)}</HelpSectionTitle>
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

export { SupportUpdatesSection }
