import React from 'react'
import { render, screen } from '@testing-library/react'
import { HomePage } from './HomePage'

jest.mock('../../components/explore/LiveNow', () => ({
  LiveNow: () => <div data-testid="live-now" />
}))

jest.mock('../../components/explore/Upcoming', () => ({
  Upcoming: () => <div data-testid="upcoming" />
}))

jest.mock('../../components/explore/AllExperiences', () => ({
  AllExperiences: () => <div data-testid="all-experiences" />
}))

jest.mock('./HomePage.styled', () => ({
  MainContainer: ({ children }: { children: React.ReactNode }) => <main data-testid="main">{children}</main>,
  ContentWrapper: ({ children }: { children: React.ReactNode }) => <div data-testid="content-wrapper">{children}</div>
}))

describe('when HomePage is rendered', () => {
  it('should render LiveNow, Upcoming and AllExperiences unconditionally in parallel', () => {
    render(<HomePage />)

    expect(screen.getByTestId('live-now')).toBeInTheDocument()
    expect(screen.getByTestId('upcoming')).toBeInTheDocument()
    expect(screen.getByTestId('all-experiences')).toBeInTheDocument()
  })

  it('should not gate Upcoming or AllExperiences on any LiveNow loading state', () => {
    render(<HomePage />)

    const main = screen.getByTestId('main')
    expect(main).toContainElement(screen.getByTestId('live-now'))
    expect(main).toContainElement(screen.getByTestId('upcoming'))
    expect(main).toContainElement(screen.getByTestId('all-experiences'))
  })
})
