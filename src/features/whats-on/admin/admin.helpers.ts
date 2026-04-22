import { AdminPermission } from './admin.types'

const ADDRESS_REGEX = /^0x[0-9a-fA-F]{40}$/

const hasAnyAdminPermission = (permissions: readonly AdminPermission[] | undefined): boolean =>
  Array.isArray(permissions) && permissions.length > 0

const isValidWalletAddress = (value: string): boolean => ADDRESS_REGEX.test(value.trim())

export { hasAnyAdminPermission, isValidWalletAddress }
