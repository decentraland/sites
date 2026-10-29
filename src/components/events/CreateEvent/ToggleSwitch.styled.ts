import { Box, styled } from 'decentraland-ui2'

const ToggleContainer = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 8
})

const ToggleTrack = styled('button', {
  shouldForwardProp: prop => prop !== '$checked'
})<{ $checked: boolean }>(({ $checked, theme }) => ({
  position: 'relative',
  width: 36,
  height: 20,
  borderRadius: 10,
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  background: $checked ? theme.palette.primary.main : 'rgba(255, 255, 255, 0.12)',
  transition: theme.transitions.create('background-color', {
    duration: theme.transitions.duration.standard
  }),
  /* eslint-disable @typescript-eslint/naming-convention */
  '&:focus-visible': {
    outline: `2px solid ${theme.palette.text.primary}`,
    outlineOffset: 2
  }
  /* eslint-enable @typescript-eslint/naming-convention */
}))

const ToggleThumb = styled('span', {
  shouldForwardProp: prop => prop !== '$checked'
})<{ $checked: boolean }>(({ $checked, theme }) => ({
  position: 'absolute',
  top: 3,
  left: $checked ? 19 : 3,
  width: 14,
  height: 14,
  borderRadius: '50%',
  background: theme.palette.common.white,
  transition: theme.transitions.create('left', {
    duration: theme.transitions.duration.standard
  })
}))

const ToggleLabel = styled('span')(({ theme }) => ({
  fontSize: 14,
  fontWeight: 400,
  color: theme.palette.text.primary
}))

export { ToggleContainer, ToggleLabel, ToggleThumb, ToggleTrack }
