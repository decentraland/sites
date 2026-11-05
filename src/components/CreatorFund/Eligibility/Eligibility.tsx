import { memo } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import CheckIcon from '@mui/icons-material/Check'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { CreatorFundSection, SectionInner } from '../CreatorFund.styled'
import { betaProgram, eligibilityCards } from '../data'
import { CardTitle, EligibilityCard, EligibilityGrid, EligibilityTitle, Requirement, RequirementList } from './Eligibility.styled'

const Eligibility = memo(() => {
  const l = useFormatMessage()

  return (
    <CreatorFundSection id="eligibility" spacing="bottom">
      <SectionInner>
        <EligibilityTitle>{l('page.creator_fund.eligibility.title')}</EligibilityTitle>
        <EligibilityGrid>
          {eligibilityCards.map(card => (
            <EligibilityCard key={card.titleKey}>
              <CardTitle>{l(card.titleKey)}</CardTitle>
              <RequirementList>
                {card.itemKeys.map(itemKey => (
                  <Requirement key={itemKey}>
                    <CheckIcon aria-hidden="true" />
                    {l(itemKey, { age: betaProgram.minimumAge })}
                  </Requirement>
                ))}
              </RequirementList>
            </EligibilityCard>
          ))}
        </EligibilityGrid>
      </SectionInner>
    </CreatorFundSection>
  )
})

Eligibility.displayName = 'Eligibility'

export { Eligibility }
