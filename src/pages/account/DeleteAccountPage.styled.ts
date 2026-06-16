import { Box, Typography, styled } from 'decentraland-ui2'

// Figma 797:78245 — Delete Account page header. Title #FCFCFC; mirrors the sibling Account
// section headers.

const PageRoot = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: 16
})

const PageTitle = styled(Typography)({
  color: '#FCFCFC',
  fontWeight: 600
})

export { PageRoot, PageTitle }
