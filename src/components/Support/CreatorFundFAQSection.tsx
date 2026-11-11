import { type MouseEvent, useState } from 'react'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import { useUnloadSafeTrackClick } from '../../hooks/useUnloadSafeTrackClick'
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
import { clickTrackingAttributes } from '../CreatorFund/CreatorFund.helpers'
import { CLICK_SECTIONS, CREATOR_FUND_CONTACT_EMAIL, faqEntries } from '../CreatorFund/data'
import { CircleAndArrowIcon } from '../Icons'

type CreatorFundFAQSectionProps = {
  isActive: boolean
}

const SECTION_PREFIX = 'component.landing.help.creator_fund_section'

// The Creator Fund page's FAQ, same questions and answers (one copy in page.creator_fund.faq) and
// the same translation helper, in the help center's accordion, ending with the support address.
// Clicks are tracked like the page's FAQ, under the `help-center` section.
const CreatorFundFAQSection = ({ isActive }: CreatorFundFAQSectionProps) => {
  const t = useFormatMessage()
  const trackClick = useUnloadSafeTrackClick()
  const [expanded, setExpanded] = useState<number | false>(false)
  const { helpCenter } = CLICK_SECTIONS

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
            <FaqAccordionSummary
              {...clickTrackingAttributes(helpCenter, entry.trackingName)}
              // Only opening a question is tracked, as on /creator-fund.
              onClick={(event: MouseEvent<HTMLElement>) => {
                if (expanded !== index) trackClick(event)
              }}
            >
              <FaqQuestion>{t(entry.questionKey)}</FaqQuestion>
              <CircleAndArrowIcon isOpen={expanded === index} />
            </FaqAccordionSummary>
            <FaqAccordionDetails>{t(entry.answerKey)}</FaqAccordionDetails>
          </FaqAccordion>
        ))}
      </AccordionContainer>
      <CreatorFundContact>
        {t('page.creator_fund.faq.contact_prompt')}{' '}
        <a
          href={`mailto:${CREATOR_FUND_CONTACT_EMAIL}`}
          {...clickTrackingAttributes(helpCenter, 'Email Creator Fund')}
          onClick={trackClick}
        >
          {CREATOR_FUND_CONTACT_EMAIL}
        </a>
      </CreatorFundContact>
    </div>
  )
}

export { CreatorFundFAQSection }
