import { type PropsWithChildren, createContext, useCallback, useMemo, useState } from 'react'

type WalletState = {
  address: string | null
  isConnected: boolean
  isConnecting: boolean
  isDisconnecting: boolean
  disconnect: () => void
}

const DEFAULT_STATE: WalletState = {
  address: null,
  isConnected: false,
  isConnecting: false,
  isDisconnecting: false,
  disconnect: () => {}
}

// eslint-disable-next-line @typescript-eslint/naming-convention
const WalletStateContext = createContext<WalletState>(DEFAULT_STATE)
// eslint-disable-next-line @typescript-eslint/naming-convention
const WalletStateSetterContext = createContext<(state: WalletState) => void>(() => {})

// Reads wagmi v2.x persisted store to derive initial wallet state without importing wagmi.
// Structure: { state: { connections: { value: Map-as-entries }, current: string } }
// If wagmi upgrades change this format, this function will safely return disconnected state.
function readWagmiLocalStorage(): Pick<WalletState, 'address' | 'isConnected'> {
  try {
    const raw = localStorage.getItem('wagmi.store')
    if (!raw) return { address: null, isConnected: false }

    const parsed = JSON.parse(raw) as {
      state?: { connections?: { value?: Array<[string, { accounts?: string[] }]> }; current?: string }
    }
    const connections = parsed?.state?.connections?.value
    const current = parsed?.state?.current

    if (!current || !connections?.length) return { address: null, isConnected: false }

    const activeConnection = connections.find(([id]) => id === current)
    const address = activeConnection?.[1]?.accounts?.[0] ?? null

    return { address, isConnected: Boolean(address) }
  } catch {
    return { address: null, isConnected: false }
  }
}

function WalletStateProvider({ children }: PropsWithChildren) {
  const initial = useMemo(() => readWagmiLocalStorage(), [])
  const [state, setState] = useState<WalletState>(() => ({
    ...DEFAULT_STATE,
    ...initial
  }))

  const setter = useCallback((next: WalletState) => setState(next), [])

  return (
    <WalletStateContext.Provider value={state}>
      <WalletStateSetterContext.Provider value={setter}>{children}</WalletStateSetterContext.Provider>
    </WalletStateContext.Provider>
  )
}

export { WalletStateContext, WalletStateProvider, WalletStateSetterContext }
export type { WalletState }
