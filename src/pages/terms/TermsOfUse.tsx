import { memo } from 'react'
import { LegalPageLayout } from '../../components/LegalPage'
import type { TOCEntry } from '../../components/LegalPage'
import { TermsOfUseContent } from './TermsOfUseContent'

const TABLE_OF_CONTENTS: TOCEntry[] = [
  { id: 'acceptance-of-terms', label: '1. Acceptance of Terms' },
  { id: 'section-1-1', label: '1.1 Introduction', depth: 1 },
  { id: 'section-1-2', label: '1.2 Services', depth: 1 },
  { id: 'section-1-3', label: '1.3 Agreement to these Terms', depth: 1 },
  { id: 'section-1-4', label: '1.4 Free access', depth: 1 },
  { id: 'section-1-5', label: '1.5 Open Source Software', depth: 1 },
  { id: 'disclaimer-and-modification', label: '2. Disclaimer and Modification of Terms of Use' },
  { id: 'eligibility', label: '3. Eligibility' },
  { id: 'account-access-and-security', label: '4. Account Access and Security' },
  { id: 'representations-and-risks', label: '5. Representations and Risks' },
  { id: 'section-5-1', label: '5.1 Disclaimer', depth: 1 },
  { id: 'section-5-2', label: '5.2 Sophistication and Risk of Cryptographic Systems', depth: 1 },
  { id: 'section-5-3', label: '5.3 Risk of Regulatory Actions in One or More Jurisdictions', depth: 1 },
  { id: 'section-5-4', label: '5.4 Risk of Weaknesses or Exploits in the Field of Cryptography', depth: 1 },
  { id: 'section-5-5', label: '5.5 Use of Crypto Assets', depth: 1 },
  { id: 'section-5-6', label: '5.6 Application Security', depth: 1 },
  { id: 'section-5-7', label: '5.7 Third Party Providers', depth: 1 },
  { id: 'section-5-8', label: '5.8 Taxes', depth: 1 },
  { id: 'section-5-9', label: '5.9 Uses of the Tools', depth: 1 },
  { id: 'section-5-10', label: '5.10 Risks of Changes to Ethereum Platform', depth: 1 },
  { id: 'section-5-11', label: '5.11 Wearables Curation Committee', depth: 1 },
  { id: 'transactions-and-fees', label: '6. Transactions and Fees' },
  { id: 'changes', label: '7. Changes' },
  { id: 'children', label: '8. Age Eligibility' },
  { id: 'indemnity', label: '9. Indemnity' },
  { id: 'disclaimers', label: '10. Disclaimers' },
  { id: 'limitation-on-liability', label: '11. Limitation on Liability' },
  { id: 'proprietary-rights', label: '12. Proprietary Rights' },
  { id: 'open-source-license', label: '13. Open Source License' },
  { id: 'section-13-1', label: '13.1 Grant of Copyright License', depth: 1 },
  { id: 'section-13-2', label: '13.2 Grant of Patent License', depth: 1 },
  { id: 'section-13-3', label: '13.3 Redistribution', depth: 1 },
  { id: 'section-13-4', label: '13.4 Submission of Contributions', depth: 1 },
  { id: 'section-13-5', label: '13.5 Trademarks', depth: 1 },
  { id: 'section-13-6', label: '13.6 Disclaimer of Warranty', depth: 1 },
  { id: 'section-13-7', label: '13.7 Limitation of Liability', depth: 1 },
  { id: 'section-13-8', label: '13.8 Accepting Warranty or Additional Liability', depth: 1 },
  { id: 'links', label: '14. Links' },
  { id: 'termination-and-suspension', label: '15. Termination and Suspension' },
  { id: 'no-third-party-beneficiaries', label: '16. No Third-Party Beneficiaries' },
  { id: 'copyright-infringement', label: '17. Notice and Procedure for Making Claims of Copyright Infringement' },
  { id: 'binding-arbitration', label: '18. Binding Arbitration and Class Action Waiver' },
  { id: 'section-18-1', label: '18.1 Initial Dispute Resolution', depth: 1 },
  { id: 'section-18-2', label: '18.2 Binding Arbitration', depth: 1 },
  { id: 'section-18-3', label: '18.3 Class Action Waiver', depth: 1 },
  { id: 'section-18-4', label: '18.4 Exception - Litigation of Intellectual Property and Small Court Claims', depth: 1 },
  { id: 'section-18-5', label: '18.5 30-day Right to Opt-Out', depth: 1 },
  { id: 'section-18-6', label: '18.6 Changes to this Section', depth: 1 },
  { id: 'general-information', label: '19. General Information' },
  { id: 'section-19-1', label: '19.1 Entire Agreement', depth: 1 },
  { id: 'section-19-2', label: '19.2 Waiver and Severability of Terms', depth: 1 },
  { id: 'section-19-3', label: '19.3 Statute of Limitations', depth: 1 },
  { id: 'section-19-4', label: '19.4 Section Titles', depth: 1 },
  { id: 'section-19-5', label: '19.5 Communications', depth: 1 },
  { id: 'definitions', label: '20. Definitions' }
]

const TermsOfUse = memo(() => (
  <LegalPageLayout title="Terms of Use" activeSlug="/terms" tableOfContents={TABLE_OF_CONTENTS}>
    <TermsOfUseContent />
  </LegalPageLayout>
))

TermsOfUse.displayName = 'TermsOfUse'

export { TermsOfUse }
