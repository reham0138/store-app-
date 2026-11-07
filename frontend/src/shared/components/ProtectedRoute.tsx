import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.ts'
import type { UserRole } from '../types/auth.ts'
import { getDashboardPath } from '../utils/dashboardRoute.ts'

interface ProtectedRouteProps {
  roles?: UserRole[]
}

export function ProtectedRoute({ roles }: ProtectedRouteProps) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    )
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={getDashboardPath(user.role) ?? '/'} replace />
  }

  return <Outlet />
}
