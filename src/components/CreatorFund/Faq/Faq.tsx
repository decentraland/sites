import { memo } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { CreatorFundSection, DisplayTitle } from '../CreatorFund.styled'
import { faqEntries } from '../data'
import { FaqAnswer, FaqInner, FaqItem, FaqList, FaqQuestion } from './Faq.styled'

// Native <details>: keyboard and screen reader support come with the element.
const Faq = memo(() => {
  const l = useFormatMessage()

  return (
    <CreatorFundSection id="faq" spacing="top">
      <FaqInner>
        <DisplayTitle>{l('page.creator_fund.faq.title')}</DisplayTitle>
        <FaqList>
          {faqEntries.map(entry => (
            <FaqItem key={entry.questionKey}>
              <FaqQuestion>
                {l(entry.questionKey)}
                <ExpandMoreIcon aria-hidden="true" />
              </FaqQuestion>
              <FaqAnswer>{l(entry.answerKey)}</FaqAnswer>
            </FaqItem>
          ))}
        </FaqList>
      </FaqInner>
    </CreatorFundSection>
  )
})

Faq.displayName = 'Faq'

export { Faq }
