import { memo } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { CreatorFundSection, DisplayTitle, LeadText, MutedText, RubyTile, SectionInner } from '../CreatorFund.styled'
import { payoutSignals } from '../data'
import { RealBody, RealCard, RealTitle, SignalCard, SignalTitle, SignalsGrid, SignalsSection } from './PayoutSignals.styled'

// "What Payouts Reward" plus the anti-botting card that qualifies it.
const PayoutSignals = memo(() => {
  const l = useFormatMessage()

  return (
    <>
      <SignalsSection spacing="both">
        <SectionInner>
          <DisplayTitle>{l('page.creator_fund.measure.title')}</DisplayTitle>
          <LeadText>{l('page.creator_fund.measure.subtitle')}</LeadText>
          <SignalsGrid>
            {/* eslint-disable-next-line @typescript-eslint/naming-convention */}
            {payoutSignals.map(({ icon: Icon, titleKey }) => (
              <li key={titleKey}>
                <SignalCard>
                  <Icon aria-hidden="true" />
                  <SignalTitle>{l(titleKey)}</SignalTitle>
                </SignalCard>
              </li>
            ))}
          </SignalsGrid>
        </SectionInner>
      </SignalsSection>
      <CreatorFundSection spacing="bottom">
        <SectionInner>
          <RealCard>
            <RubyTile size="large">
              <VerifiedUserOutlinedIcon aria-hidden="true" />
            </RubyTile>
            <div>
              <RealTitle>{l('page.creator_fund.real.title')}</RealTitle>
              <RealBody>
                <MutedText>{l('page.creator_fund.real.bots')}</MutedText>
                <MutedText>{l('page.creator_fund.real.apps')}</MutedText>
              </RealBody>
            </div>
          </RealCard>
        </SectionInner>
      </CreatorFundSection>
    </>
  )
})

PayoutSignals.displayName = 'PayoutSignals'

export { PayoutSignals }
