import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react'
import { getEnv } from '../config/env'

const getStorageApiUrl = (): string => {
  const url = getEnv('STORAGE_API_URL')
  if (!url) throw new Error('STORAGE_API_URL environment variable is not set')
  return url
}

const getWorldsContentServerUrl = (): string => {
  const url = getEnv('WORLDS_CONTENT_SERVER_URL')
  if (!url) throw new Error('WORLDS_CONTENT_SERVER_URL environment variable is not set')
  return url
}

const storageClient = createApi({
  reducerPath: 'storageClient',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['Env', 'Scene', 'Player', 'PlayerKeys', 'Profiles', 'ContributableDomains', 'WorldScenes'],
  keepUnusedDataFor: 60,
  refetchOnFocus: false,
  refetchOnReconnect: true,
  endpoints: () => ({})
})

export { getStorageApiUrl, getWorldsContentServerUrl, storageClient }
