import { Box, dclColors, styled } from 'decentraland-ui2'

// Wraps the search TextField and aligns it to the sites/ canonical input (the
// /discover SearchField): a filled subtle surface with a transparent outline
// that warms to `blurry` on hover and the primary accent on focus.
const SearchFieldRoot = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  maxWidth: 400,
  width: '100%',
  ['& .MuiInputBase-root']: {
    backgroundColor: dclColors.whiteTransparent.subtle,
    color: dclColors.neutral.softWhite,
    borderRadius: 10,
    fontSize: 14
  },
  ['& .MuiOutlinedInput-notchedOutline']: {
    borderColor: 'transparent'
  },
  ['& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline']: {
    borderColor: dclColors.whiteTransparent.blurry
  },
  ['& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline']: {
    borderColor: theme.palette.primary.main,
    borderWidth: 1
  },
  ['& .MuiInputBase-input::placeholder']: {
    color: dclColors.neutral.gray3,
    opacity: 1
  },
  ['& .MuiSvgIcon-root']: {
    color: dclColors.neutral.gray3
  }
}))

export { SearchFieldRoot }
