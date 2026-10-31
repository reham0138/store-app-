import { createContext } from 'react'
import type { LoginInput, RegisterInput, User } from '../types/auth.ts'

export interface AuthContextValue {
  user: User | null
  login: (input: LoginInput) => Promise<void>
  register: (input: RegisterInput) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
