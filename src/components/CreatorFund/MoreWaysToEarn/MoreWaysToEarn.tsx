import { memo } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
// eslint-disable-next-line @typescript-eslint/naming-convention
import TollOutlinedIcon from '@mui/icons-material/TollOutlined'
import { AnimatedBackground } from 'decentraland-ui2'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { CreatorFundSection, RubyTile, SectionInner } from '../CreatorFund.styled'
import { moreWaysToEarnKeys } from '../data'
import { MoreWaysBand, MoreWaysHeader, MoreWaysItem, MoreWaysList, MoreWaysTitle } from './MoreWaysToEarn.styled'

// Other income beyond the Fund, closing out the program details under the schedule.
const MoreWaysToEarn = memo(() => {
  const l = useFormatMessage()

  return (
    <CreatorFundSection spacing="bottom">
      <SectionInner>
        <MoreWaysBand>
          <AnimatedBackground variant="absolute" />
          <MoreWaysHeader>
            <RubyTile>
              <TollOutlinedIcon aria-hidden="true" />
            </RubyTile>
            <MoreWaysTitle>{l('page.creator_fund.more_ways.title')}</MoreWaysTitle>
          </MoreWaysHeader>
          <MoreWaysList>
            {moreWaysToEarnKeys.map(key => (
              <MoreWaysItem key={key}>
                <ArrowForwardIcon aria-hidden="true" />
                {l(key)}
              </MoreWaysItem>
            ))}
          </MoreWaysList>
        </MoreWaysBand>
      </SectionInner>
    </CreatorFundSection>
  )
})

MoreWaysToEarn.displayName = 'MoreWaysToEarn'

export { MoreWaysToEarn }
