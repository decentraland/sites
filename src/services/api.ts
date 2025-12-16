import { createApi } from '@reduxjs/toolkit/query/react'
import type { BaseQueryFn } from '@reduxjs/toolkit/query/react'
import { getEnv } from '../config/env'

const spaceId = getEnv('CONTENTFUL_SPACE_ID')!
const environment = getEnv('CONTENTFUL_ENVIRONMENT')!

const CMS_BASE_URL = import.meta.env.DEV
  ? `/api/cms/spaces/${spaceId}/environments/${environment}`
  : `https://cms.decentraland.org/spaces/${spaceId}/environments/${environment}`

type CmsError = { status: string; error: string }

const cmsBaseQuery: BaseQueryFn<{ url: string; params?: Record<string, string | number> }, unknown, CmsError> = async ({ url, params }) => {
  try {
    const baseUrl = CMS_BASE_URL.startsWith('/') ? `${window.location.origin}${CMS_BASE_URL}` : CMS_BASE_URL
    const fullUrl = new URL(`${baseUrl}${url}`)

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          fullUrl.searchParams.append(key, String(value))
        }
      })
    }

    const response = await fetch(fullUrl.toString())
    if (!response.ok) {
      return { error: { status: `${response.status}`, error: response.statusText } }
    }

    const data = await response.json()
    return { data }
  } catch (error) {
    return {
      error: {
        status: 'CUSTOM_ERROR',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

export const api = createApi({
  reducerPath: 'api',
  baseQuery: cmsBaseQuery,
  tagTypes: ['LandingContent'],
  endpoints: () => ({})
})
