let mockEnv = 'dev'

jest.mock('@dcl/ui-env', () => ({
  Env: { PRODUCTION: 'prod' }
}))

jest.mock('../../../config/env', () => ({
  getEnv: (key: string) => (key === 'MARKETPLACE_URL' ? 'https://market.example.org' : ''),
  getCurrentEnv: () => mockEnv
}))

import { buildBuyManaUrl, formatMana, getExplorerTxUrl, getMarketplaceUrl } from './wallets.helpers'

describe('wallets.helpers', () => {
  describe('formatMana', () => {
    it('should format whole balances with thousands separators', () => {
      expect(formatMana(100595)).toBe('100,595')
    })

    it('should keep at most two decimals for sub-unit balances', () => {
      expect(formatMana(12.3456)).toBe('12.35')
    })

    it('should render zero as 0', () => {
      expect(formatMana(0)).toBe('0')
    })
  })

  describe('marketplace deep-links', () => {
    it('should resolve the marketplace base url', () => {
      expect(getMarketplaceUrl()).toBe('https://market.example.org')
    })

    it('should point buy at the marketplace', () => {
      expect(buildBuyManaUrl()).toBe('https://market.example.org')
    })
  })

  describe('getExplorerTxUrl', () => {
    it('should use testnet explorers off production', () => {
      mockEnv = 'dev'
      expect(getExplorerTxUrl('ethereum', '0xabc')).toBe('https://sepolia.etherscan.io/tx/0xabc')
      expect(getExplorerTxUrl('polygon', '0xabc')).toBe('https://amoy.polygonscan.com/tx/0xabc')
    })

    it('should use mainnet explorers on production', () => {
      mockEnv = 'prod'
      expect(getExplorerTxUrl('ethereum', '0xabc')).toBe('https://etherscan.io/tx/0xabc')
      expect(getExplorerTxUrl('polygon', '0xabc')).toBe('https://polygonscan.com/tx/0xabc')
    })
  })
})
