import { Box, Typography, dclColors, styled } from 'decentraland-ui2'

const WhatsOnContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  padding: theme.spacing(10, 8),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(6),
  position: 'relative',
  overflow: 'hidden',
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(6, 2)
  }
}))

const SectionTitle = styled(Typography)({
  color: dclColors.neutral.white,
  fontWeight: 700,
  textAlign: 'center',
  fontSize: 'clamp(1.75rem, 3vw, 2.5rem)'
})

const CardsGrid = styled(Box)(({ theme }) => ({
  justifyContent: 'center',
  gap: theme.spacing(2),
  width: 'calc(100% - 160px)',
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
  ['& > *']: {
    flex: '1 1 0',
    minWidth: 0
  },
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
    alignItems: 'center',
    width: `calc(100% - ${theme.spacing(4)})`,
    ['& > *']: {
      flex: '0 0 auto',
      width: '100%'
    }
  }
}))

export { CardsGrid, SectionTitle, WhatsOnContainer }
