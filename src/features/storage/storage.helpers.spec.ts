jest.mock('decentraland-crypto-fetch', () => ({ __esModule: true, default: jest.fn() }))

const makeResponse = (body: string | null, init: { status?: number } = {}): Response => {
  const status = init.status ?? 200
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => body ?? '',
    json: async () => (body ? JSON.parse(body) : null)
  } as unknown as Response
}

const getEnvMock = jest.fn((key: string) => {
  if (key === 'LAND_REGISTRY_ADDRESS') return '0xLAND'
  if (key === 'ESTATE_REGISTRY_ADDRESS') return '0xESTATE'
  return undefined
})
jest.mock('../../config/env', () => ({ getEnv: (key: string) => getEnvMock(key) }))

import signedFetchLib from 'decentraland-crypto-fetch'
import {
  buildExportFile,
  buildSignedFetchMetadata,
  createScopedSignedFetch,
  deleteSelection,
  estateToLand,
  fetchSignedBlob,
  fromRentalFields,
  getEstateRegistryAddress,
  getLandPosition,
  getLandQuery,
  getLandRegistryAddress,
  getLandTypeFromContract,
  getRentalsQuery,
  getRoleLabelKey,
  getStorageErrorKey,
  getStorageErrorStatus,
  parcelToLand,
  sendSignedFetch,
  storageContextId,
  toStorageValueFile,
  transformLandQueryResult,
  transformRentalsQueryResult,
  truncateAddress,
  wrapSignedFetch
} from './storage.helpers'
import { LandType, RoleType } from './storage.types'
import type {
  ExportPlayerRow,
  ExportWorldRow,
  LandQueryResult,
  RentalsQueryResult,
  StorageValueFile,
  SubgraphEstate,
  SubgraphParcel
} from './storage.types'

const signedFetchMock = signedFetchLib as unknown as jest.Mock

describe('getStorageErrorKey', () => {
  it.each([
    [400, 'component.storage.errors.signed_fetch'],
    [401, 'component.storage.errors.unauthorized'],
    [403, 'component.storage.errors.unauthorized'],
    [404, 'component.storage.errors.not_found'],
    [413, 'component.storage.errors.payload_too_large'],
    [429, 'component.storage.errors.rate_limited'],
    [500, 'component.storage.errors.server'],
    [503, 'component.storage.errors.server']
  ])('maps numeric status %s to %s', (status, expected) => {
    expect(getStorageErrorKey({ status, data: 'whatever' })).toBe(expected)
  })

  it('maps the FETCH_ERROR sentinel to the network key', () => {
    expect(getStorageErrorKey({ status: 'FETCH_ERROR', error: 'offline' })).toBe('component.storage.errors.network')
  })

  it('falls back to the unknown key for unmapped numeric statuses', () => {
    expect(getStorageErrorKey({ status: 418 })).toBe('component.storage.errors.unknown')
  })

  it('falls back to the unknown key for null or non-object errors', () => {
    expect(getStorageErrorKey(null)).toBe('component.storage.errors.unknown')
    expect(getStorageErrorKey('boom')).toBe('component.storage.errors.unknown')
    expect(getStorageErrorKey(undefined)).toBe('component.storage.errors.unknown')
  })

  it('falls back to the unknown key when the status field is missing or non-numeric', () => {
    expect(getStorageErrorKey({})).toBe('component.storage.errors.unknown')
    expect(getStorageErrorKey({ status: 'WAT' as unknown as number })).toBe('component.storage.errors.unknown')
  })
})

describe('getStorageErrorStatus', () => {
  it('returns the numeric status when present', () => {
    expect(getStorageErrorStatus({ status: 401, data: 'nope' })).toBe(401)
  })

  it('returns the FETCH_ERROR sentinel for network failures', () => {
    expect(getStorageErrorStatus({ status: 'FETCH_ERROR', error: 'offline' })).toBe('FETCH_ERROR')
  })

  it('returns undefined for unrecognised shapes (passes through to analytics as "unknown")', () => {
    expect(getStorageErrorStatus(null)).toBeUndefined()
    expect(getStorageErrorStatus({})).toBeUndefined()
    expect(getStorageErrorStatus({ status: 'WAT' })).toBeUndefined()
  })
})

describe('storageContextId', () => {
  it('joins realm and position with a colon', () => {
    expect(storageContextId({ realm: 'foo.dcl.eth', position: '10,20' })).toBe('foo.dcl.eth:10,20')
  })

  it('drops falsy parts', () => {
    expect(storageContextId({ realm: 'foo.dcl.eth', position: null })).toBe('foo.dcl.eth')
    expect(storageContextId({ realm: null, position: '10,20' })).toBe('10,20')
  })

  it('returns empty string when both parts are missing', () => {
    expect(storageContextId({ realm: null, position: null })).toBe('')
  })
})

describe('buildSignedFetchMetadata', () => {
  it('includes realm + realmName + parcel when both are set', () => {
    expect(buildSignedFetchMetadata('vitsky.dcl.eth', '0,0')).toEqual({
      realm: { serverName: 'vitsky.dcl.eth' },
      realmName: 'vitsky.dcl.eth',
      parcel: '0,0'
    })
  })

  it('returns an empty object when neither is set', () => {
    expect(buildSignedFetchMetadata(null, null)).toEqual({})
  })

  it('omits parcel when position is empty', () => {
    expect(buildSignedFetchMetadata('vitsky.dcl.eth', null)).toEqual({
      realm: { serverName: 'vitsky.dcl.eth' },
      realmName: 'vitsky.dcl.eth'
    })
  })
})

describe('createScopedSignedFetch', () => {
  const validIdentity = {
    ephemeralIdentity: {},
    authChain: [],
    expiration: new Date(Date.now() + 60_000)
  } as unknown as Parameters<typeof createScopedSignedFetch>[0]

  beforeEach(() => signedFetchMock.mockReset())

  it.each([
    ['GET', undefined],
    ['PUT', 'PUT'],
    ['POST', 'POST'],
    ['PATCH', 'PATCH'],
    ['DELETE', 'DELETE']
  ])('throws 401 for %s when identity is missing (no unsigned request ever leaves the client)', async (_label, method) => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch')
    const sf = createScopedSignedFetch(undefined, 'vitsky.dcl.eth', '0,0')
    await expect(sf('https://example/api', method ? { method } : {})).rejects.toMatchObject({ status: 401 })
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(signedFetchMock).not.toHaveBeenCalled()
    fetchSpy.mockRestore()
  })

  it('treats an expired identity the same as a missing one (issue #505 — identity that survived the page load but expired before the click)', async () => {
    const expiredIdentity = {
      ephemeralIdentity: {},
      authChain: [],
      expiration: new Date(Date.now() - 60_000)
    } as unknown as Parameters<typeof createScopedSignedFetch>[0]
    const sf = createScopedSignedFetch(expiredIdentity, 'vitsky.dcl.eth', '0,0')
    await expect(sf('https://example/api', { method: 'PUT' })).rejects.toMatchObject({ status: 401 })
    expect(signedFetchMock).not.toHaveBeenCalled()
  })

  it('delegates to decentraland-crypto-fetch when identity is valid', async () => {
    signedFetchMock.mockResolvedValue(makeResponse('{}'))
    const sf = createScopedSignedFetch(validIdentity, 'vitsky.dcl.eth', '0,0')
    await sf('https://example/api', { method: 'PUT' })
    expect(signedFetchMock).toHaveBeenCalledWith(
      'https://example/api',
      expect.objectContaining({
        method: 'PUT',
        identity: validIdentity,
        metadata: expect.objectContaining({ realmName: 'vitsky.dcl.eth' })
      })
    )
  })

  it('wraps a TypeError thrown by signedFetchLib as 401 (malformed identity, not a network failure)', async () => {
    signedFetchMock.mockRejectedValue(new TypeError("Cannot read properties of undefined (reading 'privateKey')"))
    const sf = createScopedSignedFetch(validIdentity, 'vitsky.dcl.eth', '0,0')
    await expect(sf('https://example/api', { method: 'PUT' })).rejects.toMatchObject({ status: 401 })
  })

  it.each(['Failed to fetch', 'NetworkError when attempting to fetch resource', 'Load failed'])(
    'lets a network TypeError ("%s") through so it becomes a FETCH_ERROR, not a 401',
    async message => {
      signedFetchMock.mockRejectedValue(new TypeError(message))
      const sf = createScopedSignedFetch(validIdentity, 'vitsky.dcl.eth', '0,0')
      await expect(sf('https://example/api', { method: 'PUT' })).rejects.toThrow(message)
    }
  )

  it('wraps a generic signing Error as 401 too (never falls back to an unsigned request)', async () => {
    signedFetchMock.mockRejectedValue(new Error('signing broken'))
    const fetchSpy = jest.spyOn(globalThis, 'fetch')
    const sf = createScopedSignedFetch(validIdentity, 'vitsky.dcl.eth', '0,0')
    await expect(sf('https://example/api')).rejects.toMatchObject({ status: 401 })
    expect(fetchSpy).not.toHaveBeenCalled()
    fetchSpy.mockRestore()
  })

  it('re-throws structured errors with a status field untouched', async () => {
    signedFetchMock.mockRejectedValue({ status: 403, data: 'forbidden' })
    const sf = createScopedSignedFetch(validIdentity, 'vitsky.dcl.eth', '0,0')
    await expect(sf('https://example/api', { method: 'PUT' })).rejects.toMatchObject({ status: 403, data: 'forbidden' })
  })

  it.each(['vitsky.dcl.eth', 'common-ground.dcl.eth', 'foo_bar.eth'])(
    'refuses World realm "%s" with no parcel instead of letting the server default to 0,0',
    async realm => {
      const fetchSpy = jest.spyOn(globalThis, 'fetch')
      const sf = createScopedSignedFetch(validIdentity, realm, null)
      await expect(sf('https://example/api', { method: 'PUT' })).rejects.toMatchObject({ status: 422 })
      expect(signedFetchMock).not.toHaveBeenCalled()
      expect(fetchSpy).not.toHaveBeenCalled()
      fetchSpy.mockRestore()
    }
  )

  it('does not apply the World-parcel guard when there is no realm (e.g. contributable-domains lookup)', async () => {
    signedFetchMock.mockResolvedValue(makeResponse('{}'))
    const sf = createScopedSignedFetch(validIdentity)
    await sf('https://example/api')
    expect(signedFetchMock).toHaveBeenCalled()
  })
})

describe('wrapSignedFetch', () => {
  it('returns the parsed JSON when the response is ok', async () => {
    const sf = jest.fn().mockResolvedValue(makeResponse(JSON.stringify({ ok: true })))
    await expect(wrapSignedFetch<{ ok: boolean }>(sf, 'https://example/api')).resolves.toEqual({ ok: true })
  })

  it('throws a status/data shape when the response is not ok', async () => {
    const sf = jest.fn().mockResolvedValue(makeResponse('boom', { status: 401 }))
    await expect(wrapSignedFetch(sf, 'https://example/api')).rejects.toMatchObject({ status: 401, data: 'boom' })
  })

  it('wraps unexpected exceptions as FETCH_ERROR', async () => {
    const sf = jest.fn().mockRejectedValue(new Error('network down'))
    await expect(wrapSignedFetch(sf, 'https://example/api')).rejects.toMatchObject({ status: 'FETCH_ERROR', error: 'network down' })
  })
})

describe('sendSignedFetch', () => {
  it('resolves silently on a 2xx response', async () => {
    const sf = jest.fn().mockResolvedValue(makeResponse(null, { status: 204 }))
    await expect(sendSignedFetch(sf, 'https://example/api', { method: 'DELETE' })).resolves.toBeUndefined()
  })

  it('cancels the response body on success so the stream is not left open', async () => {
    const cancel = jest.fn().mockResolvedValue(undefined)
    const sf = jest.fn().mockResolvedValue({ ok: true, status: 200, body: { cancel } } as unknown as Response)
    await sendSignedFetch(sf, 'https://example/api', { method: 'DELETE' })
    expect(cancel).toHaveBeenCalledTimes(1)
  })

  it('throws a status/data shape on a non-2xx response', async () => {
    const sf = jest.fn().mockResolvedValue(makeResponse('Unauthorized', { status: 401 }))
    await expect(sendSignedFetch(sf, 'https://example/api', { method: 'PUT' })).rejects.toMatchObject({ status: 401, data: 'Unauthorized' })
  })

  it('wraps unexpected exceptions as FETCH_ERROR', async () => {
    const sf = jest.fn().mockRejectedValue('offline')
    await expect(sendSignedFetch(sf, 'https://example/api', { method: 'PUT' })).rejects.toMatchObject({
      status: 'FETCH_ERROR',
      error: 'offline'
    })
  })
})

describe('registry address helpers', () => {
  it('returns lower-cased addresses from env', () => {
    expect(getLandRegistryAddress()).toBe('0xland')
    expect(getEstateRegistryAddress()).toBe('0xestate')
  })

  it('throws when the env var is missing', () => {
    getEnvMock.mockReturnValueOnce(undefined)
    expect(() => getLandRegistryAddress()).toThrow(/LAND_REGISTRY_ADDRESS/)
    getEnvMock.mockReturnValueOnce(undefined)
    expect(() => getEstateRegistryAddress()).toThrow(/ESTATE_REGISTRY_ADDRESS/)
  })
})

describe('getLandTypeFromContract', () => {
  it('returns PARCEL for the land registry', () => {
    expect(getLandTypeFromContract('0xLAND')).toBe(LandType.PARCEL)
  })

  it('returns ESTATE for the estate registry', () => {
    expect(getLandTypeFromContract('0xESTATE')).toBe(LandType.ESTATE)
  })

  it('throws for unknown contracts', () => {
    expect(() => getLandTypeFromContract('0xother')).toThrow(/Could not derive land type/)
  })
})

describe('parcelToLand', () => {
  const parcel: SubgraphParcel = {
    x: '10',
    y: '-5',
    tokenId: '42',
    owner: { address: '0xowner' },
    updateOperator: null,
    data: null
  }

  it('builds a parcel land with the default name when data is missing', () => {
    expect(parcelToLand(parcel, RoleType.OWNER)).toMatchObject({
      id: 'parcel-10--5',
      type: LandType.PARCEL,
      role: RoleType.OWNER,
      x: 10,
      y: -5,
      name: 'Parcel (10, -5)',
      description: null,
      operators: []
    })
  })

  it('uses the parcel name + description and operator list when present', () => {
    const named = { ...parcel, data: { name: 'Home', description: 'Cosy' }, updateOperator: '0xop' }
    expect(parcelToLand(named, RoleType.OPERATOR)).toMatchObject({
      name: 'Home',
      description: 'Cosy',
      operators: ['0xop']
    })
  })
})

describe('estateToLand', () => {
  const estate: SubgraphEstate = {
    id: '7',
    tokenId: '700',
    owner: { address: '0xowner' },
    updateOperator: null,
    size: 4,
    parcels: [{ x: '1', y: '2', id: 'p-1-2' }],
    data: null
  }

  it('builds an estate land with the default name when data is missing', () => {
    expect(estateToLand(estate, RoleType.TENANT)).toMatchObject({
      id: 'estate-7',
      type: LandType.ESTATE,
      role: RoleType.TENANT,
      name: 'Estate #7',
      description: null,
      parcels: [{ x: 1, y: 2, id: 'p-1-2' }]
    })
  })

  it('uses the estate name when data is present', () => {
    const named = { ...estate, data: { name: 'Palace', description: null }, updateOperator: '0xop' }
    expect(estateToLand(named, RoleType.LESSOR)).toMatchObject({
      name: 'Palace',
      operators: ['0xop']
    })
  })
})

describe('transformLandQueryResult', () => {
  it('merges parcels and estates across roles without duplicates', () => {
    const data: LandQueryResult = {
      ownerParcels: [
        {
          x: '0',
          y: '0',
          tokenId: '1',
          owner: { address: '0xme' },
          updateOperator: null,
          data: { name: 'Home', description: null }
        }
      ],
      ownerEstates: [],
      updateOperatorParcels: [
        {
          x: '0',
          y: '0',
          tokenId: '1',
          owner: { address: '0xme' },
          updateOperator: '0xme',
          data: null
        }
      ],
      updateOperatorEstates: [],
      tenantParcels: [
        {
          x: '5',
          y: '5',
          tokenId: '2',
          owner: { address: '0xother' },
          updateOperator: null,
          data: null
        }
      ],
      tenantEstates: [],
      lessorParcels: [],
      lessorEstates: [
        {
          id: '99',
          tokenId: '999',
          owner: { address: '0xme' },
          updateOperator: null,
          size: 2,
          parcels: [{ x: '5', y: '5', id: 'e-5-5' }],
          data: null
        }
      ],
      ownerAuthorizations: [],
      operatorAuthorizations: []
    }
    const result = transformLandQueryResult(data)
    const owner = result.find(l => l.id === 'parcel-0-0')
    const tenant = result.find(l => l.id === 'parcel-5-5')
    const lessor = result.find(l => l.id === 'estate-99')
    expect(owner?.role).toBe(RoleType.OWNER)
    expect(tenant?.role).toBe(RoleType.TENANT)
    expect(lessor?.role).toBe(RoleType.LESSOR)
    expect(result).toHaveLength(3)
  })
})

describe('rental conversion', () => {
  const baseRental = {
    id: 'r-1',
    contractAddress: '0xLAND',
    tokenId: '1',
    lessor: '0xowner',
    tenant: '0xtenant',
    operator: '0xop',
    startedAt: '1700000000',
    endsAt: '1800000000'
  }

  it('fromRentalFields turns string timestamps into Date instances and derives the type', () => {
    const rental = fromRentalFields(baseRental)
    expect(rental.type).toBe(LandType.PARCEL)
    expect(rental.startedAt).toBeInstanceOf(Date)
    expect(rental.endsAt).toBeInstanceOf(Date)
  })

  it('transformRentalsQueryResult maps both buckets', () => {
    const input: RentalsQueryResult = {
      tenantRentals: [baseRental],
      lessorRentals: [{ ...baseRental, contractAddress: '0xESTATE', id: 'r-2' }]
    }
    const out = transformRentalsQueryResult(input)
    expect(out.tenantRentals[0].type).toBe(LandType.PARCEL)
    expect(out.lessorRentals[0].type).toBe(LandType.ESTATE)
  })
})

describe('getLandPosition', () => {
  it('returns x,y for parcel lands', () => {
    expect(
      getLandPosition({
        id: 'p',
        tokenId: '1',
        type: LandType.PARCEL,
        role: RoleType.OWNER,
        x: 10,
        y: -3,
        name: 'p',
        description: null,
        owner: '0xme',
        operators: []
      })
    ).toBe('10,-3')
  })

  it('returns the first parcel position for estate lands', () => {
    expect(
      getLandPosition({
        id: 'e',
        tokenId: '1',
        type: LandType.ESTATE,
        role: RoleType.OWNER,
        parcels: [{ x: 4, y: 4, id: 'a' }],
        name: 'e',
        description: null,
        owner: '0xme',
        operators: []
      })
    ).toBe('4,4')
  })

  it('returns null when coordinates are missing', () => {
    expect(
      getLandPosition({
        id: 'e',
        tokenId: '1',
        type: LandType.ESTATE,
        role: RoleType.OWNER,
        parcels: [],
        name: 'e',
        description: null,
        owner: '0xme',
        operators: []
      })
    ).toBeNull()
    expect(
      getLandPosition({
        id: 'p',
        tokenId: '1',
        type: LandType.PARCEL,
        role: RoleType.OWNER,
        name: 'p',
        description: null,
        owner: '0xme',
        operators: []
      })
    ).toBeNull()
  })
})

describe('getRoleLabelKey', () => {
  it.each([
    [RoleType.OWNER, 'owner'],
    [RoleType.OPERATOR, 'operator'],
    [RoleType.TENANT, 'tenant'],
    [RoleType.LESSOR, 'lessor']
  ])('maps role %s to %s', (role, label) => {
    expect(getRoleLabelKey(role)).toBe(label)
  })

  it('returns "unknown" for an unrecognised role', () => {
    expect(getRoleLabelKey(99 as RoleType)).toBe('unknown')
  })
})

describe('truncateAddress', () => {
  it('shortens long addresses', () => {
    expect(truncateAddress('0x88a6f83fb620b8937ff4ac484f821ab704ed8895')).toBe('0x88a6...8895')
  })

  it('returns short addresses unchanged', () => {
    expect(truncateAddress('0x88a6')).toBe('0x88a6')
  })
})

describe('graphql query builders', () => {
  it('getLandQuery returns a non-empty query string with the requested skip', () => {
    const q = getLandQuery(50)
    expect(q).toContain('skip: 50')
    expect(q).toContain('fragment parcelFields')
  })

  it('getRentalsQuery returns a non-empty query string', () => {
    expect(getRentalsQuery()).toContain('query Rentals')
  })
})

describe('toStorageValueFile', () => {
  describe('when the value is a string', () => {
    it('should keep the key as the filename and the string as the content', () => {
      expect(toStorageValueFile('feedback-1.csv', 'id,rating\n1,5')).toEqual({
        filename: 'feedback-1.csv',
        type: 'text/csv',
        content: 'id,rating\n1,5'
      })
    })

    it('should lowercase the extension and type it by that', () => {
      expect(toStorageValueFile('State.JSON', '{}')).toMatchObject({ filename: 'State.json', type: 'application/json' })
    })

    it('should type a key with an unknown or no extension as plain text', () => {
      expect(toStorageValueFile('notes.md', 'x').type).toBe('text/plain')
      expect(toStorageValueFile('greeting', 'hi').type).toBe('text/plain')
    })

    it('should append .txt to a key whose extension is not in the download allowlist', () => {
      expect(toStorageValueFile('report.html', '<b>x</b>')).toMatchObject({ filename: 'report.html.txt', type: 'text/plain' })
    })

    it('should keep an extensionless key filename unchanged', () => {
      expect(toStorageValueFile('greeting', 'hi').filename).toBe('greeting')
    })
  })

  describe('when the value is not a string', () => {
    it('should save it as pretty JSON with a .json filename', () => {
      expect(toStorageValueFile('gameState', { level: 2 })).toEqual({
        filename: 'gameState.json',
        type: 'application/json',
        content: '{\n  "level": 2\n}'
      })
    })

    it('should not add a second .json extension', () => {
      expect(toStorageValueFile('scores.json', [1, 2]).filename).toBe('scores.json')
      expect(toStorageValueFile('scores.JSON', [1, 2]).filename).toBe('scores.json')
    })
  })
})

describe('when building an export file', () => {
  let world: ExportWorldRow[]
  let players: ExportPlayerRow[]
  let file: StorageValueFile

  beforeEach(() => {
    world = []
    players = []
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('and the format is json', () => {
    describe('and there are no rows', () => {
      beforeEach(() => {
        file = buildExportFile('json', world, players)
      })

      it('should name and type the file as a json export', () => {
        expect(file).toMatchObject({ filename: 'storage-export.json', type: 'application/json' })
      })

      it('should hold empty world and players lists', () => {
        expect(JSON.parse(file.content)).toEqual({ world: [], players: [] })
      })
    })

    describe('and there are world and player rows', () => {
      beforeEach(() => {
        world = [{ key: 'a', value: { n: 1 } }]
        players = [{ address: '0xa', key: 'k', value: 's' }]
        file = buildExportFile('json', world, players)
      })

      it('should hold both lists with their values', () => {
        expect(JSON.parse(file.content)).toEqual({
          world: [{ key: 'a', value: { n: 1 } }],
          players: [{ address: '0xa', key: 'k', value: 's' }]
        })
      })
    })
  })

  describe('and the format is csv', () => {
    describe('and there are no rows', () => {
      beforeEach(() => {
        file = buildExportFile('csv', world, players)
      })

      it('should hold only the header line', () => {
        expect(file).toEqual({ filename: 'storage-export.csv', type: 'text/csv', content: 'scope,player_address,key,value\r\n' })
      })
    })

    describe('and there is a world row', () => {
      beforeEach(() => {
        world = [{ key: 'a', value: { a: 1 } }]
        file = buildExportFile('csv', world, players)
      })

      it('should write a world line with an empty address and the quoted JSON value', () => {
        expect(file.content).toContain('world,,a,"{""a"":1}"\r\n')
      })
    })

    describe('and there is a player row', () => {
      beforeEach(() => {
        players = [{ address: '0xa', key: 'k', value: 's' }]
        file = buildExportFile('csv', world, players)
      })

      it('should write a player line with the address and the quoted JSON string', () => {
        expect(file.content).toContain('player,0xa,k,"""s"""\r\n')
      })
    })

    describe('and a key starts with a formula character', () => {
      beforeEach(() => {
        world = [{ key: '=SUM(A1)', value: 1 }]
        file = buildExportFile('csv', world, players)
      })

      it('should prefix the key cell with a quote', () => {
        expect(file.content).toContain("world,,'=SUM(A1),1\r\n")
      })
    })

    describe('and a key contains a comma', () => {
      beforeEach(() => {
        world = [{ key: 'a,b', value: 1 }]
        file = buildExportFile('csv', world, players)
      })

      it('should quote the key cell', () => {
        expect(file.content).toContain('world,,"a,b",1\r\n')
      })
    })

    describe('and a value starts with a formula character', () => {
      beforeEach(() => {
        world = [{ key: 'k', value: -5 }]
        file = buildExportFile('csv', world, players)
      })

      it('should leave the value cell unprefixed', () => {
        expect(file.content).toContain('world,,k,-5\r\n')
      })
    })

    describe('and a key starts with a fullwidth or newline formula character', () => {
      it.each(['＝SUM(A1)', '＋1', '－1', '＠x', '\nx'])('should prefix "%s" with a quote', key => {
        file = buildExportFile('csv', [{ key, value: 1 }], [])

        expect(file.content).toContain(`'${key}`)
      })
    })

    describe('and a player address starts with a formula character', () => {
      beforeEach(() => {
        players = [{ address: '=cmd', key: 'k', value: 1 }]
        file = buildExportFile('csv', world, players)
      })

      it('should neutralize the address cell', () => {
        expect(file.content).toContain("player,'=cmd,k,1\r\n")
      })
    })

    describe('and a value is missing', () => {
      beforeEach(() => {
        world = [{ key: 'k', value: undefined }]
        file = buildExportFile('csv', world, players)
      })

      it('should write an empty value cell instead of the literal undefined', () => {
        expect(file.content).toContain('world,,k,\r\n')
      })
    })
  })
})

describe('when fetching a signed blob', () => {
  let signedFetch: jest.Mock

  beforeEach(() => {
    signedFetch = jest.fn()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('and the response is ok', () => {
    let blob: Blob

    beforeEach(() => {
      blob = new Blob(['gz'])
      signedFetch.mockResolvedValueOnce({ ok: true, status: 200, blob: async () => blob } as unknown as Response)
    })

    it('should resolve to the response blob', async () => {
      await expect(fetchSignedBlob(signedFetch, 'https://example/api')).resolves.toBe(blob)
    })
  })

  describe('and the response is not ok', () => {
    beforeEach(() => {
      signedFetch.mockResolvedValueOnce(makeResponse('not ready', { status: 409 }))
    })

    it('should throw the status with the response text', async () => {
      await expect(fetchSignedBlob(signedFetch, 'https://example/api')).rejects.toEqual({ status: 409, data: 'not ready' })
    })
  })

  describe('and the request is rejected', () => {
    beforeEach(() => {
      signedFetch.mockRejectedValueOnce(new Error('network down'))
    })

    it('should throw a FETCH_ERROR with the error message', async () => {
      await expect(fetchSignedBlob(signedFetch, 'https://example/api')).rejects.toEqual({ status: 'FETCH_ERROR', error: 'network down' })
    })
  })
})

describe('when a signed request fails and its error body cannot be read', () => {
  let signedFetch: jest.Mock

  beforeEach(() => {
    signedFetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.reject(new Error('stream closed'))
    } as unknown as Response)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it.each([
    ['wrapSignedFetch', (sf: jest.Mock) => wrapSignedFetch(sf, 'https://example/api')],
    ['sendSignedFetch', (sf: jest.Mock) => sendSignedFetch(sf, 'https://example/api', { method: 'PUT' })],
    ['fetchSignedBlob', (sf: jest.Mock) => fetchSignedBlob(sf, 'https://example/api')]
  ])('should make %s throw the status with undefined data', async (_name, request) => {
    await expect(request(signedFetch)).rejects.toEqual({ status: 500, data: undefined })
  })
})

describe('deleteSelection', () => {
  let deleteOne: jest.Mock
  let clearAll: jest.Mock
  let allSelected: boolean

  const run = () => deleteSelection({ allSelected, ids: ['a', 'b'], deleteOne, clearAll })

  beforeEach(() => {
    deleteOne = jest.fn().mockResolvedValue(undefined)
    clearAll = jest.fn().mockResolvedValue(undefined)
    allSelected = false
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when only some items are selected', () => {
    it('should delete each selected id', async () => {
      await run()

      expect(deleteOne.mock.calls).toEqual([['a'], ['b']])
    })

    it('should not clear everything', async () => {
      await run()

      expect(clearAll).not.toHaveBeenCalled()
    })

    it('should resolve to no failed ids when every delete succeeds', async () => {
      await expect(run()).resolves.toEqual([])
    })

    describe('and one delete fails', () => {
      beforeEach(() => {
        deleteOne.mockImplementation((id: string) => (id === 'b' ? Promise.reject({ status: 500 }) : Promise.resolve()))
      })

      it('should still attempt every delete', async () => {
        await run()

        expect(deleteOne).toHaveBeenCalledTimes(2)
      })

      it('should resolve to only the failed ids', async () => {
        await expect(run()).resolves.toEqual(['b'])
      })
    })

    describe('and more ids are selected than the concurrency cap', () => {
      it('should never run more than the cap at once', async () => {
        let inFlight = 0
        let peak = 0
        const slow = jest.fn(async () => {
          inFlight++
          peak = Math.max(peak, inFlight)
          await Promise.resolve()
          inFlight--
        })
        await deleteSelection({ allSelected: false, ids: ['a', 'b', 'c', 'd', 'e'], deleteOne: slow, clearAll, concurrency: 2 })

        expect(peak).toBeLessThanOrEqual(2)
        expect(slow).toHaveBeenCalledTimes(5)
      })
    })
  })

  describe('when everything is selected', () => {
    beforeEach(() => {
      allSelected = true
    })

    it('should clear everything with a single call', async () => {
      await run()

      expect(clearAll).toHaveBeenCalledTimes(1)
    })

    it('should not delete item by item', async () => {
      await run()

      expect(deleteOne).not.toHaveBeenCalled()
    })

    it('should resolve to no failed ids when the clear succeeds', async () => {
      await expect(run()).resolves.toEqual([])
    })

    describe('and the clear fails', () => {
      beforeEach(() => {
        clearAll.mockRejectedValue({ status: 500 })
      })

      it('should resolve to the selected ids so they stay selected', async () => {
        await expect(run()).resolves.toEqual(['a', 'b'])
      })
    })
  })
})
