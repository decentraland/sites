/* eslint-disable @typescript-eslint/naming-convention */
import { Link } from 'react-router-dom'
import { Box, Button, Typography, dclColors, styled } from 'decentraland-ui2'

interface ActionsProps {
  isMobile: boolean
}

const EventActions = styled(Box, {
  shouldForwardProp: prop => prop !== 'isMobile'
})<ActionsProps>(({ isMobile }) => ({
  display: 'flex',
  flexDirection: isMobile ? 'column' : 'row',
  gap: 12,
  width: '100%',
  marginTop: isMobile ? 0 : 16
}))

const CalendarButton = styled(Button)({
  color: '#FCFCFC',
  borderColor: '#FCFCFC',
  borderRadius: 8,
  textTransform: 'none',
  fontWeight: 600,
  fontSize: 14,
  padding: '8px 24px',
  '&:hover': {
    backgroundColor: '#4A0F5F',
    borderColor: '#FCFCFC',
    color: '#FCFCFC'
  }
})

const ShareIconButton = styled(Button)({
  backgroundColor: '#FCFCFC',
  color: '#161518',
  borderColor: '#E0E0E0',
  borderRadius: 8,
  minWidth: 'auto',
  width: 48,
  height: 40,
  padding: 0,
  '&:hover': {
    backgroundColor: '#F5F5F5',
    borderColor: '#FF2D55'
  }
})

const ExploreEventsButton = styled(Button)({
  color: '#161518'
})

// Shown instead of the action buttons when the hangout was soft-deleted.
const DeletedNotice = styled(Typography)({
  fontFamily: "'Inter', sans-serif",
  fontSize: 14,
  fontWeight: 400,
  lineHeight: 1.5,
  color: dclColors.neutral.softWhite
})

const DeletedNoticeLink = styled(Link)({
  color: '#FF2D55',
  textDecoration: 'none',
  '&:hover': {
    textDecoration: 'underline'
  },
  '&:focus-visible': {
    outline: '2px solid #FF2D55',
    outlineOffset: 2
  }
})

export { CalendarButton, DeletedNotice, DeletedNoticeLink, EventActions, ExploreEventsButton, ShareIconButton }
