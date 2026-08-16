import { clearProfileCache, fetchProfile, fetchProfiles } from './peer'

jest.mock('../../config/env', () => ({
  getEnv: (key: string) => (key === 'PEER_URL' ? 'https://peer.test' : undefined)
}))

const buildEntry = (address: string, name: string, hasClaimedName = true) => ({
  avatars: [
    {
      ethAddress: address,
      userId: address,
      name,
      hasClaimedName,
      avatar: { snapshots: { face256: `https://cdn.test/${name}.png` } }
    }
  ]
})

describe('cast2/peer', () => {
  let fetchSpy: jest.SpyInstance
  let consoleErrorSpy: jest.SpyInstance

  beforeEach(() => {
    clearProfileCache()
    fetchSpy = jest.spyOn(globalThis, 'fetch')
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    jest.resetAllMocks()
    jest.restoreAllMocks()
  })

  describe('when fetching several profiles at once', () => {
    beforeEach(() => {
      fetchSpy.mockResolvedValue(
        new Response(JSON.stringify([buildEntry('0xAAA', 'alice'), buildEntry('0xBBB', 'bob', false)]), { status: 200 })
      )
    })

    it('should issue a single batched request', async () => {
      await fetchProfiles(['0xAAA', '0xBBB'])

      expect(fetchSpy).toHaveBeenCalledTimes(1)
      expect(fetchSpy).toHaveBeenCalledWith('https://peer.test/lambdas/profiles', expect.objectContaining({ method: 'POST' }))
    })

    it('should map every returned entry, not just the first one', async () => {
      const profiles = await fetchProfiles(['0xAAA', '0xBBB'])

      expect(profiles).toEqual([
        { address: '0xaaa', name: 'alice', hasClaimedName: true, avatarFace256: 'https://cdn.test/alice.png' },
        { address: '0xbbb', name: 'bob', hasClaimedName: false, avatarFace256: 'https://cdn.test/bob.png' }
      ])
    })
  })

  describe('when an address has no profile', () => {
    beforeEach(() => {
      fetchSpy.mockResolvedValue(new Response(JSON.stringify([buildEntry('0xAAA', 'alice')]), { status: 200 }))
    })

    it('should resolve it to an empty profile rather than inventing a name', async () => {
      const profiles = await fetchProfiles(['0xAAA', '0xBBB'])

      expect(profiles).toEqual([
        { address: '0xaaa', name: 'alice', hasClaimedName: true, avatarFace256: 'https://cdn.test/alice.png' },
        { address: '0xbbb', hasClaimedName: false }
      ])
    })
  })

  describe('when a returned avatar claims an address that was not requested', () => {
    beforeEach(() => {
      fetchSpy.mockResolvedValue(new Response(JSON.stringify([buildEntry('0xVICTIM', 'impostor')]), { status: 200 }))
    })

    it('should drop it so one profile cannot claim another address row', async () => {
      const profiles = await fetchProfiles(['0xAAA'])

      expect(profiles).toEqual([{ address: '0xaaa', hasClaimedName: false }])
    })
  })

  describe('when the request already resolved an address', () => {
    beforeEach(async () => {
      fetchSpy.mockResolvedValue(new Response(JSON.stringify([buildEntry('0xAAA', 'alice')]), { status: 200 }))
      await fetchProfiles(['0xAAA'])
    })

    it('should serve it from the cache without hitting the network again', async () => {
      const profiles = await fetchProfiles(['0xAAA'])

      expect(fetchSpy).toHaveBeenCalledTimes(1)
      expect(profiles[0].name).toBe('alice')
    })

    it('should refetch once the cache is cleared for that address', async () => {
      clearProfileCache(['0xAAA'])
      await fetchProfiles(['0xAAA'])

      expect(fetchSpy).toHaveBeenCalledTimes(2)
    })
  })

  describe('when the lambdas endpoint answers with an error status', () => {
    beforeEach(() => {
      fetchSpy.mockResolvedValue(new Response('nope', { status: 503 }))
    })

    it('should fall back to empty profiles for every requested address', async () => {
      const profiles = await fetchProfiles(['0xAAA', '0xBBB'])

      expect(profiles).toEqual([
        { address: '0xaaa', hasClaimedName: false },
        { address: '0xbbb', hasClaimedName: false }
      ])
    })
  })

  describe('when the request throws', () => {
    beforeEach(() => {
      fetchSpy.mockRejectedValue(new Error('offline'))
    })

    it('should fall back to an empty profile', async () => {
      const profile = await fetchProfile('0xAAA')

      expect(profile).toEqual({ address: '0xaaa', hasClaimedName: false })
    })

    it('should log the failure', async () => {
      await fetchProfile('0xAAA')

      expect(consoleErrorSpy).toHaveBeenCalled()
    })
  })
})
