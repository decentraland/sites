import { createApi } from '@reduxjs/toolkit/query/react'
import { createIdentityBaseQuery } from './identityBaseQuery'

const accountNotificationsClient = createApi({
  reducerPath: 'accountNotificationsClient',
  baseQuery: createIdentityBaseQuery('NOTIFICATIONS_API_URL', true),
  tagTypes: ['Subscription'],
  keepUnusedDataFor: 120,
  refetchOnFocus: false,
  refetchOnReconnect: true,
  endpoints: () => ({})
})

export { accountNotificationsClient }
