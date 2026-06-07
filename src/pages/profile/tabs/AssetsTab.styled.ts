import { Box, Chip, FormControl, MenuItem, Select, styled } from 'decentraland-ui2'

// Card row used for ENS name NFTs — they ship no thumbnail/rarity so they don't
// belong in the wearable CatalogCard grid. The shape mirrors a "list row" item:
// gradient logo tile, name + suffix, action buttons (Edit / Transfer).
const NameRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1.25),
  width: '100%'
}))

const NameCard = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  padding: theme.spacing(1.5, 2),
  borderRadius: 12,
  background: 'rgba(0, 0, 0, 0.25)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  transition: 'background 150ms ease, border-color 150ms ease',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&:hover': {
    background: 'rgba(0, 0, 0, 0.35)',
    borderColor: 'rgba(255, 255, 255, 0.18)'
  }
}))

const NameLogoTile = styled(Box)({
  flexShrink: 0,
  width: 48,
  height: 48,
  borderRadius: 10,
  // Brand gradient backdrop — the DCL "person + landscape" glyph sits on top.
  background: 'linear-gradient(135deg, #FF2D55 0%, #A524B3 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#FCFCFC',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& .MuiSvgIcon-root': { fontSize: 26 }
})

const NameLabel = styled(Box)({
  flex: '1 1 auto',
  minWidth: 0,
  fontFamily: '"Inter", sans-serif',
  fontSize: 16,
  fontWeight: 600,
  color: '#FCFCFC',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap'
})

const NameSuffix = styled('span')({
  color: '#8B8593',
  fontWeight: 500
})

const NameActions = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1),
  flexShrink: 0,
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column'
  }
}))

const AssetsHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: theme.spacing(2),
  flexWrap: 'wrap',
  marginBottom: theme.spacing(2)
}))

const AssetsFilters = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(1)
}))

// Filter chip styled to match Figma 322:54170 — outlined pill with icon slot.
// Selected state uses the brand primary (#FF2D55) instead of MUI's default
// white-on-primary, so the active filter matches the "MY ASSETS" tab underline
// and reads as the same brand accent.
const AssetFilterChip = styled(Chip)(({ theme }) => ({
  height: 32,
  borderRadius: 999,
  paddingLeft: theme.spacing(0.5),
  paddingRight: theme.spacing(0.5),
  fontFamily: '"Inter", sans-serif',
  fontWeight: 600,
  fontSize: 13,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: '#FCFCFC',
  borderColor: 'rgba(255, 255, 255, 0.25)',
  backgroundColor: 'rgba(255, 255, 255, 0.06)',
  transition: 'background-color 150ms ease, border-color 150ms ease, color 150ms ease',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& .MuiChip-icon': {
    color: '#FCFCFC',
    marginLeft: theme.spacing(0.75),
    marginRight: -theme.spacing(0.25),
    fontSize: 18
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& .MuiChip-label': {
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1.25)
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderColor: 'rgba(255, 255, 255, 0.35)'
  },
  // Selected: white background + dark text (Figma 322:54170 chip-active state).
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&.is-active': {
    backgroundColor: '#FCFCFC',
    borderColor: '#FCFCFC',
    color: '#161518',
    // eslint-disable-next-line @typescript-eslint/naming-convention
    '& .MuiChip-icon': { color: '#161518' },
    // eslint-disable-next-line @typescript-eslint/naming-convention
    '&:hover': {
      backgroundColor: 'rgba(252, 252, 252, 0.88)'
    }
  }
}))

// Rarity dropdown lives on the right of AssetsHeader (category chips on the
// left). Styled as a compact outlined pill so it reads as a sibling of the
// AssetFilterChip row rather than a heavyweight form control.
const RarityFilterControl = styled(FormControl)({
  minWidth: 168
})

const RarityFilterSelect = styled(Select)({
  height: 32,
  borderRadius: 999,
  fontFamily: '"Inter", sans-serif',
  fontWeight: 600,
  fontSize: 13,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: '#FCFCFC',
  backgroundColor: 'rgba(255, 255, 255, 0.06)',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& .MuiSelect-select': {
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 16,
    display: 'flex',
    alignItems: 'center'
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(255, 255, 255, 0.25)'
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(255, 255, 255, 0.35)'
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderWidth: 1,
    borderColor: '#FCFCFC'
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& .MuiSelect-icon': {
    color: '#FCFCFC'
  }
})

const RarityFilterItem = styled(MenuItem)({
  fontFamily: '"Inter", sans-serif',
  fontSize: 14,
  fontWeight: 600
})

export {
  AssetFilterChip,
  AssetsFilters,
  AssetsHeader,
  NameActions,
  NameCard,
  NameLabel,
  NameLogoTile,
  NameRow,
  NameSuffix,
  RarityFilterControl,
  RarityFilterItem,
  RarityFilterSelect
}
