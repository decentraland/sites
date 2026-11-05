import { styled } from 'decentraland-ui2'
import { MutedText, SectionInner, creatorFundColors } from '../CreatorFund.styled'

const FaqInner = styled(SectionInner)({
  maxWidth: 768
})

const FaqList = styled('div')(({ theme }) => ({
  marginTop: theme.spacing(5),
  borderTop: `1px solid ${creatorFundColors.border}`
}))

const FaqItem = styled('details')(({ theme }) => ({
  padding: `${theme.spacing(2.5)} 0`,
  borderBottom: `1px solid ${creatorFundColors.border}`,
  ['&[open] > summary > svg']: {
    transform: 'rotate(180deg)'
  }
}))

const FaqQuestion = styled('summary')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: theme.spacing(2),
  listStyle: 'none',
  cursor: 'pointer',
  fontSize: 18,
  fontWeight: 600,
  color: creatorFundColors.text,
  ['&::-webkit-details-marker']: {
    display: 'none'
  },
  ['&:hover']: {
    color: creatorFundColors.white
  },
  ['&:focus-visible']: {
    outline: `2px solid ${creatorFundColors.white}`,
    outlineOffset: 4,
    borderRadius: 4
  },
  ['& > svg']: {
    flexShrink: 0,
    fontSize: 20,
    transition: 'transform 0.2s'
  }
}))

const FaqAnswer = styled(MutedText)(({ theme }) => ({
  marginTop: theme.spacing(1.5)
}))

// Support line under the questions: where to write when the FAQ doesn't answer it.
const FaqContact = styled('p')(({ theme }) => ({
  margin: `${theme.spacing(4)} 0 0`,
  fontSize: 16,
  lineHeight: 1.5,
  color: creatorFundColors.text
}))

const FaqContactLink = styled('a')({
  fontWeight: 600,
  color: creatorFundColors.primary,
  textDecoration: 'none',
  overflowWrap: 'anywhere',
  ['&:hover']: {
    color: creatorFundColors.linkHover,
    textDecoration: 'underline'
  },
  ['&:focus-visible']: {
    outline: `2px solid ${creatorFundColors.white}`,
    outlineOffset: 2,
    borderRadius: 2
  }
})

export { FaqAnswer, FaqContact, FaqContactLink, FaqInner, FaqItem, FaqList, FaqQuestion }
