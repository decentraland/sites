import { memo } from 'react'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useScrollParallax } from '../../../hooks/useScrollParallax'
import { formatUsd } from '../CreatorFund.helpers'
import {
  CreatorFundSection,
  DisplayTitle,
  LeadText,
  PARALLAX_OFFSET_PROPERTY,
  PARALLAX_SPEED,
  RubyTile,
  SectionInner
} from '../CreatorFund.styled'
import { betaProgram, buildToEarnSteps } from '../data'
import { StepCard, StepNumber, StepText, StepTitle, StepsGrid } from './BuildToEarn.styled'

const BuildToEarn = memo(() => {
  const l = useFormatMessage()
  const bandRef = useScrollParallax<HTMLElement>(PARALLAX_OFFSET_PROPERTY, PARALLAX_SPEED)
  const values = { amount: formatUsd(betaProgram.cycles[0].allocationUsd), currency: betaProgram.currency }

  return (
    <CreatorFundSection id="how" band ref={bandRef}>
      <SectionInner>
        <DisplayTitle>{l('page.creator_fund.how.title')}</DisplayTitle>
        <LeadText>{l('page.creator_fund.how.subtitle')}</LeadText>
        <StepsGrid>
          {/* eslint-disable-next-line @typescript-eslint/naming-convention */}
          {buildToEarnSteps.map(({ icon: Icon, titleKey, textKey }, index) => (
            <li key={titleKey}>
              <StepCard>
                <StepNumber aria-hidden="true">0{index + 1}</StepNumber>
                <RubyTile>
                  <Icon aria-hidden="true" />
                </RubyTile>
                <StepTitle>{l(titleKey)}</StepTitle>
                <StepText>{l(textKey, values)}</StepText>
              </StepCard>
            </li>
          ))}
        </StepsGrid>
      </SectionInner>
    </CreatorFundSection>
  )
})

BuildToEarn.displayName = 'BuildToEarn'

export { BuildToEarn }
