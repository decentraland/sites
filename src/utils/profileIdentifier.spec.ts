import { getProfileName, isProfileAddress } from './profileIdentifier'

describe('when validating a profile identifier', () => {
  describe.each([
    ['brai', 'brai'],
    ['SirTesla', 'sirtesla'],
    ['Brai.DCL.ETH', 'brai'],
    ['0xnot-a-wallet', undefined],
    ['brai.eth', undefined],
    ['brai/overview', undefined],
    ['brai"', undefined],
    ['', undefined],
    [undefined, undefined]
  ])('and the identifier is %s', (value, expected) => {
    let result: string | undefined
    beforeEach(() => {
      result = getProfileName(value)
    })
    it('should normalize only supported Decentraland names', () => {
      expect(result).toBe(expected)
    })
  })

  describe.each([
    ['0xd9B96B5dC720fC52BedE1EC3B40A930e15F70Ddd', true],
    ['brai', false],
    ['0x1234', false],
    [null, false],
    [['0xd9b96b5dc720fc52bede1ec3b40a930e15f70ddd'], false],
    [undefined, false]
  ] as const)('and the wallet candidate is %s', (value, expected) => {
    it('should accept only complete Ethereum addresses', () => {
      expect(isProfileAddress(value)).toBe(expected)
    })
  })
})
