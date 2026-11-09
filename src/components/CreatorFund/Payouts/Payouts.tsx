import { memo } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined'
// eslint-disable-next-line @typescript-eslint/naming-convention
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
// eslint-disable-next-line @typescript-eslint/naming-convention
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined'
// eslint-disable-next-line @typescript-eslint/naming-convention
import TollOutlinedIcon from '@mui/icons-material/TollOutlined'
import { AnimatedBackground } from 'decentraland-ui2'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useUnloadSafeTrackClick } from '../../../hooks/useUnloadSafeTrackClick'
import { clickTrackingAttributes } from '../CreatorFund.helpers'
import { CreatorFundSection, DisplayTitle, SectionInner, creatorFundColors } from '../CreatorFund.styled'
import { CLICK_SECTIONS, betaProgram } from '../data'
import { PAYOUT_ICON_GRADIENT_ID, PayoutIconGradient, PayoutLabel, PayoutLink, PayoutRow, PayoutTerms, PayoutValue } from './Payouts.styled'

const PAYOUT_ROWS = [
  { id: 'when', icon: AccessTimeOutlinedIcon },
  { id: 'currency', icon: TollOutlinedIcon },
  { id: 'where', icon: CalendarMonthOutlinedIcon },
  { id: 'leaderboard', icon: EmojiEventsOutlinedIcon }
].map(({ id, icon }) => ({
  id,
  icon,
  labelKey: `page.creator_fund.rewards.${id}_label`,
  valueKey: `page.creator_fund.rewards.${id}`
}))

// The "When" row points at the per-cycle payment dates in the Beta Schedule section.
const SCHEDULE_ANCHOR = '#dates'

const Payouts = memo(() => {
  const l = useFormatMessage()
  const trackClick = useUnloadSafeTrackClick()
  const values = {
    days: betaProgram.paymentWindowDays,
    currency: betaProgram.currency,
    standard: betaProgram.tokenStandard,
    network: betaProgram.network
  }

  return (
    <CreatorFundSection id="payouts" band>
      <AnimatedBackground variant="absolute" />
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
          {PAYOUT_ROWS.map(({ id, icon: Icon, labelKey, valueKey }) => (
            <PayoutRow key={labelKey}>
              <PayoutLabel>
                <Icon aria-hidden="true" />
                {l(labelKey)}
              </PayoutLabel>
              <PayoutValue>
                {l(valueKey, values)}
                {id === 'when' && (
                  <>
                    {' '}
                    <PayoutLink
                      href={SCHEDULE_ANCHOR}
                      {...clickTrackingAttributes(CLICK_SECTIONS.payouts, 'See Below')}
                      onClick={trackClick}
                    >
                      {l('page.creator_fund.rewards.see_below')}
                    </PayoutLink>
                  </>
                )}
              </PayoutValue>
            </PayoutRow>
          ))}
        </PayoutTerms>
      </SectionInner>
    </CreatorFundSection>
  )
})

Payouts.displayName = 'Payouts'

export { Payouts }
