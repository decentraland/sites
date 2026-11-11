const mockCreateWeb3CoreConfig = jest.fn((..._args: unknown[]) => ({ created: true }))
const mockThirdweb = jest.fn((..._args: unknown[]) => 'thirdweb-connector')
let mockEnv: string
let mockIsThirdwebAccount: boolean
let mockClientId: string | undefined

jest.mock('@dcl/core-web3', () => ({
  createWeb3CoreConfig: (...args: unknown[]) => mockCreateWeb3CoreConfig(...args),
  thirdweb: (...args: unknown[]) => mockThirdweb(...args)
}))

jest.mock('../hooks/useIsThirdwebAccount', () => ({
  isThirdwebAccount: () => mockIsThirdwebAccount
}))

jest.mock('@dcl/ui-env', () => ({
  Env: { PRODUCTION: 'prod' }
}))

jest.mock('../config/env', () => ({
  getCurrentEnv: () => mockEnv,
  getEnv: () => mockClientId
}))

describe('web3Config', () => {
  beforeEach(() => {
    jest.resetModules()
    mockCreateWeb3CoreConfig.mockClear()
    mockThirdweb.mockClear()
    mockIsThirdwebAccount = false
    mockClientId = 'client-example123'
  })

  it('should build the config with the prd environment on production', () => {
    mockEnv = 'prod'
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getWeb3Config } = require('./web3Config')

    getWeb3Config()

    expect(mockCreateWeb3CoreConfig).toHaveBeenCalledWith({
      environment: 'prd',
      appMetadata: { name: 'Decentraland', urlPath: '/account' },
      additionalConnectors: []
    })
    expect(mockThirdweb).not.toHaveBeenCalled()
  })

  it('should add the thirdweb connector with the Polygon chains for a thirdweb login', () => {
    mockEnv = 'prod'
    mockIsThirdwebAccount = true
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getWeb3Config } = require('./web3Config')

    getWeb3Config()

    expect(mockThirdweb).toHaveBeenCalledWith({ clientId: 'client-example123', supportedChainIds: [1, 137, 11155111, 80002] })
    expect(mockCreateWeb3CoreConfig).toHaveBeenCalledWith(expect.objectContaining({ additionalConnectors: ['thirdweb-connector'] }))
  })

  it('should still build the config when the thirdweb client id is missing', () => {
    mockEnv = 'prod'
    mockIsThirdwebAccount = true
    mockClientId = undefined
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getWeb3Config } = require('./web3Config')

    getWeb3Config()

    expect(mockThirdweb).toHaveBeenCalledWith(expect.objectContaining({ clientId: '' }))
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
