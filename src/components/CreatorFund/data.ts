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
import { DownloadTarget } from '../../modules/segment'
import type { BuildStep, BuilderQuote, CreatorFundProgram, FaqEntry, IconCopy, PlatformLink, SectionLink } from './CreatorFund.types'

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
    end: '2027-01-11',
    ticks: ['2026-11-01', '2026-11-15', '2026-12-01', '2026-12-16', '2026-12-31', '2027-01-11']
  },
  cycles: [
    { number: 1, start: '2026-11-15', end: '2026-11-30', allocationUsd: 10000, paymentBy: '2026-12-10' },
    { number: 2, start: '2026-12-01', end: '2026-12-15', allocationUsd: 10000, paymentBy: '2026-12-23' },
    { number: 3, start: '2026-12-16', end: '2026-12-31', allocationUsd: 10000, paymentBy: '2027-01-11' }
  ]
}

const sectionLinks: SectionLink[] = [
  { id: 'how', labelKey: 'page.creator_fund.nav.how', trackingName: 'How It Works' },
  { id: 'payouts', labelKey: 'page.creator_fund.nav.payouts', trackingName: 'Payouts' },
  { id: 'eligibility', labelKey: 'page.creator_fund.nav.eligibility', trackingName: 'Eligibility' },
  { id: 'dates', labelKey: 'page.creator_fund.nav.dates', trackingName: 'Dates' },
  { id: 'faq', labelKey: 'page.creator_fund.nav.faq', trackingName: 'FAQ' }
]

const platformLinks: PlatformLink[] = [
  { name: 'Android', os: 'android', icon: AndroidIcon, downloadTarget: DownloadTarget.GOOGLE_PLAY },
  { name: 'iOS', os: 'ios', icon: AppleIcon, downloadTarget: DownloadTarget.APP_STORE },
  { name: 'Windows', os: 'windows', icon: MicrosoftIcon },
  { name: 'Mac', os: 'apple', icon: AppleIcon }
]

const scenes = [
  { name: 'Genesis Plaza', image: sceneGenesisPlaza },
  { name: 'Cryocene', image: sceneCryocene },
  { name: 'Cozy Farm', image: sceneCozyFarm }
]

// Opt in → Build → Get paid. The opt-in step opens with a link that downloads Creator Hub.
const buildToEarnSteps: BuildStep[] = [
  {
    icon: PowerOutlinedIcon,
    titleKey: 'page.creator_fund.how.opt_in_title',
    linkKey: 'page.creator_fund.how.opt_in_link',
    textKey: 'page.creator_fund.how.opt_in_text'
  },
  { icon: BuildOutlinedIcon, titleKey: 'page.creator_fund.how.build_title', textKey: 'page.creator_fund.how.build_text' },
  { icon: EmojiEventsOutlinedIcon, titleKey: 'page.creator_fund.how.paid_title', textKey: 'page.creator_fund.how.paid_text' }
]

const payoutSignals: IconCopy[] = [
  { icon: PersonAddAltOutlinedIcon, titleKey: 'page.creator_fund.measure.new_players' },
  { icon: ShowChartIcon, titleKey: 'page.creator_fund.measure.playtime' },
  { icon: RepeatIcon, titleKey: 'page.creator_fund.measure.retention' }
]

const moreWaysToEarnKeys = [
  'page.creator_fund.more_ways.wearables',
  'page.creator_fund.more_ways.funding',
  'page.creator_fund.more_ways.contests',
  'page.creator_fund.more_ways.purchases'
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

const faqEntries: FaqEntry[] = [
  { id: 'join', trackingName: 'How Do I Join' },
  { id: 'rewards', trackingName: 'How Are Payouts Calculated' },
  { id: 'worlds', trackingName: 'Do Worlds Count' },
  { id: 'wallet', trackingName: 'Custom Payout Wallet' },
  { id: 'transfer', trackingName: 'Transfer During A Cycle' },
  { id: 'runs', trackingName: 'Who Runs The Creator Fund' },
  { id: 'after', trackingName: 'After The Beta Season' },
  { id: 'grant', trackingName: 'Is This A Grant' }
].map(({ id, trackingName }) => ({
  questionKey: `page.creator_fund.faq.${id}_question`,
  answerKey: `page.creator_fund.faq.${id}_answer`,
  trackingName
}))

// `section` values on this page's Click events.
const CLICK_SECTIONS = {
  navbar: 'navbar',
  navbarMenu: 'navbar-menu',
  hero: 'hero-banner',
  intro: 'decentraland-intro',
  howItWorks: 'how-it-works',
  payouts: 'payouts',
  faq: 'faq',
  builders: 'builders',
  finalCta: 'final-cta'
} as const

// "Meet Decentraland builders" quotes, from the Nov 9 design. Shown below the FAQ.
const builderQuotes: BuilderQuote[] = [
  {
    name: 'Low Poly Models (KJ)',
    quote: "Since Decentraland is a platform for adults, I have a lot more creative freedom in what I'm building."
  },
  {
    name: 'Roustan',
    quote:
      'Building in Decentraland allowed me to cut out all the middlemen. It has enabled me to develop a community and following faster than anything IRL has ever done in the past.'
  },
  {
    name: 'Stom',
    quote: 'Getting paid repeatedly makes you feel like you’re actually building something professionally.'
  }
]

const CREATOR_FUND_CONTACT_EMAIL = 'creatorfund@decentraland.org'

const CREATOR_HUB_DOWNLOAD_PATH = '/download/creator-hub'

// Program Rules and Program Terms are two separate pages on the docs site
// (decentraland/docs: creator/creator-fund/program-rules.md and program-terms.md).
const CREATOR_FUND_RULES_URL = 'https://docs.decentraland.org/creator/creator-fund/program-rules'
const CREATOR_FUND_TERMS_URL = 'https://docs.decentraland.org/creator/creator-fund/program-terms'

export {
  CLICK_SECTIONS,
  CREATOR_FUND_CONTACT_EMAIL,
  CREATOR_FUND_RULES_URL,
  CREATOR_FUND_TERMS_URL,
  CREATOR_HUB_DOWNLOAD_PATH,
  betaProgram,
  buildToEarnSteps,
  builderQuotes,
  eligibilityCards,
  faqEntries,
  moreWaysToEarnKeys,
  payoutSignals,
  platformLinks,
  scenes,
  sectionLinks
}
