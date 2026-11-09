import { Env } from '@dcl/ui-env'
import { getCurrentEnv } from '../../config/env'

/**
 * NOTE: Creator Fund launch gate. decentraland.org shows no program details until the program
 * is announced: /creator-fund keeps its coming-soon view and /help hides its Creator Fund tab.
 * Every other environment (decentraland.zone, .today, Vercel previews, localhost) shows them so
 * they can be reviewed. At launch, delete this gate and its callers' fallbacks.
 */
const isCreatorFundContentEnabled = (): boolean => getCurrentEnv() !== Env.PRODUCTION

export { isCreatorFundContentEnabled }
