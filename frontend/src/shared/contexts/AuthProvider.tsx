import { useCallback, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { AuthContext } from './auth-context.ts'
import type { AuthContextValue } from './auth-context.ts'
import { authService } from '../services/authService.ts'
import type { User, UserRole } from '../types/auth.ts'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(() => authService.getCurrentUser())

  const login = useCallback<AuthContextValue['login']>(async (input) => {
    setUser(await authService.login(input))
  }, [])

  const register = useCallback<AuthContextValue['register']>(async (input) => {
    setUser(await authService.register(input))
  }, [])

  const loginAsRole = useCallback<AuthContextValue['loginAsRole']>((role: Exclude<UserRole, 'customer'>) => {
    setUser(authService.loginAsRole(role))
  }, [])

  const logout = useCallback<AuthContextValue['logout']>(() => {
    authService.logout()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, login, register, loginAsRole, logout }),
    [user, login, register, loginAsRole, logout],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
