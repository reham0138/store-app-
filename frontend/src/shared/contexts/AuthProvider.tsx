import { useCallback, useMemo } from 'react'
import type { ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AuthContext } from './auth-context.ts'
import type { AuthContextValue } from './auth-context.ts'
import { authService } from '../services/authService.ts'
import { queryKeys } from '../api/queryKeys.ts'
import { normalizeError } from '../api/errors.ts'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const queryClient = useQueryClient()
  const sessionQuery = useQuery({
    queryKey: queryKeys.auth.session,
    queryFn: authService.refreshSession,
    staleTime: Infinity,
    retry: 0,
  })
  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (user) => {
      queryClient.setQueryData(queryKeys.auth.session, user)
    },
  })
  const registerMutation = useMutation({
    mutationFn: authService.register,
    onSuccess: (user) => {
      queryClient.setQueryData(queryKeys.auth.session, user)
    },
  })
  const user = sessionQuery.data ?? null
  const isLoading = sessionQuery.isLoading
  const error = sessionQuery.error
    ? normalizeError(sessionQuery.error, 'Could not restore the session.').message
    : null

  const login = useCallback<AuthContextValue['login']>(
    async (input) => {
      await loginMutation.mutateAsync(input)
    },
    [loginMutation],
  )

  const register = useCallback<AuthContextValue['register']>(
    async (input) => {
      await registerMutation.mutateAsync(input)
    },
    [registerMutation],
  )

  const logout = useCallback<AuthContextValue['logout']>(() => {
    try {
      authService.logout()
    } finally {
      void queryClient.cancelQueries()
      queryClient.removeQueries({
        predicate: (query) =>
          query.queryKey[0] !== queryKeys.auth.session[0] ||
          query.queryKey[1] !== queryKeys.auth.session[1],
      })
      queryClient.setQueryData(queryKeys.auth.session, null)
    }
  }, [queryClient])

  const value = useMemo(
    () => ({ user, isLoading, error, login, register, logout }),
    [user, isLoading, error, login, register, logout],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
