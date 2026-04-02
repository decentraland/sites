import { Box, styled } from 'decentraland-ui2'

const DownloadButtonImage = styled('img')({
  width: '20px',
  height: '20px',
  filter: 'brightness(0) invert(1)'
})

const AlsoAvailableContainer = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginTop: '8px',
  justifyContent: 'center'
})

const AlsoAvailableText = styled('span')({
  fontSize: '14px',
  color: 'rgba(255, 255, 255, 0.7)'
})

const AlternativeIconButton = styled('button')(({ theme }) => ({
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '4px',
  display: 'flex',
  alignItems: 'center',
  outline: 'none',
  ['&:focus-visible']: {
    outline: `2px solid ${theme.palette.primary.main}`,
    outlineOffset: 2
  }
}))

const AlternativeButtonImage = styled('img')({
  width: '20px',
  height: '20px',
  filter: 'brightness(0) invert(1)'
})

export { AlsoAvailableContainer, AlsoAvailableText, AlternativeButtonImage, AlternativeIconButton, DownloadButtonImage }
