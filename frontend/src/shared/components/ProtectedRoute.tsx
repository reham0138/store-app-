import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.ts'
import type { UserRole } from '../types/auth.ts'

interface ProtectedRouteProps {
  /** إذا انحددت: بس هالأدوار مسموح لها (مثلاً الداشبورد). */
  roles?: UserRole[]
}

/**
 * الاستخدام داخل <Routes>:
 *   <Route element={<ProtectedRoute />}>
 *     <Route path="checkout" element={<CheckoutPage />} />
 *   </Route>
 *   <Route element={<ProtectedRoute roles={['admin', 'branchManager']} />}>
 *     <Route path="dashboard" element={<DashboardPage />} />
 *   </Route>
 */
export function ProtectedRoute({ roles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <p className="px-4 py-16 text-center text-text-slate" role="status">
        Loading…
      </p>
    )
  }

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
    return <Navigate to="/forbidden" replace />
  }

  return <Outlet />
}
