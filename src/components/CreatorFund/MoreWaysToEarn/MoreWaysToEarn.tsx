import { memo } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
// eslint-disable-next-line @typescript-eslint/naming-convention
import TollOutlinedIcon from '@mui/icons-material/TollOutlined'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useScrollParallax } from '../../../hooks/useScrollParallax'
import { CreatorFundSection, PARALLAX_LIMIT, PARALLAX_OFFSET_PROPERTY, PARALLAX_SPEED, RubyTile, SectionInner } from '../CreatorFund.styled'
import { moreWaysToEarnKeys } from '../data'
import { MoreWaysBand, MoreWaysHeader, MoreWaysItem, MoreWaysList, MoreWaysTitle } from './MoreWaysToEarn.styled'

// Other income beyond the Fund, closing out the program details under the schedule.
const MoreWaysToEarn = memo(() => {
  const l = useFormatMessage()
  const bandRef = useScrollParallax<HTMLDivElement>(PARALLAX_OFFSET_PROPERTY, PARALLAX_SPEED, PARALLAX_LIMIT)

  return (
    <CreatorFundSection spacing="bottom">
      <SectionInner>
        <MoreWaysBand ref={bandRef}>
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
