import { Box, Typography, dclColors, styled } from 'decentraland-ui2'

const NAV_BAR_HEIGHT = 50
const NAV_BAR_MARGIN_BOTTOM = 12
const NAV_BUTTON_SIZE = 20
const NavigationBar = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  height: NAV_BAR_HEIGHT,
  marginBottom: NAV_BAR_MARGIN_BOTTOM,
  position: 'relative',
  backgroundColor: dclColors.blackTransparent.backdrop,
  borderRadius: 12,
  padding: 0
})

const DateLabel = styled(Typography, { shouldForwardProp: prop => prop !== 'isToday' })<{ isToday?: boolean }>(({ isToday }) => ({
  flex: 1,
  textAlign: 'center',
  fontWeight: 600,
  fontSize: 16,
  lineHeight: '100%',
  letterSpacing: 0,
  color: isToday ? dclColors.neutral.softWhite : 'rgba(255, 255, 255, 0.7)'
}))

const NavButton = styled('button')<{ disabled?: boolean; side: 'left' | 'right' }>(({ disabled, side }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'none',
  border: 'none',
  padding: 0,
  cursor: disabled ? 'default' : 'pointer',
  color: disabled ? 'rgba(255, 255, 255, 0.3)' : dclColors.neutral.softWhite,
  height: NAV_BUTTON_SIZE,
  width: NAV_BUTTON_SIZE,
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  [side]: 8,
  zIndex: 1,
  ['&:focus-visible']: {
    outline: `2px solid ${dclColors.neutral.softWhite}`,
    outlineOffset: 2
  }
}))

export { DateLabel, NavButton, NavigationBar }
