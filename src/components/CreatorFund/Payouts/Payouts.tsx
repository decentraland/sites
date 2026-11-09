import { memo } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined'
// eslint-disable-next-line @typescript-eslint/naming-convention
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
// eslint-disable-next-line @typescript-eslint/naming-convention
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined'
// eslint-disable-next-line @typescript-eslint/naming-convention
import TollOutlinedIcon from '@mui/icons-material/TollOutlined'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useScrollParallax } from '../../../hooks/useScrollParallax'
import {
  CreatorFundSection,
  DisplayTitle,
  PARALLAX_LIMIT,
  PARALLAX_OFFSET_PROPERTY,
  PARALLAX_SPEED,
  SectionInner,
  creatorFundColors
} from '../CreatorFund.styled'
import { betaProgram } from '../data'
import { PAYOUT_ICON_GRADIENT_ID, PayoutIconGradient, PayoutLabel, PayoutRow, PayoutTerms, PayoutValue } from './Payouts.styled'

const PAYOUT_ROWS = [
  { id: 'when', icon: AccessTimeOutlinedIcon },
  { id: 'currency', icon: TollOutlinedIcon },
  { id: 'where', icon: CalendarMonthOutlinedIcon },
  { id: 'leaderboard', icon: EmojiEventsOutlinedIcon }
].map(({ id, icon }) => ({
  icon,
  labelKey: `page.creator_fund.rewards.${id}_label`,
  valueKey: `page.creator_fund.rewards.${id}`
}))

const Payouts = memo(() => {
  const l = useFormatMessage()
  const bandRef = useScrollParallax<HTMLElement>(PARALLAX_OFFSET_PROPERTY, PARALLAX_SPEED, PARALLAX_LIMIT)
  const values = {
    days: betaProgram.paymentWindowDays,
    currency: betaProgram.currency,
    standard: betaProgram.tokenStandard,
    network: betaProgram.network
  }

  return (
    <CreatorFundSection id="payouts" band ref={bandRef}>
      {/* The red-orange gradient every label icon is painted with. */}
      <PayoutIconGradient aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id={PAYOUT_ICON_GRADIENT_ID} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={creatorFundColors.orange} />
            <stop offset="100%" stopColor={creatorFundColors.primary} />
          </linearGradient>
        </defs>
      </PayoutIconGradient>
      <SectionInner>
        <DisplayTitle>{l('page.creator_fund.rewards.title')}</DisplayTitle>
        <PayoutTerms>
          {/* eslint-disable-next-line @typescript-eslint/naming-convention */}
          {PAYOUT_ROWS.map(({ icon: Icon, labelKey, valueKey }) => (
            <PayoutRow key={labelKey}>
              <PayoutLabel>
                <Icon aria-hidden="true" />
                {l(labelKey)}
              </PayoutLabel>
              <PayoutValue>{l(valueKey, values)}</PayoutValue>
            </PayoutRow>
          ))}
        </PayoutTerms>
      </SectionInner>
    </CreatorFundSection>
  )
})

Payouts.displayName = 'Payouts'

export { Payouts }
