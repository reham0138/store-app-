import { createContext } from 'react'
import type { LoginInput, RegisterInput, User, UserRole } from '../types/auth.ts'

export interface AuthContextValue {
  user: User | null
  login: (input: LoginInput) => Promise<void>
  register: (input: RegisterInput) => Promise<void>
  loginAsRole: (role: Exclude<UserRole, 'customer'>) => void
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
