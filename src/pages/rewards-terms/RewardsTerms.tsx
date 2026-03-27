import { memo } from 'react'
import { BulletList, LegalPageLayout, Paragraph, Section, SectionTitle, SubsectionTitle } from '../../components/LegalPage'
import type { TOCEntry } from '../../components/LegalPage'

const TABLE_OF_CONTENTS: TOCEntry[] = [
  { id: 'general-provisions', label: '1. General Provisions' },
  { id: 'program-duration', label: '2. Program Duration and Structure' },
  { id: 'credits-and-prize-allocation', label: '3. Credits and Prize Allocation' },
  { id: 'eligibility-and-participation', label: '4. Eligibility and Participation' },
  { id: 'earnings-and-credit-allocation', label: '5. Earnings and Credit Allocation' },
  { id: 'reward-validity-and-usage', label: '6. Reward Validity and Usage' },
  { id: 'non-transferability', label: '7. Non-Transferability and Restrictions' },
  { id: 'email-notifications', label: '8. Email Notifications' },
  { id: 'miscellaneous', label: '9. Miscellaneous' },
  { id: 'seasons', label: '10. Seasons' },
  { id: 'first-season', label: 'First Season (2025)', depth: 1 },
  { id: 'second-season', label: 'Second Season (2025)', depth: 1 },
  { id: 'third-season', label: 'Third Season (2025)', depth: 1 },
  { id: 'fourth-season', label: 'Fourth Season (2026)', depth: 1 },
  { id: 'fifth-season', label: 'Fifth Season (2026)', depth: 1 }
]

const RewardsTerms = memo(() => (
  <LegalPageLayout title="Rewards Program" activeSlug="/rewards-terms" tableOfContents={TABLE_OF_CONTENTS}>
    <Paragraph>Terms and Conditions of the Rewards Program</Paragraph>

    <Section id="general-provisions">
      <SectionTitle>1. General Provisions</SectionTitle>
      <Paragraph>
        1.1. The Rewards Program (the &quot;Program&quot;) is offered by the Decentraland Foundation and is conducted in specific Seasons,
        the dates of which will be announced by the Decentraland Foundation.
      </Paragraph>
      <Paragraph>
        1.2. Participation in the Program constitutes acceptance of these Terms and Conditions, as well as the Decentraland Terms of Use,
        Privacy Policy, and Content Policy.
      </Paragraph>
      <Paragraph>
        1.3. The Decentraland Foundation reserves the right to modify, suspend, or terminate the Program at its discretion.
      </Paragraph>
    </Section>

    <Section id="program-duration">
      <SectionTitle>2. Program Duration and Structure</SectionTitle>
      <Paragraph>
        2.1. The Program is organized in Seasons (the &quot;Season&quot;). The Decentraland Foundation will announce the start and end dates
        for each Season.
      </Paragraph>
    </Section>

    <Section id="credits-and-prize-allocation">
      <SectionTitle>3. Credits and Prize Allocation</SectionTitle>
      <Paragraph>
        3.1. Credits issued under the Program may only be used on primary sales of Polygon Wearables &amp; Emotes (L1 sales are excluded).
      </Paragraph>
      <Paragraph>
        3.2. Each Marketplace Credit is valued in each Season; however this value may be changed (lowered or increased) in the future at the
        discretion of the Decentraland Foundation.
      </Paragraph>
      <Paragraph>3.3. Credits do not represent voting power (VP).</Paragraph>
      <Paragraph>
        3.4. A maximum total reward budget is allocated per Season. Once this budget is exhausted, no further rewards will be granted during
        that Season.
      </Paragraph>
    </Section>

    <Section id="eligibility-and-participation">
      <SectionTitle>4. Eligibility and Participation</SectionTitle>
      <Paragraph>
        4.1. To be eligible for rewards, participants must complete specified actions, attend designated events, or fulfill other tasks as
        determined by the Decentraland Foundation.
      </Paragraph>
      <Paragraph>
        4.2. The Decentraland Foundation reserves the right to verify the completion of required actions before awarding any rewards.
      </Paragraph>
    </Section>

    <Section id="earnings-and-credit-allocation">
      <SectionTitle>5. Earnings and Credit Allocation</SectionTitle>
      <Paragraph>
        5.1. Participants who fully complete all designated weekly goals will earn the maximum Marketplace Credits per week mentioned in the
        corresponding Season.
      </Paragraph>
      <Paragraph>5.2. The maximum Marketplace Credits a user can earn during the Season shall be determined in each Season.</Paragraph>
      <Paragraph>5.3. A weekly goal must be fully completed to receive its associated credit value.</Paragraph>
      <Paragraph>
        5.4. Participants will earn credits only for the goals they fully complete; it is not necessary to complete every goal in order to
        receive some credit.
      </Paragraph>
    </Section>

    <Section id="reward-validity-and-usage">
      <SectionTitle>6. Reward Validity and Usage</SectionTitle>
      <Paragraph>
        6.1. Rewards will be valid for a period of weeks to be announced in each Season (the &quot;validity period&quot;).
      </Paragraph>
      <Paragraph>6.2. Any rewards not redeemed within the validity period will expire and become non-redeemable.</Paragraph>
    </Section>

    <Section id="non-transferability">
      <SectionTitle>7. Non-Transferability and Restrictions</SectionTitle>
      <Paragraph>7.1. Rewards are non-transferable and may only be used by the designated recipient.</Paragraph>
      <Paragraph>
        7.2. Credits must be issued to a specific beneficiary (a valid EVM Address) and can only be utilized by that beneficiary.
      </Paragraph>
      <Paragraph>7.3. Rewards cannot be exchanged for cash, MANA, or any other alternative benefits.</Paragraph>
      <Paragraph>
        7.4. Credits cannot be used to publish a collection, used on Ethereum for this iteration, or transferred between users.
      </Paragraph>
      <Paragraph>
        7.5. The Decentraland Foundation reserves the right to revoke or cancel rewards if they are misused or if participants are found to
        be in violation of the Program&apos;s terms.
      </Paragraph>
    </Section>

    <Section id="email-notifications">
      <SectionTitle>8. Email Notifications</SectionTitle>
      <Paragraph>
        8.1. By participating in the Program, you consent to receive email notifications related to &quot;Weekly Rewards.&quot;
      </Paragraph>
      <Paragraph>8.2. The Decentraland Foundation may add additional email notification categories in the future.</Paragraph>
    </Section>

    <Section id="miscellaneous">
      <SectionTitle>9. Miscellaneous</SectionTitle>
      <Paragraph>
        9.1. The Decentraland Foundation is not responsible for any technical malfunctions, errors, or issues that may affect participation
        in the Program.
      </Paragraph>
      <Paragraph>
        9.2. Any disputes regarding the Program shall be resolved at the sole discretion of the Decentraland Foundation.
      </Paragraph>
      <Paragraph>
        For further inquiries, please contact <a href="mailto:legal@decentraland.org">legal@decentraland.org</a>.
      </Paragraph>
    </Section>

    <Section id="seasons">
      <SectionTitle>10. Seasons</SectionTitle>

      <SubsectionTitle id="first-season">First Season (2025)</SubsectionTitle>
      <BulletList>
        <li>The First Season starts on May 19, 2025 and finishes July 14, 2025.</li>
        <li>The First Season will run for 8 weeks, with each week defined as Monday 00:00 UTC to Sunday 23:59 UTC.</li>
        <li>The maximum total reward budget for the first Season is set at 640,000 Credits.</li>
        <li>The maximum a user can earn during the 8-week trial Season is 64 Marketplace Credits.</li>
        <li>Rewards will be valid for a period of ten (10) weeks from the Season launch date (the &quot;validity period&quot;).</li>
        <li>Each Marketplace Credit is valued at 1 MANA.</li>
      </BulletList>
      <Paragraph>Weekly Goals and Credit Values:</Paragraph>
      <BulletList>
        <li>Log into DCL on at least 3 separate days - Value: 4 Credits</li>
        <li>Attend at least 2 events - Value: 2 Credits</li>
        <li>View 3 new Profiles - Value: 1 Credit</li>
        <li>Visit 3 new locations - Value: 1 Credit</li>
      </BulletList>

      <SubsectionTitle id="second-season">Second Season (2025)</SubsectionTitle>
      <BulletList>
        <li>Starts August 11, 2025, finishes October 12, 2025.</li>
        <li>9 weeks, Monday 00:00 UTC to Sunday 23:59 UTC.</li>
        <li>Budget: 640,000 Credits. Max per user: 360 Credits.</li>
        <li>Validity: eleven (11) weeks from launch (October 26, 2025 at 23:59).</li>
        <li>Each Credit valued at 1 MANA.</li>
      </BulletList>
      <Paragraph>Weekly Goals:</Paragraph>
      <BulletList>
        <li>Log into DCL on at least 3 separate days - 20 Credits (Must remain in-world 10+ min each day)</li>
        <li>Attend at least 2 events - 10 Credits (Must remain 10+ min each event)</li>
        <li>View 3 new Profiles - 5 Credits</li>
        <li>Visit 3 new locations - 5 Credits</li>
      </BulletList>

      <SubsectionTitle id="third-season">Third Season (2025)</SubsectionTitle>
      <BulletList>
        <li>Starts October 27, 2025, finishes December 21, 2025.</li>
        <li>8 weeks. Budget: 640,000 Credits. Max per user: 320 Credits.</li>
        <li>Validity: ten (10) weeks (January 4, 2026 at 23:59:59).</li>
        <li>Each Credit valued at 1 MANA.</li>
      </BulletList>
      <Paragraph>Weekly Goals:</Paragraph>
      <BulletList>
        <li>Log into DCL on at least 3 separate days - 20 Credits</li>
        <li>Attend at least 2 events - 10 Credits (Must remain 5+ min)</li>
        <li>Explore a weekly location - 5 Credits</li>
        <li>Snap A Photo Emoting With Someone - 5 Credits</li>
      </BulletList>

      <SubsectionTitle id="fourth-season">Fourth Season (2026)</SubsectionTitle>
      <BulletList>
        <li>Starts January 12, 2026, finishes March 01, 2026.</li>
        <li>7 weeks. Budget: 640,000 Credits. Max per user: 280 Credits.</li>
        <li>Validity: nine (9) weeks (March 15, 2026 at 23:59:59).</li>
        <li>Each Credit valued at 1 MANA.</li>
      </BulletList>
      <Paragraph>Weekly Goals:</Paragraph>
      <BulletList>
        <li>Log into DCL on at least 3 separate days - 20 Credits</li>
        <li>Attend at least 2 events - 10 Credits (Must remain 5+ min)</li>
        <li>Explore a weekly location - 5 Credits</li>
        <li>Snap A Photo Emoting With Someone - 5 Credits</li>
      </BulletList>

      <SubsectionTitle id="fifth-season">Fifth Season (2026)</SubsectionTitle>
      <BulletList>
        <li>Starts March 16, 2026, finishes April 19, 2026.</li>
        <li>5 weeks. Budget: 640,000 Credits. Max per user: 200 Credits.</li>
        <li>Validity: six (6) weeks (April 26, 2026 at 23:59:59).</li>
        <li>Each Credit valued at 1 MANA.</li>
      </BulletList>
      <Paragraph>Weekly Goals:</Paragraph>
      <BulletList>
        <li>Log into DCL on at least 3 separate days - 20 Credits</li>
        <li>Attend at least 2 events - 10 Credits (Must remain 5+ min)</li>
        <li>Explore a weekly location - 5 Credits</li>
        <li>Snap A Photo Emoting With Someone - 5 Credits</li>
      </BulletList>
    </Section>
  </LegalPageLayout>
))

RewardsTerms.displayName = 'RewardsTerms'

export { RewardsTerms }
