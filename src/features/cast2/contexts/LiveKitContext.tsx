/* eslint-disable @typescript-eslint/naming-convention */
import { type ReactNode, createContext, useContext, useState } from 'react'
import type { LiveKitCredentials } from '../cast2.types'

interface StreamMetadata {
  placeName: string
  // Either parcel coordinates ("-116,129") or a world name ("aworld.dcl.eth").
  location: string
  isWorld: boolean
}

interface LiveKitContextValue {
  credentials: LiveKitCredentials | null
  setCredentials: (credentials: LiveKitCredentials | null) => void
  streamMetadata: StreamMetadata | null
  setStreamMetadata: (metadata: StreamMetadata | null) => void
}

const LiveKitContext = createContext<LiveKitContextValue | undefined>(undefined)

const LiveKitProvider = ({ children }: { children: ReactNode }) => {
  const [credentials, setCredentials] = useState<LiveKitCredentials | null>(null)
  const [streamMetadata, setStreamMetadata] = useState<StreamMetadata | null>(null)

  return (
    <LiveKitContext.Provider value={{ credentials, setCredentials, streamMetadata, setStreamMetadata }}>{children}</LiveKitContext.Provider>
  )
}

const useLiveKitCredentials = (): LiveKitContextValue => {
  const context = useContext(LiveKitContext)
  if (!context) {
    throw new Error('useLiveKitCredentials must be used within LiveKitProvider')
  }
  return context
}

export { LiveKitProvider, useLiveKitCredentials }
export type { LiveKitContextValue, StreamMetadata }
