import { memo } from 'react'
import { BuildToEarn } from '../BuildToEarn'
import { SCROLL_SECTIONS } from '../data'
import { Eligibility } from '../Eligibility'
import { Faq } from '../Faq'
import { Hero } from '../Hero'
import { Join } from '../Join'
import { MoreWaysToEarn } from '../MoreWaysToEarn'
import { Payouts } from '../Payouts'
import { PayoutSignals } from '../PayoutSignals'
import { Schedule } from '../Schedule'
import { ScrollCheckpoint } from '../ScrollCheckpoint'
import { SectionNav } from '../SectionNav'
import { Why } from '../Why'
import { LandingRoot } from './CreatorFundLanding.styled'

// The full Creator Fund program page (Beta Season). Ported from the design
// prototype. Its own navbar replaces the site one; the site footer comes from <Layout />.
// A ScrollCheckpoint before each section sends one `Scroll` event when the visitor reaches it.
const CreatorFundLanding = memo(() => (
  <LandingRoot>
    <SectionNav />
    <ScrollCheckpoint name={SCROLL_SECTIONS.hero} />
    <Hero />
    <ScrollCheckpoint name={SCROLL_SECTIONS.intro} />
    <Why />
    <ScrollCheckpoint name={SCROLL_SECTIONS.howItWorks} />
    <BuildToEarn />
    <ScrollCheckpoint name={SCROLL_SECTIONS.whatWeReward} />
    <PayoutSignals />
    <ScrollCheckpoint name={SCROLL_SECTIONS.payouts} />
    <Payouts />
    <ScrollCheckpoint name={SCROLL_SECTIONS.eligibility} />
    <Eligibility />
    <ScrollCheckpoint name={SCROLL_SECTIONS.dates} />
    <Schedule />
    <ScrollCheckpoint name={SCROLL_SECTIONS.moreWaysToEarn} />
    <MoreWaysToEarn />
    <ScrollCheckpoint name={SCROLL_SECTIONS.finalCta} />
    <Join />
    <ScrollCheckpoint name={SCROLL_SECTIONS.faq} />
    <Faq />
  </LandingRoot>
))

CreatorFundLanding.displayName = 'CreatorFundLanding'

export { CreatorFundLanding }
