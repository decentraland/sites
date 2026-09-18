import { createApi } from '@reduxjs/toolkit/query/react'
import { createIdentityBaseQuery } from './identityBaseQuery'

const referralClient = createApi({
  reducerPath: 'referralClient',
  baseQuery: createIdentityBaseQuery('REFERRAL_API_URL', true),
  tagTypes: ['ReferralState'],
  keepUnusedDataFor: 120,
  refetchOnFocus: false,
  refetchOnReconnect: true,
  endpoints: () => ({})
})

export { referralClient }
