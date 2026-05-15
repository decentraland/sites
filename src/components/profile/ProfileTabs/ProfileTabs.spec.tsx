import * as mockReact from 'react'
import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProfileTabs } from './ProfileTabs'

const navigateMock = jest.fn()

jest.mock('../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (key: string) => key
}))

jest.mock('decentraland-ui2', () => {
  type TabsProps = {
    value: string
    onChange: (event: React.SyntheticEvent, value: string) => void
    children: React.ReactNode
  }
  type TabProps = { value: string; label: string }
  const Tabs = ({ value, onChange, children }: TabsProps) =>
    mockReact.createElement(
      'div',
      { role: 'tablist', 'data-active': value },
      mockReact.Children.map(children, child =>
        mockReact.isValidElement(child) ? mockReact.cloneElement(child as React.ReactElement, { onChange }) : child
      )
    )
  const Tab = ({ value, label, onChange }: TabProps & { onChange?: (e: React.SyntheticEvent, v: string) => void }) =>
    mockReact.createElement(
      'button',
      {
        role: 'tab',
        'data-value': value,
        onClick: (event: React.SyntheticEvent) => onChange?.(event, value)
      },
      label
    )
  const styled = () => (component: unknown) => component
  return { Tab, Tabs, styled }
})

jest.mock('./ProfileTabs.styled', () => {
  const StyledTabs = ({
    value,
    onChange,
    children
  }: {
    value: string
    onChange: (e: unknown, v: string) => void
    children: React.ReactNode
  }) =>
    mockReact.createElement(
      'div',
      { role: 'tablist', 'data-active': value },
      mockReact.Children.map(children, child =>
        mockReact.isValidElement(child) ? mockReact.cloneElement(child as React.ReactElement, { onChange }) : child
      )
    )
  const StyledTab = ({
    value,
    label,
    onChange
  }: {
    value: string
    label: string
    onChange?: (e: React.SyntheticEvent, v: string) => void
  }) =>
    mockReact.createElement(
      'button',
      {
        role: 'tab',
        'data-value': value,
        onClick: (event: React.SyntheticEvent) => onChange?.(event, value)
      },
      label
    )
  return { StyledTab, StyledTabs }
})

const onTabSelectMock = jest.fn()

function renderTabs(isOwnProfile: boolean, activeTab: Parameters<typeof ProfileTabs>[0]['activeTab'] = 'overview') {
  return render(
    <MemoryRouter>
      <ProfileTabs activeTab={activeTab} isOwnProfile={isOwnProfile} onTabSelect={onTabSelectMock} />
    </MemoryRouter>
  )
}

describe('ProfileTabs', () => {
  beforeEach(() => {
    navigateMock.mockClear()
    onTabSelectMock.mockClear()
  })

  describe('when viewing as a Member', () => {
    it('should show only the 5 public tabs without Assets/Referral', () => {
      renderTabs(false)
      const tabs = screen.getAllByRole('tab')
      expect(tabs.map(tab => tab.getAttribute('data-value'))).toEqual(['overview', 'creations', 'communities', 'places', 'photos'])
    })
  })

  describe('when viewing as the owner', () => {
    it('should show the 6 owner tabs with MY prefix and no Creations', () => {
      renderTabs(true)
      const tabs = screen.getAllByRole('tab')
      expect(tabs.map(tab => tab.getAttribute('data-value'))).toEqual([
        'overview',
        'assets',
        'communities',
        'places',
        'photos',
        'referral-rewards'
      ])
    })
  })

  it('should invoke onTabSelect when a Member tab is clicked', async () => {
    const user = userEvent.setup()
    renderTabs(false, 'overview')

    await user.click(screen.getByRole('tab', { name: 'profile.tabs.creations' }))

    expect(onTabSelectMock).toHaveBeenCalledWith('creations')
  })
})
