import React from 'react'
import { act, render, screen } from '@testing-library/react'
import { IndexPage } from './index'

const mockUseGetExploreDataQuery = jest.fn()
jest.mock('../features/events/events.client', () => ({
  useGetExploreDataQuery: () => mockUseGetExploreDataQuery()
}))

const mockUseDesktopMediaQuery = jest.fn(() => true)
jest.mock('decentraland-ui2', () => ({
  useDesktopMediaQuery: () => mockUseDesktopMediaQuery()
}))

jest.mock('../components/Home/Hero', () => ({
  Hero: () => <div data-testid="hero" />
}))

jest.mock('../components/Home/Explore', () => ({
  Explore: () => <div data-testid="explore" />
}))
jest.mock('../components/Home/CatchTheVibe', () => ({
  CatchTheVibe: () => <div data-testid="catch-the-vibe" />
}))
jest.mock('../components/Home/WeeklyRituals', () => ({
  WeeklyRituals: () => <div data-testid="weekly-rituals" />
}))
jest.mock('../components/Home/ComeHangOut', () => ({
  ComeHangOut: () => <div data-testid="come-hang-out" />
}))

jest.mock('./index.styled', () => ({
  BelowFoldContent: ({ children }: { children: React.ReactNode }) => <div data-testid="below-fold">{children}</div>,
  SuspenseFallback: () => <div data-testid="suspense-fallback" />
}))

const mockUseInView = jest.fn(() => ({ ref: jest.fn(), inView: false }))
jest.mock('react-intersection-observer', () => ({
  useInView: () => mockUseInView()
}))

const scheduleCallbacks: Array<() => void> = []
jest.mock('../utils/scheduleWhenIdle', () => ({
  scheduleWhenIdle: (cb: () => void) => {
    scheduleCallbacks.push(cb)
    return { kind: 'timeout' as const, id: scheduleCallbacks.length }
  },
  cancelScheduledIdleCall: jest.fn()
}))

describe('IndexPage', () => {
  beforeEach(() => {
    mockUseGetExploreDataQuery.mockReset()
    mockUseGetExploreDataQuery.mockReturnValue({ data: [], isLoading: true })
    mockUseInView.mockReturnValue({ ref: jest.fn(), inView: false })
    scheduleCallbacks.length = 0
  })

  it('should render the hero and defer the below-fold tree until scrolled into view', () => {
    render(<IndexPage />)

    expect(screen.getByTestId('hero')).toBeInTheDocument()
    expect(screen.queryByTestId('below-fold')).not.toBeInTheDocument()
  })

  it('should not subscribe to explore data on mount (LCP protection)', () => {
    render(<IndexPage />)
    expect(mockUseGetExploreDataQuery).not.toHaveBeenCalled()
  })

  it('should subscribe to explore data once the browser is idle', () => {
    render(<IndexPage />)
    expect(mockUseGetExploreDataQuery).not.toHaveBeenCalled()

    // Fire the scheduled idle callback.
    act(() => {
      const cb = scheduleCallbacks[0]
      if (cb) cb()
    })

    expect(mockUseGetExploreDataQuery).toHaveBeenCalled()
  })

  it('should also subscribe to explore data as soon as the user scrolls past the hero', async () => {
    mockUseInView.mockReturnValue({ ref: jest.fn(), inView: true })

    render(<IndexPage />)

    expect(mockUseGetExploreDataQuery).toHaveBeenCalled()
    // Suspense is mounted with the fallback while the lazy children resolve,
    // which is itself proof that the below-fold branch was taken.
    expect(screen.getByTestId('suspense-fallback')).toBeInTheDocument()
  })
})
