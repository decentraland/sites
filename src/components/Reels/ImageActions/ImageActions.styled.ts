// eslint-disable-next-line @typescript-eslint/naming-convention
import XIcon from '@mui/icons-material/X'
import { Box, styled } from 'decentraland-ui2'

interface InfoButtonProps {
  metadataVisible: boolean
}

interface CopyLinkBadgeProps {
  visible: boolean
}

const ActionsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  position: 'absolute',
  top: 13,
  right: 45,
  zIndex: 2,
  [theme.breakpoints.down('lg')]: {
    top: 27,
    right: 24
  },
  [theme.breakpoints.down('md')]: {
    right: 26
  }
}))

const ActionIcon = styled('img')({
  width: 24,
  marginLeft: 10,
  marginRight: 10,
  cursor: 'pointer',
  transition: 'opacity 0.35s',
  ['&:hover']: { opacity: 0.8 }
})

const ShareButton = styled('button')({
  appearance: 'none',
  border: 'none',
  background: 'transparent',
  padding: 0,
  marginLeft: 10,
  marginRight: 10,
  cursor: 'pointer',
  color: '#FCFCFC',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center'
})

const ShareIcon = styled(XIcon)({
  width: 22,
  height: 22,
  transition: 'opacity 0.35s',
  ['&:hover']: { opacity: 0.8 }
})

const Spacer = styled(Box)({
  width: 1,
  height: 21,
  backgroundColor: '#716b7c',
  marginLeft: 10,
  marginRight: 10
})

const CopyLinkWrapper = styled(Box)({ position: 'relative', display: 'inline-flex' })

const CopyLinkBadge = styled(Box, {
  shouldForwardProp: prop => prop !== 'visible'
})<CopyLinkBadgeProps>(({ visible }) => ({
  position: 'absolute',
  bottom: -30,
  left: 0,
  padding: '5px 10px',
  backgroundColor: '#716b7c',
  color: '#fff',
  borderRadius: 5,
  fontSize: 12,
  whiteSpace: 'nowrap',
  opacity: visible ? 1 : 0,
  transition: 'opacity 0.5s',
  pointerEvents: 'none'
}))

const InfoButton = styled(Box, {
  shouldForwardProp: prop => prop !== 'metadataVisible'
})<InfoButtonProps>(({ metadataVisible }) => ({
  width: 24,
  height: 24,
  padding: 1,
  borderRadius: 6,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  cursor: 'pointer',
  backgroundColor: metadataVisible ? '#42404a' : 'transparent'
}))

const InfoIcon = styled('img')({
  width: 24,
  cursor: 'pointer',
  transition: 'opacity 0.35s',
  ['&:hover']: { opacity: 0.8 }
})

export { ActionIcon, ActionsContainer, CopyLinkBadge, CopyLinkWrapper, InfoButton, InfoIcon, ShareButton, ShareIcon, Spacer }
