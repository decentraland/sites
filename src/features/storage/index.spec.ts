jest.mock('decentraland-crypto-fetch', () => ({ __esModule: true, default: jest.fn() }))
jest.mock('../../config/env', () => ({ getEnv: jest.fn(() => 'https://example.invalid') }))

import * as storage from './index'

const expectedExports = [
  'storageEndpoints',
  'useClearAllPlayersMutation',
  'useClearEnvMutation',
  'useClearPlayerMutation',
  'useClearSceneMutation',
  'useDeleteEnvMutation',
  'useDeletePlayerValueMutation',
  'useDeleteSceneValueMutation',
  'useGetContributableDomainsQuery',
  'useGetPlayerValueQuery',
  'useGetSceneValueQuery',
  'useGetWorldScenesQuery',
  'useListEnvKeysQuery',
  'useListPlayerKeysQuery',
  'useListPlayersQuery',
  'useListSceneKeysQuery',
  'useSetEnvMutation',
  'useSetPlayerValueMutation',
  'useSetSceneValueMutation',
  'assetsEndpoints',
  'useGetUserDCLNamesQuery',
  'useGetUserLandsQuery',
  'useGetUserRentalsQuery',
  'getLandPosition',
  'getRoleLabelKey',
  'getStorageErrorKey',
  'storageContextId',
  'transformLandQueryResult',
  'transformRentalsQueryResult',
  'truncateAddress',
  'LandType',
  'RoleType'
]

describe('features/storage barrel', () => {
  it.each(expectedExports)('re-exports %s', name => {
    expect((storage as Record<string, unknown>)[name]).toBeDefined()
  })

  it('exports storageEndpoints with the expected RTK Query reducerPath', () => {
    expect((storage.storageEndpoints as { reducerPath: string }).reducerPath).toBe('storageClient')
  })

  it('exports assetsEndpoints with the expected RTK Query reducerPath', () => {
    expect((storage.assetsEndpoints as { reducerPath: string }).reducerPath).toBe('subgraphClient')
  })
})
