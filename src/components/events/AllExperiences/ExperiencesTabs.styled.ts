import { Box, dclColors, styled } from 'decentraland-ui2'

type TabValue = 'all' | 'my'

const TabsRow = styled(Box)(({ theme }) => ({
  alignItems: 'center',
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(2),
  marginBottom: theme.spacing(3.5),
  [theme.breakpoints.down('sm')]: {
    justifyContent: 'center',
    marginBottom: theme.spacing(2)
  }
}))

type TabButtonProps = { isActive: boolean }

const TabButton = styled('button', { shouldForwardProp: prop => prop !== 'isActive' })<TabButtonProps>(({ theme, isActive }) => ({
  alignItems: 'center',
  backgroundColor: isActive ? dclColors.neutral.softWhite : 'rgba(255, 255, 255, 0.1)',
  border: 'none',
  borderRadius: 50,
  color: isActive ? dclColors.neutral.softBlack1 : dclColors.neutral.softWhite,
  cursor: 'pointer',
  display: 'inline-flex',
  fontFamily: theme.typography.fontFamily,
  fontSize: 15,
  fontWeight: 600,
  letterSpacing: '0.46px',
  lineHeight: '24px',
  padding: theme.spacing(1, 2),
  textTransform: 'uppercase',
  transition: 'background-color 150ms ease, color 150ms ease',
  ['&:hover']: {
    backgroundColor: isActive ? dclColors.neutral.softWhite : 'rgba(255, 255, 255, 0.2)'
  },
  ['&:focus-visible']: {
    outline: `2px solid ${dclColors.neutral.softWhite}`,
    outlineOffset: 2
  }
}))

export { TabButton, TabsRow }
export type { TabValue }
