import { memo } from 'react'
import { BulletList, LegalPageLayout, Paragraph, Section, SectionTitle } from '../../components/LegalPage'
import type { TOCEntry } from '../../components/LegalPage'

const TABLE_OF_CONTENTS: TOCEntry[] = [
  { id: 'general-provisions', label: '1. General Provisions' },
  { id: 'how-it-works', label: '2. How It Works' },
  { id: 'rewards-structure', label: '3. Rewards Structure' },
  { id: 'reward-distribution', label: '4. Reward Distribution and Delivery' },
  { id: 'program-abuse', label: '5. Program Abuse and Disqualification' },
  { id: 'email-notifications', label: '6. Email Notifications' },
  { id: 'changes-and-termination', label: '7. Changes and Termination' },
  { id: 'miscellaneous', label: '8. Miscellaneous' }
]

const ReferralTerms = memo(() => (
  <LegalPageLayout title="Referral" activeSlug="/referral-terms" tableOfContents={TABLE_OF_CONTENTS}>
    <Paragraph>Referral Program &ndash; Terms and Conditions</Paragraph>

    <Section id="general-provisions">
      <SectionTitle>1. General Provisions</SectionTitle>
      <Paragraph>
        1.1. This Referral Program (&quot;Program&quot;) is open to all registered users of Decentraland platform who are in good standing
        and comply with our general Terms of Service.
      </Paragraph>
      <Paragraph>
        1.2. Participation in the Program constitutes acceptance of these Terms and Conditions, as well as the Decentraland Terms of Use,
        Privacy Policy, and Content Policy.
      </Paragraph>
      <Paragraph>
        1.3. The Decentraland Foundation reserves the right to modify, suspend, or terminate the Program at its discretion.
      </Paragraph>
    </Section>

    <Section id="how-it-works">
      <SectionTitle>2. How It Works</SectionTitle>
      <Paragraph>
        2.1. To refer a new user, share your unique referral link. A referred user (&quot;Referee&quot;) will be considered valid if the
        following conditions are met:
      </Paragraph>
      <BulletList>
        <li>The Referee successfully creates an account on our platform using a referral link.</li>
        <li>The Referee downloads and installs Decentraland&apos;s desktop client.</li>
        <li>The Referee jumps into Genesis City via the desktop client three (3) different days.</li>
      </BulletList>
      <Paragraph>2.2. Only referrals meeting those criteria will count towards your reward tally.</Paragraph>
      <Paragraph>
        2.3. Every successful referral should count and be displayed in a counter under the &quot;Referral Rewards&quot; section.
      </Paragraph>
    </Section>

    <Section id="rewards-structure">
      <SectionTitle>3. Rewards Structure</SectionTitle>
      <Paragraph>
        Rewards are granted based on the number of valid referrals you accumulate in the &quot;Referral Rewards&quot; section. Each reward
        tier is cumulative and unlocks sequentially:
      </Paragraph>
      <BulletList>
        <li>5 Friends Joined: EPIC Bottoms Wearable + Starter Community Recruiter Badge</li>
        <li>10 Friends Joined: EPIC Jacket Wearable + Bronze Community Recruiter Badge</li>
        <li>20 Friends Joined: LEGENDARY Handwear Wearable</li>
        <li>25 Friends Joined: LEGENDARY Emote + Silver Community Recruiter Badge</li>
        <li>30 Friends Joined: EXOTIC Shoes Wearable</li>
        <li>50 Friends Joined: EXOTIC Hair Wearable + Gold Community Recruiter Badge</li>
        <li>60 Friends Joined: MYTHIC &quot;Companion-style&quot; Wearable</li>
        <li>75 Friends Joined: MYTHIC Looping Emote+ Platinum Community Recruiter Badge</li>
        <li>100 Friends Joined: IRL Swag Pack + Digital Twin Wearable + Diamond Community Recruiter Badge</li>
      </BulletList>
    </Section>

    <Section id="reward-distribution">
      <SectionTitle>4. Reward Distribution and Delivery</SectionTitle>
      <Paragraph>
        4.1. Digital rewards (Wearables, Emotes, badges, and Credits) will be automatically credited to your account within 3 business days
        of reaching a reward tier.
      </Paragraph>
      <Paragraph>4.2. IRL rewards require contact through the designated email or the email address you share for such purpose.</Paragraph>
      <Paragraph>
        4.3. We commit to delivering the Rewards in accordance with the rarity levels of the Wearables as stated in the Program. However, we
        do not guarantee the delivery of a specific Wearable within a given rarity category, as each Wearable is subject to availability and
        are traded on the Marketplace.
      </Paragraph>
    </Section>

    <Section id="program-abuse">
      <SectionTitle>5. Program Abuse and Disqualification</SectionTitle>
      <Paragraph>
        We reserve the right to disqualify participants who attempt to game, abuse, or manipulate the referral system, including but not
        limited to creating fake accounts, using bots, or violating the platform&apos;s Terms of Service.
      </Paragraph>
    </Section>

    <Section id="email-notifications">
      <SectionTitle>6. Email Notifications</SectionTitle>
      <Paragraph>
        6.1. By participating in the Program, you consent to receive email notifications related to &quot;Referral Program.&quot;
      </Paragraph>
      <Paragraph>6.2. The Decentraland Foundation may add additional email notification categories in the future.</Paragraph>
    </Section>

    <Section id="changes-and-termination">
      <SectionTitle>7. Changes and Termination</SectionTitle>
      <Paragraph>
        We reserve the right to modify or terminate this Program at any time without prior notice. Any changes will be effective immediately
        upon posting an updated version of these Terms and Conditions.
      </Paragraph>
    </Section>

    <Section id="miscellaneous">
      <SectionTitle>8. Miscellaneous</SectionTitle>
      <Paragraph>
        7.1. The Decentraland Foundation is not responsible for any technical malfunctions, errors, or issues that may affect participation
        in the Program.
      </Paragraph>
      <Paragraph>
        7.2. Any disputes regarding the Program shall be resolved at the sole discretion of the Decentraland Foundation.
      </Paragraph>
      <Paragraph>
        7.3. For any questions regarding the Referral Program, please contact our support team via the platform or at{' '}
        <a href="mailto:support@decentraland.org">support@decentraland.org</a>.
      </Paragraph>
      <Paragraph>Updated August 18, 2025</Paragraph>
    </Section>
  </LegalPageLayout>
))

ReferralTerms.displayName = 'ReferralTerms'

export { ReferralTerms }
