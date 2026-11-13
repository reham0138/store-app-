import type { UserRole } from '../types/auth.ts'

export function getDashboardPath(role: UserRole): string | null {
  if (role === 'admin') return '/dashboard/admin'
  if (role === 'branchManager') return '/dashboard/branch'
  return null
}
