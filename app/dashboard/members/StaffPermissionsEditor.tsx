'use client'

import {
  DASHBOARD_AREA_LABELS,
  DASHBOARD_STAFF_AREAS,
  GLOBAL_PERMISSION_LABELS,
  GLOBAL_PERMISSIONS,
  createPermission,
  deletePermission,
  editPermission,
  normalizePermissionGrants,
  tabPermission,
  type DashboardPermission,
  type DashboardRole,
} from '@/lib/dashboard-permissions'
import { Checkbox } from '@/components/ui/checkbox'

type Props = {
  role: DashboardRole
  permissions: DashboardPermission[]
  onRoleChange: (role: 'admin' | 'moderator') => void
  onPermissionsChange: (permissions: DashboardPermission[]) => void
  disabled?: boolean
}

export default function StaffPermissionsEditor({
  role,
  permissions,
  onRoleChange,
  onPermissionsChange,
  disabled,
}: Props) {
  const set = new Set(permissions)

  const toggle = (perm: DashboardPermission, checked: boolean) => {
    const next = new Set(permissions)
    if (checked) next.add(perm)
    else next.delete(perm)
    // Create / edit / delete imply view
    if (
      checked &&
      (perm.startsWith('create:') ||
        perm.startsWith('edit:') ||
        perm.startsWith('delete:'))
    ) {
      const area = perm.split(':')[1] as Parameters<typeof tabPermission>[0]
      next.add(tabPermission(area))
    }
    onPermissionsChange(normalizePermissionGrants(Array.from(next)))
  }

  const staffRole = role === 'moderator' ? 'moderator' : 'admin'

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-gray-700">Role</label>
        <select
          className="h-10 w-full rounded-xl border-2 border-gray-200 bg-white px-3 text-sm"
          value={staffRole}
          disabled={disabled}
          onChange={(e) =>
            onRoleChange(e.target.value === 'moderator' ? 'moderator' : 'admin')
          }
        >
          <option value="admin">Admin</option>
          <option value="moderator">Moderator</option>
        </select>
        <p className="text-xs text-gray-500">
          Create = add new items and edit ones they created. Edit = change items
          created by someone else.
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold text-gray-700">Area access</p>
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 bg-gray-50 px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-gray-500">
            <span>Area</span>
            <span className="w-14 text-center">View</span>
            <span className="w-14 text-center">Create</span>
            <span className="w-14 text-center">Edit</span>
            <span className="w-14 text-center">Delete</span>
          </div>
          {DASHBOARD_STAFF_AREAS.map((area) => {
            const view = set.has(tabPermission(area))
            const create = set.has(createPermission(area))
            const edit = set.has(editPermission(area))
            const del = set.has(deletePermission(area))
            return (
              <div
                key={area}
                className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 items-center px-3 py-2 border-t border-gray-100"
              >
                <span className="text-sm text-gray-800">
                  {DASHBOARD_AREA_LABELS[area]}
                </span>
                <div className="w-14 flex justify-center">
                  <Checkbox
                    checked={view}
                    disabled={disabled}
                    onCheckedChange={(v) =>
                      toggle(tabPermission(area), v === true)
                    }
                  />
                </div>
                <div className="w-14 flex justify-center">
                  <Checkbox
                    checked={create}
                    disabled={disabled}
                    onCheckedChange={(v) =>
                      toggle(createPermission(area), v === true)
                    }
                  />
                </div>
                <div className="w-14 flex justify-center">
                  <Checkbox
                    checked={edit}
                    disabled={disabled}
                    onCheckedChange={(v) =>
                      toggle(editPermission(area), v === true)
                    }
                  />
                </div>
                <div className="w-14 flex justify-center">
                  <Checkbox
                    checked={del}
                    disabled={disabled}
                    onCheckedChange={(v) =>
                      toggle(deletePermission(area), v === true)
                    }
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold text-gray-700">Global</p>
        {GLOBAL_PERMISSIONS.map((perm) => (
          <label
            key={perm}
            className="flex items-center gap-2 text-sm text-gray-700"
          >
            <Checkbox
              checked={set.has(perm)}
              disabled={disabled}
              onCheckedChange={(v) => toggle(perm, v === true)}
            />
            {GLOBAL_PERMISSION_LABELS[perm]}
          </label>
        ))}
      </div>
    </div>
  )
}
