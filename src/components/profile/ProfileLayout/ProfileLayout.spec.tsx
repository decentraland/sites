import * as mockReact from 'react'
import { render, screen } from '@testing-library/react'
import { ProfileLayout } from './ProfileLayout'

jest.mock('./ProfileLayout.styled', () => {
  const make = (testid: string) =>
    mockReact.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { $hasAside?: boolean; $showAside?: boolean }>(
      ({ $hasAside: _hasAside, $showAside: _showAside, ...props }, ref) =>
        mockReact.createElement('div', { 'data-testid': testid, ref, ...props })
    )
  return {
    AsideArea: make('aside-area'),
    BodyArea: make('body-area'),
    BodySplit: make('body-split'),
    ContentArea: make('content-area'),
    LayoutRoot: make('layout-root'),
    ProfileCard: make('profile-card'),
    TabsArea: make('tabs-area')
  }
})

describe('ProfileLayout', () => {
  it('should render the header and the body content', () => {
    render(
      <ProfileLayout header={<div data-testid="profile-header" />}>
        <p>profile-body</p>
      </ProfileLayout>
    )

    expect(screen.getByTestId('profile-header')).toBeInTheDocument()
    expect(screen.getByText('profile-body')).toBeInTheDocument()
  })

  it('should render the tabs slot when provided', () => {
    render(
      <ProfileLayout header={<div />} tabs={<nav data-testid="profile-tabs" />}>
        <p>body</p>
      </ProfileLayout>
    )

    expect(screen.getByTestId('profile-tabs')).toBeInTheDocument()
  })

  it('should omit the tabs slot when not provided', () => {
    render(
      <ProfileLayout header={<div />}>
        <p>body</p>
      </ProfileLayout>
    )

    expect(screen.queryByTestId('profile-tabs')).not.toBeInTheDocument()
  })

  it('should render the aside slot when provided', () => {
    render(
      <ProfileLayout header={<div />} aside={<aside data-testid="profile-aside" />}>
        <p>body</p>
      </ProfileLayout>
    )

    expect(screen.getByTestId('profile-aside')).toBeInTheDocument()
    expect(screen.getByTestId('aside-area')).toBeInTheDocument()
  })

  it('should omit the aside region when not provided', () => {
    render(
      <ProfileLayout header={<div />}>
        <p>body</p>
      </ProfileLayout>
    )

    expect(screen.queryByTestId('aside-area')).not.toBeInTheDocument()
  })

  describe('when embedded inside another modal', () => {
    it('should drop the outer page chrome (no card frame / layout root)', () => {
      render(
        <ProfileLayout header={<div data-testid="profile-header" />} embedded>
          <p>profile-body</p>
        </ProfileLayout>
      )

      // The body still renders, but the gradient/card frame is gone.
      expect(screen.getByTestId('profile-header')).toBeInTheDocument()
      expect(screen.getByText('profile-body')).toBeInTheDocument()
      expect(screen.queryByTestId('layout-root')).not.toBeInTheDocument()
      expect(screen.queryByTestId('profile-card')).not.toBeInTheDocument()
    })
  })

  describe('when the aside is provided but hidden', () => {
    it('should still render the aside region while collapsing it', () => {
      render(
        <ProfileLayout header={<div />} aside={<aside data-testid="profile-aside" />} showAside={false}>
          <p>body</p>
        </ProfileLayout>
      )

      // `hasAside` is true so the region mounts; `$showAside` drives the collapse via styling.
      expect(screen.getByTestId('aside-area')).toBeInTheDocument()
    })
  })
})
