import { Box, Typography, dclColors, styled } from 'decentraland-ui2'

const GridPanel = styled(Box)(({ theme }) => ({
  backgroundColor: 'rgba(179, 47, 255, 0.15)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 24,
  padding: theme.spacing(3)
}))

const GridTitle = styled(Typography)(({ theme }) => ({
  color: dclColors.neutral.softWhite,
  fontSize: 16,
  fontWeight: 600,
  marginBottom: theme.spacing(2)
})) as typeof Typography

const CardGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gap: theme.spacing(2),
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))'
}))

export { CardGrid, GridPanel, GridTitle }
