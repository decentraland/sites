import { memo } from 'react'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useLocale } from '../../../intl/LocaleContext'
import { daysBetween, formatAmount, formatDateRange, formatShortDate } from '../CreatorFund.helpers'
import { CreatorFundSection, SectionInner } from '../CreatorFund.styled'
import { betaProgram } from '../data'
import {
  CycleSegment,
  Milestone,
  MilestoneDate,
  MilestoneList,
  MilestoneText,
  ScheduleTitle,
  type TickAlign,
  TimelineBar,
  TimelineTick,
  TimelineTicks
} from './Schedule.styled'

const { timeline, cycles } = betaProgram
const timelineDays = daysBetween(timeline.start, timeline.end)
const toPercent = (days: number) => (days / timelineDays) * 100
const timelineYear = new Date(timeline.start).getUTCFullYear()

const tickAlign = (index: number): TickAlign => {
  if (index === 0) return 'start'
  return index === timeline.ticks.length - 1 ? 'end' : 'center'
}

const Schedule = memo(() => {
  const l = useFormatMessage()
  const { locale } = useLocale()

  const cycleName = (cycleNumber: number) => l('page.creator_fund.dates.cycle_name', { number: cycleNumber })
  const milestones = [
    { key: 'launch', date: formatShortDate(locale, betaProgram.launchDate), text: l('page.creator_fund.dates.launch'), highlight: false },
    ...cycles.map(cycle => ({
      key: `cycle-${cycle.number}`,
      date: formatDateRange(locale, cycle.start, cycle.end),
      text: l('page.creator_fund.dates.cycle_row', {
        name: cycleName(cycle.number),
        amount: formatAmount(cycle.allocationUsd),
        // Payments that land in the next year say so.
        date: formatShortDate(locale, cycle.paymentBy, new Date(cycle.paymentBy).getUTCFullYear() !== timelineYear)
      }),
      highlight: true
    }))
  ]

  return (
    <CreatorFundSection id="dates">
      <SectionInner>
        <ScheduleTitle>{l('page.creator_fund.dates.title')}</ScheduleTitle>
        {/* The bar repeats the list below it, so screen readers get the list only. */}
        <div aria-hidden="true">
          <TimelineBar>
            {cycles.map((cycle, index) => (
              <CycleSegment
                key={cycle.number}
                left={toPercent(daysBetween(timeline.start, cycle.start))}
                width={toPercent(daysBetween(cycle.start, cycle.end) + 1)}
                alternate={index % 2 === 1}
              >
                {cycleName(cycle.number)}
              </CycleSegment>
            ))}
          </TimelineBar>
          <TimelineTicks>
            {timeline.ticks.map((tick, index) => (
              <TimelineTick
                key={tick}
                left={toPercent(daysBetween(timeline.start, tick))}
                align={tickAlign(index)}
                secondary={index % 2 === 1}
              >
                {formatShortDate(locale, tick)}
              </TimelineTick>
            ))}
          </TimelineTicks>
        </div>
        <MilestoneList>
          {milestones.map(milestone => (
            <Milestone key={milestone.key}>
              <MilestoneDate highlight={milestone.highlight}>{milestone.date}</MilestoneDate>
              <MilestoneText highlight={milestone.highlight}>{milestone.text}</MilestoneText>
            </Milestone>
          ))}
        </MilestoneList>
      </SectionInner>
    </CreatorFundSection>
  )
})

Schedule.displayName = 'Schedule'

export { Schedule }
