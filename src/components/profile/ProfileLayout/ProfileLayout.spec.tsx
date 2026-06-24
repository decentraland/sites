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
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when rendering with a header and body content', () => {
    beforeEach(() => {
      render(
        <ProfileLayout header={<div data-testid="profile-header" />}>
          <p>profile-body</p>
        </ProfileLayout>
      )
    })

    it('should render the header', () => {
      expect(screen.getByTestId('profile-header')).toBeInTheDocument()
    })

    it('should render the body content', () => {
      expect(screen.getByText('profile-body')).toBeInTheDocument()
    })
  })

  describe('when the tabs slot is provided', () => {
    beforeEach(() => {
      render(
        <ProfileLayout header={<div />} tabs={<nav data-testid="profile-tabs" />}>
          <p>body</p>
        </ProfileLayout>
      )
    })

    it('should render the tabs slot', () => {
      expect(screen.getByTestId('profile-tabs')).toBeInTheDocument()
    })
  })

  describe('when the tabs slot is not provided', () => {
    beforeEach(() => {
      render(
        <ProfileLayout header={<div />}>
          <p>body</p>
        </ProfileLayout>
      )
    })

    it('should omit the tabs slot', () => {
      expect(screen.queryByTestId('profile-tabs')).not.toBeInTheDocument()
    })
  })

  describe('when the aside slot is provided', () => {
    beforeEach(() => {
      render(
        <ProfileLayout header={<div />} aside={<aside data-testid="profile-aside" />}>
          <p>body</p>
        </ProfileLayout>
      )
    })

    it('should render the aside slot', () => {
      expect(screen.getByTestId('profile-aside')).toBeInTheDocument()
    })

    it('should mount the aside region', () => {
      expect(screen.getByTestId('aside-area')).toBeInTheDocument()
    })
  })

  describe('when the aside slot is not provided', () => {
    beforeEach(() => {
      render(
        <ProfileLayout header={<div />}>
          <p>body</p>
        </ProfileLayout>
      )
    })

    it('should omit the aside region', () => {
      expect(screen.queryByTestId('aside-area')).not.toBeInTheDocument()
    })
  })

  describe('when embedded inside another modal', () => {
    beforeEach(() => {
      render(
        <ProfileLayout header={<div data-testid="profile-header" />} embedded>
          <p>profile-body</p>
        </ProfileLayout>
      )
    })

    it('should still render the header', () => {
      expect(screen.getByTestId('profile-header')).toBeInTheDocument()
    })

    it('should still render the body content', () => {
      expect(screen.getByText('profile-body')).toBeInTheDocument()
    })

    it('should drop the outer layout root frame', () => {
      expect(screen.queryByTestId('layout-root')).not.toBeInTheDocument()
    })

    it('should drop the profile card frame', () => {
      expect(screen.queryByTestId('profile-card')).not.toBeInTheDocument()
    })
  })

  describe('when the aside is provided but hidden', () => {
    beforeEach(() => {
      render(
        <ProfileLayout header={<div />} aside={<aside data-testid="profile-aside" />} showAside={false}>
          <p>body</p>
        </ProfileLayout>
      )
    })

    it('should still mount the aside region while collapsing it', () => {
      expect(screen.getByTestId('aside-area')).toBeInTheDocument()
    })
  })
})
