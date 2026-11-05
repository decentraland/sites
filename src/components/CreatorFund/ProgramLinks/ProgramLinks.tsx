import { memo } from 'react'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { CREATOR_FUND_CONTACT_EMAIL } from '../data'
import { ContactLink, PendingLink, ProgramLinkList, ProgramLinksInner, ProgramLinksSection, ProgramLinksTitle } from './ProgramLinks.styled'

// Target of the "Terms" links. The site footer below already carries the
// Decentraland-wide links, so this keeps only the program's own.
const ProgramLinks = memo(() => {
  const l = useFormatMessage()
  const pending = l('page.creator_fund.terms.pending')

  return (
    <ProgramLinksSection id="terms">
      <ProgramLinksInner>
        <ProgramLinksTitle>{l('page.creator_fund.terms.title')}</ProgramLinksTitle>
        <ProgramLinkList>
          <li>
            <PendingLink aria-disabled="true" title={pending}>
              {l('page.creator_fund.terms.rules')}
            </PendingLink>
          </li>
          <li>
            <PendingLink aria-disabled="true" title={pending}>
              {l('page.creator_fund.terms.program_terms')}
            </PendingLink>
          </li>
          <li>
            <ContactLink href={`mailto:${CREATOR_FUND_CONTACT_EMAIL}`}>{l('page.creator_fund.terms.contact')}</ContactLink>
          </li>
        </ProgramLinkList>
      </ProgramLinksInner>
    </ProgramLinksSection>
  )
})

ProgramLinks.displayName = 'ProgramLinks'

export { ProgramLinks }
