import { type ReactNode, memo } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
// eslint-disable-next-line @typescript-eslint/naming-convention
import TollOutlinedIcon from '@mui/icons-material/TollOutlined'
import { AnimatedBackground } from 'decentraland-ui2'
import { useFormatMessage, useIntl } from '../../../hooks/adapters/useFormatMessage'
import { CreatorFundSection, RubyTile, SectionInner } from '../CreatorFund.styled'
import { moreWaysToEarnKeys } from '../data'
import { MoreWaysBand, MoreWaysHeader, MoreWaysItem, MoreWaysList, MoreWaysStrong, MoreWaysTitle } from './MoreWaysToEarn.styled'

// Renders the <b>…</b> key term of each line (formatjs rich text).
const boldTerm = (chunks: ReactNode[]) => <MoreWaysStrong key="term">{chunks}</MoreWaysStrong>

// Other income beyond the Fund, closing out the program details under the schedule.
const MoreWaysToEarn = memo(() => {
  const l = useFormatMessage()
  // Rich text (the <b> term) goes through formatMessage, as on the Creator Hub download page. formatjs
  // returns React nodes for tag values at runtime, but the shared intl instance is typed for strings.
  const formatRich = useIntl().formatMessage as unknown as (
    descriptor: { id: string },
    values: Record<string, (chunks: ReactNode[]) => ReactNode>
  ) => ReactNode

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
                {/* One span keeps the sentence a single flex item next to the arrow. */}
                <span>{formatRich({ id: key }, { b: boldTerm })}</span>
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
