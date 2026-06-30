import { Box, Typography, styled } from 'decentraland-ui2'

const AccordionRoot = styled(Box)(() => ({
  borderRadius: 12,
  background: 'rgba(0, 0, 0, 0.2)',
  overflow: 'hidden',
  // Fill the column width (the parent flex column stretches us); height stays content-sized.
  width: '100%',
  // Hover: soft white glow around the edges — same `CARD_HOVER_SHADOW` the what's on cards use
  // (kept inline to avoid coupling account to the whats-on domain).
  transition: 'box-shadow 0.2s ease',
  ['&:hover']: {
    boxShadow: '0px 2px 12px 12px rgba(255, 255, 255, 0.3)'
  }
}))

const Header = styled('button')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: theme.spacing(1),
  width: '100%',
  padding: theme.spacing(2),
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: 16,
  fontWeight: 500,
  textAlign: 'left',
  color: '#FCFCFC',
  transition: 'background 0.2s ease',
  ['&:hover']: {
    background: 'rgba(255, 255, 255, 0.04)'
  },
  ['&:focus-visible']: {
    outline: '2px solid rgba(255, 255, 255, 0.6)',
    outlineOffset: -2
  }
}))

const HeaderLabel = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  minWidth: 0
}))

const GroupIcon = styled('span')(() => ({
  display: 'inline-flex',
  alignItems: 'center',
  flexShrink: 0,
  color: '#A09BA8'
}))

const ChevronIconWrap = styled(Box, { shouldForwardProp: prop => prop !== '$expanded' })<{ $expanded: boolean }>(({ $expanded }) => ({
  display: 'inline-flex',
  flexShrink: 0,
  color: '#A09BA8',
  transition: 'transform 0.2s ease',
  transform: $expanded ? 'rotate(180deg)' : 'rotate(0deg)'
}))

const Content = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  padding: theme.spacing(0, 2, 1)
}))

const TypeRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: theme.spacing(2),
  padding: theme.spacing(0.75, 0)
}))

const TypeLabel = styled(Typography)(() => ({
  fontSize: 14,
  color: '#CFCDD4'
}))

export { AccordionRoot, ChevronIconWrap, Content, GroupIcon, Header, HeaderLabel, TypeLabel, TypeRow }
