import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { AuthContext } from './auth-context.ts'
import type { AuthContextValue } from './auth-context.ts'
import { authService } from '../services/authService.ts'
import type { User } from '../types/auth.ts'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(() => authService.getCurrentUser())
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    authService
      .refreshSession()
      .then((sessionUser) => {
        if (isMounted) setUser(sessionUser)
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })
    return () => {
      isMounted = false
    }
  }, [])

  const login = useCallback<AuthContextValue['login']>(async (input) => {
    setUser(await authService.login(input))
  }, [])

  const register = useCallback<AuthContextValue['register']>(async (input) => {
    setUser(await authService.register(input))
  }, [])

  const logout = useCallback<AuthContextValue['logout']>(() => {
    authService.logout()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, isLoading, login, register, logout }),
    [user, isLoading, login, register, logout],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
