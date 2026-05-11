import { Box, Button, Typography, styled } from 'decentraland-ui2'

const FileUploadContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2)
}))

const HiddenFileInput = styled('input')({
  display: 'none'
})

const FileChipsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(2)
}))

const FileChip = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  backgroundColor: theme.palette.action.hover,
  borderRadius: theme.spacing(4),
  padding: theme.spacing(1, 3),
  ...theme.typography.caption,
  color: theme.palette.text.secondary
}))

const FileChipRemove = styled('button')(({ theme }) => ({
  appearance: 'none',
  background: 'transparent',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  color: theme.palette.text.secondary,
  font: 'inherit',
  ['&:hover']: {
    color: theme.palette.text.primary
  },
  ['&:focus-visible']: {
    outline: `2px solid ${theme.palette.primary.main}`,
    outlineOffset: 2
  }
}))

const AddFileButton = styled(Button)({
  alignSelf: 'flex-start'
})

const ErrorText = styled(Typography)(({ theme }) => ({
  ...theme.typography.caption,
  color: theme.palette.error.main
}))

export { AddFileButton, ErrorText, FileChip, FileChipRemove, FileChipsContainer, FileUploadContainer, HiddenFileInput }
