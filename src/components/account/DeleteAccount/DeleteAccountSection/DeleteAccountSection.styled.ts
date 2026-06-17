import { Box, Button, Typography, styled } from 'decentraland-ui2'

// Figma 797:78245 — Delete Account section ("Danger Zone"). Colours mirror the DCL design
// tokens used across the Account area: destructive DCL Red (#FF2D55), warning amber (#FFA500),
// text #FCFCFC, muted #A09BA8. The warning card sits on the translucent panel (rgba(0,0,0,0.2)).
// Hardcoded hexes follow the sibling Account styled files.

const Container = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  maxWidth: 660
})

const DangerBanner = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: 16,
  borderRadius: 8,
  backgroundColor: 'rgba(255, 45, 85, 0.1)',
  border: '1px solid rgba(255, 45, 85, 0.3)'
})

const BannerTextWrapper = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: 2
})

const DangerBannerTitle = styled(Typography)({
  color: '#FF2D55',
  fontSize: 15,
  fontWeight: 700,
  lineHeight: '22px'
})

const DangerBannerDescription = styled(Typography)({
  color: '#A09BA8',
  fontSize: 13,
  lineHeight: '20px'
})

const WarningCard = styled(Box)({
  padding: 24,
  borderRadius: 8,
  backgroundColor: 'rgba(0, 0, 0, 0.2)'
})

const WarningDescription = styled(Typography)({
  color: '#FCFCFC',
  fontSize: 15,
  fontWeight: 600,
  marginBottom: 16,
  lineHeight: '24px'
})

const ConsequencesList = styled('ul')({
  listStyle: 'none',
  padding: 0,
  margin: 0
})

const ConsequenceItem = styled('li')({
  display: 'flex',
  gap: 10,
  marginBottom: 12,
  color: '#CFCDD4',
  fontSize: 14,
  lineHeight: '22px',
  alignItems: 'flex-start',
  ['&:last-child']: {
    marginBottom: 0
  }
})

const ConsequenceIcon = styled('span')({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  marginTop: 1,
  color: '#A09BA8',
  ['& .MuiSvgIcon-root']: {
    fontSize: 18
  }
})

const ConsequenceText = styled('span')({
  color: '#CFCDD4'
})

const ConsequenceTitle = styled('span')({
  color: '#FCFCFC',
  fontWeight: 600
})

const AssetWarningBox = styled(Box)({
  display: 'flex',
  gap: 12,
  padding: 16,
  borderRadius: 8,
  backgroundColor: 'rgba(255, 165, 0, 0.08)',
  border: '1px solid rgba(255, 165, 0, 0.3)',
  alignItems: 'flex-start'
})

const AssetWarningTextWrapper = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: 4
})

const AssetWarningTitle = styled(Typography)({
  color: '#FFA500',
  fontSize: 14,
  fontWeight: 700,
  lineHeight: '20px'
})

const AssetWarningDescription = styled(Typography)({
  color: '#A09BA8',
  fontSize: 13,
  lineHeight: '20px'
})

const ExportKeyDescription = styled(Typography)({
  color: '#A09BA8',
  fontSize: 13,
  lineHeight: '20px',
  marginTop: 4
})

const ExportKeyLink = styled(Button)({
  color: '#FFA500',
  fontSize: 13,
  fontWeight: 600,
  marginTop: 4,
  padding: 0,
  minWidth: 'auto',
  textTransform: 'none',
  justifyContent: 'flex-start',
  alignSelf: 'flex-start',
  ['&:hover']: {
    textDecoration: 'underline',
    backgroundColor: 'transparent'
  }
})

const DeleteButton = styled(Button)({
  marginTop: 8,
  // Figma 797:78245 — the destructive action sits at the bottom-right of the section.
  alignSelf: 'flex-end',
  backgroundColor: '#FF2D55',
  ['&:hover']: {
    backgroundColor: '#E0264B'
  },
  ['&.Mui-disabled']: {
    backgroundColor: 'rgba(255, 45, 85, 0.4)',
    color: 'rgba(252, 252, 252, 0.6)'
  }
})

export {
  AssetWarningBox,
  AssetWarningDescription,
  AssetWarningTextWrapper,
  AssetWarningTitle,
  BannerTextWrapper,
  ConsequenceIcon,
  ConsequenceItem,
  ConsequenceText,
  ConsequenceTitle,
  ConsequencesList,
  Container,
  DangerBanner,
  DangerBannerDescription,
  DangerBannerTitle,
  DeleteButton,
  ExportKeyDescription,
  ExportKeyLink,
  WarningCard,
  WarningDescription
}
