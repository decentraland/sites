import { getEnv } from '../../../config/env'

// NOTE: Joining / rejoining the Marketplace Credits Program is a Marketplace-side flow (the
// standalone account dapp redirected there too). sites has no in-page signup, so Join/Rejoin
// deep-links out to the Marketplace. ASSUMPTION: the credits signup lives at `/credits` on the
// Marketplace origin — pending product confirmation of the exact path.
const buildCreditsSignupUrl = (): string => {
  const marketplaceUrl = getEnv('MARKETPLACE_URL')
  if (!marketplaceUrl) throw new Error('MARKETPLACE_URL environment variable is not set')
  return `${marketplaceUrl.replace(/\/$/, '')}/credits`
}

const openCreditsSignup = (): void => {
  window.open(buildCreditsSignupUrl(), '_blank', 'noopener,noreferrer')
}

export { buildCreditsSignupUrl, openCreditsSignup }
