const mockCreateWeb3CoreConfig = jest.fn((..._args: unknown[]) => ({ created: true }))
let mockEnv: string

jest.mock('@dcl/core-web3', () => ({
  createWeb3CoreConfig: (...args: unknown[]) => mockCreateWeb3CoreConfig(...args)
}))

jest.mock('@dcl/ui-env', () => ({
  Env: { PRODUCTION: 'prod' }
}))

jest.mock('../config/env', () => ({
  getCurrentEnv: () => mockEnv
}))

describe('web3Config', () => {
  beforeEach(() => {
    jest.resetModules()
    mockCreateWeb3CoreConfig.mockClear()
  })

  it('should build the config with the prd environment on production', () => {
    mockEnv = 'prod'
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getWeb3Config } = require('./web3Config')

    getWeb3Config()

    expect(mockCreateWeb3CoreConfig).toHaveBeenCalledWith({
      environment: 'prd',
      appMetadata: { name: 'Decentraland', urlPath: '/account' }
    })
  })

  it('should build the config with the dev environment off production', () => {
    mockEnv = 'stg'
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getWeb3Config } = require('./web3Config')

    getWeb3Config()

    expect(mockCreateWeb3CoreConfig).toHaveBeenCalledWith(expect.objectContaining({ environment: 'dev' }))
  })

  it('should memoize the config across calls', () => {
    mockEnv = 'prod'
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getWeb3Config } = require('./web3Config')

    const first = getWeb3Config()
    const second = getWeb3Config()

    expect(first).toBe(second)
    expect(mockCreateWeb3CoreConfig).toHaveBeenCalledTimes(1)
  })
})
