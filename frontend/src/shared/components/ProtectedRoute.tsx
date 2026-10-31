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
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
