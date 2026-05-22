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
  buildSignedFetchMetadata,
  createScopedSignedFetch,
  estateToLand,
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
  transformLandQueryResult,
  transformRentalsQueryResult,
  truncateAddress,
  wrapSignedFetch
} from './storage.helpers'
import { LandType, RoleType } from './storage.types'
import type { LandQueryResult, RentalsQueryResult, SubgraphEstate, SubgraphParcel } from './storage.types'

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
