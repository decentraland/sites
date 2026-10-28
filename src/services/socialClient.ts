import { createApi } from '@reduxjs/toolkit/query/react'
import { createIdentityBaseQuery } from './identityBaseQuery'

const socialClient = createApi({
  reducerPath: 'socialClient',
  baseQuery: createIdentityBaseQuery('SOCIAL_API_URL'),
  tagTypes: ['Communities', 'Events', 'Members', 'MemberRequests'],
  keepUnusedDataFor: 60,
  refetchOnFocus: true,
  refetchOnReconnect: true,
  refetchOnMountOrArgChange: 30,
  endpoints: () => ({})
})

export { socialClient }
