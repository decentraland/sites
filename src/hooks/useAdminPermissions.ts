import { useMemo } from 'react'
import { skipToken } from '@reduxjs/toolkit/query/react'
import { useGetMyProfileSettingsQuery } from '../features/experiences/events/admin/admin.client'
import { hasAnyAdminPermission } from '../features/experiences/events/admin/admin.helpers'
import { AdminPermission } from '../features/experiences/events/admin/admin.types'
import { useAuthIdentity } from './useAuthIdentity'

type AdminPermissionsState = {
  isLoading: boolean
  hasIdentity: boolean
  permissions: AdminPermission[]
  canApproveOwnEvent: boolean
  canApproveAnyEvent: boolean
  canEditAnyEvent: boolean
  canEditAnySchedule: boolean
  canEditAnyProfile: boolean
  isAdmin: boolean
}

const EMPTY: AdminPermission[] = []

function useAdminPermissions(): AdminPermissionsState {
  const { identity, hasValidIdentity } = useAuthIdentity()
  const queryResult = useGetMyProfileSettingsQuery(hasValidIdentity && identity ? { identity } : skipToken)

  return useMemo(() => {
    const permissions = hasValidIdentity ? queryResult.data?.permissions ?? EMPTY : EMPTY
    return {
      isLoading: queryResult.isLoading,
      hasIdentity: hasValidIdentity,
      permissions,
      canApproveOwnEvent: permissions.includes(AdminPermission.APPROVE_OWN_EVENT),
      canApproveAnyEvent: permissions.includes(AdminPermission.APPROVE_ANY_EVENT),
      canEditAnyEvent: permissions.includes(AdminPermission.EDIT_ANY_EVENT),
      canEditAnySchedule: permissions.includes(AdminPermission.EDIT_ANY_SCHEDULE),
      canEditAnyProfile: permissions.includes(AdminPermission.EDIT_ANY_PROFILE),
      isAdmin: hasAnyAdminPermission(permissions)
    }
  }, [hasValidIdentity, queryResult.data, queryResult.isLoading])
}

export { useAdminPermissions }
export type { AdminPermissionsState }
