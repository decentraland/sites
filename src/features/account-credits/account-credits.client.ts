import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { creditsClient } from '../../services/creditsClient'
import { UserCreditsStatus } from './account-credits.types'
import type { UserCreditsStatusEnvelope, UserCreditsStatusResponse } from './account-credits.types'

const NOT_REGISTERED_RESPONSE: UserCreditsStatusResponse = {
  status: UserCreditsStatus.NOT_REGISTERED,
  optedOutAt: null
}

const isFetchBaseQueryError = (error: unknown): error is FetchBaseQueryError =>
  typeof error === 'object' && error !== null && 'status' in error

const accountCreditsApi = creditsClient.injectEndpoints({
  endpoints: builder => ({
    // The credits-server returns its payload under `data` and answers 404 for
    // wallets it has never seen — both handled here so the UI always gets a
    // resolved status. `queryFn` (not `query` + `transformResponse`) because
    // `transformResponse` never runs for the 404 case.
    getUserCreditsStatus: builder.query<UserCreditsStatusResponse, string>({
      async queryFn(address, _api, _extraOptions, baseQuery) {
        const result = await baseQuery(`/users/${encodeURIComponent(address)}/status`)
        if (result.error) {
          if (isFetchBaseQueryError(result.error) && result.error.status === 404) {
            return { data: NOT_REGISTERED_RESPONSE }
          }
          return { error: result.error }
        }
        return { data: (result.data as UserCreditsStatusEnvelope).data }
      },
      providesTags: (_result, _error, address) => [{ type: 'CreditsStatus', id: address }]
    }),

    // Opt-out is a DELETE; a 404 means the wallet was never registered, which is
    // a no-op success (it is already not enrolled). On success we patch the
    // status cache to OPTED_OUT so the card flips to "Opted Out" without a refetch.
    optOutFromCredits: builder.mutation<void, string>({
      async queryFn(address, _api, _extraOptions, baseQuery) {
        const result = await baseQuery({ url: `/users/${encodeURIComponent(address)}`, method: 'DELETE' })
        if (result.error) {
          if (isFetchBaseQueryError(result.error) && result.error.status === 404) {
            return { data: undefined }
          }
          return { error: result.error }
        }
        return { data: undefined }
      },
      async onQueryStarted(address, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled
          dispatch(
            accountCreditsApi.util.updateQueryData('getUserCreditsStatus', address, draft => {
              draft.status = UserCreditsStatus.OPTED_OUT
              draft.optedOutAt = new Date().toISOString()
            })
          )
        } catch {
          // Mutation failed — leave the cached status untouched; the card surfaces the error.
        }
      }
    })
  })
})

const { useGetUserCreditsStatusQuery, useOptOutFromCreditsMutation } = accountCreditsApi

export { accountCreditsApi, useGetUserCreditsStatusQuery, useOptOutFromCreditsMutation }
