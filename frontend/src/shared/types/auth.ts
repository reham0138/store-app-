export type UserRole = 'customer' | 'branchManager' | 'admin'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
}

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput {
  name: string
  email: string
  password: string
}
