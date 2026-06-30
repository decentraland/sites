import type { SubscriptionDetails } from '@dcl/schemas'
import { accountNotificationsClient } from '../../services/accountNotificationsClient'
import type { SetEmailRequest, SubscriptionResponse } from './account-notifications.types'

const accountNotificationsApi = accountNotificationsClient.injectEndpoints({
  endpoints: builder => ({
    // Identity-scoped: the signed fetch attaches the auth chain and the server returns the
    // caller's own subscription. No `:address` param.
    getSubscription: builder.query<SubscriptionResponse, void>({
      query: () => '/subscription',
      providesTags: ['Subscription']
    }),

    updateSubscription: builder.mutation<SubscriptionResponse, SubscriptionDetails>({
      query: details => ({
        url: '/subscription',
        method: 'PUT',
        body: details
      }),
      // Optimistically write the new details into the cached subscription so the toggles reflect
      // the change immediately and stay put; roll back only if the request fails. We deliberately
      // do NOT reconcile with the PUT response — that endpoint can echo a partial/empty `details`,
      // which would wipe the just-applied toggles ("everything reverts"); the next GET is canonical.
      async onQueryStarted(details, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          accountNotificationsApi.util.updateQueryData('getSubscription', undefined, draft => {
            draft.details = details
          })
        )
        try {
          await queryFulfilled
        } catch {
          patch.undo()
        }
      }
    }),

    setEmail: builder.mutation<void, SetEmailRequest>({
      query: body => ({
        url: '/set-email',
        method: 'PUT',
        body
      }),
      // The address is not confirmed yet — reflect it as the pending `unconfirmedEmail` so the
      // card shows the "pending approval" state until the user clicks the confirmation link.
      async onQueryStarted({ email }, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled
          dispatch(
            accountNotificationsApi.util.updateQueryData('getSubscription', undefined, draft => {
              draft.unconfirmedEmail = email
            })
          )
        } catch {
          // Surfaced to the UI via the mutation's `isError`; no cache change on failure.
        }
      }
    })
  })
})

const { useGetSubscriptionQuery, useUpdateSubscriptionMutation, useSetEmailMutation } = accountNotificationsApi

export { accountNotificationsApi, useGetSubscriptionQuery, useSetEmailMutation, useUpdateSubscriptionMutation }
