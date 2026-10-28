import { Box, styled } from 'decentraland-ui2'

const ExportMenuRoot = styled(Box)(() => ({
  display: 'inline-flex',
  alignItems: 'center',
  flexWrap: 'wrap'
}))

const ExportStatus = styled('span')(({ theme }) => ({
  ...theme.typography.caption,
  color: theme.palette.text.secondary,
  ['&:not(:empty)']: {
    marginInlineStart: theme.spacing(1)
  }
}))

export { ExportMenuRoot, ExportStatus }
