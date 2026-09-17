import { dclColors, styled } from 'decentraland-ui2'

// The creator name inside a card by-line. Ruby, and shared by every card so the
// three surfaces can't drift apart.
const CreatorName = styled('span')({
  color: dclColors.base.primary
})

// Same name as a control, for the places that resolve a wallet: clicking opens
// that profile. Inherits the by-line's font so swapping between the two never
// reflows the row.
const CreatorLink = styled('button')({
  border: 'none',
  padding: 0,
  margin: 0,
  background: 'none',
  font: 'inherit',
  color: dclColors.base.primary,
  cursor: 'pointer',
  ['&:hover']: { textDecoration: 'underline' },
  ['&:active']: { textDecoration: 'underline' },
  ['&:focus-visible']: { outline: `2px solid ${dclColors.neutral.softWhite}`, outlineOffset: 2, borderRadius: 2 }
})

export { CreatorLink, CreatorName }
