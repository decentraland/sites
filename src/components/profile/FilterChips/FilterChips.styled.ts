import { Box, Chip, styled } from 'decentraland-ui2'

// Shared filter pills for profile tab content (Figma 322:54170 — same design across
// My Assets / My Places / Creations). Outlined pill with icon slot; the selected state
// is a `$active` prop (never a className) and renders white background + dark text.
const FiltersRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(1),
  marginBottom: theme.spacing(2)
}))

/* eslint-disable @typescript-eslint/naming-convention -- MUI slot classes + pseudo-selectors */
const FilterChip = styled(Chip, {
  shouldForwardProp: prop => prop !== '$active'
})<{ $active?: boolean }>(({ theme, $active }) => ({
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
  '& .MuiChip-icon': {
    color: '#FCFCFC',
    marginLeft: theme.spacing(0.75),
    marginRight: -theme.spacing(0.25),
    fontSize: 18
  },
  '& .MuiChip-label': {
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1.25)
  },
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderColor: 'rgba(255, 255, 255, 0.35)'
  },
  '&:focus-visible': {
    outline: '2px solid rgba(252, 252, 252, 0.6)',
    outlineOffset: 2
  },
  ...($active
    ? {
        backgroundColor: '#FCFCFC',
        borderColor: '#FCFCFC',
        color: '#161518',
        '& .MuiChip-icon': { color: '#161518' },
        '&:hover': {
          backgroundColor: 'rgba(252, 252, 252, 0.88)'
        }
      }
    : {})
}))
/* eslint-enable @typescript-eslint/naming-convention */

export { FilterChip, FiltersRow }
