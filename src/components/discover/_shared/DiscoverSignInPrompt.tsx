import { useCallback } from 'react'
import { Button } from 'decentraland-ui2'
import type { ExploreSection } from '../../../features/discover/discover.types'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { redirectToAuth } from '../../../utils/authRedirect'
import { Empty } from './DiscoverShell.styled'
import { SignInPromptBox } from './DiscoverSignInPrompt.styled'

interface DiscoverSignInPromptProps {
  // Why this tab is empty, e.g. "Sign in to see the places you created."
  message: string
  // Tab to reopen once the user is back. The active tab is component state, so
  // it has to travel through the redirect as `?tab=` or signing in would land
  // them on Explore all, one click away from what they asked for.
  returnTab: ExploreSection
}

// Signed-out state for the tabs that need an identity. Bounces through the same
// SSO redirect the navbar and /events use.
function DiscoverSignInPrompt({ message, returnTab }: DiscoverSignInPromptProps) {
  const t = useFormatMessage()

  const handleSignIn = useCallback(() => {
    redirectToAuth('/places', { tab: returnTab })
  }, [returnTab])

  return (
    <SignInPromptBox>
      <Empty>{message}</Empty>
      <Button variant="contained" color="primary" onClick={handleSignIn}>
        {t('discover.explore.sign_in')}
      </Button>
    </SignInPromptBox>
  )
}

export { DiscoverSignInPrompt }
