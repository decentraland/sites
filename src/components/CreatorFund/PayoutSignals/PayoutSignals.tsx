import { memo } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import rewardsBackground from '../../../images/creator-fund/rewards-players-background.jpg'
import { DisplayTitle, MutedText, RubyTile, SectionInner } from '../CreatorFund.styled'
import { payoutSignals } from '../data'
import {
  RealBlock,
  RealBody,
  RealCard,
  RealTitle,
  RewardsBackground,
  RewardsSection,
  SignalCard,
  SignalTitle,
  SignalsBlock,
  SignalsGrid,
  SignalsLead
} from './PayoutSignals.styled'

// "What we reward" plus the anti-botting card that qualifies it, sharing one background photo.
const PayoutSignals = memo(() => {
  const l = useFormatMessage()

  return (
    <RewardsSection>
      <RewardsBackground src={rewardsBackground} alt="" aria-hidden="true" loading="lazy" />
      <SignalsBlock>
        <SectionInner>
          <DisplayTitle>{l('page.creator_fund.measure.title')}</DisplayTitle>
          <SignalsLead>{l('page.creator_fund.measure.subtitle')}</SignalsLead>
          <SignalsGrid>
            {/* eslint-disable-next-line @typescript-eslint/naming-convention */}
            {payoutSignals.map(({ icon: Icon, titleKey }) => (
              <li key={titleKey}>
                <SignalCard>
                  <RubyTile size="large">
                    <Icon aria-hidden="true" />
                  </RubyTile>
                  <SignalTitle>{l(titleKey)}</SignalTitle>
                </SignalCard>
              </li>
            ))}
          </SignalsGrid>
        </SectionInner>
      </SignalsBlock>
      <RealBlock>
        <SectionInner>
          <RealCard>
            <RubyTile size="large">
              <VerifiedUserOutlinedIcon aria-hidden="true" />
            </RubyTile>
            <div>
              <RealTitle>{l('page.creator_fund.real.title')}</RealTitle>
              <RealBody>
                <MutedText>{l('page.creator_fund.real.text')}</MutedText>
              </RealBody>
            </div>
          </RealCard>
        </SectionInner>
      </RealBlock>
    </RewardsSection>
  )
})

PayoutSignals.displayName = 'PayoutSignals'

export { PayoutSignals }
