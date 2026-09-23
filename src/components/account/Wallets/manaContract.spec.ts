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
  polygon: { id: 137 },
  sepolia: { id: 11155111 },
  polygonAmoy: { id: 80002 }
}))

import { ERC20_TRANSFER_ABI, getManaAddress, getNetworkChainId } from './manaContract'

describe('manaContract', () => {
  describe('getManaAddress', () => {
    describe('when on production', () => {
      beforeEach(() => {
        mockEnv = 'prod'
      })

      it('should return the mainnet MANA address for ethereum', () => {
        expect(getManaAddress('ethereum')).toBe('0x0f5d2fb29fb7d3cfee444a200298f468908cc942')
      })

      it('should return the polygon MANA address for polygon', () => {
        expect(getManaAddress('polygon')).toBe('0xA1c57f48F0Deb89f569dFbE6E2B7f46D33606fD4')
      })
    })

    describe('when not on production', () => {
      beforeEach(() => {
        mockEnv = 'dev'
      })

      it('should return the testnet MANA addresses', () => {
        expect(getManaAddress('ethereum')).toBe('0xfa04d2e2ba9aec166c93dfeeba7427b2303befa9')
        expect(getManaAddress('polygon')).toBe('0x7ad72b9f944ea9793cf4055d88f81138cc2c63a0')
      })
    })
  })

  describe('getNetworkChainId', () => {
    it('should map to mainnet and polygon chain ids on production', () => {
      mockEnv = 'prod'
      expect(getNetworkChainId('ethereum')).toBe(1)
      expect(getNetworkChainId('polygon')).toBe(137)
    })

    it('should map to sepolia and amoy chain ids off production', () => {
      mockEnv = 'dev'
      expect(getNetworkChainId('ethereum')).toBe(11155111)
      expect(getNetworkChainId('polygon')).toBe(80002)
    })
  })

  describe('ERC20_TRANSFER_ABI', () => {
    it('should describe a single transfer function taking an address and a uint256', () => {
      expect(ERC20_TRANSFER_ABI).toHaveLength(1)
      const [transfer] = ERC20_TRANSFER_ABI
      expect(transfer.name).toBe('transfer')
      expect(transfer.inputs.map(input => input.type)).toEqual(['address', 'uint256'])
    })
  })
})
