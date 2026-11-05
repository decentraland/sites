import type { SvgIconComponent } from '@mui/icons-material'
import type { DownloadOS } from '../../modules/downloadConstants'

type ProgramCycle = {
  number: number
  // ISO dates (UTC). `end` is the last day of the cycle, inclusive.
  start: string
  end: string
  allocationUsd: number
  paymentBy: string
}

type CreatorFundProgram = {
  seasonPoolUsd: number
  paymentWindowDays: number
  currency: string
  tokenStandard: string
  network: string
  minimumAge: number
  launchDate: string
  timeline: { start: string; end: string; ticks: string[] }
  cycles: ProgramCycle[]
}

type SectionLink = {
  id: string
  labelKey: string
}

type PlatformLink = {
  name: string
  os: DownloadOS
  icon: SvgIconComponent
}

type IconCopy = {
  icon: SvgIconComponent
  titleKey: string
  textKey?: string
}

type FaqEntry = {
  questionKey: string
  answerKey: string
}

export type { CreatorFundProgram, FaqEntry, IconCopy, PlatformLink, ProgramCycle, SectionLink }
