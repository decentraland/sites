import { cast2Client } from '../../services/cast2Client'
import { getGatekeeperUrl, getPresenterServerUrl, getWorldsContentUrl } from './cast2.helpers'
import type { LiveKitCredentials, PresentationBotToken, PresentationInfo, StreamInfo, WorldScenesResponse } from './cast2.types'

interface GetStreamerTokenArgs {
  token: string
  identity: string
}

interface GetWatcherTokenArgs {
  location: string
  identity: string
  parcel?: string
}

interface GetPresentationBotTokenArgs {
  streamingKey: string
}

interface UploadPresentationArgs {
  file: File
  livekitToken: string
  livekitUrl: string
}

interface UploadPresentationFromUrlArgs {
  url: string
  livekitToken: string
  livekitUrl: string
}

const cast2Endpoints = cast2Client.injectEndpoints({
  endpoints: build => ({
    getStreamerToken: build.mutation<LiveKitCredentials, GetStreamerTokenArgs>({
      query: ({ token, identity }) => ({
        url: `${getGatekeeperUrl()}/cast/streamer-token`,
        method: 'POST',
        body: { token, identity }
      })
    }),
    getWatcherToken: build.mutation<LiveKitCredentials, GetWatcherTokenArgs>({
      query: ({ location, identity, parcel }) => ({
        url: `${getGatekeeperUrl()}/cast/watcher-token`,
        method: 'POST',
        body: parcel ? { location, identity, parcel } : { location, identity }
      })
    }),
    getStreamInfo: build.query<StreamInfo, string>({
      query: streamingKey => `${getGatekeeperUrl()}/cast/stream-info/${encodeURIComponent(streamingKey)}`,
      providesTags: (_result, _error, streamingKey) => [{ type: 'StreamInfo', id: streamingKey }]
    }),
    getWorldScenes: build.query<WorldScenesResponse, string>({
      query: worldName => `${getWorldsContentUrl()}/world/${encodeURIComponent(worldName.toLowerCase())}/scenes`,
      providesTags: (_result, _error, worldName) => [{ type: 'WorldScenes', id: worldName.toLowerCase() }]
    }),
    getPresentationBotToken: build.mutation<PresentationBotToken, GetPresentationBotTokenArgs>({
      query: ({ streamingKey }) => ({
        url: `${getGatekeeperUrl()}/cast/presentation-bot-token`,
        method: 'POST',
        body: { streamingKey }
      })
    }),
    uploadPresentation: build.mutation<PresentationInfo, UploadPresentationArgs>({
      query: ({ file, livekitToken, livekitUrl }) => {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('livekitToken', livekitToken)
        formData.append('livekitUrl', livekitUrl)
        return {
          url: `${getPresenterServerUrl()}/presentations`,
          method: 'POST',
          body: formData,
          formData: true
        }
      }
    }),
    uploadPresentationFromUrl: build.mutation<PresentationInfo, UploadPresentationFromUrlArgs>({
      query: ({ url, livekitToken, livekitUrl }) => ({
        url: `${getPresenterServerUrl()}/presentations`,
        method: 'POST',
        body: { url, livekitToken, livekitUrl }
      })
    })
  }),
  overrideExisting: false
})

const {
  useGetStreamerTokenMutation,
  useGetWatcherTokenMutation,
  useGetStreamInfoQuery,
  useLazyGetStreamInfoQuery,
  useGetWorldScenesQuery,
  useLazyGetWorldScenesQuery,
  useGetPresentationBotTokenMutation,
  useUploadPresentationMutation,
  useUploadPresentationFromUrlMutation
} = cast2Endpoints

export {
  cast2Endpoints,
  useGetPresentationBotTokenMutation,
  useGetStreamInfoQuery,
  useGetStreamerTokenMutation,
  useGetWatcherTokenMutation,
  useGetWorldScenesQuery,
  useLazyGetStreamInfoQuery,
  useLazyGetWorldScenesQuery,
  useUploadPresentationFromUrlMutation,
  useUploadPresentationMutation
}
