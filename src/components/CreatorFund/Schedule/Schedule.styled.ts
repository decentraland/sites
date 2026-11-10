import { Box, styled } from 'decentraland-ui2'
import { DisplayTitle, Eyebrow, creatorFundColors, labelStyles, rubyGradient } from '../CreatorFund.styled'

const ScheduleTitle = styled(DisplayTitle)({
  maxWidth: 768
})

const TimelineBar = styled(Box)(({ theme }) => ({
  position: 'relative',
  height: 40,
  marginTop: theme.spacing(6),
  borderRadius: 9999,
  backgroundColor: creatorFundColors.card
}))

// Cycles alternate ruby and purple so neighbouring segments stay distinct.
const CycleSegment = styled('span', {
  shouldForwardProp: prop => prop !== 'left' && prop !== 'width' && prop !== 'alternate'
})<{ left: number; width: number; alternate: boolean }>(({ theme, left, width, alternate }) => ({
  position: 'absolute',
  top: 4,
  bottom: 4,
  left: `${left}%`,
  width: `calc(${width}% - 2px)`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 9999,
  background: alternate ? creatorFundColors.purpleDeep : rubyGradient,
  color: creatorFundColors.white,
  fontSize: 10,
  fontWeight: 600,
  whiteSpace: 'nowrap',
  [theme.breakpoints.up('sm')]: {
    fontSize: 12
  }
}))

const TimelineTicks = styled(Box)(({ theme }) => ({
  position: 'relative',
  height: 20,
  marginTop: theme.spacing(1)
}))

type TickAlign = 'start' | 'center' | 'end'

const TICK_TRANSFORMS: Record<TickAlign, string> = {
  start: 'none',
  center: 'translateX(-50%)',
  end: 'translateX(-100%)'
}

// Every other tick hides on phones, where six labels don't fit the bar.
const TimelineTick = styled(Eyebrow, {
  shouldForwardProp: prop => prop !== 'left' && prop !== 'align' && prop !== 'secondary'
})<{ left: number; align: TickAlign; secondary: boolean }>(({ theme, left, align, secondary }) => ({
  position: 'absolute',
  left: `${left}%`,
  transform: TICK_TRANSFORMS[align],
  display: secondary ? 'none' : 'block',
  fontSize: 9,
  whiteSpace: 'nowrap',
  color: creatorFundColors.mutedText,
  [theme.breakpoints.up('sm')]: {
    display: 'block',
    fontSize: 11
  }
}))

const MilestoneList = styled('ul')(({ theme }) => ({
  margin: `${theme.spacing(5)} 0 0`,
  padding: 0,
  listStyle: 'none',
  borderTop: `1px solid ${creatorFundColors.border}`
}))

const Milestone = styled('li')(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: '108px 1fr',
  gap: theme.spacing(1.5),
  padding: `${theme.spacing(2)} 0`,
  borderBottom: `1px solid ${creatorFundColors.border}`,
  [theme.breakpoints.up('sm')]: {
    gridTemplateColumns: '132px 1fr',
    gap: theme.spacing(2)
  }
}))

const MilestoneDate = styled('span', {
  shouldForwardProp: prop => prop !== 'highlight'
})<{ highlight: boolean }>(({ theme, highlight }) => ({
  ...labelStyles,
  fontSize: 14,
  color: highlight ? creatorFundColors.primary : creatorFundColors.mutedText,
  [theme.breakpoints.up('sm')]: {
    fontSize: 16
  }
}))

const MilestoneText = styled('span', {
  shouldForwardProp: prop => prop !== 'highlight'
})<{ highlight: boolean }>(({ highlight }) => ({
  fontWeight: highlight ? 600 : 400,
  color: creatorFundColors.text
}))

export { CycleSegment, Milestone, MilestoneDate, MilestoneList, MilestoneText, ScheduleTitle, TimelineBar, TimelineTick, TimelineTicks }
export type { TickAlign }
