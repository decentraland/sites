import { memo } from 'react'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useScrollParallax } from '../../../hooks/useScrollParallax'
import { useUnloadSafeTrackClick } from '../../../hooks/useUnloadSafeTrackClick'
import { DownloadTarget } from '../../../modules/segment'
import { clickTrackingAttributes, formatUsd } from '../CreatorFund.helpers'
import { DisplayTitle, PARALLAX_LIMIT, PARALLAX_OFFSET_PROPERTY, PARALLAX_SPEED, RubyTile, SectionInner } from '../CreatorFund.styled'
import { CLICK_SECTIONS, CREATOR_HUB_DOWNLOAD_PATH, betaProgram, buildToEarnSteps } from '../data'
import { BuildSection, StepCard, StepLink, StepNumber, StepText, StepTitle, StepsGrid } from './BuildToEarn.styled'

const BuildToEarn = memo(() => {
  const l = useFormatMessage()
  const trackClick = useUnloadSafeTrackClick()
  const bandRef = useScrollParallax<HTMLElement>(PARALLAX_OFFSET_PROPERTY, PARALLAX_SPEED, PARALLAX_LIMIT)
  const values = { amount: formatUsd(betaProgram.cycles[0].allocationUsd), currency: betaProgram.currency }

  return (
    <BuildSection id="how" band ref={bandRef}>
      <SectionInner>
        <DisplayTitle>{l('page.creator_fund.how.title')}</DisplayTitle>
        <StepsGrid>
          {/* eslint-disable-next-line @typescript-eslint/naming-convention */}
          {buildToEarnSteps.map(({ icon: Icon, titleKey, textKey, linkKey }, index) => (
            <li key={titleKey}>
              <StepCard>
                <StepNumber aria-hidden="true">0{index + 1}</StepNumber>
                {/* Same 56px tile as the "What we reward" cards. */}
                <RubyTile size="large">
                  <Icon aria-hidden="true" />
                </RubyTile>
                <StepTitle>{l(titleKey)}</StepTitle>
                <StepText>
                  {/* The opt-in step opens with an inline link that downloads Creator Hub. */}
                  {linkKey && (
                    <StepLink
                      href={CREATOR_HUB_DOWNLOAD_PATH}
                      {...clickTrackingAttributes(CLICK_SECTIONS.howItWorks, 'Download Creator Hub', DownloadTarget.CREATOR_HUB)}
                      onClick={trackClick}
                    >
                      {l(linkKey)}
                    </StepLink>
                  )}
                  {l(textKey, values)}
                </StepText>
              </StepCard>
            </li>
          ))}
        </StepsGrid>
      </SectionInner>
    </BuildSection>
  )
})

BuildToEarn.displayName = 'BuildToEarn'

export { BuildToEarn }
