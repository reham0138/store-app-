import type { LoginInput, RegisterInput, User, UserRole } from '../types/auth.ts'

/*
 * خدمة مصادقة وهمية (localStorage).
 * عند جاهزية الباك اند: بدّل الداخل فقط (axios من shared/api)، وخلّي أسماء الدوال
 * والأنواع نفسها، فما بينكسر أي كود يستخدم useAuth.
 * تحذير: كلمات المرور هون مخزنة نص عادي لأنو هاد وهمي للتطوير فقط.
 */

const USERS_KEY = 'crown-anchor:mock-users'
const SESSION_KEY = 'crown-anchor:session'
const FAKE_DELAY_MS = 600

interface StoredUser extends User {
  password: string
}

export type AuthErrorCode = 'INVALID_CREDENTIALS' | 'EMAIL_TAKEN'

export class AuthError extends Error {
  code: AuthErrorCode

  constructor(code: AuthErrorCode, message: string) {
    super(message)
    this.name = 'AuthError'
    this.code = code
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function readUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    return raw ? (JSON.parse(raw) as StoredUser[]) : []
  } catch {
    return []
  }
}

function writeUsers(users: StoredUser[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

function toPublicUser(stored: StoredUser): User {
  return {
    id: stored.id,
    name: stored.name,
    email: stored.email,
    role: stored.role,
    ...(stored.branchId ? { branchId: stored.branchId } : {}),
  }
}

async function login({ email, password }: LoginInput): Promise<User> {
  await wait(FAKE_DELAY_MS)
  const found = readUsers().find(
    (u) => u.email === normalizeEmail(email) && u.password === password,
  )
  if (!found) {
    throw new AuthError('INVALID_CREDENTIALS', 'The email or password is incorrect.')
  }
  localStorage.setItem(SESSION_KEY, found.id)
  return toPublicUser(found)
}

async function register({ name, email, password }: RegisterInput): Promise<User> {
  await wait(FAKE_DELAY_MS)
  const users = readUsers()
  const normalized = normalizeEmail(email)
  if (users.some((u) => u.email === normalized)) {
    throw new AuthError('EMAIL_TAKEN', 'An account with this email already exists.')
  }
  const created: StoredUser = {
    id: crypto.randomUUID(),
    name: name.trim(),
    email: normalized,
    role: 'customer',
    password,
  }
  writeUsers([...users, created])
  localStorage.setItem(SESSION_KEY, created.id)
  return toPublicUser(created)
}

function loginAsRole(role: Exclude<UserRole, 'customer'>): User {
  if (!import.meta.env.DEV) {
    throw new Error('Development role access is not available in production.')
  }

  const isAdmin = role === 'admin'
  const mockUser: StoredUser = {
    id: `development-${role}`,
    name: isAdmin ? 'Development Admin' : 'Development Branch Manager',
    email: isAdmin ? 'admin@development.local' : 'manager@development.local',
    role,
    ...(isAdmin ? {} : { branchId: 'damascus' }),
    password: '',
  }
  const users = readUsers().filter((user) => user.id !== mockUser.id)
  writeUsers([...users, mockUser])
  localStorage.setItem(SESSION_KEY, mockUser.id)
  return toPublicUser(mockUser)
}

function logout(): void {
  localStorage.removeItem(SESSION_KEY)
}

/** متزامنة عمداً: بتنقرأ مرة وحدة عند فتح الموقع بدون وميض "غير مسجّل". */
function getCurrentUser(): User | null {
  try {
    const id = localStorage.getItem(SESSION_KEY)
    if (!id) return null
    const found = readUsers().find((u) => u.id === id)
    return found ? toPublicUser(found) : null
  } catch {
    return null
  }
}

export const authService = { login, register, loginAsRole, logout, getCurrentUser }
