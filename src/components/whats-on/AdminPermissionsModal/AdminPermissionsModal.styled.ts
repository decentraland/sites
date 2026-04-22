import { Avatar, Box, Dialog, Typography, styled } from 'decentraland-ui2'

const StyledDialog = styled(Dialog)(({ theme }) => ({
  /* eslint-disable @typescript-eslint/naming-convention */
  '& .MuiDialog-paper': {
    backgroundColor: '#2E1041',
    borderRadius: theme.spacing(3),
    color: theme.palette.common.white,
    maxWidth: 621,
    width: '100%'
  },
  '& .MuiDialogTitle-root': {
    color: theme.palette.common.white,
    padding: theme.spacing(3)
  },
  '& .MuiDialogContent-root': {
    padding: theme.spacing(3),
    paddingTop: 0
  },
  '& .MuiTypography-root': {
    color: theme.palette.common.white
  },
  '& .MuiInputBase-input': {
    color: theme.palette.common.white
  },
  '& .MuiInputLabel-root': {
    color: 'rgba(255, 255, 255, 0.7)'
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(255, 255, 255, 0.23)'
  },
  '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(255, 255, 255, 0.5)'
  }
}))

const ModalHeader = styled(Box)(({ theme }) => ({
  alignItems: 'center',
  borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
  display: 'flex',
  gap: theme.spacing(2),
  padding: theme.spacing(3),
  paddingBottom: theme.spacing(3)
}))

const HeaderAvatar = styled(Avatar)(({ theme }) => ({
  height: theme.spacing(7),
  width: theme.spacing(7)
}))

const HeaderText = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  minWidth: 0
})

const HeaderName = styled(Typography)(({ theme }) => ({
  color: theme.palette.common.white,
  fontSize: theme.typography.h5.fontSize,
  fontWeight: 600
}))

const HeaderAddress = styled(Typography)(({ theme }) => ({
  color: 'rgba(255, 255, 255, 0.6)',
  fontSize: theme.typography.body2.fontSize,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap'
}))

const PermissionRow = styled(Box)(({ theme }) => ({
  alignItems: 'center',
  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  display: 'flex',
  gap: theme.spacing(2),
  justifyContent: 'space-between',
  padding: theme.spacing(2, 0),
  '&:last-of-type': {
    borderBottom: 'none'
  }
}))

const PermissionMeta = styled(Box)({
  flex: 1,
  minWidth: 0
})

const PermissionTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.common.white,
  fontSize: theme.typography.body1.fontSize,
  fontWeight: 600
}))

const PermissionDescription = styled(Typography)(({ theme }) => ({
  color: 'rgba(255, 255, 255, 0.6)',
  fontSize: theme.typography.body2.fontSize
}))

const Footer = styled(Box)(({ theme }) => ({
  /* eslint-disable @typescript-eslint/naming-convention */
  borderTop: '1px solid rgba(255, 255, 255, 0.12)',
  display: 'flex',
  gap: theme.spacing(2),
  padding: theme.spacing(3),
  '& > *': { flex: 1 }
}))

export {
  Footer,
  HeaderAddress,
  HeaderAvatar,
  HeaderName,
  HeaderText,
  ModalHeader,
  PermissionDescription,
  PermissionMeta,
  PermissionRow,
  PermissionTitle,
  StyledDialog
}
