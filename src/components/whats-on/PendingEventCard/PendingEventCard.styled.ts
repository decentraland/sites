import { Box, styled } from 'decentraland-ui2'

const CardFrame = styled(Box)({
  position: 'relative',
  width: '100%'
})

const ChipOverlay = styled(Box)(({ theme }) => ({
  alignItems: 'center',
  display: 'flex',
  gap: theme.spacing(1),
  left: theme.spacing(1.5),
  pointerEvents: 'none',
  position: 'absolute',
  right: theme.spacing(1.5),
  top: theme.spacing(1.5),
  zIndex: 2,
  justifyContent: 'space-between'
}))

const DateChip = styled(Box)(({ theme }) => ({
  alignItems: 'center',
  backgroundColor: 'rgba(0, 0, 0, 0.75)',
  borderRadius: theme.spacing(0.75),
  color: theme.palette.common.white,
  display: 'inline-flex',
  fontSize: theme.typography.caption.fontSize,
  fontWeight: 600,
  letterSpacing: '0.3px',
  padding: theme.spacing(0.5, 1)
}))

type StatusChipProps = { status: 'pending' | 'approved' | 'rejected' }

const STATUS_COLORS: Record<StatusChipProps['status'], { bg: string; dot: string; text: string }> = {
  pending: { bg: 'rgba(0, 0, 0, 0.75)', dot: '#FFBC5B', text: '#FFBC5B' },
  approved: { bg: 'rgba(0, 0, 0, 0.75)', dot: '#34CE77', text: '#34CE77' },
  rejected: { bg: 'rgba(0, 0, 0, 0.75)', dot: '#FB3B3B', text: '#FB3B3B' }
}

const StatusChip = styled(Box, { shouldForwardProp: prop => prop !== 'status' })<StatusChipProps>(({ theme, status }) => ({
  /* eslint-disable @typescript-eslint/naming-convention */
  alignItems: 'center',
  backgroundColor: STATUS_COLORS[status].bg,
  borderRadius: theme.spacing(0.75),
  color: STATUS_COLORS[status].text,
  display: 'inline-flex',
  fontSize: theme.typography.caption.fontSize,
  fontWeight: 700,
  gap: theme.spacing(0.75),
  letterSpacing: '0.4px',
  padding: theme.spacing(0.5, 1),
  textTransform: 'uppercase',
  '&::before': {
    backgroundColor: STATUS_COLORS[status].dot,
    borderRadius: '50%',
    content: '""',
    display: 'inline-block',
    height: 6,
    width: 6
  }
}))

export { CardFrame, ChipOverlay, DateChip, StatusChip }
export type { StatusChipProps }
