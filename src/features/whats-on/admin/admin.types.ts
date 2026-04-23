import type { AuthIdentity } from '@dcl/crypto'

enum AdminPermission {
  APPROVE_OWN_EVENT = 'approve_own_event',
  APPROVE_ANY_EVENT = 'approve_any_event',
  EDIT_ANY_EVENT = 'edit_any_event',
  EDIT_ANY_SCHEDULE = 'edit_any_schedule',
  EDIT_ANY_PROFILE = 'edit_any_profile'
}

const UPDATEABLE_PERMISSIONS: readonly AdminPermission[] = [
  AdminPermission.APPROVE_OWN_EVENT,
  AdminPermission.APPROVE_ANY_EVENT,
  AdminPermission.EDIT_ANY_EVENT,
  AdminPermission.EDIT_ANY_PROFILE
] as const

const REJECT_REASONS = ['invalid_image', 'invalid_event_name', 'inappropriate_description', 'invalid_duration', 'invalid_location'] as const

type AdminProfileSettings = {
  user: string
  email: string | null
  permissions: AdminPermission[]
}

type IdentityOnlyParams = { identity: AuthIdentity }
type UpdateAdminPermissionsParams = IdentityOnlyParams & { address: string; permissions: AdminPermission[] }
type AdminEventActionParams = IdentityOnlyParams & { eventId: string }
type RejectReasonCode = (typeof REJECT_REASONS)[number]
type AdminRejectEventParams = AdminEventActionParams & { reasons?: RejectReasonCode[]; notes?: string }

export { AdminPermission, REJECT_REASONS, UPDATEABLE_PERMISSIONS }
export type {
  AdminEventActionParams,
  AdminProfileSettings,
  AdminRejectEventParams,
  IdentityOnlyParams,
  RejectReasonCode,
  UpdateAdminPermissionsParams
}
