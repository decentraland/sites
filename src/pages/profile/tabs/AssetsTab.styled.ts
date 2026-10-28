import { Box, styled } from 'decentraland-ui2'

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

export { AssetsFilters, AssetsHeader, NameActions, NameCard, NameLabel, NameLogoTile, NameRow, NameSuffix }
