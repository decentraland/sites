import { styled } from 'decentraland-ui2'
import { CreatorFundSection, Eyebrow, SectionInner, creatorFundColors } from '../CreatorFund.styled'

// Follows the FAQ closely and shares its column, so it reads as that section's footnote.
const ProgramLinksSection = styled(CreatorFundSection)(({ theme }) => ({
  paddingTop: theme.spacing(6),
  [theme.breakpoints.up('sm')]: {
    paddingTop: theme.spacing(6)
  }
}))

const ProgramLinksInner = styled(SectionInner)({
  maxWidth: 768
})

const ProgramLinksTitle = styled(Eyebrow)({
  display: 'block',
  color: creatorFundColors.mutedText
})

const ProgramLinkList = styled('ul')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1.5),
  margin: `${theme.spacing(2)} 0 0`,
  padding: 0,
  listStyle: 'none',
  fontSize: 14,
  fontWeight: 600
}))

// Program Rules and Terms aren't published yet: shown, but not clickable.
const PendingLink = styled('span')({
  color: creatorFundColors.mutedText,
  cursor: 'not-allowed'
})

const ContactLink = styled('a')({
  color: creatorFundColors.text,
  textDecoration: 'none',
  ['&:hover, &:focus-visible']: {
    color: creatorFundColors.primary
  }
})

export { ContactLink, PendingLink, ProgramLinkList, ProgramLinksInner, ProgramLinksSection, ProgramLinksTitle }
