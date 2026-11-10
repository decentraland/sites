import { type MouseEvent, memo, useCallback } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useUnloadSafeTrackClick } from '../../../hooks/useUnloadSafeTrackClick'
import { clickTrackingAttributes } from '../CreatorFund.helpers'
import { CreatorFundSection, DisplayTitle } from '../CreatorFund.styled'
import { CLICK_SECTIONS, CREATOR_FUND_CONTACT_EMAIL, faqEntries } from '../data'
import { FaqAnswer, FaqContact, FaqContactLink, FaqInner, FaqItem, FaqList, FaqQuestion } from './Faq.styled'

// Native <details>: keyboard and screen reader support come with the element.
const Faq = memo(() => {
  const l = useFormatMessage()
  const trackClick = useUnloadSafeTrackClick()
  // Like the /create FAQ, only opening a question is tracked; closing it is not a signal.
  const trackOpen = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      const details = event.currentTarget.parentElement as HTMLDetailsElement | null
      if (!details?.open) trackClick(event)
    },
    [trackClick]
  )

  return (
    <CreatorFundSection id="faq">
      <FaqInner>
        <DisplayTitle>{l('page.creator_fund.faq.title')}</DisplayTitle>
        <FaqList>
          {faqEntries.map(entry => (
            <FaqItem key={entry.questionKey}>
              <FaqQuestion {...clickTrackingAttributes(CLICK_SECTIONS.faq, entry.trackingName)} onClick={trackOpen}>
                {l(entry.questionKey)}
                <ExpandMoreIcon aria-hidden="true" />
              </FaqQuestion>
              <FaqAnswer>{l(entry.answerKey)}</FaqAnswer>
            </FaqItem>
          ))}
        </FaqList>
        <FaqContact>
          {l('page.creator_fund.faq.contact_prompt')}{' '}
          <FaqContactLink
            href={`mailto:${CREATOR_FUND_CONTACT_EMAIL}`}
            {...clickTrackingAttributes(CLICK_SECTIONS.faq, 'Email Creator Fund')}
            onClick={trackClick}
          >
            {CREATOR_FUND_CONTACT_EMAIL}
          </FaqContactLink>
        </FaqContact>
      </FaqInner>
    </CreatorFundSection>
  )
})

Faq.displayName = 'Faq'

export { Faq }
