import { Box, Paper, Typography, styled } from 'decentraland-ui2'

/* ── dropdown surface ───────────────────────────────────────────────── */

// Figma declares the panel as a `rgba(0, 0, 0, 0.2)` scrim, but it composites that against the
// board's own backdrop and the frame renders as a flat #36333b — sampled straight off the export.
// A dropdown floats over the form, so reproducing the scrim literally would let the fields behind it
// show through; the composited value is what matches the design. `FeaturedAssetRow`'s
// `rgba(255, 255, 255, 0.2)` hover lands on #5e5c62 over this, exactly as the export measures.
// No elevation shadow: the design has none.
const FeaturedAssetPaper = styled(Paper)({
  backgroundColor: '#36333b',
  backgroundImage: 'none',
  boxShadow: 'none',
  borderRadius: 12,
  padding: 12,
  /* eslint-disable @typescript-eslint/naming-convention */
  '& .MuiAutocomplete-noOptions, & .MuiAutocomplete-loading': {
    padding: 0,
    color: '#cfcdd4',
    fontFamily: "'Inter', sans-serif",
    fontSize: 14,
    fontWeight: 400
  },
  // MUI's own `.MuiAutocomplete-listbox` / `.MuiAutocomplete-option` rules are appended AFTER the
  // styled components below (the listbox is composed via `as`, and options get MUI's class from the
  // props spread), so single-class selectors on those components lose and the Figma values never
  // land — measured on the running page as 6px 16px rows, an `action.focus` highlight and a 40vh
  // listbox. Scoping the same values here, under the Paper, outranks them.
  '& .MuiAutocomplete-listbox': {
    padding: 0,
    maxHeight: 416
  },
  '& .MuiAutocomplete-listbox .MuiAutocomplete-option': {
    minHeight: 76,
    padding: 8,
    borderRadius: 12,
    gap: 12
  },
  // MUI adds `Mui-focused` on mousemove, so this covers hover and keyboard navigation alike.
  '& .MuiAutocomplete-listbox .MuiAutocomplete-option.Mui-focused, & .MuiAutocomplete-listbox .MuiAutocomplete-option[aria-selected="true"]':
    {
      backgroundColor: 'rgba(255, 255, 255, 0.2)'
    }
  /* eslint-enable @typescript-eslint/naming-convention */
})

const FeaturedAssetListbox = styled('ul')({
  margin: 0,
  padding: 0,
  listStyle: 'none',
  maxHeight: 416,
  overflowY: 'auto',
  overscrollBehavior: 'contain',
  scrollbarWidth: 'thin',
  scrollbarColor: 'rgba(236, 235, 237, 0.3) transparent',
  /* eslint-disable @typescript-eslint/naming-convention */
  '&::-webkit-scrollbar': {
    width: 4
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: 'rgba(236, 235, 237, 0.3)',
    borderRadius: 2
  }
  /* eslint-enable @typescript-eslint/naming-convention */
})

/* ── sections ───────────────────────────────────────────────────────── */

const FeaturedAssetGroup = styled('li')({
  listStyle: 'none',
  /* eslint-disable-next-line @typescript-eslint/naming-convention */
  '&:not(:first-of-type)': {
    paddingTop: 12
  }
})

const FeaturedAssetGroupLabel = styled(Typography)({
  fontFamily: "'Inter', sans-serif",
  fontSize: 12,
  fontWeight: 500,
  lineHeight: '12px',
  letterSpacing: '0.15px',
  textTransform: 'uppercase',
  color: '#ecebed'
})

const FeaturedAssetGroupItems = styled('ul')({
  margin: 0,
  padding: 0,
  listStyle: 'none'
})

/* ── rows ───────────────────────────────────────────────────────────── */

const FeaturedAssetRow = styled('li')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  height: 76,
  padding: 8,
  borderRadius: 12,
  cursor: 'pointer',
  backgroundColor: 'transparent',
  transition: theme.transitions.create('background-color', {
    duration: theme.transitions.duration.shortest
  }),
  /* eslint-disable @typescript-eslint/naming-convention */
  '&:hover, &.Mui-focused, &[aria-selected="true"]': {
    backgroundColor: 'rgba(255, 255, 255, 0.2)'
  },
  '&.Mui-focusVisible': {
    outline: `2px solid ${theme.palette.primary.main}`,
    outlineOffset: -2
  }
  /* eslint-enable @typescript-eslint/naming-convention */
}))

const FeaturedAssetTexts = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  flex: '1 0 0',
  minWidth: 0
})

const FeaturedAssetName = styled(Typography)({
  fontFamily: "'Inter', sans-serif",
  fontSize: 14,
  fontWeight: 500,
  lineHeight: 1.6,
  color: '#ffffff',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  width: '100%'
})

const FeaturedAssetCreator = styled(Typography)({
  fontFamily: "'Inter', sans-serif",
  fontSize: 12,
  fontWeight: 400,
  lineHeight: 1,
  color: '#cfcdd4',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  width: '100%'
})

/* ── selected value adornment ───────────────────────────────────────── */

const SelectedAssetAdornment = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  paddingRight: 8
})

export {
  FeaturedAssetCreator,
  FeaturedAssetGroup,
  FeaturedAssetGroupItems,
  FeaturedAssetGroupLabel,
  FeaturedAssetListbox,
  FeaturedAssetName,
  FeaturedAssetPaper,
  FeaturedAssetRow,
  FeaturedAssetTexts,
  SelectedAssetAdornment
}
