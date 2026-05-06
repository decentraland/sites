/* eslint-disable @typescript-eslint/naming-convention */
import { Button, styled } from 'decentraland-ui2'

const StackRoot = styled('div')({
  position: 'fixed',
  top: 16,
  right: 16,
  zIndex: 10000,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  pointerEvents: 'none',
  maxWidth: 'calc(100vw - 32px)',
  width: 360
})

const Toast = styled('div')({
  pointerEvents: 'auto',
  background: '#2a2730',
  color: 'white',
  borderRadius: 8,
  padding: '12px 14px',
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
  borderLeft: '4px solid #ff5a5f'
})

const TopRow = styled('div')({
  display: 'flex',
  alignItems: 'flex-start',
  gap: 8
})

const TextBlock = styled('div')({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  minWidth: 0
})

const Title = styled('div')({
  fontSize: 14,
  fontWeight: 600,
  lineHeight: 1.3
})

const Message = styled('div')({
  fontSize: 13,
  color: '#cfcdd3',
  lineHeight: 1.4,
  wordBreak: 'break-word'
})

const CloseButton = styled('button')({
  background: 'none',
  border: 'none',
  color: '#999',
  cursor: 'pointer',
  padding: 0,
  marginLeft: 4,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  '&:hover': {
    color: 'white'
  },
  '& svg': {
    fontSize: 18
  }
})

const ActionButton = styled(Button)(({ theme }) => ({
  alignSelf: 'flex-start',
  background: theme.palette.primary.main,
  color: 'white',
  fontWeight: 600,
  fontSize: 12,
  textTransform: 'uppercase',
  padding: '4px 12px',
  minWidth: 'unset',
  borderRadius: 4,
  '&:hover': {
    background: theme.palette.primary.dark
  }
}))

export { StackRoot, Toast, TopRow, TextBlock, Title, Message, CloseButton, ActionButton }
