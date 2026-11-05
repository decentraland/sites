import { memo } from 'react'
import { Builders } from '../Builders'
import { BuildToEarn } from '../BuildToEarn'
import { Eligibility } from '../Eligibility'
import { Faq } from '../Faq'
import { Hero } from '../Hero'
import { Join } from '../Join'
import { Payouts } from '../Payouts'
import { PayoutSignals } from '../PayoutSignals'
import { Schedule } from '../Schedule'
import { SectionNav } from '../SectionNav'
import { Why } from '../Why'
import { LandingRoot } from './CreatorFundLanding.styled'

// The full Creator Fund program page (Beta Season). Ported from the design
// prototype. Its own navbar replaces the site one; the site footer comes from <Layout />.
const CreatorFundLanding = memo(() => (
  <LandingRoot>
    <SectionNav />
    <Hero />
    <Why />
    <BuildToEarn />
    <PayoutSignals />
    <Payouts />
    <Eligibility />
    <Builders />
    <Schedule />
    <Join />
    <Faq />
  </LandingRoot>
))

CreatorFundLanding.displayName = 'CreatorFundLanding'

export { CreatorFundLanding }
