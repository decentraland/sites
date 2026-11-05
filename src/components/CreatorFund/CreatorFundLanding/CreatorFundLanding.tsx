import { memo } from 'react'
import { Builders } from '../Builders'
import { BuildToEarn } from '../BuildToEarn'
import { Eligibility } from '../Eligibility'
import { Faq } from '../Faq'
import { Hero } from '../Hero'
import { Join } from '../Join'
import { Payouts } from '../Payouts'
import { PayoutSignals } from '../PayoutSignals'
import { ProgramLinks } from '../ProgramLinks'
import { Schedule } from '../Schedule'
import { SectionNav } from '../SectionNav'
import { Why } from '../Why'
import { LandingRoot } from './CreatorFundLanding.styled'

// The full Creator Fund program page (Beta Season). Ported from the design
// prototype; the site navbar and footer come from <Layout />.
const CreatorFundLanding = memo(() => (
  <LandingRoot>
    <SectionNav />
    <Hero />
    <Why />
    <BuildToEarn />
    <PayoutSignals />
    <Eligibility />
    <Payouts />
    <Builders />
    <Schedule />
    <Join />
    <Faq />
    <ProgramLinks />
  </LandingRoot>
))

CreatorFundLanding.displayName = 'CreatorFundLanding'

export { CreatorFundLanding }
