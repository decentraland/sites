import { memo } from 'react'
import { LegalPageLayout, Paragraph } from '../../components/LegalPage'
import type { TOCEntry } from '../../components/LegalPage'

const TABLE_OF_CONTENTS: TOCEntry[] = []

const SecurityPage = memo(() => (
  <LegalPageLayout title="Vulnerability Disclosure Procedure" activeSlug="/security" tableOfContents={TABLE_OF_CONTENTS}>
    <Paragraph>
      At Decentraland, we take every measure necessary to ensure the security of the platform. If you are a security researcher and took a
      look at some of our code, contracts, or websites and found a vulnerability, you&apos;re eligible for a bounty for doing a responsible
      disclosure of that bug.
    </Paragraph>
    <Paragraph>
      <a href="https://immunefi.com/bounty/decentraland/" target="_blank" rel="noopener noreferrer">
        Submit a report on Immunefi
      </a>
    </Paragraph>
  </LegalPageLayout>
))

SecurityPage.displayName = 'SecurityPage'

export { SecurityPage }
