import { memo } from 'react'
import { Button } from 'decentraland-ui2'
import { LegalPageLayout, Paragraph } from '../../components/LegalPage'
import type { TOCEntry } from '../../components/LegalPage'

const TABLE_OF_CONTENTS: TOCEntry[] = []

const SecurityPage = memo(() => (
  <LegalPageLayout title="Vulnerability Disclosure Procedure" activeSlug="/security" tableOfContents={TABLE_OF_CONTENTS}>
    <Paragraph>
      At Decentraland, we take every measure necessary to ensure the security of the platform. If you are a security researcher and took a
      look at some of our code, contracts, or websites and found a vulnerability, please report it responsibly by emailing us at
      security@decentraland.org.
    </Paragraph>
    <Button component="a" href="mailto:security@decentraland.org" variant="contained">
      Report a security issue
    </Button>
  </LegalPageLayout>
))

SecurityPage.displayName = 'SecurityPage'

export { SecurityPage }
