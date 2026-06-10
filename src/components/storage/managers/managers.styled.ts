import { Box, styled } from 'decentraland-ui2'

// Header row above each storage table: title on the left, actions on the right.
// Local to the managers so they don't reach into a page-level styled file.
const SectionHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: theme.spacing(3),
  flexWrap: 'wrap',
  gap: theme.spacing(2)
}))

const CardsGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gap: theme.spacing(2),
  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))'
}))

// Right-aligned header controls (inline search + actions) that wrap under the
// title on narrow viewports.
const HeaderActions = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  flexWrap: 'wrap'
}))

// Width-constrained slot so the search field sits neatly beside the section
// title instead of spanning a full row below it.
const SearchSlot = styled(Box)({ width: 260, maxWidth: '100%' })

export { CardsGrid, HeaderActions, SearchSlot, SectionHeader }
