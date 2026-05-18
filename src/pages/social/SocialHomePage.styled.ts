import { Box, Chip, Select, Typography, dclColors, styled } from 'decentraland-ui2'

const SortSelect = styled(Select)({
  minWidth: 180,
  height: 40,
  color: dclColors.neutral.softWhite,
  backgroundColor: dclColors.whiteTransparent.subtle,
  borderRadius: 8,
  fontSize: 13,
  ['& .MuiSelect-icon']: { color: dclColors.neutral.softWhite },
  ['& .MuiOutlinedInput-notchedOutline']: { borderColor: dclColors.whiteTransparent.subtle }
})

const CategoryRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(1),
  marginBottom: theme.spacing(3)
}))

interface CategoryChipProps {
  $active?: boolean
}

const CategoryChip = styled(Chip, { shouldForwardProp: prop => prop !== '$active' })<CategoryChipProps>(({ theme, $active }) => ({
  textTransform: 'uppercase',
  fontWeight: 700,
  letterSpacing: '0.08em',
  fontSize: 11,
  height: 30,
  backgroundColor: $active ? theme.palette.primary.main : dclColors.whiteTransparent.subtle,
  color: $active ? dclColors.neutral.softWhite : dclColors.neutral.gray3,
  border: 'none',
  ['& .MuiChip-label']: { paddingInline: theme.spacing(1.5) },
  ['&:hover, &.MuiChip-clickable:hover']: {
    backgroundColor: $active ? theme.palette.primary.dark : dclColors.whiteTransparent.blurry,
    color: dclColors.neutral.softWhite
  }
}))

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontSize: 13,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: dclColors.neutral.gray3,
  margin: theme.spacing(2, 0, 1.5)
}))

export { CategoryChip, CategoryRow, SectionTitle, SortSelect }
