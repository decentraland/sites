// eslint-disable-next-line @typescript-eslint/naming-convention
import AccessTimeFilledIcon from '@mui/icons-material/AccessTimeFilled'
import { Box, styled } from 'decentraland-ui2'
import { labelColor } from './EventForm.styled'

const DURATION_MENU_MAX_HEIGHT = 288

const DurationPlaceholder = styled('span')({
  color: labelColor
})

const DurationIconBox = styled(Box)({
  position: 'absolute',
  right: 12,
  top: '50%',
  transform: 'translateY(-50%)',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center'
})

const DurationClockIcon = styled(AccessTimeFilledIcon)({
  color: labelColor,
  fontSize: 24,
  pointerEvents: 'none'
})

export { DurationClockIcon, DurationIconBox, DURATION_MENU_MAX_HEIGHT, DurationPlaceholder }
