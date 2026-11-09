import { useState } from 'react'
import { useTranslation } from '@dcl/hooks'
import {
  AccordionContainer,
  CreatorFundContact,
  FaqAccordion,
  FaqAccordionDetails,
  FaqAccordionSummary,
  FaqQuestion,
  HelpSectionDescription,
  HelpSectionTexts,
  HelpSectionTitle
} from '../../pages/help/HelpPage.styled'
import { CREATOR_FUND_CONTACT_EMAIL, faqEntries } from '../CreatorFund/data'
import { CircleAndArrowIcon } from '../Icons'

type CreatorFundFAQSectionProps = {
  isActive: boolean
}

const SECTION_PREFIX = 'component.landing.help.creator_fund_section'

// The Creator Fund page's FAQ, same questions and answers (one copy in page.creator_fund.faq),
// in the help center's accordion, ending with the program's support address.
const CreatorFundFAQSection = ({ isActive }: CreatorFundFAQSectionProps) => {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState<number | false>(false)

  if (!isActive) return null

  return (
    <div>
      <HelpSectionTexts>
        <HelpSectionTitle>{t(`${SECTION_PREFIX}.title`)}</HelpSectionTitle>
        <HelpSectionDescription>{t(`${SECTION_PREFIX}.paragraph`)}</HelpSectionDescription>
      </HelpSectionTexts>
      <AccordionContainer>
        {faqEntries.map((entry, index) => (
          <FaqAccordion
            key={entry.questionKey}
            expanded={expanded === index}
            onChange={(_, isExpanded) => setExpanded(isExpanded ? index : false)}
          >
            <FaqAccordionSummary>
              <FaqQuestion>{t(entry.questionKey)}</FaqQuestion>
              <CircleAndArrowIcon isOpen={expanded === index} />
            </FaqAccordionSummary>
            <FaqAccordionDetails>{t(entry.answerKey)}</FaqAccordionDetails>
          </FaqAccordion>
        ))}
      </AccordionContainer>
      <CreatorFundContact>
        {t('page.creator_fund.faq.contact_prompt')} <a href={`mailto:${CREATOR_FUND_CONTACT_EMAIL}`}>{CREATOR_FUND_CONTACT_EMAIL}</a>
      </CreatorFundContact>
    </div>
  )
}

export { CreatorFundFAQSection }
