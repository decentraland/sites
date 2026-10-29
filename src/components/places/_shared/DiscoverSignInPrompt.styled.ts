import { Box, styled } from 'decentraland-ui2'

// Signed-out state for the Favourites / My places tabs: the reason the tab is
// empty plus the way out of it, instead of a sentence the user can only read.
// No padding of its own — `Empty` already carries the section's.
const SignInPromptBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(2)
}))

export { SignInPromptBox }
