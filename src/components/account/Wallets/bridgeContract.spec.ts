let mockEnv: string

jest.mock('@dcl/ui-env', () => ({
  Env: { PRODUCTION: 'prod' }
}))

jest.mock('../../../config/env', () => ({
  getCurrentEnv: () => mockEnv
}))

jest.mock('viem', () => ({
  getAddress: (address: string) => address
}))

jest.mock('viem/chains', () => ({
  mainnet: { id: 1 },
  sepolia: { id: 11155111 }
}))

import {
  ERC20_ALLOWANCE_ABI,
  ROOT_CHAIN_MANAGER_ABI,
  getErc20PredicateAddress,
  getL1ChainId,
  getRootChainManagerAddress
} from './bridgeContract'

describe('bridgeContract', () => {
  describe('when on production', () => {
    beforeEach(() => {
      mockEnv = 'prod'
    })

    it('should resolve the mainnet L1 chain id', () => {
      expect(getL1ChainId()).toBe(1)
    })

    it('should resolve the production bridge addresses', () => {
      expect(getRootChainManagerAddress()).toBe('0xA0c68C638235ee32657e8f720a23ceC1bFc77C77')
      expect(getErc20PredicateAddress()).toBe('0x40ec5B33f54e0E8A33A975908C5BA1c14e5BbbDf')
    })
  })

  describe('when not on production', () => {
    beforeEach(() => {
      mockEnv = 'dev'
    })

    it('should resolve the sepolia L1 chain id', () => {
      expect(getL1ChainId()).toBe(11155111)
    })

    it('should resolve the development bridge addresses', () => {
      expect(getRootChainManagerAddress()).toBe('0x34F5A25B627f50Bb3f5cAb72807c4D4F405a9232')
      expect(getErc20PredicateAddress()).toBe('0x4258c75b752c812b7fa586bdeb259f2d4bd17f4f')
    })
  })

  describe('ABIs', () => {
    it('should expose allowance + approve on the ERC20 ABI', () => {
      expect(ERC20_ALLOWANCE_ABI.map(entry => entry.name)).toEqual(['allowance', 'approve'])
    })

    it('should expose depositFor on the RootChainManager ABI', () => {
      const [depositFor] = ROOT_CHAIN_MANAGER_ABI
      expect(depositFor.name).toBe('depositFor')
      expect(depositFor.inputs.map(input => input.type)).toEqual(['address', 'address', 'bytes'])
    })
  })
})
