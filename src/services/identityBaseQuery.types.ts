import type { FetchArgs } from '@reduxjs/toolkit/query'

type IdentityFetchArgs = FetchArgs & {
  account?: string
  baseUrl?: string
}

export type { IdentityFetchArgs }
