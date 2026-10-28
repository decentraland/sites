import type { ChangeEventHandler, ReactNode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { DeleteAccountSection } from './DeleteAccountSection'

type ChildrenProps = { children?: ReactNode; 'data-role'?: string }
type ButtonProps = ChildrenProps & { onClick?: () => void; disabled?: boolean }
type ControlProps = { control?: ReactNode; label?: ReactNode }
type CheckboxProps = { checked?: boolean; onChange?: ChangeEventHandler<HTMLInputElement>; 'data-role'?: string }

jest.mock('@mui/icons-material/AccountCircleRounded', () => ({ __esModule: true, default: () => <span /> }))
jest.mock('@mui/icons-material/CardGiftcardRounded', () => ({ __esModule: true, default: () => <span /> }))
jest.mock('@mui/icons-material/ErrorOutlineRounded', () => ({ __esModule: true, default: () => <span /> }))
jest.mock('@mui/icons-material/GroupRounded', () => ({ __esModule: true, default: () => <span /> }))
jest.mock('@mui/icons-material/NotificationsRounded', () => ({ __esModule: true, default: () => <span /> }))
jest.mock('@mui/icons-material/PlaceRounded', () => ({ __esModule: true, default: () => <span /> }))
jest.mock('@mui/icons-material/StorefrontRounded', () => ({ __esModule: true, default: () => <span /> }))
jest.mock('@mui/icons-material/WarningAmberRounded', () => ({ __esModule: true, default: () => <span /> }))

jest.mock('./DeleteAccountSection.styled', () => ({
  Container: ({ children, 'data-role': dataRole }: ChildrenProps) => <div data-role={dataRole}>{children}</div>,
  DangerBanner: ({ children }: ChildrenProps) => <div>{children}</div>,
  BannerTextWrapper: ({ children }: ChildrenProps) => <div>{children}</div>,
  DangerBannerTitle: ({ children }: ChildrenProps) => <div>{children}</div>,
  DangerBannerDescription: ({ children }: ChildrenProps) => <div>{children}</div>,
  WarningCard: ({ children }: ChildrenProps) => <div>{children}</div>,
  WarningDescription: ({ children }: ChildrenProps) => <div>{children}</div>,
  ConsequencesList: ({ children }: ChildrenProps) => <ul>{children}</ul>,
  ConsequenceItem: ({ children }: ChildrenProps) => <li>{children}</li>,
  ConsequenceIcon: ({ children }: ChildrenProps) => <span>{children}</span>,
  ConsequenceText: ({ children }: ChildrenProps) => <span>{children}</span>,
  ConsequenceTitle: ({ children }: ChildrenProps) => <span>{children}</span>,
  AssetWarningBox: ({ children }: ChildrenProps) => <div>{children}</div>,
  AssetWarningTextWrapper: ({ children }: ChildrenProps) => <div>{children}</div>,
  AssetWarningTitle: ({ children }: ChildrenProps) => <div>{children}</div>,
  AssetWarningDescription: ({ children }: ChildrenProps) => <div>{children}</div>,
  ExportKeyDescription: ({ children }: ChildrenProps) => <div>{children}</div>,
  ExportKeyLink: ({ children, onClick, 'data-role': dataRole }: ButtonProps) => (
    <button type="button" data-role={dataRole} onClick={onClick}>
      {children}
    </button>
  ),
  AcknowledgeControl: ({ control, label }: ControlProps) => (
    <label>
      {control}
      {label}
    </label>
  ),
  AcknowledgeCheckbox: ({ checked, onChange, 'data-role': dataRole }: CheckboxProps) => (
    <input type="checkbox" checked={checked} onChange={onChange} data-role={dataRole} />
  ),
  AcknowledgeLabel: ({ children }: ChildrenProps) => <span>{children}</span>,
  DeleteButton: ({ children, onClick, disabled, 'data-role': dataRole }: ButtonProps) => (
    <button type="button" data-role={dataRole} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )
}))

jest.mock('../../../../hooks/adapters/useFormatMessage', () => ({
  useFormatMessage: () => (id: string) => id
}))

const ADDRESS = '0x1234567890123456789012345678901234567890'

describe('DeleteAccountSection', () => {
  let onOpenConfirmModal: jest.Mock
  let onGoToWallets: jest.Mock
  let onGoToSecurity: jest.Mock

  beforeEach(() => {
    onOpenConfirmModal = jest.fn()
    onGoToWallets = jest.fn()
    onGoToSecurity = jest.fn()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  const renderSection = (address?: string, isMagic = false) =>
    render(
      <DeleteAccountSection
        address={address}
        isMagic={isMagic}
        onOpenConfirmModal={onOpenConfirmModal}
        onGoToWallets={onGoToWallets}
        onGoToSecurity={onGoToSecurity}
      />
    )

  it('should render the danger banner, all six consequences and the asset warning', () => {
    renderSection(ADDRESS)

    expect(screen.getByText('account.delete.title')).toBeInTheDocument()
    expect(screen.getByText('account.delete.consequences.profile.title')).toBeInTheDocument()
    expect(screen.getByText('account.delete.consequences.social.title')).toBeInTheDocument()
    expect(screen.getByText('account.delete.consequences.marketplace.title')).toBeInTheDocument()
    expect(screen.getByText('account.delete.consequences.credits.title')).toBeInTheDocument()
    expect(screen.getByText('account.delete.consequences.favorites.title')).toBeInTheDocument()
    expect(screen.getByText('account.delete.consequences.notifications.title')).toBeInTheDocument()
    expect(screen.getByText('account.delete.asset_warning_title')).toBeInTheDocument()
  })

  it('should render the acknowledgement checkbox above the delete button', () => {
    renderSection(ADDRESS)

    expect(screen.getByRole('checkbox', { name: 'account.delete.acknowledge' })).toBeInTheDocument()
  })

  describe('when the acknowledgement checkbox is unchecked', () => {
    it('should keep the delete button disabled', () => {
      renderSection(ADDRESS)

      expect(screen.getByRole('button', { name: 'account.delete.delete_button' })).toBeDisabled()
    })
  })

  describe('when the acknowledgement checkbox is checked', () => {
    it('should enable the delete button', () => {
      renderSection(ADDRESS)

      fireEvent.click(screen.getByRole('checkbox', { name: 'account.delete.acknowledge' }))

      expect(screen.getByRole('button', { name: 'account.delete.delete_button' })).toBeEnabled()
    })

    it('should open the confirm modal when the delete button is clicked', () => {
      renderSection(ADDRESS)

      fireEvent.click(screen.getByRole('checkbox', { name: 'account.delete.acknowledge' }))
      fireEvent.click(screen.getByRole('button', { name: 'account.delete.delete_button' }))

      expect(onOpenConfirmModal).toHaveBeenCalledTimes(1)
    })
  })

  it('should navigate to wallets when a non-Magic account clicks the export key link', () => {
    renderSection(ADDRESS)

    fireEvent.click(screen.getByRole('button', { name: 'account.delete.export_key_link' }))

    expect(onGoToWallets).toHaveBeenCalledTimes(1)
    expect(onGoToSecurity).not.toHaveBeenCalled()
  })

  describe('when the account is a Magic login', () => {
    it('should render the Magic export-key description pointing at the Security tab', () => {
      renderSection(ADDRESS, true)

      expect(screen.getByText('account.delete.export_key_description_magic')).toBeInTheDocument()
    })

    it('should navigate to security (not wallets) when the export key link is clicked', () => {
      renderSection(ADDRESS, true)

      fireEvent.click(screen.getByRole('button', { name: 'account.delete.export_key_link_magic' }))

      expect(onGoToSecurity).toHaveBeenCalledTimes(1)
      expect(onGoToWallets).not.toHaveBeenCalled()
    })
  })

  it('should disable the delete button when there is no address', () => {
    renderSection(undefined)

    expect(screen.getByRole('button', { name: 'account.delete.delete_button' })).toBeDisabled()
  })
})
