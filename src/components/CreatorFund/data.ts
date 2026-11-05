/* eslint-disable @typescript-eslint/naming-convention */
import AndroidIcon from '@mui/icons-material/Android'
import AppleIcon from '@mui/icons-material/Apple'
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined'
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined'
import MicrosoftIcon from '@mui/icons-material/Microsoft'
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined'
import PowerOutlinedIcon from '@mui/icons-material/PowerOutlined'
import RepeatIcon from '@mui/icons-material/Repeat'
import ShowChartIcon from '@mui/icons-material/ShowChart'
/* eslint-enable @typescript-eslint/naming-convention */
import sceneCozyFarm from '../../images/creator-fund/scene-cozy-farm.jpg'
import sceneCryocene from '../../images/creator-fund/scene-cryocene.jpg'
import sceneGenesisPlaza from '../../images/creator-fund/scene-genesis-plaza.jpg'
import type { CreatorFundProgram, FaqEntry, IconCopy, PlatformLink, SectionLink } from './CreatorFund.types'

// Beta Season facts from the Creator Fund Program Rules. Amounts are USD.
const betaProgram: CreatorFundProgram = {
  seasonPoolUsd: 30000,
  paymentWindowDays: 14,
  currency: 'USDC',
  tokenStandard: 'ERC-20',
  network: 'Ethereum mainnet',
  minimumAge: 18,
  launchDate: '2026-11-11',
  timeline: {
    start: '2026-11-01',
    end: '2027-01-10',
    ticks: ['2026-11-01', '2026-11-15', '2026-12-01', '2026-12-16', '2026-12-31', '2027-01-10']
  },
  cycles: [
    { number: 1, start: '2026-11-15', end: '2026-11-30', allocationUsd: 10000, paymentBy: '2026-12-10' },
    { number: 2, start: '2026-12-01', end: '2026-12-15', allocationUsd: 10000, paymentBy: '2026-12-25' },
    { number: 3, start: '2026-12-16', end: '2026-12-31', allocationUsd: 10000, paymentBy: '2027-01-10' }
  ]
}

const sectionLinks: SectionLink[] = [
  { id: 'how', labelKey: 'page.creator_fund.nav.how' },
  { id: 'payouts', labelKey: 'page.creator_fund.nav.payouts' },
  { id: 'eligibility', labelKey: 'page.creator_fund.nav.eligibility' },
  { id: 'dates', labelKey: 'page.creator_fund.nav.dates' },
  { id: 'faq', labelKey: 'page.creator_fund.nav.faq' }
]

const platformLinks: PlatformLink[] = [
  { name: 'Android', os: 'android', icon: AndroidIcon },
  { name: 'iOS', os: 'ios', icon: AppleIcon },
  { name: 'Windows', os: 'windows', icon: MicrosoftIcon },
  { name: 'Mac', os: 'apple', icon: AppleIcon }
]

const scenes = [
  { name: 'Genesis Plaza', image: sceneGenesisPlaza },
  { name: 'Cryocene', image: sceneCryocene },
  { name: 'Cozy Farm', image: sceneCozyFarm }
]

// Same order as the flyer: Build → Opt in → Get paid.
const buildToEarnSteps: Required<IconCopy>[] = [
  { icon: BuildOutlinedIcon, titleKey: 'page.creator_fund.how.build_title', textKey: 'page.creator_fund.how.build_text' },
  { icon: PowerOutlinedIcon, titleKey: 'page.creator_fund.how.opt_in_title', textKey: 'page.creator_fund.how.opt_in_text' },
  { icon: EmojiEventsOutlinedIcon, titleKey: 'page.creator_fund.how.paid_title', textKey: 'page.creator_fund.how.paid_text' }
]

const payoutSignals: IconCopy[] = [
  { icon: PersonAddAltOutlinedIcon, titleKey: 'page.creator_fund.measure.new_players' },
  { icon: ShowChartIcon, titleKey: 'page.creator_fund.measure.playtime' },
  { icon: RepeatIcon, titleKey: 'page.creator_fund.measure.retention' }
]

const moreWaysToEarnKeys = [
  'page.creator_fund.builders.more_wearables',
  'page.creator_fund.builders.more_funding',
  'page.creator_fund.builders.more_contests',
  'page.creator_fund.builders.more_purchases'
]

const eligibilityCards = [
  {
    titleKey: 'page.creator_fund.eligibility.you_title',
    itemKeys: [
      'page.creator_fund.eligibility.you_age',
      'page.creator_fund.eligibility.you_owner',
      'page.creator_fund.eligibility.you_sign',
      'page.creator_fund.eligibility.you_terms'
    ]
  },
  {
    titleKey: 'page.creator_fund.eligibility.scene_title',
    itemKeys: [
      'page.creator_fund.eligibility.scene_policy',
      'page.creator_fund.eligibility.scene_content',
      'page.creator_fund.eligibility.scene_removed'
    ]
  }
]

const faqEntries: FaqEntry[] = ['join', 'rewards', 'worlds', 'wallet', 'transfer', 'runs', 'after', 'grant'].map(id => ({
  questionKey: `page.creator_fund.faq.${id}_question`,
  answerKey: `page.creator_fund.faq.${id}_answer`
}))

const CREATOR_FUND_CONTACT_EMAIL = 'creatorfund@decentraland.org'

// Program Rules and Program Terms are two separate pages on the docs site
// (decentraland/docs: creator/creator-fund/program-rules.md and program-terms.md).
const CREATOR_FUND_RULES_URL = 'https://docs.decentraland.org/creator/creator-fund/program-rules'
const CREATOR_FUND_TERMS_URL = 'https://docs.decentraland.org/creator/creator-fund/program-terms'

export {
  CREATOR_FUND_CONTACT_EMAIL,
  CREATOR_FUND_RULES_URL,
  CREATOR_FUND_TERMS_URL,
  betaProgram,
  buildToEarnSteps,
  eligibilityCards,
  faqEntries,
  moreWaysToEarnKeys,
  payoutSignals,
  platformLinks,
  scenes,
  sectionLinks
}
