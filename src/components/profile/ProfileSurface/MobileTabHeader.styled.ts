import { Box, IconButton, Typography, styled } from 'decentraland-ui2'

// Mobile sub-screen breadcrumb row (Figma 167:85490 "< Overview" + X): back chevron +
// section label on the left, optional close on the right.
const HeaderRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  width: '100%',
  // Breathing room below the fixed navbar so the back button isn't glued to it.
  paddingTop: theme.spacing(2),
  paddingBottom: theme.spacing(1)
}))

/* eslint-disable @typescript-eslint/naming-convention */
const BackButton = styled('button')(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  background: 'none',
  border: 'none',
  padding: theme.spacing(0.5, 1),
  marginLeft: -theme.spacing(1),
  borderRadius: 8,
  color: '#FCFCFC',
  cursor: 'pointer',
  '&:focus-visible': {
    outline: '2px solid rgba(252, 252, 252, 0.6)',
    outlineOffset: 2
  }
}))
/* eslint-enable @typescript-eslint/naming-convention */

const HeaderLabel = styled(Typography)({
  fontFamily: '"Inter", sans-serif',
  fontWeight: 600,
  fontSize: 16,
  lineHeight: 1.5,
  color: '#FCFCFC'
})

const Spacer = styled(Box)({
  flex: '1 1 auto'
})

const CloseButton = styled(IconButton)({
  color: '#FCFCFC'
})

export { BackButton, CloseButton, HeaderLabel, HeaderRow, Spacer }
