import { Box, styled } from 'decentraland-ui2'

interface ActionsContainerProps {
  metadataVisible: boolean
}

/* eslint-disable @typescript-eslint/naming-convention */
const ActionsContainer = styled(Box, {
  shouldForwardProp: prop => prop !== 'metadataVisible'
})<ActionsContainerProps>(({ theme, metadataVisible }) => ({
  display: 'flex',
  alignItems: 'center',
  position: 'absolute',
  top: 13,
  right: 45,
  zIndex: 2,
  '& img': {
    width: 24,
    marginLeft: 10,
    marginRight: 10,
    cursor: 'pointer',
    transition: 'opacity 0.35s',
    '&:hover': { opacity: 0.8 }
  },
  '& .reels-action-info': {
    width: 24,
    height: 24,
    padding: 1,
    borderRadius: 6,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    backgroundColor: metadataVisible ? '#42404a' : 'transparent',
    '& img': { marginLeft: 0, marginRight: 0 }
  },
  [theme.breakpoints.down('lg')]: {
    top: 27,
    right: 24
  },
  [theme.breakpoints.down('md')]: {
    right: 26
  }
}))
/* eslint-enable @typescript-eslint/naming-convention */

const Spacer = styled(Box)({
  width: 1,
  height: 21,
  backgroundColor: '#716b7c',
  marginLeft: 10,
  marginRight: 10
})

interface CopyLinkBadgeProps {
  visible: boolean
}

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

export { ActionsContainer, CopyLinkBadge, CopyLinkWrapper, Spacer }
