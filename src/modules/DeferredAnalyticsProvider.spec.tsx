import React from 'react'
import { act, render, screen } from '@testing-library/react'
import { DeferredAnalyticsProvider } from './DeferredAnalyticsProvider'

const mockProviderProps = jest.fn()

jest.mock('@dcl/hooks', () => ({
  AnalyticsProvider: (props: { writeKey: string; cdnUrl?: string; apiHost?: string; children: React.ReactNode }) => {
    mockProviderProps(props)
    return React.createElement('div', { 'data-testid': 'analytics-provider' }, props.children)
  }
}))

let mockIdleCallback: (() => void) | undefined
const mockCancelScheduledIdleCall = jest.fn()

jest.mock('../utils/scheduleWhenIdle', () => ({
  scheduleWhenIdle: (cb: () => void) => {
    mockIdleCallback = cb
    return { kind: 'idle', id: 1 }
  },
  cancelScheduledIdleCall: (handle: unknown) => mockCancelScheduledIdleCall(handle)
}))

function lastProviderProps() {
  return mockProviderProps.mock.calls[mockProviderProps.mock.calls.length - 1][0]
}

describe('when rendering the DeferredAnalyticsProvider', () => {
  beforeEach(() => {
    mockIdleCallback = undefined
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render its children', () => {
    render(
      <DeferredAnalyticsProvider writeKey="wk-test">
        <span>a child</span>
      </DeferredAnalyticsProvider>
    )

    expect(screen.getByText('a child')).toBeInTheDocument()
  })

  it('should hold the write key back until the browser is idle', () => {
    render(
      <DeferredAnalyticsProvider writeKey="wk-test">
        <span>a child</span>
      </DeferredAnalyticsProvider>
    )

    expect(lastProviderProps().writeKey).toBe('')

    act(() => mockIdleCallback?.())

    expect(lastProviderProps().writeKey).toBe('wk-test')
  })

  it('should never schedule the activation when there is no write key', () => {
    render(
      <DeferredAnalyticsProvider writeKey="">
        <span>a child</span>
      </DeferredAnalyticsProvider>
    )

    expect(mockIdleCallback).toBeUndefined()
    expect(lastProviderProps().writeKey).toBe('')
  })

  it('should forward the first-party proxy configuration untouched', () => {
    render(
      <DeferredAnalyticsProvider writeKey="wk-test" cdnUrl="https://evs.e.decentraland.org" apiHost="evs.e.decentraland.org/v1">
        <span>a child</span>
      </DeferredAnalyticsProvider>
    )

    expect(lastProviderProps()).toEqual(
      expect.objectContaining({
        cdnUrl: 'https://evs.e.decentraland.org',
        apiHost: 'evs.e.decentraland.org/v1'
      })
    )
  })

  it('should leave the proxy configuration undefined when it is not set', () => {
    render(
      <DeferredAnalyticsProvider writeKey="wk-test">
        <span>a child</span>
      </DeferredAnalyticsProvider>
    )

    expect(lastProviderProps().cdnUrl).toBeUndefined()
    expect(lastProviderProps().apiHost).toBeUndefined()
  })

  it('should cancel the pending activation when it unmounts', () => {
    const { unmount } = render(
      <DeferredAnalyticsProvider writeKey="wk-test">
        <span>a child</span>
      </DeferredAnalyticsProvider>
    )

    unmount()

    expect(mockCancelScheduledIdleCall).toHaveBeenCalledWith({ kind: 'idle', id: 1 })
  })
})
