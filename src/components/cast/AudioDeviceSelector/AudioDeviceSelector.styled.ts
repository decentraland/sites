import { FormControl, MenuItem, Typography, styled } from 'decentraland-ui2'

const SelectorContainer = styled('div')({
  margin: '8px 0',
  minWidth: 200
})

const StyledFormControl = styled(FormControl)(({ theme }) => ({
  width: '100%',
  '& .MuiInputLabel-root': {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    fontWeight: 500
  },
  '& .MuiSelect-select': {
    color: '#333',
    background: 'rgba(255, 255, 255, 0.95)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: 6,
    fontSize: 12,
    padding: '8px 12px',
    fontWeight: 500
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(255, 255, 255, 0.3)'
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(255, 255, 255, 0.5)'
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: theme.palette.primary.main,
    borderWidth: 2
  }
}))

const StyledMenuItem = styled(MenuItem)(({ theme }) => ({
  color: '#333',
  fontSize: 12,
  fontWeight: 500,
  background: 'white',
  '&:hover': {
    background: '#f5f5f5'
  },
  '&.Mui-selected': {
    background: theme.palette.primary.main,
    color: 'white',
    '&:hover': {
      background: theme.palette.primary.dark
    }
  }
}))

const LoadingText = styled(Typography)(() => ({
  color: 'rgba(255, 255, 255, 0.7)',
  fontSize: 12
}))

const NoDevicesText = styled(Typography)(() => ({
  color: 'rgba(255, 255, 255, 0.5)',
  fontSize: 12
}))

export { LoadingText, NoDevicesText, SelectorContainer, StyledFormControl, StyledMenuItem }
