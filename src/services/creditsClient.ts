import { createApi } from '@reduxjs/toolkit/query/react'
import { createIdentityBaseQuery } from './identityBaseQuery'

const creditsClient = createApi({
  reducerPath: 'creditsClient',
  baseQuery: createIdentityBaseQuery('CREDITS_SERVER_URL', true),
  tagTypes: ['CreditsStatus'],
  keepUnusedDataFor: 120,
  refetchOnFocus: false,
  refetchOnReconnect: true,
  endpoints: () => ({})
})

export { creditsClient }
