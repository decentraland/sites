import * as mockReact from 'react'
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { type TabType, Tabs } from './Tabs'

jest.mock('@dcl/hooks', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

// Stub the decentraland-ui2 styled() barrel — Jest can't transform its ESM bundle.
jest.mock('./Tabs.styled', () => {
  const make = (testid: string) =>
    mockReact.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { active?: boolean }>(
      ({ active: _active, ...props }, ref) => mockReact.createElement('div', { 'data-testid': testid, ref, ...props })
    )
  return {
    TabsContainer: make('tabs-container'),
    Tab: make('tab'),
    TabButton: make('tab-button'),
    TabText: make('tab-text')
  }
})

function renderTabs(props: Partial<React.ComponentProps<typeof Tabs>> = {}) {
  const defaults = { activeTab: 'members' as TabType, onTabChange: jest.fn() }
  return render(<Tabs {...defaults} {...props} />)
}

describe('Tabs', () => {
  describe('when rendering', () => {
    afterEach(() => {
      jest.resetAllMocks()
    })

    it('should display both tab labels', () => {
      renderTabs()
      expect(screen.getByText('community.tabs.members')).toBeInTheDocument()
      expect(screen.getByText('community.tabs.upcoming_events')).toBeInTheDocument()
    })

    it('should call onTabChange("events") when clicking the events tab', async () => {
      const onTabChange = jest.fn()
      const user = userEvent.setup()
      renderTabs({ activeTab: 'members', onTabChange })
      await user.click(screen.getByText('community.tabs.upcoming_events'))
      expect(onTabChange).toHaveBeenCalledWith('events')
    })

    it('should call onTabChange("members") when clicking the members tab', async () => {
      const onTabChange = jest.fn()
      const user = userEvent.setup()
      renderTabs({ activeTab: 'events', onTabChange })
      await user.click(screen.getByText('community.tabs.members'))
      expect(onTabChange).toHaveBeenCalledWith('members')
    })
  })
})
