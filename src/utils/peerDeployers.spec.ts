import { resolveDeployers } from './peerDeployers'

const PEER_URL = 'https://peer.test'

function mockSuccess(
  entityResponse: Array<{ id: string; pointers: string[] }>,
  deploymentResponse: Array<{ entityId: string; deployedBy: string }>
): jest.SpyInstance {
  const spy = jest.spyOn(global, 'fetch').mockImplementation((url: string | URL | Request) => {
    const urlStr = typeof url === 'string' ? url : url.toString()
    if (urlStr.includes('/content/entities/active')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(entityResponse)
      } as Response)
    }
    if (urlStr.includes('/content/deployments')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ deployments: deploymentResponse })
      } as Response)
    }
    return Promise.resolve({ ok: false, json: () => Promise.resolve(null) } as Response)
  })
  spy.mockClear()
  return spy
}

describe('resolveDeployers', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('when given an empty list of coordinates', () => {
    let result: Map<string, string>
    let fetchSpy: jest.SpyInstance

    beforeEach(async () => {
      fetchSpy = jest.spyOn(global, 'fetch').mockImplementation(jest.fn())
      result = await resolveDeployers(PEER_URL, [])
    })

    it('should not make any network calls', () => {
      expect(fetchSpy).not.toHaveBeenCalled()
    })

    it('should return an empty map', () => {
      expect(result.size).toBe(0)
    })
  })

  describe('when the entities/active call fails', () => {
    let result: Map<string, string>

    beforeEach(async () => {
      jest.spyOn(global, 'fetch').mockImplementation(() => Promise.reject(new Error('network error')))
      jest.spyOn(console, 'warn').mockImplementation(() => undefined)
      result = await resolveDeployers(PEER_URL, ['10,20'])
    })

    it('should return an empty map without throwing', () => {
      expect(result.size).toBe(0)
    })
  })

  describe('when the entities/active call returns no entities', () => {
    let result: Map<string, string>
    let fetchSpy: jest.SpyInstance

    beforeEach(async () => {
      fetchSpy = mockSuccess([], [])
      result = await resolveDeployers(PEER_URL, ['10,20'])
    })

    it('should not call deployments', () => {
      const deploymentCalls = fetchSpy.mock.calls.filter(call => String(call[0]).includes('/content/deployments'))
      expect(deploymentCalls.length).toBe(0)
    })

    it('should return an empty map', () => {
      expect(result.size).toBe(0)
    })
  })

  describe('when the batch returns deployers for matching pointers', () => {
    let result: Map<string, string>
    let fetchSpy: jest.SpyInstance

    beforeEach(async () => {
      fetchSpy = mockSuccess(
        [
          { id: 'ent-a', pointers: ['10,20'] },
          { id: 'ent-b', pointers: ['30,40', '31,40'] }
        ],
        [
          { entityId: 'ent-a', deployedBy: '0xAlice' },
          { entityId: 'ent-b', deployedBy: '0xBob' }
        ]
      )
      result = await resolveDeployers(PEER_URL, ['10,20', '30,40'])
    })

    it('should make a single entities/active call with all coordinates', () => {
      const entityCalls = fetchSpy.mock.calls.filter(call => String(call[0]).includes('/content/entities/active'))
      expect(entityCalls.length).toBe(1)
      const init = entityCalls[0][1] as RequestInit
      const body = JSON.parse(init.body as string) as { pointers: string[] }
      expect(body.pointers).toEqual(['10,20', '30,40'])
    })

    it('should make a single deployments call for both entity ids', () => {
      const deploymentCalls = fetchSpy.mock.calls.filter(call => String(call[0]).includes('/content/deployments'))
      expect(deploymentCalls.length).toBe(1)
      expect(String(deploymentCalls[0][0])).toContain('entityId=ent-a')
      expect(String(deploymentCalls[0][0])).toContain('entityId=ent-b')
    })

    it('should map matching pointers back to their deployer', () => {
      expect(result.get('10,20')).toBe('0xAlice')
      expect(result.get('30,40')).toBe('0xBob')
    })

    it('should not include pointers absent from the input', () => {
      expect(result.has('31,40')).toBe(false)
    })
  })

  describe('when a deployment entry lacks deployedBy', () => {
    let result: Map<string, string>

    beforeEach(async () => {
      mockSuccess([{ id: 'ent-a', pointers: ['10,20'] }], [{ entityId: 'ent-a', deployedBy: '' }])
      result = await resolveDeployers(PEER_URL, ['10,20'])
    })

    it('should skip the entry and leave the pointer unmapped', () => {
      expect(result.has('10,20')).toBe(false)
    })
  })

  describe('when the deployments call fails', () => {
    let result: Map<string, string>

    beforeEach(async () => {
      jest.spyOn(global, 'fetch').mockImplementation((url: string | URL | Request) => {
        const urlStr = typeof url === 'string' ? url : url.toString()
        if (urlStr.includes('/content/entities/active')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve([{ id: 'ent-a', pointers: ['10,20'] }]) } as Response)
        }
        return Promise.resolve({ ok: false, status: 500 } as Response)
      })
      jest.spyOn(console, 'warn').mockImplementation(() => undefined)
      result = await resolveDeployers(PEER_URL, ['10,20'])
    })

    it('should return an empty map', () => {
      expect(result.size).toBe(0)
    })
  })
})
