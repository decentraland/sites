/* eslint-disable @typescript-eslint/naming-convention */
import { styled } from 'decentraland-ui2'

const PresentationControlsOverlay = styled('div')({
  position: 'absolute',
  bottom: 16,
  left: '50%',
  transform: 'translateX(-50%)',
  display: 'flex',
  alignItems: 'center',
  gap: 4
})

const NavButton = styled('button')({
  width: 36,
  height: 36,
  borderRadius: '50%',
  background: 'rgba(0, 0, 0, 0.6)',
  backdropFilter: 'blur(10px)',
  border: 'none',
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'background 0.2s ease',
  '&:hover': {
    background: 'rgba(0, 0, 0, 0.8)'
  },
  '&:disabled': {
    opacity: 0.3,
    cursor: 'default'
  },
  '& svg': {
    fontSize: 22
  }
})

const SlideInfo = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '6px 16px',
  background: 'rgba(0, 0, 0, 0.6)',
  backdropFilter: 'blur(10px)',
  borderRadius: 20,
  color: 'white',
  fontSize: 13,
  fontWeight: 500,
  userSelect: 'none'
})

const VideoButton = styled('button')({
  width: 36,
  height: 36,
  borderRadius: '50%',
  background: 'rgba(0, 0, 0, 0.6)',
  backdropFilter: 'blur(10px)',
  border: 'none',
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'background 0.2s ease',
  '&:hover': {
    background: 'rgba(0, 0, 0, 0.8)'
  },
  '&:disabled': {
    opacity: 0.6,
    cursor: 'wait'
  },
  '& svg': {
    fontSize: 20
  }
})

const Divider = styled('div')({
  width: 1,
  height: 24,
  background: 'rgba(255, 255, 255, 0.3)',
  margin: '0 4px'
})

const UploadingOverlay = styled('div')({
  position: 'absolute',
  bottom: 16,
  left: '50%',
  transform: 'translateX(-50%)',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 20px',
  background: 'rgba(0, 0, 0, 0.75)',
  backdropFilter: 'blur(10px)',
  borderRadius: 20,
  color: 'white',
  fontSize: 14
})

const OverlayMenuButton = styled(VideoButton)(({ theme }) => ({
  '&:focus-visible': {
    outline: `2px solid ${theme.palette.primary.main}`,
    outlineOffset: 2
  },
  '&:active': {
    transform: 'scale(0.95)'
  }
}))

const OverlayMenuDivider = styled('li')(({ theme }) => ({
  height: 1,
  margin: theme.spacing(0.5, 0),
  backgroundColor: theme.palette.divider,
  listStyle: 'none'
}))

export { Divider, NavButton, OverlayMenuButton, OverlayMenuDivider, PresentationControlsOverlay, SlideInfo, UploadingOverlay, VideoButton }
