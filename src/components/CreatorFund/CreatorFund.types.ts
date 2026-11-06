import type { SvgIconComponent } from '@mui/icons-material'
import type { DownloadOS } from '../../modules/downloadConstants'
import type { DownloadTarget } from '../../modules/segment'

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
  // English name sent as `button` on the Click event (stable across locales).
  trackingName: string
}

type PlatformLink = {
  name: string
  os: DownloadOS
  icon: SvgIconComponent
  // Store exits carry the warehouse's download_target; links to the /download page don't.
  downloadTarget?: DownloadTarget
}

type IconCopy = {
  icon: SvgIconComponent
  titleKey: string
  textKey?: string
}

type BuildStep = Required<IconCopy> & {
  // Optional link text rendered before `textKey`, pointing at the Creator Hub download.
  linkKey?: string
}

type FaqEntry = {
  questionKey: string
  answerKey: string
  trackingName: string
}

export type { BuildStep, CreatorFundProgram, FaqEntry, IconCopy, PlatformLink, ProgramCycle, SectionLink }
