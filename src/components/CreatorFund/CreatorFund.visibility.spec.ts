import { getCurrentEnv } from '../../config/env'
import { isCreatorFundContentEnabled } from './CreatorFund.visibility'

jest.mock('@dcl/ui-env', () => ({
  Env: { DEVELOPMENT: 'dev', STAGING: 'stg', PRODUCTION: 'prod' }
}))

jest.mock('../../config/env', () => ({
  getCurrentEnv: jest.fn()
}))

describe('isCreatorFundContentEnabled', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should hide the Creator Fund content on decentraland.org', () => {
    ;(getCurrentEnv as jest.Mock).mockReturnValue('prod')

    expect(isCreatorFundContentEnabled()).toBe(false)
  })

  it.each(['dev', 'stg'])('should show it on the %s environment', env => {
    ;(getCurrentEnv as jest.Mock).mockReturnValue(env)

    expect(isCreatorFundContentEnabled()).toBe(true)
  })
})
