import { memo } from 'react'
import { LegalPageLayout, Paragraph, Section, SectionTitle } from '../../components/LegalPage'
import type { TOCEntry } from '../../components/LegalPage'

const TABLE_OF_CONTENTS: TOCEntry[] = [
  { id: 'allowable-usage', label: '1. Allowable Usage' },
  { id: 'logo-and-name-ownership', label: '2. Logo and name ownership' },
  { id: 'wearables-and-user-names', label: '3. Wearables and user names in Decentraland' },
  { id: 'nfts-and-other-uses', label: '4. NFTs and other uses outside the Decentraland platform' },
  { id: 'disclaimer', label: '5. Disclaimer' },
  { id: 'press-releases', label: '6. Press Releases' },
  { id: 'advertisements', label: '7. Advertisements' },
  { id: 'the-name-decentraland', label: '8. The Name "Decentraland"' },
  { id: 'the-logo-decentraland', label: '9. The Logo "Decentraland"' },
  { id: 'additional-rules', label: '10. Additional Rules' }
]

const BrandTerms = memo(() => (
  <LegalPageLayout title="Terms of Use for Decentraland's Logo and Name" activeSlug="/brand" tableOfContents={TABLE_OF_CONTENTS}>
    <Paragraph>
      Decentraland is a decentralized virtual world governed by its users and as such strongly supports user generated content (UGC). People
      may use the Decentraland logo and name in their creations within Decentraland, but must follow the following terms.
    </Paragraph>

    <Section id="allowable-usage">
      <SectionTitle>1. Allowable Usage</SectionTitle>
      <Paragraph>
        Users shall comply with these terms as well as Decentraland&apos;s{' '}
        <a href="https://decentraland.org/terms/" target="_blank" rel="noopener noreferrer">
          Terms of Use
        </a>{' '}
        and{' '}
        <a href="https://decentraland.org/content/" target="_blank" rel="noopener noreferrer">
          Content Policy
        </a>{' '}
        in order to be allowed to use the Decentraland name and logo within Decentraland.
      </Paragraph>
    </Section>

    <Section id="logo-and-name-ownership">
      <SectionTitle>2. Logo and name ownership</SectionTitle>
      <Paragraph>
        The Decentraland Foundation is the registered owner of the Decentraland name and logo, acting for the benefit of the DAO. This is
        because currently the DAO lacks formal legal status.
      </Paragraph>
    </Section>

    <Section id="wearables-and-user-names">
      <SectionTitle>3. Wearables and user names in Decentraland</SectionTitle>
      <Paragraph>
        Users may create wearables and names using the Decentraland logo and name on the Decentraland platform, provided that they
        don&apos;t violate the platform&apos;s Content Policy and Terms of Use. As far as the Decentraland Foundation is concerned, you are
        not prevented from monetizing or obtaining profits from the sale of said wearables or user names. The NFT must be unique in design.
      </Paragraph>
      <Paragraph>
        The Decentraland Foundation has the right to deny the use of the Decentraland name and logo at its sole discretion in any case and
        at any time.
      </Paragraph>
    </Section>

    <Section id="nfts-and-other-uses">
      <SectionTitle>4. NFTs and other uses outside the Decentraland platform</SectionTitle>
      <Paragraph>
        The Decentraland Foundation does not authorize the creation of NFTs using the Decentraland name or logo outside the Decentraland
        platform. The use of the Decentraland name or logo is not allowed in other virtual platforms different from Decentraland or in the
        real world.
      </Paragraph>
    </Section>

    <Section id="disclaimer">
      <SectionTitle>5. Disclaimer</SectionTitle>
      <Paragraph>
        In all written materials relating to your product, including websites, publications, etc. it must be made clear that you do not have
        any kind of affiliation, business partnerships or other official association with Decentraland, the DAO or the Decentraland
        Foundation.
      </Paragraph>
    </Section>

    <Section id="press-releases">
      <SectionTitle>6. Press Releases</SectionTitle>
      <Paragraph>
        Any press releases that you distribute through social networks, media or news services should clearly state that you do not have any
        kind of affiliation, business partnerships or other official association with Decentraland, the DAO or the Decentraland Foundation.
      </Paragraph>
    </Section>

    <Section id="advertisements">
      <SectionTitle>7. Advertisements</SectionTitle>
      <Paragraph>
        Any paid advertisement that uses the Decentraland name or logo is generally not allowed and must first be approved by the
        Decentraland Foundation or the DAO. To seek such approval, you can send an email to:{' '}
        <a href="mailto:legal@decentraland.org">legal@decentraland.org</a> or through a DAO proposal.
      </Paragraph>
    </Section>

    <Section id="the-name-decentraland">
      <SectionTitle>8. The Name &quot;Decentraland&quot;</SectionTitle>
      <Paragraph>
        Subject to these terms you can use the name &quot;Decentraland&quot; to promote your game(s) or wearables as long as it doesn&apos;t
        confuse consumers and as long as it is not used as the name of an app or any kind of merchandise or product. In other words, you can
        refer to &quot;Decentraland&quot; as the name of the platform, and you can use the name to show your interest in or affection for
        the Decentraland platform.
      </Paragraph>
    </Section>

    <Section id="the-logo-decentraland">
      <SectionTitle>9. The Logo &quot;Decentraland&quot;</SectionTitle>
      <Paragraph>
        Subject to these terms, you are only allowed to use the logo design that is available at the following link{' '}
        <a href="https://decentraland.org/press/" target="_blank" rel="noopener noreferrer">
          https://decentraland.org/press/
        </a>
        . The Decentraland Foundation or the DAO may alter the form of this design from time to time. You are allowed to resize the logo as
        long as you do not modify the proportions. But otherwise, you cannot modify the logo design in any way and must abide by these
        terms.
      </Paragraph>
    </Section>

    <Section id="additional-rules">
      <SectionTitle>10. Additional Rules</SectionTitle>
      <Paragraph>
        THE USE OF DECENTRALAND LOGO AND NAME CANNOT BE ASSOCIATED WITH ANYTHING THAT VIOLATES THE RIGHTS OF OTHER THIRD PARTIES IP, CREATES
        BRAND CONFUSION, HAS HARMFUL OR OBJECTIONABLE ASPECTS OR DOES NOT COMPLY WITH APPLICABLE LAWS OR ANY OF DECENTRALAND GUIDELINES,
        TERMS OR RULES. THE DAO AND THE DECENTRALAND FOUNDATION HAVE THE RIGHT TO DECIDE (IN THEIR SOLE DISCRETION) WHETHER THE USE IS
        ACCEPTABLE.
      </Paragraph>
      <Paragraph>
        YOU MUST NOT USE THE DECENTRALAND NAME OR LOGO IN ANY MANNER THAT IS LIKELY TO HAVE AN ADVERSE EFFECT ON THE REPUTATION OF
        DECENTRALAND (AS THE DAO OR DECENTRALAND FOUNDATION MAY DETERMINE IN THEIR SOLE DISCRETION). YOU MAY NOT USE THE DECENTRALAND NAME
        OR LOGO IN ANY WAY THAT SUGGESTS THAT YOU ARE AFFILIATED WITH DECENTRALAND, THE DAO OR THE DECENTRALAND FOUNDATION, OR IN ANY WAY
        THAT SUGGESTS THAT DECENTRALAND, THE DAO OR THE DECENTRALAND FOUNDATION SPONSORS OR ENDORSES YOUR USAGE.
      </Paragraph>
      <Paragraph>
        These terms grant you permission to use the Decentraland trademarks only in the ways described above. The Decentraland Foundation or
        the DAO may withdraw or change this permission at any time for any reason.
      </Paragraph>
      <Paragraph>
        Other uses of the Decentraland logo and name require the express approval of the Decentraland Foundation or the DAO.
      </Paragraph>
    </Section>
  </LegalPageLayout>
))

BrandTerms.displayName = 'BrandTerms'

export { BrandTerms }
