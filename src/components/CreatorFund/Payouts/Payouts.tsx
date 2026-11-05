import { memo } from 'react'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useScrollParallax } from '../../../hooks/useScrollParallax'
import { CreatorFundSection, DisplayTitle, PARALLAX_OFFSET_PROPERTY, PARALLAX_SPEED, SectionInner } from '../CreatorFund.styled'
import { betaProgram } from '../data'
import { PayoutLabel, PayoutRow, PayoutTerms, PayoutValue } from './Payouts.styled'

const PAYOUT_ROWS = ['when', 'currency', 'where', 'leaderboard'].map(id => ({
  labelKey: `page.creator_fund.rewards.${id}_label`,
  valueKey: `page.creator_fund.rewards.${id}`
}))

const Payouts = memo(() => {
  const l = useFormatMessage()
  const bandRef = useScrollParallax<HTMLElement>(PARALLAX_OFFSET_PROPERTY, PARALLAX_SPEED)
  const values = {
    days: betaProgram.paymentWindowDays,
    currency: betaProgram.currency,
    standard: betaProgram.tokenStandard,
    network: betaProgram.network
  }

  return (
    <CreatorFundSection id="rewards" band ref={bandRef}>
      <SectionInner>
        <DisplayTitle>{l('page.creator_fund.rewards.title')}</DisplayTitle>
        <PayoutTerms>
          {PAYOUT_ROWS.map(row => (
            <PayoutRow key={row.labelKey}>
              <PayoutLabel>{l(row.labelKey)}</PayoutLabel>
              <PayoutValue>{l(row.valueKey, values)}</PayoutValue>
            </PayoutRow>
          ))}
        </PayoutTerms>
      </SectionInner>
    </CreatorFundSection>
  )
})

Payouts.displayName = 'Payouts'

export { Payouts }
