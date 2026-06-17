import * as mockReact from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useHangOutAction } from '../../../hooks/useHangOutAction'
import { JumpInEmptyState } from './JumpInEmptyState'

const handleClick = jest.fn()
const closeDownloadModal = jest.fn()
let downloadModalOpen = false

jest.mock('decentraland-ui2', () => ({
  DownloadModal: ({ open }: { open?: boolean }) => (open ? mockReact.createElement('div', { role: 'dialog' }, 'download') : null)
}))
jest.mock('./ProfileEmptyState.icons', () => ({ JumpInBadgeIcon: () => null }))
jest.mock('./ProfileEmptyState', () => ({
  ProfileEmptyState: ({
    title,
    subtitle,
    action
  }: {
    title: string
    subtitle?: string
    action?: { label: string; onClick?: () => void }
  }) =>
    mockReact.createElement(
      'div',
      { 'data-testid': 'empty-state' },
      mockReact.createElement('p', null, title),
      subtitle ? mockReact.createElement('p', null, subtitle) : null,
      action ? mockReact.createElement('button', { onClick: action.onClick }, action.label) : null
    )
}))
jest.mock('../../../hooks/useHangOutAction', () => ({ useHangOutAction: jest.fn() }))

const mockedHook = useHangOutAction as jest.MockedFunction<typeof useHangOutAction>

describe('JumpInEmptyState', () => {
  beforeEach(() => {
    downloadModalOpen = false
    mockedHook.mockImplementation(
      () =>
        ({ handleClick, isDownloadModalOpen: downloadModalOpen, closeDownloadModal, downloadModalProps: {} }) as unknown as ReturnType<
          typeof useHangOutAction
        >
    )
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should render the empty state and keep the download modal closed by default', () => {
    render(<JumpInEmptyState icon={<span />} title="No photos yet" subtitle="Snap a photo" ctaLabel="Jump in" />)

    expect(screen.getByText('No photos yet')).toBeInTheDocument()
    expect(screen.getByText('Snap a photo')).toBeInTheDocument()
    expect(screen.getByText('Jump in')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('should trigger the jump-in launcher when the CTA is clicked', async () => {
    render(<JumpInEmptyState icon={<span />} title="No photos yet" ctaLabel="Jump in" />)

    await userEvent.click(screen.getByText('Jump in'))

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should show the download modal when the launcher reports no installed app', () => {
    downloadModalOpen = true

    render(<JumpInEmptyState icon={<span />} title="No photos yet" ctaLabel="Jump in" />)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
